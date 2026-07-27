/**
 * Netlify Function: dc-ingest
 *
 * Unified serverless endpoint for Data Cloud Ingestion API.
 * Handles three route types via the `action` field in the request body:
 *
 *   1. "beacon"    → Behavioral events → Zasocitinib_AppEngagement/AppEngagementEvents
 *   2. "checkin"   → PRO assessment data → ZasocitinibApp/pro_assessments
 *   3. "adherence" → Dose confirmation  → ZasocitinibApp/adherence_events
 *
 * Auth: JWT Bearer flow → SF access token → CDP token exchange.
 * The private key is read from the SALESFORCE_PRIVATE_KEY env var (PEM-encoded, newlines preserved).
 */

const https = require('https');
const crypto = require('crypto');

// ─── Config (all from environment variables or hardcoded org-specific values) ───

const SF_INSTANCE_URL = 'https://storm-ffbfcc9fa2ad3e.my.salesforce.com';
const DC_TENANT_URL   = 'https://mq4tsnjqgzsgmy3gg5tdczjwg8.c360a.salesforce.com';
const CLIENT_ID       = '3MVG9OGq41FnYVsE1w2LJnCIN3XZZT.smJdBEVdAHkaDrNLeB7woAmV7MvIVaKO5apshv_hgwYTFEuArCQ4wl';
const SF_USERNAME     = 'storm.ffbfcc9fa2ad3e@salesforce.com';

// Connector → schema mapping
const CONNECTORS = {
  beacon:    { connector: 'Zasocitinib_AppEngagement', schema: 'AppEngagementEvents' },
  checkin:   { connector: 'ZasocitinibApp',            schema: 'pro_assessments'     },
  adherence: { connector: 'ZasocitinibApp',            schema: 'adherence_events'    },
};

// ─── Token cache (persisted across warm invocations) ───

let tokenCache = { dcToken: null, expiresAt: 0 };

// ─── Helpers ───

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function makeJWT(privateKey) {
  const header  = base64url(Buffer.from(JSON.stringify({ alg: 'RS256' })));
  const now     = Math.floor(Date.now() / 1000);
  const payload = base64url(Buffer.from(JSON.stringify({
    iss: CLIENT_ID,
    sub: SF_USERNAME,
    aud: 'https://login.salesforce.com',
    exp: now + 300,
  })));
  const signing = `${header}.${payload}`;
  const sig = base64url(
    crypto.sign('sha256', Buffer.from(signing), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    })
  );
  return `${signing}.${sig}`;
}

function httpsPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyBuf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(JSON.stringify(body));
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname,
        method: 'POST',
        port: 443,
        headers: { 'Content-Length': bodyBuf.length, ...headers },
      },
      (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      }
    );
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

// ─── Auth: JWT → SF token → CDP token ───

async function getDCToken() {
  if (tokenCache.dcToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache.dcToken;
  }

  const privateKey = process.env.SALESFORCE_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('SALESFORCE_PRIVATE_KEY environment variable is not set');
  }

  // Netlify stores multi-line env vars with literal \n — convert to real newlines
  const pem = privateKey.replace(/\\n/g, '\n');

  const jwt = makeJWT(pem);

  // Step 1: JWT → Salesforce access token
  const sfRes = await httpsPost(
    `${SF_INSTANCE_URL}/services/oauth2/token`,
    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
  if (sfRes.status !== 200) {
    throw new Error(`SF auth failed (${sfRes.status}): ${sfRes.body}`);
  }
  const sfToken = JSON.parse(sfRes.body).access_token;

  // Step 2: SF token → Data Cloud CDP token
  const dcRes = await httpsPost(
    `${SF_INSTANCE_URL}/services/a360/token`,
    `grant_type=urn:salesforce:grant-type:external:cdp&subject_token=${encodeURIComponent(sfToken)}&subject_token_type=urn:ietf:params:oauth:token-type:access_token`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
  if (dcRes.status !== 200) {
    throw new Error(`DC token exchange failed (${dcRes.status}): ${dcRes.body}`);
  }
  const dcToken = JSON.parse(dcRes.body).access_token;

  // Cache for 25 min (tokens last 30)
  tokenCache = { dcToken, expiresAt: Date.now() + 25 * 60 * 1000 };
  return dcToken;
}

// ─── Ingest to Data Cloud ───

async function ingestToDC(connector, schema, records) {
  const dcToken = await getDCToken();
  const url = `${DC_TENANT_URL}/api/v1/ingest/sources/${connector}/${schema}`;
  return httpsPost(url, { data: records }, {
    Authorization: `Bearer ${dcToken}`,
    'Content-Type': 'application/json',
  });
}

// ─── Record mappers ───

function mapBeaconRecord(evt) {
  return {
    EventId:          evt.eventId   || crypto.randomUUID(),
    EventType:        evt.eventType || 'engagement',
    EventDatetime:    evt.dateTime  || new Date().toISOString(),
    InteractionName:  evt.interactionName || evt.name || 'Unknown',
    SessionId:        evt.sessionId || '',
    PageName:         evt.pageName  || evt.sourceChannel || '',
    PageUrl:          evt.sourceUrl || '',
    ContentCategory:  evt.category  || '',
    DeviceType:       evt.deviceType || 'mobile_app',
    DurationSeconds:  evt.durationSeconds || 0,
    ProductName:      'Zasocitinib',
    ContactId:        evt.contactId || '',
  };
}

function mapCheckinRecord(body) {
  return {
    device_id:         body.deviceId,
    check_in_datetime: body.checkInDatetime,
    week_on_therapy:   body.weekOnTherapy,
    nrs_score:         body.nrsScore,
    psodisk_itch:      body.psodiskScores?.itch,
    psodisk_pain:      body.psodiskScores?.pain,
    psodisk_scaling:   body.psodiskScores?.scaling,
    psodisk_fatigue:   body.psodiskScores?.fatigue,
    psodisk_sleep:     body.psodiskScores?.sleep,
    psodisk_emotional: body.psodiskScores?.emotional,
    psodisk_body:      body.psodiskScores?.body,
    psodisk_social:    body.psodiskScores?.social,
    psodisk_work:      body.psodiskScores?.work,
    psodisk_overall:   body.psodiskScores?.overall,
  };
}

function mapAdherenceRecord(body) {
  return {
    device_id:      body.deviceId,
    dose_datetime:  body.doseDatetime,
    dose_confirmed: body.doseConfirmed,
    week_on_therapy: body.weekOnTherapy,
  };
}

// ─── Netlify Function handler ───

exports.handler = async (event) => {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const action = body.action;
  if (!action || !CONNECTORS[action]) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing or invalid action. Use: beacon, checkin, adherence' }),
    };
  }

  try {
    const { connector, schema } = CONNECTORS[action];
    let records;

    switch (action) {
      case 'beacon': {
        // Accept single event or array of events
        const events = Array.isArray(body.events) ? body.events : [body.events || body];
        records = events.map(mapBeaconRecord);
        break;
      }
      case 'checkin': {
        if (!body.deviceId || !body.checkInDatetime || body.nrsScore === undefined) {
          return { statusCode: 400, body: JSON.stringify({ error: 'deviceId, checkInDatetime, and nrsScore are required' }) };
        }
        records = [mapCheckinRecord(body)];
        break;
      }
      case 'adherence': {
        if (!body.deviceId || !body.doseDatetime) {
          return { statusCode: 400, body: JSON.stringify({ error: 'deviceId and doseDatetime are required' }) };
        }
        records = [mapAdherenceRecord(body)];
        break;
      }
    }

    const dcRes = await ingestToDC(connector, schema, records);

    if (dcRes.status === 202 || dcRes.status === 200) {
      return {
        statusCode: 200,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true, action, recordCount: records.length }),
      };
    } else {
      console.error(`DC ingest error [${action}]:`, dcRes.status, dcRes.body);
      return {
        statusCode: 502,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Data Cloud ingest failed', status: dcRes.status, detail: dcRes.body }),
      };
    }
  } catch (err) {
    console.error(`dc-ingest error [${action}]:`, err.message);
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message }),
    };
  }
};

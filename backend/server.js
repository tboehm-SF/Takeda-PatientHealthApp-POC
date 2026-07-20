const https = require('https');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Config
const SF_INSTANCE_URL = 'https://storm-ffbfcc9fa2ad3e.my.salesforce.com';
const DC_TENANT_URL = 'https://mq4tsnjqgzsgmy3gg5tdczjwg8.c360a.salesforce.com';
const CLIENT_ID = '3MVG9OGq41FnYVsE1w2LJnCIN3XZZT.smJdBEVdAHkaDrNLeB7woAmV7MvIVaKO5apshv_hgwYTFEuArCQ4wl';
const SF_USERNAME = 'storm.ffbfcc9fa2ad3e@salesforce.com';
const PRIVATE_KEY_PATH = path.join(__dirname, '..', 'salesforce', 'jwt', 'server.key');

// Token cache — avoid re-auth on every request
let tokenCache = { sfToken: null, dcToken: null, expiresAt: 0 };

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function makeJWT(privateKey) {
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'RS256' })));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(Buffer.from(JSON.stringify({
    iss: CLIENT_ID,
    sub: SF_USERNAME,
    aud: 'https://login.salesforce.com',
    exp: now + 300
  })));
  const signing = `${header}.${payload}`;
  const sig = base64url(crypto.sign('sha256', Buffer.from(signing), { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING }));
  return `${signing}.${sig}`;
}

function httpsPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const bodyBuf = typeof body === 'string' ? Buffer.from(body) : Buffer.from(JSON.stringify(body));
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST', port: 443,
      headers: { 'Content-Length': bodyBuf.length, ...headers }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

async function getDCToken() {
  if (tokenCache.dcToken && Date.now() < tokenCache.expiresAt) {
    return tokenCache.dcToken;
  }

  const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
  const jwt = makeJWT(privateKey);

  const sfRes = await httpsPost(
    `${SF_INSTANCE_URL}/services/oauth2/token`,
    `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
  if (sfRes.status !== 200) throw new Error(`SF auth failed: ${sfRes.body}`);
  const sfToken = JSON.parse(sfRes.body).access_token;

  const dcRes = await httpsPost(
    `${SF_INSTANCE_URL}/services/a360/token`,
    `grant_type=urn:salesforce:grant-type:external:cdp&subject_token=${encodeURIComponent(sfToken)}&subject_token_type=urn:ietf:params:oauth:token-type:access_token`,
    { 'Content-Type': 'application/x-www-form-urlencoded' }
  );
  if (dcRes.status !== 200) throw new Error(`DC token exchange failed: ${dcRes.body}`);
  const dcToken = JSON.parse(dcRes.body).access_token;

  // Cache for 25 minutes (tokens last 30)
  tokenCache = { dcToken, expiresAt: Date.now() + 25 * 60 * 1000 };
  return dcToken;
}

async function ingestToDC(object, records) {
  const dcToken = await getDCToken();
  const res = await httpsPost(
    `${DC_TENANT_URL}/api/v1/ingest/sources/ZasocitinibApp/${object}`,
    { data: records },
    { 'Authorization': `Bearer ${dcToken}`, 'Content-Type': 'application/json' }
  );
  return res;
}

// POST /checkin — receives check-in data from the app
app.post('/checkin', async (req, res) => {
  try {
    const { deviceId, checkInDatetime, weekOnTherapy, nrsScore, psodiskScores } = req.body;

    if (!deviceId || !checkInDatetime || nrsScore === undefined) {
      return res.status(400).json({ error: 'deviceId, checkInDatetime and nrsScore are required' });
    }

    const record = {
      device_id: deviceId,
      check_in_datetime: checkInDatetime,
      week_on_therapy: weekOnTherapy,
      nrs_score: nrsScore,
      psodisk_itch: psodiskScores?.itch,
      psodisk_pain: psodiskScores?.pain,
      psodisk_scaling: psodiskScores?.scaling,
      psodisk_fatigue: psodiskScores?.fatigue,
      psodisk_sleep: psodiskScores?.sleep,
      psodisk_emotional: psodiskScores?.emotional,
      psodisk_body: psodiskScores?.body,
      psodisk_social: psodiskScores?.social,
      psodisk_work: psodiskScores?.work,
      psodisk_overall: psodiskScores?.overall,
    };

    const dcRes = await ingestToDC('pro_assessments', [record]);

    if (dcRes.status === 202) {
      res.json({ success: true });
    } else {
      console.error('DC ingest error:', dcRes.body);
      res.status(502).json({ error: 'DC ingest failed', detail: dcRes.body });
    }
  } catch (err) {
    console.error('Check-in error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /adherence — receives dose confirmation from the app
app.post('/adherence', async (req, res) => {
  try {
    const { deviceId, doseDatetime, doseConfirmed, weekOnTherapy } = req.body;

    if (!deviceId || !doseDatetime) {
      return res.status(400).json({ error: 'deviceId and doseDatetime are required' });
    }

    const record = {
      device_id: deviceId,
      dose_datetime: doseDatetime,
      dose_confirmed: doseConfirmed,
      week_on_therapy: weekOnTherapy,
    };

    const dcRes = await ingestToDC('adherence_events', [record]);

    if (dcRes.status === 202) {
      res.json({ success: true });
    } else {
      console.error('DC ingest error:', dcRes.body);
      res.status(502).json({ error: 'DC ingest failed', detail: dcRes.body });
    }
  } catch (err) {
    console.error('Adherence error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Zasocitinib backend running on port ${PORT}`));

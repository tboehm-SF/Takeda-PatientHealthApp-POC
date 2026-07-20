const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

const CLIENT_ID = '3MVG9OGq41FnYVsE1w2LJnCIN3XZZT.smJdBEVdAHkaDrNLeB7woAmV7MvIVaKO5apshv_hgwYTFEuArCQ4wl';
const USERNAME = 'storm.ffbfcc9fa2ad3e@salesforce.com';
const AUDIENCE = 'https://login.salesforce.com';
const TOKEN_URL = 'https://storm-ffbfcc9fa2ad3e.my.salesforce.com/services/oauth2/token';
const DC_TOKEN_URL = 'https://storm-ffbfcc9fa2ad3e.my.salesforce.com/services/a360/token';

const privateKey = fs.readFileSync(__dirname + '/server.key', 'utf8');

function base64url(buf) {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function makeJWT() {
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'RS256' })));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(Buffer.from(JSON.stringify({
    iss: CLIENT_ID,
    sub: USERNAME,
    aud: AUDIENCE,
    exp: now + 300
  })));
  const signing = `${header}.${payload}`;
  const sig = base64url(crypto.sign('sha256', Buffer.from(signing), { key: privateKey, padding: crypto.constants.RSA_PKCS1_PADDING }));
  return `${signing}.${sig}`;
}

function post(url, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST', port: 443,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Content-Length': Buffer.byteLength(body) }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const jwt = makeJWT();

  console.log('Step 1: Exchanging JWT for SF access token...');
  const sfRes = await post(TOKEN_URL, `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`);
  console.log('SF token status:', sfRes.status);
  if (sfRes.status !== 200) { console.log(sfRes.body); process.exit(1); }
  const sfToken = JSON.parse(sfRes.body).access_token;
  console.log('SF token obtained.\n');

  console.log('Step 2: Exchanging SF token for Data Cloud token...');
  const dcRes = await post(DC_TOKEN_URL,
    `grant_type=urn:salesforce:grant-type:external:cdp&subject_token=${encodeURIComponent(sfToken)}&subject_token_type=urn:ietf:params:oauth:token-type:access_token`
  );
  console.log('DC token status:', dcRes.status);
  if (dcRes.status !== 200) { console.log(dcRes.body); process.exit(1); }
  const dcToken = JSON.parse(dcRes.body).access_token;
  console.log('DC token obtained.\n');

  console.log('Step 3: Posting sample PRO check-in to Data Cloud Ingestion API...');
  const payload = JSON.stringify({
    data: [{
      device_id: 'T4K3D4',
      check_in_datetime: '2026-07-14T09:00:00Z',
      week_on_therapy: 4,
      nrs_score: 8,
      psodisk_itch: 7,
      psodisk_pain: 5,
      psodisk_scaling: 6,
      psodisk_fatigue: 4,
      psodisk_sleep: 6,
      psodisk_emotional: 3,
      psodisk_body: 5,
      psodisk_social: 4,
      psodisk_work: 3,
      psodisk_overall: 5
    }]
  });

  const ingestRes = await new Promise((resolve, reject) => {
    const u = new URL('https://mq4tsnjqgzsgmy3gg5tdczjwg8.c360a.salesforce.com/api/v1/ingest/sources/ZasocitinibApp/pro_assessments');
    const req = https.request({
      hostname: u.hostname, path: u.pathname, method: 'POST', port: 443,
      headers: { 'Authorization': `Bearer ${dcToken}`, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, res => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });

  console.log('Ingest status:', ingestRes.status);
  console.log(ingestRes.body || '(empty body — check status code)');
}

main().catch(console.error);

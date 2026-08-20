// imouClient.js
// Client for Imou Open Platform API (accessToken + setDeviceSnap)
const crypto = require('crypto');
const config = require('./config');

const BASE_URL = 'https://openapi-' + config.IMOU_DATA_CENTER + '.easy4ip.com/openapi/';

function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          const r = (Math.random() * 16) | 0;
          const v = c === 'x' ? r : (r & 0x3) | 0x8;
          return v.toString(16);
    });
}

function buildSign(time, nonce) {
    const str = 'time:' + time + ',nonce:' + nonce + ',appSecret:' + config.IMOU_APP_SECRET;
    return crypto.createHash('md5').update(str).digest('hex');
}

async function callImouApi(method, params) {
    const time = Math.floor(Date.now() / 1000);
    const nonce = uuid();
    const sign = buildSign(time, nonce);
    const body = {
          system: {
                  ver: '1.0',
                  appId: config.IMOU_APP_ID,
                  sign: sign,
                  time: time,
                  nonce: nonce,
          },
          id: uuid(),
          params: params || {},
    };
    const res = await fetch(BASE_URL + method, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.result || data.result.code !== '0') {
          const msg = data.result ? data.result.msg : 'Unknown error';
          throw new Error('Imou API error (' + method + '): ' + msg);
    }
    return data.result.data;
}

async function getAccessToken() {
    const data = await callImouApi('accessToken', {});
    return data.accessToken;
}

async function getSnapshotUrl(deviceId, channelId) {
    const token = await getAccessToken();
    const data = await callImouApi('setDeviceSnapEnhanced', {
          deviceId: deviceId,
          channelId: channelId || '0',
          token: token,
    });
    return data.url;
}

module.exports = { getAccessToken: getAccessToken, getSnapshotUrl: getSnapshotUrl };

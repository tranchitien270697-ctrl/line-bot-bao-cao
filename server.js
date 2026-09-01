require('dotenv').config();
const express = require('express');
const lineBotSdk = require('@line/bot-sdk');
const config = require('./config');
const flexBuilder = require('./flexBuilder');
const lunarCalendar = require('./lunarCalendar');
const imouClient = require('./imouClient');

const lineConfig = {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const app = express();
const fs = require('fs');
const path = require('path');
app.use(express.json({ limit: '15mb' }));
app.use('/tmp', express.static(path.join(__dirname, 'public', 'tmp')));

// ---------- Theo doi xe giao hang ----------
let trackingDrivers = {};
let trackingStoreConfig = null;
const trackingConfigPath = path.join(__dirname, 'public', 'tracking-store.json');
try {
  if (fs.existsSync(trackingConfigPath)) {
    trackingStoreConfig = JSON.parse(fs.readFileSync(trackingConfigPath, 'utf8'));
  }
} catch (e) { console.error('tracking config load error', e); }

function slugifyDriver(s) {
  return String(s).trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'tai-xe';
}

app.get('/tracking', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'tracking.html'));
});

app.post('/api/tracking/driver', (req, res) => {
  const { name, lat, lng } = req.body || {};
  if (!name || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'missing fields' });
  }
  trackingDrivers[slugifyDriver(name)] = { name, lat, lng, updatedAt: Date.now() };
  res.json({ ok: true });
});

app.delete('/api/tracking/driver/:slug', (req, res) => {
  delete trackingDrivers[req.params.slug];
  res.json({ ok: true });
});

app.get('/api/tracking/drivers', (req, res) => {
  res.json(Object.values(trackingDrivers));
});

app.post('/api/tracking/store', (req, res) => {
  const { lat, lng, speedKmh } = req.body || {};
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'missing fields' });
  }
  trackingStoreConfig = { lat, lng, speedKmh: speedKmh || 30 };
  try { fs.writeFileSync(trackingConfigPath, JSON.stringify(trackingStoreConfig)); } catch (e) { console.error('tracking config save error', e); }
  res.json({ ok: true });
});

app.get('/api/tracking/store', (req, res) => {
  res.json(trackingStoreConfig || {});
});

// ---------- Khach hang giao hang (luu 1 lan, tra cuu theo SDT) ----------
let trackingCustomers = {};
const trackingCustomersPath = path.join(__dirname, 'public', 'tracking-customers.json');
try {
  if (fs.existsSync(trackingCustomersPath)) {
    trackingCustomers = JSON.parse(fs.readFileSync(trackingCustomersPath, 'utf8'));
  }
} catch (e) { console.error('tracking customers load error', e); }

function normalizePhone(p) {
  return String(p || '').replace(/[^0-9]/g, '');
}

app.get('/api/tracking/customer/:phone', (req, res) => {
  const phone = normalizePhone(req.params.phone);
  const c = trackingCustomers[phone];
  if (!c) return res.status(404).json({ error: 'not found' });
  res.json(c);
});

app.post('/api/tracking/customer', (req, res) => {
  const { phone, lat, lng, photoBase64, savedBy } = req.body || {};
  const p = normalizePhone(phone);
  if (!p || typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'missing fields' });
  }
  if (trackingCustomers[p]) {
    return res.json({ ok: true, existed: true, customer: trackingCustomers[p] });
  }
  let photoUrl = null;
  if (photoBase64) {
    try {
      const dir = path.join(__dirname, 'public', 'tmp');
      const filename = 'khach_' + p + '_' + Date.now() + '.jpg';
      const filePath = path.join(dir, filename);
      fs.writeFileSync(filePath, Buffer.from(photoBase64, 'base64'));
      photoUrl = 'https://' + req.get('host') + '/tmp/' + filename;
    } catch (e) { console.error('customer photo save error', e); }
  }
  const record = { phone: p, lat, lng, photoUrl, savedBy: savedBy || '', savedAt: Date.now() };
  trackingCustomers[p] = record;
  try { fs.writeFileSync(trackingCustomersPath, JSON.stringify(trackingCustomers)); } catch (e) { console.error('tracking customers save error', e); }
  res.json({ ok: true, existed: false, customer: record });
});
const client = new lineBotSdk.Client(lineConfig);

app.get('/', (req, res) => res.send('LINE report bot is running'));

app.get('/push/revenue', async (req, res) => {
        try {
                  if (req.query.key !== config.CRON_SECRET) {
                              return res.status(403).send('Forbidden');
                  }
                  const storeLabel = req.query.store || '5152-Kế Sách';
                  const todayTotal = parseFloat(req.query.todayTotal) || 0;
                  const yesterdayTotal = parseFloat(req.query.yesterdayTotal) || 0;
                  let industries = [];
                  try {
                              industries = JSON.parse(req.query.industries || '[]');
                  } catch (parseErr) {
                              console.error('Industries parse error:', parseErr);
                  }
                  const revenueMsg = flexBuilder.buildRevenueDetailFlexMessage(storeLabel, todayTotal, yesterdayTotal, industries);
                  await client.pushMessage(config.TARGET_GROUP_ID, revenueMsg);
                  res.send('Sent revenue detail card');
        } catch (err) {
                  console.error('Push revenue error:', err);
                  res.status(500).send('Error sending revenue card');
        }
});

app.post('/push/image', async (req, res) => {
try {
if (req.query.key !== config.CRON_SECRET) {
return res.status(403).send('Forbidden');
}
const imageBase64 = req.body.imageBase64;
const filename = 'report_' + Date.now() + '.png';
if (!imageBase64) {
return res.status(400).send('Missing imageBase64');
}
const dir = path.join(__dirname, 'public', 'tmp');
fs.mkdirSync(dir, { recursive: true });
const filePath = path.join(dir, filename);
fs.writeFileSync(filePath, Buffer.from(imageBase64, 'base64'));
const publicUrl = 'https://' + req.get('host') + '/tmp/' + filename;
const imageMsg = { type: 'image', originalContentUrl: publicUrl, previewImageUrl: publicUrl };
await client.pushMessage(config.TARGET_GROUP_ID, imageMsg);
res.send('Sent image: ' + publicUrl);
} catch (err) {
console.error('Push image error:', err);
res.status(500).send('Error sending image: ' + err.message);
}
});

app.get('/camera/:name', async (req, res) => {
        try {
                  if (req.query.key !== config.CRON_SECRET) {
                              return res.status(403).send('Forbidden');
                  }
                  const camName = req.params.name.toLowerCase();
                  const deviceId = config.IMOU_CAMERAS[camName];
                  if (!deviceId) {
                              return res.status(404).send('Camera not found: ' + camName);
                  }
                  const snapUrl = await imouClient.getSnapshotUrl(deviceId, '0');
                  const imageMsg = { type: 'image', originalContentUrl: snapUrl, previewImageUrl: snapUrl };
                  await client.pushMessage(config.TARGET_GROUP_ID, imageMsg);
                  res.send('Sent camera snapshot: ' + camName + ' -> ' + snapUrl);
        } catch (err) {
                  console.error('Camera push error:', err);
                  res.status(500).send('Error sending camera snapshot: ' + err.message);
        }
});

app.get('/cron/:id', async (req, res) => {
        try {
                  if (req.query.key !== config.CRON_SECRET) {
                              return res.status(403).send('Forbidden');
                  }

          if (req.params.id === 'morning') {
const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
const dow = now.getDay();
const people = config.CLEANING_SCHEDULE[dow] || [];
const dayLabel = config.DAY_LABELS[dow];
let weatherText = 'Khong lay duoc du lieu thoi tiet';
try {
const wRes = await fetch('https://wttr.in/' + config.WEATHER_LOCATION + '?format=3&m&lang=vi');
weatherText = (await wRes.text()).trim(); const wColonIdx = weatherText.indexOf(':'); if (wColonIdx > -1) { weatherText = 'Sóc Trăng:' + weatherText.slice(wColonIdx + 1); }
} catch (weatherErr) {
console.error('Weather fetch error:', weatherErr);
}
const lunarText = lunarCalendar.getTodayLunarText();
const solarText = dayLabel + ', ngày ' + now.getDate() + ' tháng ' + (now.getMonth() + 1) + ' năm ' + now.getFullYear();
const quote = config.LIFE_QUOTES[Math.floor(Math.random() * config.LIFE_QUOTES.length)];
const holidayText = lunarCalendar.getTodayHoliday();
const greetingText = config.SCHEDULED_MESSAGES['1'];
const morningMsg = flexBuilder.buildMorningCombinedFlexMessage(greetingText, weatherText, solarText, lunarText, quote, holidayText, dayLabel, people);
await client.pushMessage(config.TARGET_GROUP_ID, morningMsg);
return res.send('Sent morning combined card');
}

if (req.params.id === 'morning2') {
const text2 = 'Xin chào ngày mới Anh Chị !\n\nCác công việc sáng nay cần hoàn tất trước 9h\n\n1. Nhập Aba\n2. Nhập Fresh\n3. Kiểm Date/Kiểm Kê/Tem giá /Bắn kệ\n\nTất cả công việc vui lòng có ảnh chụp màn hình và tạo Album báo cáo đầy đủ (Cân Aba,....)\n\nChúc Anh chị làm việc vui vẻ ! Cảm ơn Anh Chị !';
const msg2 = flexBuilder.buildReminderFlexMessage(text2);
await client.pushMessage(config.TARGET_GROUP_ID, msg2);
return res.send('Sent morning2 combined message');
}

if (req.params.id === 'midday') {
const text45 = 'Xin chào Anh Chị, Anh Chị cần hoàn tất các công việc sau:\n\n1. Báo cáo Hình ảnh chất lượng Fresh nhóm 5152- Kế Sách\n(Nhóm Zalo siêu thị cũng gần gửi hình Fresh-Các khuyến mãi đến với Khách Hàng)\n2. Báo cáo Fresh nhóm KV\n3. Báo cáo Thu Ngân nhóm KV\n\nCảm Ơn Anh Chị đã hoàn tất !';
const msg45 = flexBuilder.buildReminderFlexMessage(text45);
await client.pushMessage(config.TARGET_GROUP_ID, msg45);
return res.send('Sent midday combined message');
}

if (req.params.id === '9') {
                      let weatherText9 = 'Không lấy được dữ liệu thời tiết';
                      try {
                                    const wRes9 = await fetch('https://wttr.in/' + config.WEATHER_LOCATION + '?format=3&m&lang=vi');
                                    weatherText9 = (await wRes9.text()).trim();
                      } catch (weatherErr9) {
                                    console.error('Weather fetch error:', weatherErr9);
                      }
                      const tip = config.BUDDHIST_QUOTES[Math.floor(Math.random() * config.BUDDHIST_QUOTES.length)];
                      const goodnightMsg = flexBuilder.buildGoodnightFlexMessage(weatherText9, tip);
                      await client.pushMessage(config.TARGET_GROUP_ID, goodnightMsg);
                      return res.send('Sent goodnight card');
          }
                  if (req.params.id === '6') {
const now6 = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
const dow6 = now6.getDay();
const people6 = config.CLEANING_SCHEDULE[dow6] || [];
const dayLabel6 = config.DAY_LABELS[dow6];
const text6 = 'Xin chào Anh Chị, Anh Chị cần hoàn tất các công việc sau:\n\n1. Báo cáo Hình ảnh chất lượng Fresh nhóm 5152- Kế Sách\n(Nhóm Zalo siêu thị cũng gần gửi hình Fresh-Các khuyến mãi đến với Khách Hàng)\n2. Anh Chị đã hoàn tất Úp phiếu nộp tiền và hoàn tất báo cáo nhóm KT-KV chưa ?\n\nCảm Ơn Anh Chị đã hoàn tất !';
const msg6 = flexBuilder.buildReminderWithCleaningFlexMessage(text6, dayLabel6, people6);
await client.pushMessage(config.TARGET_GROUP_ID, msg6);
return res.send('Sent id 6 with cleaning reminder');
}

const text = config.SCHEDULED_MESSAGES[req.params.id];
                  if (!text) {
                              return res.status(404).send('No message for id ' + req.params.id);
                  }
                  const reminderMsg = flexBuilder.buildReminderFlexMessage(text);
                  await client.pushMessage(config.TARGET_GROUP_ID, reminderMsg);
                  res.send('Sent message ' + req.params.id);
        } catch (err) {
                  console.error('Cron error:', err);
                  res.status(500).send('Error sending message');
        }
});

app.post('/webhook', lineBotSdk.middleware(lineConfig), async (req, res) => {
        try {
                  const events = req.body.events || [];
                  await Promise.all(events.map(handleEvent));
                  res.status(200).end();
        } catch (err) {
                  console.error('Webhook error:', err);
                  res.status(500).end();
        }
});

async function handleEvent(event) {
        console.log('DEBUG source:', JSON.stringify(event.source));
        if (event.type === 'message' && event.message.type === 'text') {
                  const rawText = (event.message.text || '').trim();
                  const lowerText = rawText.toLowerCase();
                  if (lowerText.startsWith('camera ') || lowerText.startsWith('cam ')) {
                              const camName = lowerText.replace(/^camera\s+|^cam\s+/, '').trim();
                              const deviceId = config.IMOU_CAMERAS[camName];
                              if (!deviceId) {
                                            return client.replyMessage(event.replyToken, {
                                                            type: 'text',
                                                            text: 'Không tìm thấy camera "' + camName + '". Các camera: ' + Object.keys(config.IMOU_CAMERAS).join(', '),
                                            });
                              }
                              try {
                                            const snapUrl = await imouClient.getSnapshotUrl(deviceId, '0');
                                            return client.replyMessage(event.replyToken, {
                                                            type: 'image',
                                                            originalContentUrl: snapUrl,
                                                            previewImageUrl: snapUrl,
                                            });
                              } catch (camErr) {
                                            console.error('Camera snapshot error:', camErr);
                                            return client.replyMessage(event.replyToken, {
                                                            type: 'text',
                                                            text: 'Không lấy được ảnh camera, vui lòng thử lại sau.',
                                            });
                              }
                  }
        }
        return null;}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on port ' + PORT));

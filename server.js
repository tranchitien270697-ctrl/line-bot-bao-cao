require('dotenv').config();
const express = require('express');
const lineBotSdk = require('@line/bot-sdk');
const config = require('./config');
const reportEngine = require('./reportEngine');
const flexBuilder = require('./flexBuilder');
const lunarCalendar = require('./lunarCalendar');
const imouClient = require('./imouClient');

const lineConfig = {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
        channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const app = express();
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

          if (req.params.id === 'cleaning') {
                      const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
                      const dow = now.getDay();
                      const people = config.CLEANING_SCHEDULE[dow] || [];
                      const dayLabel = config.DAY_LABELS[dow];
                      if (people.length === 0) {
                                    return res.send('No cleaning duty today (' + dayLabel + ')');
                      }
                      const cleaningMsg = flexBuilder.buildCleaningFlexMessage(dayLabel, people);
                      await client.pushMessage(config.TARGET_GROUP_ID, cleaningMsg);
                      return res.send('Sent cleaning reminder for ' + dayLabel);
          }

          if (req.params.id === 'daily') {
                      let weatherText = 'Không lấy được dữ liệu thời tiết';
                      try {
                                    const wRes = await fetch('https://wttr.in/' + config.WEATHER_LOCATION + '?format=3&m&lang=vi');
                                    weatherText = (await wRes.text()).trim();
                      } catch (weatherErr) {
                                    console.error('Weather fetch error:', weatherErr);
                      }
                      const lunarText = lunarCalendar.getTodayLunarText();
                      const solarNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }));
                      const solarText = config.DAY_LABELS[solarNow.getDay()] + ', ngày ' + solarNow.getDate() + ' tháng ' + (solarNow.getMonth() + 1) + ' năm ' + solarNow.getFullYear();
                      const quote = config.LIFE_QUOTES[Math.floor(Math.random() * config.LIFE_QUOTES.length)];
                      const holidayText = lunarCalendar.getTodayHoliday();
                      const dailyMsg = flexBuilder.buildDailyFlexMessage(weatherText, solarText, lunarText, quote, holidayText);
                      await client.pushMessage(config.TARGET_GROUP_ID, dailyMsg);
                      return res.send('Sent daily card');
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
        return null; // Da tat lenh "bao cao" va "doanh thu hien tai" (Google Sheet cu)
  if (event.type !== 'message' || event.message.type !== 'text') return null;
        const text = (event.message.text || '').toLowerCase();
        const isActualRequest = text.includes(config.ACTUAL_KEYWORD.toLowerCase());
        const isReportRequest = text.includes(config.TRIGGER_KEYWORD.toLowerCase());
        if (!isActualRequest && !isReportRequest) return null;

  try {
            if (isActualRequest) {
                        const actual = await reportEngine.buildActualToDateRevenue();
                        const todayFlexMessage = flexBuilder.buildTodayRevenueFlexMessage(actual);
                        return client.replyMessage(event.replyToken, todayFlexMessage);
            }
            const data = await reportEngine.buildReportData();
            const flexMessage = flexBuilder.buildReportFlexMessage(data);
            return client.replyMessage(event.replyToken, flexMessage);
  } catch (err) {
            console.error('Loi khi tao bao cao:', err);
            return client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: 'Xin loi, hien chua lay duoc du lieu tu Google Sheet.',
            });
  }
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server listening on port ' + PORT));

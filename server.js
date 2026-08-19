require('dotenv').config();
const express = require('express');
const lineBotSdk = require('@line/bot-sdk');
const config = require('./config');
const reportEngine = require('./reportEngine');
const flexBuilder = require('./flexBuilder');

const lineConfig = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET,
};

const app = express();
const client = new lineBotSdk.Client(lineConfig);

app.get('/', (req, res) => res.send('LINE report bot is running'));

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

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

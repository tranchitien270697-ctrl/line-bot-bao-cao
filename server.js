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
                                if (event.type !== 'message' || event.message.type !== 'text') return null;
                                  const text = (event.message.text || '').toLowerCase();
                                    if (!text.includes(config.TRIGGER_KEYWORD.toLowerCase())) return null;

                                      try {
                                          const data = await reportEngine.buildReportData();
                                              const flexMessage = flexBuilder.buildReportFlexMessage(data);
                                                  return client.replyMessage(event.replyToken, flexMessage);
                                                    } catch (err) {
                                                        console.error('Loi khi tao bao cao:', err);
                                                            return client.replyMessage(event.replyToken, {
                                                                  type: 'text',
                                                                        text: 'Xin loi, hien chua lay duoc du lieu tu Google Sheet. Kiem tra lai quyen chia se Sheet hoac ket noi mang cua server.',
                                                                            });
                                                                              }
                                                                              }

                                                                              const PORT = process.env.PORT || 3000;
                                                                              app.listen(PORT, () => console.log('Server listening on port ' + PORT));

const GREEN = '#06C755';
const RED = '#FF334B';
const GREY = '#8C8C8C';
const DARK = '#1A1A1A';

function formatVND(n) {
    return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' d';
}
function formatNumber(n, decimals) {
    return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
}
function formatPct(pct) {
    if (pct === null) return 'N/A';
    return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
}
function deltaColor(n) { return n >= 0 ? GREEN : RED; }
function arrow(n) { return n >= 0 ? String.fromCharCode(9650) : String.fromCharCode(9660); }

function kvRow(label, value, opts) {
    opts = opts || {};
    return {
          type: 'box', layout: 'baseline',
          contents: [
            { type: 'text', text: label, size: 'sm', color: GREY, flex: 4 },
            { type: 'text', text: value, size: opts.size || 'sm', color: opts.color || DARK, align: 'end', flex: 5, weight: opts.weight || 'regular' },
                ],
    };
}

function groupRow(name, delta, pct) {
    const color = deltaColor(delta);
    return {
          type: 'box', layout: 'horizontal', margin: 'md',
          contents: [
            { type: 'text', text: name, size: 'sm', color: DARK, weight: 'bold', flex: 3 },
            { type: 'text', text: arrow(delta) + ' ' + formatVND(Math.abs(delta)), size: 'xs', color: color, flex: 5, align: 'end' },
            { type: 'text', text: formatPct(pct), size: 'sm', color: color, weight: 'bold', flex: 2, align: 'end' },
                ],
    };
}


function buildCleaningCard(dayLabel, people) {
      const PALETTE = ['#FF6B6B', '#FFA94D', '#51CF66', '#339AF0', '#CC5DE8'];
      const rows = people.map((p, i) => ({
              type: 'box', layout: 'horizontal', backgroundColor: PALETTE[i % PALETTE.length], cornerRadius: 'lg', paddingAll: 'md', margin: i === 0 ? 'none' : 'md',
              contents: [
                  { type: 'text', text: '🧹', flex: 0, size: 'lg' },
                  { type: 'text', text: p, color: '#FFFFFF', weight: 'bold', size: 'md', margin: 'md', gravity: 'center', wrap: true },
                      ],
      }));
      return {
              type: 'bubble', size: 'mega',
              header: {
                        type: 'box', layout: 'vertical', backgroundColor: '#7B61FF', paddingAll: 'lg',
                        contents: [
                            { type: 'text', text: 'LỊCH VỆ SINH HÔM NAY', color: '#FFFFFF', weight: 'bold', size: 'lg' },
                            { type: 'text', text: dayLabel, color: '#FFFFFF', size: 'md' },
                                  ],
              },
              body: {
                        type: 'box', layout: 'vertical', backgroundColor: '#F5F3FF', paddingAll: 'lg',
                        contents: rows,
              },
      };
}

function buildCleaningFlexMessage(dayLabel, people) {
      return {
              type: 'flex',
              altText: 'Lịch vệ sinh ' + dayLabel + ': ' + people.join(', '),
              contents: buildCleaningCard(dayLabel, people),
      };
}

function buildReminderCard(text) {
      return {
              type: 'bubble', size: 'mega',
              header: {
                        type: 'box', layout: 'vertical', backgroundColor: '#66BB6A', paddingAll: 'lg',
                        contents: [
                            { type: 'text', text: '🔔 THÔNG BÁO CÔNG VIỆC', color: '#FFFFFF', weight: 'bold', size: 'lg', wrap: true },
                                  ],
              },
              body: {
                        type: 'box', layout: 'vertical', backgroundColor: '#E8F5E9', paddingAll: 'lg',
                        contents: [
                            {
                                          type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'lg',
                                          contents: [
                                              { type: 'text', text: text, size: 'md', color: '#2E7D32', weight: 'bold', wrap: true },
                                                        ],
                            },
                                  ],
              },
      };
}

function buildReminderFlexMessage(text) {
      return {
              type: 'flex',
              altText: text.length > 95 ? text.substring(0, 95) + '...' : text,
              contents: buildReminderCard(text),
      };
}

function buildDailyCard(weatherText, solarText, lunarText, quote, holidayText) {
      return {
              type: 'bubble', size: 'mega',
              header: {
                        type: 'box', layout: 'vertical', backgroundColor: '#42A5F5', paddingAll: 'lg',
                        contents: [
                            { type: 'text', text: '☀️ CHÀO BUỔI SÁNG!', color: '#FFFFFF', weight: 'bold', size: 'lg' },
                                  ],
              },
              body: {
                        type: 'box', layout: 'vertical', backgroundColor: '#E3F2FD', paddingAll: 'lg', spacing: 'md',
                        contents: [
                            {
                                          type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md',
                                          contents: [
                                              { type: 'text', text: '🌤️ Thời tiết hôm nay', size: 'sm', color: '#1565C0', weight: 'bold' },
                                              { type: 'text', text: weatherText, size: 'sm', color: '#333333', wrap: true, margin: 'sm' },
                                                        ],
                            },
                            {
                                          type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md', margin: 'md',
                                          contents: [
                                              { type: 'text', text: '📅 Ngày dương lịch', size: 'sm', color: '#1565C0', weight: 'bold' },
                                { type: 'text', text: solarText, size: 'sm', color: '#333333', wrap: true, margin: 'sm' },
                                                        ],
                            },
                            {
                                          type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md', margin: 'md',
                                          contents: [
                                              { type: 'text', text: '🌙 Âm lịch', size: 'sm', color: '#1565C0', weight: 'bold' },
                                              { type: 'text', text: lunarText, size: 'sm', color: '#333333', wrap: true, margin: 'sm' },
                                                        ],
                            },
                                    ...(holidayText ? [{
                                                  type: 'box', layout: 'vertical', backgroundColor: '#FFEBEE', cornerRadius: 'lg', paddingAll: 'md', margin: 'md',
                                                  contents: [
                                                      { type: 'text', text: '🎉 Ngày lễ hôm nay', size: 'sm', color: '#C62828', weight: 'bold' },
                                                      { type: 'text', text: holidayText, size: 'sm', color: '#B71C1C', weight: 'bold', wrap: true, margin: 'sm' },
                                                                ],
                                    }] : []),
                            {
                                          type: 'box', layout: 'vertical', backgroundColor: '#FFF9C4', cornerRadius: 'lg', paddingAll: 'md', margin: 'md',
                                          contents: [
                                              { type: 'text', text: '💬 Châm ngôn hôm nay', size: 'sm', color: '#F57F17', weight: 'bold' },
                                              { type: 'text', text: quote, size: 'sm', color: '#5D4037', wrap: true, margin: 'sm', style: 'italic' },
                                                        ],
                            },
                                  ],
              },
      };
}

function buildDailyFlexMessage(weatherText, solarText, lunarText, quote, holidayText) {
      return {
              type: 'flex',
              altText: 'Chào buổi sáng! ' + weatherText,
              contents: buildDailyCard(weatherText, solarText, lunarText, quote, holidayText),
      };
}

function buildGoodnightCard(weatherText, tip) {
      const DARKBLUE = '#0D2B5C';
      return {
              type: 'bubble', size: 'mega',
              header: {
                        type: 'box', layout: 'vertical', backgroundColor: DARKBLUE, paddingAll: 'lg',
                        contents: [
                            { type: 'text', text: '🌙 CHÚC NGỦ NGON', color: '#FFFFFF', weight: 'bold', size: 'lg' },
                            { type: 'text', text: 'Nghỉ ngơi sớm nhé, Anh Chị!', color: '#B0C4DE', size: 'xs' },
                                  ],
              },
              body: {
                        type: 'box', layout: 'vertical', backgroundColor: '#E8EAF6', paddingAll: 'lg', spacing: 'md',
                        contents: [
                            {
                                          type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md',
                                          contents: [
                                              { type: 'text', text: '🌤️ Thời tiết', size: 'sm', color: DARKBLUE, weight: 'bold' },
                                              { type: 'text', text: weatherText, size: 'sm', color: '#333333', wrap: true, margin: 'sm' },
                                                        ],
                            },
                            {
                                          type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md', margin: 'md',
                                          contents: [
                                              { type: 'text', text: '🙏 Châm ngôn nhà Phật', size: 'sm', color: DARKBLUE, weight: 'bold' },
                                              { type: 'text', text: tip, size: 'sm', color: '#333333', wrap: true, margin: 'sm' },
                                                        ],
                            },
                            {
                                          type: 'box', layout: 'vertical', backgroundColor: DARKBLUE, cornerRadius: 'lg', paddingAll: 'md', margin: 'md',
                                          contents: [
                                              { type: 'text', text: 'Chúc Anh Chị Ngủ Ngon! Nghỉ ngơi sớm nhé !', color: '#FFFFFF', weight: 'bold', size: 'sm', wrap: true, align: 'center' },
                                                        ],
                            },
                                  ],
              },
      };
}

function buildGoodnightFlexMessage(weatherText, tip) {
      return {
              type: 'flex',
              altText: 'Chúc Anh Chị Ngủ Ngon! ' + weatherText,
              contents: buildGoodnightCard(weatherText, tip),
      };
}

function buildRevenueDetailCard(storeLabel, todayTotal, yesterdayTotal, industries) {
      const BLUE = '#1565C0';
      const totalDelta = todayTotal - yesterdayTotal;
      const totalPct = yesterdayTotal ? (totalDelta / yesterdayTotal) * 100 : null;
      const now = new Date();
      const timeStr = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });

      const sorted = industries.slice().sort((a, b) => Math.max(b.t, b.y) - Math.max(a.t, a.y));
      const top = sorted.slice(0, 6);
      const restCount = sorted.length - top.length;

      const industryRows = top.map((it, i) => {
              const delta = it.t - it.y;
              const pct = it.y ? (delta / it.y) * 100 : null;
              return {
                        type: 'box', layout: 'horizontal', margin: i === 0 ? 'none' : 'sm',
                        contents: [
                            { type: 'text', text: it.n, size: 'xs', color: DARK, flex: 5, wrap: true },
                            { type: 'text', text: formatVND(it.t), size: 'xs', color: BLUE, weight: 'bold', flex: 3, align: 'end' },
                            { type: 'text', text: arrow(delta) + formatPct(pct), size: 'xxs', color: deltaColor(delta), flex: 2, align: 'end', gravity: 'center' },
                                  ],
              };
      });
      if (restCount > 0) {
              industryRows.push({ type: 'text', text: 'và ' + restCount + ' ngành hàng khác', size: 'xxs', color: GREY, margin: 'md', align: 'center' });
      }

      return {
              type: 'bubble', size: 'mega',
              header: {
                        type: 'box', layout: 'vertical', backgroundColor: BLUE, paddingAll: 'lg', spacing: 'xs',
                        contents: [
                            { type: 'text', text: storeLabel, color: '#FFFFFF', weight: 'bold', size: 'md' },
                            { type: 'text', text: 'Doanh thu hôm nay', color: '#BBDEFB', size: 'xs' },
                                  ],
              },
              body: {
                        type: 'box', layout: 'vertical', paddingAll: 'lg', spacing: 'md',
                        contents: [
                            { type: 'text', text: formatVND(todayTotal), size: 'xxl', color: BLUE, weight: 'bold' },
                            {
                                          type: 'box', layout: 'horizontal',
                                          contents: [
                                              { type: 'text', text: 'Hôm qua ' + formatVND(yesterdayTotal), size: 'xs', color: GREY, flex: 3 },
                                              { type: 'text', text: arrow(totalDelta) + ' ' + formatPct(totalPct), size: 'sm', weight: 'bold', color: deltaColor(totalDelta), flex: 2, align: 'end' },
                                                        ],
                            },
                            { type: 'separator', margin: 'md' },
                            { type: 'text', text: 'NGÀNH HÀNG NỔI BẬT', size: 'xxs', color: GREY, weight: 'bold', margin: 'md' },
                            { type: 'box', layout: 'vertical', margin: 'sm', contents: industryRows },
                            { type: 'text', margin: 'md', size: 'xxs', color: GREY, text: timeStr },
                                  ],
              },
      };
}

function buildRevenueDetailFlexMessage(storeLabel, todayTotal, yesterdayTotal, industries) {
      return {
              type: 'flex',
              altText: 'Doanh thu hôm nay - ' + storeLabel + ': ' + formatVND(todayTotal),
              contents: buildRevenueDetailCard(storeLabel, todayTotal, yesterdayTotal, industries),
      };
}

function buildMorningCombinedCard(greetingText, weatherText, solarText, lunarText, quote, holidayText, cleaningDayLabel, cleaningPeople) {
const PALETTE = ['#FF6B6B', '#FFA94D', '#51CF66', '#339AF0', '#CC5DE8'];
const cleaningRows = (cleaningPeople || []).map((p, i) => ({
type: 'box', layout: 'horizontal', backgroundColor: PALETTE[i % PALETTE.length], cornerRadius: 'md', paddingAll: 'sm', margin: i === 0 ? 'sm' : 'xs',
contents: [
{ type: 'text', text: '\uD83E\uDDF9', flex: 0, size: 'sm' },
{ type: 'text', text: p, color: '#FFFFFF', weight: 'bold', size: 'sm', margin: 'sm', gravity: 'center', wrap: true },
],
}));
const cleaningBox = cleaningRows.length > 0 ? [{
type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md', margin: 'md',
contents: [
{ type: 'text', text: '\uD83E\uDDF9 Lịch vệ sinh - ' + cleaningDayLabel, size: 'sm', color: '#1565C0', weight: 'bold' },
...cleaningRows,
],
}] : [];
return {
type: 'bubble', size: 'mega',
header: {
type: 'box', layout: 'vertical', backgroundColor: '#42A5F5', paddingAll: 'lg',
contents: [
{ type: 'text', text: '\u2600\uFE0F CHÀO BUỔI SÁNG!', color: '#FFFFFF', weight: 'bold', size: 'lg' },
],
},
body: {
type: 'box', layout: 'vertical', backgroundColor: '#E3F2FD', paddingAll: 'lg', spacing: 'md',
contents: [
{
type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md',
contents: [
{ type: 'text', text: '\uD83D\uDC4B Chào ngày mới', size: 'sm', color: '#1565C0', weight: 'bold' },
{ type: 'text', text: greetingText, size: 'sm', color: '#333333', wrap: true, margin: 'sm' },
],
},
{
type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md',
contents: [
{ type: 'text', text: '\uD83C\uDF24\uFE0F Thời tiết hôm nay', size: 'sm', color: '#1565C0', weight: 'bold' },
{ type: 'text', text: weatherText, size: 'sm', color: '#333333', wrap: true, margin: 'sm' },
],
},
{
type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md',
contents: [
{ type: 'text', text: '\uD83D\uDCC5 Ngày dương lịch', size: 'sm', color: '#1565C0', weight: 'bold' },
{ type: 'text', text: solarText, size: 'sm', color: '#333333', wrap: true, margin: 'sm' },
],
},
{
type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md',
contents: [
{ type: 'text', text: '\uD83C\uDF19 Âm lịch', size: 'sm', color: '#1565C0', weight: 'bold' },
{ type: 'text', text: lunarText, size: 'sm', color: '#333333', wrap: true, margin: 'sm' },
],
},
...(holidayText ? [{
type: 'box', layout: 'vertical', backgroundColor: '#FFEBEE', cornerRadius: 'lg', paddingAll: 'md',
contents: [
{ type: 'text', text: '\uD83C\uDF89 Ngày lễ hôm nay', size: 'sm', color: '#C62828', weight: 'bold' },
{ type: 'text', text: holidayText, size: 'sm', color: '#B71C1C', weight: 'bold', wrap: true, margin: 'sm' },
],
}] : []),
...cleaningBox,
{
type: 'box', layout: 'vertical', backgroundColor: '#FFF9C4', cornerRadius: 'lg', paddingAll: 'md',
contents: [
{ type: 'text', text: '\uD83D\uDCAC Châm ngôn hôm nay', size: 'sm', color: '#F57F17', weight: 'bold' },
{ type: 'text', text: quote, size: 'sm', color: '#5D4037', wrap: true, margin: 'sm', style: 'italic' },
],
},
],
},
};
}

function buildMorningCombinedFlexMessage(greetingText, weatherText, solarText, lunarText, quote, holidayText, cleaningDayLabel, cleaningPeople) {
return {
type: 'flex',
altText: 'Chao buoi sang! ' + weatherText,
contents: buildMorningCombinedCard(greetingText, weatherText, solarText, lunarText, quote, holidayText, cleaningDayLabel, cleaningPeople),
};
}

function buildReminderWithCleaningFlexMessage(reminderText, cleaningDayLabel, cleaningPeople) {
const PALETTE = ['#FF6B6B', '#FFA94D', '#51CF66', '#339AF0', '#CC5DE8'];
const cleaningRows = (cleaningPeople || []).map((p, i) => ({
type: 'box', layout: 'horizontal', backgroundColor: PALETTE[i % PALETTE.length], cornerRadius: 'md', paddingAll: 'sm', margin: i === 0 ? 'sm' : 'xs',
contents: [
{ type: 'text', text: '\uD83E\uDDF9', flex: 0, size: 'sm' },
{ type: 'text', text: p, color: '#FFFFFF', weight: 'bold', size: 'sm', margin: 'sm', gravity: 'center', wrap: true },
],
}));
const cleaningBox = cleaningRows.length > 0 ? [{
type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md', margin: 'md',
contents: [
{ type: 'text', text: '\uD83E\uDDF9 Nhắc lại lịch vệ sinh - ' + cleaningDayLabel, size: 'sm', color: '#1565C0', weight: 'bold' },
...cleaningRows,
],
}] : [];
const bubble = {
type: 'bubble', size: 'mega',
header: {
type: 'box', layout: 'vertical', backgroundColor: GREEN, paddingAll: 'lg',
contents: [
{ type: 'text', text: '\uD83D\uDD14 NHAC VIEC', color: '#FFFFFF', weight: 'bold', size: 'lg' },
],
},
body: {
type: 'box', layout: 'vertical', backgroundColor: '#F1F8E9', paddingAll: 'lg', spacing: 'md',
contents: [
{
type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'md',
contents: [
{ type: 'text', text: reminderText, size: 'sm', color: '#333333', wrap: true },
],
},
...cleaningBox,
],
},
};
return { type: 'flex', altText: reminderText, contents: bubble };
}

module.exports = { buildCleaningFlexMessage: buildCleaningFlexMessage, buildReminderFlexMessage: buildReminderFlexMessage, buildDailyFlexMessage: buildDailyFlexMessage, buildRevenueDetailFlexMessage: buildRevenueDetailFlexMessage, buildGoodnightFlexMessage: buildGoodnightFlexMessage, buildMorningCombinedFlexMessage: buildMorningCombinedFlexMessage, buildReminderWithCleaningFlexMessage: buildReminderWithCleaningFlexMessage };

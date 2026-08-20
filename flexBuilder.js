const config = require('./config');

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


function buildReportCard(data) {
    const revenue = data.revenue, group = data.revenueByGroup, volume = data.volume, meta = data.meta;
    return {
          type: 'bubble', size: 'mega',
          header: {
                  type: 'box', layout: 'vertical', backgroundColor: GREEN, paddingAll: 'lg',
                  contents: [
    { type: 'text', text: 'BAO CAO KINH DOANH', color: '#FFFFFF', weight: 'bold', size: 'lg' },
                    { type: 'text', text: 'Du kien ' + config.LABEL_CURR_MONTH + ' so voi ' + config.LABEL_PREV_MONTH, color: '#FFFFFF', size: 'sm' },
                          ],
          },
                body: {
                        type: 'box', layout: 'vertical', spacing: 'md',
                        contents: [
                          { type: 'text', text: 'TONG DOANH THU', weight: 'bold', size: 'sm', color: GREEN },
                                  kvRow(config.LABEL_CURR_MONTH + ' (du kien)', formatVND(revenue.currProjectedTotal), { weight: 'bold', size: 'md' }),
                                  kvRow(config.LABEL_PREV_MONTH + ' (thuc te)', formatVND(revenue.prevTotal)),
                                  kvRow('Chenh lech', arrow(revenue.delta) + ' ' + formatVND(Math.abs(revenue.delta)) + '  ' + formatPct(revenue.pct), { color: deltaColor(revenue.delta), weight: 'bold' }),
                     { type: 'separator', margin: 'lg' },
                          { type: 'text', text: 'DOANH THU THEO NGANH HANG (chenh lech)', weight: 'bold', size: 'sm', color: GREEN, margin: 'lg', wrap: true },
                                  groupRow('FMCG', group.fmcg.delta, group.fmcg.pct),
                                  groupRow('FRESH', group.fresh.delta, group.fresh.pct),
                          { type: 'separator', margin: 'lg' },
                          { type: 'text', text: 'SAN LUONG BAN', weight: 'bold', size: 'sm', color: GREEN, margin: 'lg' },
                                  kvRow(config.LABEL_CURR_MONTH + ' (du kien)', formatNumber(volume.currProjectedTotal, 1), { weight: 'bold', size: 'md' }),
                                  kvRow(config.LABEL_PREV_MONTH + ' (thuc te)', formatNumber(volume.prevTotal, 1)),
                                  kvRow('Chenh lech', arrow(volume.delta) + ' ' + formatNumber(Math.abs(volume.delta), 1) + '  ' + formatPct(volume.pct), { color: deltaColor(volume.delta), weight: 'bold' }),
                          { type: 'separator', margin: 'lg' },
                          { type: 'text', margin: 'lg', size: 'xxs', color: GREY, wrap: true, text: 'Du lieu ' + config.LABEL_CURR_MONTH + ': ' + meta.revCurrDayCount + '/' + meta.daysInTargetMonth + ' ngay' },
                                ],
                },
    };
}



                    function buildReportFlexMessage(data) {
                        const bubble = buildReportCard(data);
                        return {
                              type: 'flex',
                              altText: 'Bao cao kinh doanh du kien ' + (data.revenue.pct >= 0 ? 'tang' : 'giam') + ' ' + Math.abs(data.revenue.pct).toFixed(1) + '%',
                              contents: bubble,
                        };
                    }

function buildTodayRevenueCard(actual) {
      const offlineVAT = actual.offlineVAT || 0;
      const onlineVAT = actual.onlineVAT || 0;
      const OFFLINE_COLOR = '#3E5CFF';
      const ONLINE_COLOR = '#FF8A00';
      const now = new Date();
      const timeStr = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });
      return {
              type: 'bubble', size: 'mega',
              header: {
                        type: 'box', layout: 'vertical', backgroundColor: GREEN, paddingAll: 'lg',
                        contents: [
                            { type: 'text', text: 'DOANH THU HIỆN TẠI', color: '#FFFFFF', weight: 'bold', size: 'lg' },
                            { type: 'text', text: 'Ngày ' + (actual.date || 'Không xác định'), color: '#FFFFFF', size: 'sm' },
                                  ],
              },
              body: {
                        type: 'box', layout: 'vertical', spacing: 'md',
                        contents: [
                                    kvRow('Tổng doanh thu', formatVND(actual.total), { weight: 'bold', size: 'md', color: GREEN }),
                            { type: 'separator', margin: 'lg' },
                            { type: 'text', text: 'DOANH THU THEO KÊNH BÁN (đã VAT)', weight: 'bold', size: 'sm', color: GREEN, margin: 'lg', wrap: true },
                            {
                                          type: 'box', layout: 'vertical', margin: 'md',
                                          contents: [
                                              { type: 'text', text: 'Doanh thu Offline', size: 'sm', color: DARK, weight: 'bold' },
                                              { type: 'text', text: formatVND(offlineVAT), size: 'md', color: OFFLINE_COLOR, weight: 'bold' },
                                                        ],
                            },
                            {
                                          type: 'box', layout: 'vertical', margin: 'md',
                                          contents: [
                                              { type: 'text', text: 'Doanh thu Online', size: 'sm', color: DARK, weight: 'bold' },
                                              { type: 'text', text: formatVND(onlineVAT), size: 'md', color: ONLINE_COLOR, weight: 'bold' },
                                                        ],
                            },
                            { type: 'separator', margin: 'lg' },
                            { type: 'text', margin: 'lg', size: 'xxs', color: GREY, wrap: true, text: 'Thời gian tạo báo cáo: ' + timeStr },
                                  ],
              },
      };
}

function buildTodayRevenueFlexMessage(actual) {
      return {
              type: 'flex',
              altText: 'Doanh thu ngày ' + (actual.date || '') + ': ' + formatVND(actual.total),
              contents: buildTodayRevenueCard(actual),
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

function buildDailyCard(weatherText, lunarText, quote) {
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
                                              { type: 'text', text: '🌙 Âm lịch', size: 'sm', color: '#1565C0', weight: 'bold' },
                                              { type: 'text', text: lunarText, size: 'sm', color: '#333333', wrap: true, margin: 'sm' },
                                                        ],
                            },
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

function buildDailyFlexMessage(weatherText, lunarText, quote) {
      return {
              type: 'flex',
              altText: 'Chào buổi sáng! ' + weatherText,
              contents: buildDailyCard(weatherText, lunarText, quote),
      };
}

function buildRevenueCompareCard(storeLabel, todayOffline, yesterdayOffline, todayOnline, yesterdayOnline) {
      const BLUE = '#1565C0';
      const LIGHT_BLUE = '#E3F2FD';
      const offlineDelta = todayOffline - yesterdayOffline;
      const offlinePct = yesterdayOffline ? (offlineDelta / yesterdayOffline) * 100 : null;
      const onlineDelta = todayOnline - yesterdayOnline;
      const onlinePct = yesterdayOnline ? (onlineDelta / yesterdayOnline) * 100 : null;
      const now = new Date();
      const timeStr = now.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false });

  function channelBox(label, todayVal, yesterdayVal, delta, pct, isFirst) {
          return {
                    type: 'box', layout: 'vertical', backgroundColor: '#FFFFFF', cornerRadius: 'lg', paddingAll: 'lg', margin: isFirst ? 'none' : 'md',
                    contents: [
                        { type: 'text', text: label, size: 'sm', color: GREY, weight: 'bold' },
                        { type: 'text', text: formatVND(todayVal), size: 'xxl', color: BLUE, weight: 'bold', margin: 'sm' },
                        {
                                      type: 'box', layout: 'horizontal', margin: 'md',
                                      contents: [
                                          { type: 'text', text: 'Hôm qua: ' + formatVND(yesterdayVal), size: 'xs', color: GREY, flex: 3 },
                                          { type: 'text', text: arrow(delta) + ' ' + formatPct(pct), size: 'sm', color: deltaColor(delta), weight: 'bold', flex: 2, align: 'end' },
                                                    ],
                        },
                              ],
          };
  }

  return {
          type: 'bubble', size: 'mega',
          header: {
                    type: 'box', layout: 'vertical', backgroundColor: BLUE, paddingAll: 'lg',
                    contents: [
                        { type: 'text', text: '📊 DOANH THU HÔM NAY', color: '#FFFFFF', weight: 'bold', size: 'lg' },
                        { type: 'text', text: storeLabel, color: '#FFFFFF', size: 'sm' },
                              ],
          },
          body: {
                    type: 'box', layout: 'vertical', backgroundColor: LIGHT_BLUE, paddingAll: 'lg',
                    contents: [
                                channelBox('Doanh thu Offline', todayOffline, yesterdayOffline, offlineDelta, offlinePct, true),
                                channelBox('Doanh thu Online', todayOnline, yesterdayOnline, onlineDelta, onlinePct, false),
                        { type: 'separator', margin: 'lg' },
                        { type: 'text', margin: 'lg', size: 'xxs', color: GREY, wrap: true, text: 'Cập nhật lúc: ' + timeStr },
                              ],
          },
  };
}

function buildRevenueCompareFlexMessage(storeLabel, todayOffline, yesterdayOffline, todayOnline, yesterdayOnline) {
      return {
              type: 'flex',
              altText: 'Doanh thu hôm nay - ' + storeLabel,
              contents: buildRevenueCompareCard(storeLabel, todayOffline, yesterdayOffline, todayOnline, yesterdayOnline),
      };
}

module.exports = { buildReportFlexMessage: buildReportFlexMessage, buildTodayRevenueFlexMessage: buildTodayRevenueFlexMessage, buildCleaningFlexMessage: buildCleaningFlexMessage, buildReminderFlexMessage: buildReminderFlexMessage, buildDailyFlexMessage: buildDailyFlexMessage, buildRevenueCompareFlexMessage: buildRevenueCompareFlexMessage };

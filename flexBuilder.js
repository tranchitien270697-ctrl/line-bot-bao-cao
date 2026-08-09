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

module.exports = { buildReportFlexMessage: buildReportFlexMessage };

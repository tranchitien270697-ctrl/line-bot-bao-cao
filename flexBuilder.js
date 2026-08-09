const config = require('./config');

const GREEN = '#06C755', RED = '#FF334B', GREY = '#8C8C8C', DARK = '#1A1A1A';

function formatVND(n) { return new Intl.NumberFormat('vi-VN').format(Math.round(n)) + ' d'; }
function formatNumber(n, decimals) {
  return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n);
  }
  function formatPct(pct) {
    if (pct === null) return 'N/A';
      return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
      }
      function deltaColor(n) { return n >= 0 ? GREEN : RED; }
      function arrow(n) { return n >= 0 ? 'up' : 'down'; }

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

                                    function industryRow(item) {
                                      const color = deltaColor(item.delta);
                                        return {
                                            type: 'box', layout: 'vertical', margin: 'md',
                                                contents: [
                                                      { type: 'text', text: item.industry, size: 'sm', color: DARK, wrap: true, weight: 'bold' },
                                                            { type: 'box', layout: 'baseline', margin: 'xs', contents: [
                                                                    { type: 'text', text: arrow(item.delta) + ' ' + formatVND(Math.abs(item.delta)), size: 'sm', color, flex: 3 },
                                                                            { type: 'text', text: formatPct(item.pct), size: 'sm', color, align: 'end', flex: 2, weight: 'bold' },
                                                                                  ]},
                                                                                      ],
                                                                                        };
                                                                                        }

                                                                                        function buildSummaryBubble(data) {
                                                                                          const revenue = data.revenue, volume = data.volume, meta = data.meta;
                                                                                            return {
                                                                                                type: 'bubble', size: 'mega',
                                                                                                    header: { type: 'box', layout: 'vertical', backgroundColor: '#06C755', paddingAll: 'lg', contents: [
                                                                                                          { type: 'text', text: 'BAO CAO KINH DOANH', color: '#FFFFFF', weight: 'bold', size: 'lg' },
                                                                                                                { type: 'text', text: config.LABEL_PREV_MONTH + ' vs ' + config.LABEL_CURR_MONTH, color: '#FFFFFF', size: 'sm' },
                                                                                                                    ]},
                                                                                                                        body: { type: 'box', layout: 'vertical', spacing: 'md', contents: [
                                                                                                                              { type: 'text', text: 'TONG DOANH THU', weight: 'bold', size: 'sm', color: GREY },
                                                                                                                                    kvRow(config.LABEL_PREV_MONTH, formatVND(revenue.prevTotal)),
                                                                                                                                          kvRow(config.LABEL_CURR_MONTH, formatVND(revenue.currProjectedTotal), { weight: 'bold', size: 'md' }),
                                                                                                                                                kvRow('Tang giam', arrow(revenue.delta) + ' ' + formatVND(Math.abs(revenue.delta)) + ' (' + formatPct(revenue.pct) + ')', { color: deltaColor(revenue.delta), weight: 'bold' }),
                                                                                                                                                      { type: 'separator', margin: 'lg' },
                                                                                                                                                            { type: 'text', text: 'TONG SAN LUONG', weight: 'bold', size: 'sm', color: GREY, margin: 'lg' },
                                                                                                                                                                  kvRow(config.LABEL_PREV_MONTH, formatNumber(volume.prevTotal, 1)),
                                                                                                                                                                        kvRow(config.LABEL_CURR_MONTH, formatNumber(volume.currProjectedTotal, 1), { weight: 'bold', size: 'md' }),
                                                                                                                                                                              kvRow('Tang giam', arrow(volume.delta) + ' ' + formatNumber(Math.abs(volume.delta), 1) + ' (' + formatPct(volume.pct) + ')', { color: deltaColor(volume.delta), weight: 'bold' }),
                                                                                                                                                                                    { type: 'separator', margin: 'lg' },
                                                                                                                                                                                          { type: 'text', margin: 'lg', size: 'xxs', color: GREY, wrap: true, text: '* ' + config.LABEL_CURR_MONTH + ' du phong tu ' + meta.revCurrDayCount + ' ngay du lieu thuc te x ' + meta.daysInTargetMonth + ' ngay/thang.' },
                                                                                                                                                                                              ]},
                                                                                                                                                                                                };
                                                                                                                                                                                                }
                                                                                                                                                                                                
                                                                                                                                                                                                function buildIndustryBubble(title, color, list) {
                                                                                                                                                                                                  return {
                                                                                                                                                                                                      type: 'bubble', size: 'mega',
                                                                                                                                                                                                          header: { type: 'box', layout: 'vertical', backgroundColor: color, paddingAll: 'lg', contents: [
                                                                                                                                                                                                                { type: 'text', text: title, color: '#FFFFFF', weight: 'bold', size: 'lg' },
                                                                                                                                                                                                                      { type: 'text', text: 'Doanh thu tang giam du kien theo nganh hang', color: '#FFFFFF', size: 'xs', wrap: true },
                                                                                                                                                                                                                          ]},
                                                                                                                                                                                                                              body: { type: 'box', layout: 'vertical',
                                                                                                                                                                                                                                    contents: list.length ? list.map(industryRow) : [{ type: 'text', text: 'Khong co du lieu', size: 'sm', color: GREY }] },
                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                      function buildReportFlexMessage(data) {
                                                                                                                                                                                                                                        const bubbles = [
                                                                                                                                                                                                                                            buildSummaryBubble(data),
                                                                                                                                                                                                                                                buildIndustryBubble('FMCG', '#3E5CFF', data.revenueByIndustry.fmcg),
                                                                                                                                                                                                                                                    buildIndustryBubble('FRESH', '#00A86B', data.revenueByIndustry.fresh),
                                                                                                                                                                                                                                                      ];
                                                                                                                                                                                                                                                        return {
                                                                                                                                                                                                                                                            type: 'flex',
                                                                                                                                                                                                                                                                altText: 'Bao cao kinh doanh du kien ' + (data.revenue.pct >= 0 ? 'tang' : 'giam') + ' ' + Math.abs(data.revenue.pct).toFixed(1) + '%',
                                                                                                                                                                                                                                                                    contents: { type: 'carousel', contents: bubbles },
                                                                                                                                                                                                                                                                      };
                                                                                                                                                                                                                                                                      }
                                                                                                                                                                                                                                                                      
                                                                                                                                                                                                                                                                      module.exports = { buildReportFlexMessage };

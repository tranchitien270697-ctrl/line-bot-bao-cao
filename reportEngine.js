const config = require('./config');
const sheetsClient = require('./sheetsClient');

function normalizeDate(value) {
    const s = String(value).trim();
    const parts = s.split('/');
    if (parts.length === 3) {
          const d = parts[0], m = parts[1], y = parts[2];
          return y + '-' + m.padStart(2, '0') + '-' + d.padStart(2, '0');
        }
    return s;
  }

async function loadRevenueTab(gid) {
    const rows = await sheetsClient.fetchSheetRows(gid);
    const byIndustry = {};
    const days = new Set();
    let total = 0;

    for (const row of rows) {
          if (!row || row.length < 6) continue;
          const date = row[0];
          const industry = row[4];
          const revenue = sheetsClient.parseVNNumber(row[5]);
          if (!industry || revenue == null) continue;

          byIndustry[industry] = (byIndustry[industry] || 0) + revenue;
          total += revenue;
          if (date) days.add(normalizeDate(date));
        }

    return { byIndustry: byIndustry, total: total, dayCount: days.size };
  }

async function loadVolumeTab(gid) {
    const rows = await sheetsClient.fetchSheetRows(gid);
    const byIndustry = {};
    const days = new Set();
    let total = 0;

    for (const row of rows) {
          if (!row || row.length < 6) continue;
          const date = row[0];
          const industry = row[4];
          const volume = sheetsClient.parseVNNumber(row[5]);
          if (!industry || volume == null) continue;

          byIndustry[industry] = (byIndustry[industry] || 0) + volume;
          total += volume;
          if (date) days.add(normalizeDate(date));
        }

    return { byIndustry: byIndustry, total: total, dayCount: days.size };
  }

function project(totalSoFar, dayCountSoFar, daysInMonth) {
    if (!dayCountSoFar) return 0;
    return (totalSoFar / dayCountSoFar) * daysInMonth;
  }

function pctChange(curr, prev) {
    if (!prev) return null;
    return ((curr - prev) / prev) * 100;
  }

async function buildReportData() {
    const TAB_GIDS = config.TAB_GIDS, FRESH_INDUSTRIES = config.FRESH_INDUSTRIES, DAYS_IN_TARGET_MONTH = config.DAYS_IN_TARGET_MONTH;
    const freshSet = new Set(FRESH_INDUSTRIES);

    const revPrev = await loadRevenueTab(TAB_GIDS.revenuePrevMonth);
    const revCurr = await loadRevenueTab(TAB_GIDS.revenueCurrMonth);
    const volPrev = await loadVolumeTab(TAB_GIDS.volumePrevMonth);
    const volCurr = await loadVolumeTab(TAB_GIDS.volumeCurrMonth);

    const revPrevTotal = revPrev.total;
    const revCurrProjected = project(revCurr.total, revCurr.dayCount, DAYS_IN_TARGET_MONTH);
    const revTotalDelta = revCurrProjected - revPrevTotal;
    const revTotalPct = pctChange(revCurrProjected, revPrevTotal);

    const allIndustries = new Set(Object.keys(revPrev.byIndustry).concat(Object.keys(revCurr.byIndustry)));
    const fmcgList = [];
    const freshList = [];

    allIndustries.forEach((industry) => {
          const prevVal = revPrev.byIndustry[industry] || 0;
          const currValProjected = project(revCurr.byIndustry[industry] || 0, revCurr.dayCount, DAYS_IN_TARGET_MONTH);
          const delta = currValProjected - prevVal;
          const pct = pctChange(currValProjected, prevVal);
          const entry = { industry: industry, delta: delta, pct: pct };
          if (freshSet.has(industry)) { freshList.push(entry); } else { fmcgList.push(entry); }
        });

    fmcgList.sort((a, b) => b.delta - a.delta);
    freshList.sort((a, b) => b.delta - a.delta);

    const volPrevTotal = volPrev.total;
    const volCurrProjected = project(volCurr.total, volCurr.dayCount, DAYS_IN_TARGET_MONTH);
    const volDelta = volCurrProjected - volPrevTotal;
    const volPct = pctChange(volCurrProjected, volPrevTotal);

    return {
          revenue: { prevTotal: revPrevTotal, currProjectedTotal: revCurrProjected, delta: revTotalDelta, pct: revTotalPct },
          revenueByIndustry: { fmcg: fmcgList, fresh: freshList },
          volume: { prevTotal: volPrevTotal, currProjectedTotal: volCurrProjected, delta: volDelta, pct: volPct },
          meta: { revCurrDayCount: revCurr.dayCount, volCurrDayCount: volCurr.dayCount, daysInTargetMonth: DAYS_IN_TARGET_MONTH },
        };
  }

module.exports = { buildReportData: buildReportData };

// Writes prices.json: RUB and USD prices from the KZT price and the National Bank of Kazakhstan rate.
// Same formula and parameters as the Telegram bot (price-refresh.json in the bot config). Change both together.
import { readFileSync, writeFileSync } from 'node:fs';

const KZT = { tubage: 25000, 'cleanse-3': 130000, 'fasting-7-7': 120000, 'fasting-14-14': 140000 };
const MARGIN_PERCENT = 3;
const STEP = { rub: 100, usd: 5 };

const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Almaty', day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(new Date()).map((p) => [p.type, p.value]));
const response = await fetch(`https://nationalbank.kz/rss/get_rates.cfm?fdate=${parts.day}.${parts.month}.${parts.year}`, { signal: AbortSignal.timeout(20000) });
const xml = response.ok ? await response.text() : '';
const rate = (code) => {
  const m = new RegExp(`<title>${code}</title>\\s*<description>([\\d.]+)</description>\\s*<quant>(\\d+)</quant>`).exec(xml);
  return m ? Number(m[1]) / Number(m[2]) : undefined;
};
const rub = rate('RUB');
const usd = rate('USD');
const date = /<date>(\d\d\.\d\d)\.\d{4}<\/date>/.exec(xml)?.[1];
if (!rub || !usd || !date) { console.log('National Bank rates unavailable, keeping current prices'); process.exit(0); }

const convert = (kzt, r, step) => Math.round((kzt / r) * (1 + MARGIN_PERCENT / 100) / step) * step;
const prices = Object.fromEntries(Object.entries(KZT).map(([key, kzt]) => [key, { kzt, rub: convert(kzt, rub, STEP.rub), usd: convert(kzt, usd, STEP.usd) }]));
const next = { date, prices };

let current = {};
try { current = JSON.parse(readFileSync('prices.json', 'utf8')); } catch { /* first run */ }
if (JSON.stringify(current) === JSON.stringify(next)) { console.log('prices up to date'); process.exit(0); }
writeFileSync('prices.json', `${JSON.stringify(next, null, 2)}\n`);
console.log('prices updated', date);

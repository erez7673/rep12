// Minimal SVG charts that follow the app's colour tokens (light & dark).
import { esc } from './ui.js';
import { t, locale } from './i18n.js';

export function lineChart(points, { unit = '', height = 170 } = {}) {
  if (!points.length) return `<p class="muted center">${t('No data yet.')}</p>`;
  const W = 340, H = height, pl = 34, pr = 12, pt = 14, pb = 24;
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  let x0 = Math.min(...xs), x1 = Math.max(...xs);
  if (x0 === x1) { x0 -= 864e5; x1 += 864e5; }
  let y0 = Math.min(...ys), y1 = Math.max(...ys);
  const pad = Math.max(1, (y1 - y0) * 0.15);
  y0 = Math.max(0, y0 - pad); y1 += pad;
  const X = x => pl + (x - x0) / (x1 - x0) * (W - pl - pr);
  const Y = y => pt + (1 - (y - y0) / (y1 - y0)) * (H - pt - pb);
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${X(p.x).toFixed(1)},${Y(p.y).toFixed(1)}`).join('');
  const area = `${d}L${X(points.at(-1).x).toFixed(1)},${H - pb}L${X(points[0].x).toFixed(1)},${H - pb}Z`;
  const ticks = [y0, (y0 + y1) / 2, y1];
  const fd = t => new Date(t).toLocaleDateString(locale(), { day: 'numeric', month: 'short' });
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">
    ${ticks.map(t => `<line x1="${pl}" x2="${W - pr}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/><text x="${pl - 6}" y="${Y(t) + 4}" text-anchor="end" class="axis">${Math.round(t)}</text>`).join('')}
    <path d="${area}" class="area"/>
    <path d="${d}" class="line"/>
    ${points.map(p => `<circle cx="${X(p.x)}" cy="${Y(p.y)}" r="3.5" class="dot"><title>${esc(fd(p.x))}: ${p.y}${unit}</title></circle>`).join('')}
    <text x="${pl}" y="${H - 6}" class="axis">${fd(x0)}</text>
    <text x="${W - pr}" y="${H - 6}" text-anchor="end" class="axis">${fd(x1)}</text>
  </svg>`;
}

export function barChart(bars, { height = 150 } = {}) {
  if (!bars.length) return `<p class="muted center">${t('No data yet.')}</p>`;
  const W = 340, H = height, pb = 22, pt = 16;
  const max = Math.max(...bars.map(b => b.y), 1);
  const bw = (W - 8) / bars.length;
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img">
    ${bars.map((b, i) => {
      const h = (b.y / max) * (H - pb - pt);
      const x = 4 + i * bw + bw * 0.15;
      return `<rect x="${x}" y="${H - pb - h}" width="${bw * 0.7}" height="${Math.max(h, 1)}" rx="4" class="bar"><title>${esc(b.label)}: ${b.y}</title></rect>
        <text x="${x + bw * 0.35}" y="${H - 6}" text-anchor="middle" class="axis">${esc(b.label)}</text>
        ${b.y ? `<text x="${x + bw * 0.35}" y="${H - pb - h - 4}" text-anchor="middle" class="axis">${b.y}</text>` : ''}`;
    }).join('')}
  </svg>`;
}

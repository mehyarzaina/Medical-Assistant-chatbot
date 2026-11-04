import { useId, useState } from 'react';
import './Charts.css';

// Small hand-built charts for the admin dashboard (no chart library).
// Every chart has a legend or a title naming its one series, a hover/focus
// tooltip, and a "Show as table" view with the same numbers.

// Round the axis top up to a clean number: 1, 2, 5 × 10ⁿ steps, four of them.
function niceScale(max) {
  if (max <= 0) return { top: 4, step: 1 };
  const rough = max / 4;
  const pow = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough);
  const safeStep = Math.max(1, step);
  return { top: Math.ceil(max / safeStep) * safeStep, step: safeStep };
}

const formatNumber = (n) => new Intl.NumberFormat('en').format(n);

export function ChartCard({ title, subtitle, legend, table, children, className = '' }) {
  return (
    <section className={`panel chart-card ${className}`}>
      <header className="chart-card-head">
        <div>
          <h2 className="panel-title chart-card-title">{title}</h2>
          {subtitle && <p className="chart-card-subtitle">{subtitle}</p>}
        </div>
        {legend && (
          <ul className="chart-legend">
            {legend.map((item) => (
              <li key={item.label}>
                <span className="chart-legend-swatch" style={{ background: item.color }} aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        )}
      </header>
      {children}
      {table && (
        <details className="chart-table">
          <summary>Show as table</summary>
          <table className="admin-table">
            <thead>
              <tr>{table.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr>
            </thead>
            <tbody>
              {table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className={typeof cell === 'number' ? 'num' : ''} dir={j === 0 ? 'auto' : undefined}>
                      {typeof cell === 'number' ? formatNumber(cell) : cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}

// Vertical columns, optionally stacked by series.
// rows: [{ label, values: { [seriesKey]: number } }]; series: [{ key, label, color }]
export function ColumnChart({ rows, series, emptyText = 'No data for this period.' }) {
  const [active, setActive] = useState(null);
  const tooltipId = useId();

  if (rows.length === 0) return <p className="chart-empty">{emptyText}</p>;

  const totals = rows.map((r) => series.reduce((sum, s) => sum + (r.values[s.key] || 0), 0));
  const { top, step } = niceScale(Math.max(...totals));
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  // Thin the x labels out so they never collide.
  const labelEvery = Math.ceil(rows.length / 12);

  return (
    <div className="column-chart">
      <div className="column-chart-plot">
        <div className="column-chart-grid" aria-hidden="true">
          {ticks.map((tick) => (
            <div key={tick} className="column-chart-gridline" style={{ bottom: `${(tick / top) * 100}%` }}>
              <span>{formatNumber(tick)}</span>
            </div>
          ))}
        </div>

        <div className="column-chart-cols" onMouseLeave={() => setActive(null)}>
          {rows.map((row, i) => {
            const summary = series
              .filter((s) => row.values[s.key])
              .map((s) => `${s.label} ${row.values[s.key]}`)
              .join(', ');
            return (
              <div
                key={row.label}
                className={`column-chart-col ${active === i ? 'is-active' : ''}`}
                tabIndex={0}
                aria-label={`${row.label}: ${totals[i]}${summary ? ` (${summary})` : ''}`}
                aria-describedby={active === i ? tooltipId : undefined}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
              >
                <div className="column-chart-stack" style={{ height: `${(totals[i] / top) * 100}%` }}>
                  {series.map((s) =>
                    row.values[s.key] ? (
                      <div
                        key={s.key}
                        className="column-chart-seg"
                        style={{ flexGrow: row.values[s.key], background: s.color }}
                      />
                    ) : null,
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {active !== null && (
          <div
            className="chart-tooltip"
            id={tooltipId}
            role="tooltip"
            style={{ left: `${((active + 0.5) / rows.length) * 100}%` }}
          >
            <strong>{rows[active].label}</strong>
            {series.map((s) => (
              <span key={s.key} className="chart-tooltip-row">
                <span className="chart-legend-swatch" style={{ background: s.color }} aria-hidden="true" />
                {s.label}
                <b>{formatNumber(rows[active].values[s.key] || 0)}</b>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="column-chart-xlabels" aria-hidden="true">
        {rows.map((row, i) => (
          <span key={row.label}>{i % labelEvery === 0 ? row.label : ''}</span>
        ))}
      </div>
    </div>
  );
}

// Horizontal bars with the label on the left and the value at the tip.
// rows: [{ label, count }]
export function BarList({ rows, color, emptyText = 'No data for this period.' }) {
  if (rows.length === 0) return <p className="chart-empty">{emptyText}</p>;
  const max = Math.max(...rows.map((r) => r.count));
  return (
    <ul className="bar-list">
      {rows.map((row) => (
        <li key={row.label} className="bar-list-row" title={`${row.label}: ${formatNumber(row.count)}`}>
          <span className="bar-list-label" dir="auto">{row.label}</span>
          <span className="bar-list-track">
            <span
              className="bar-list-bar"
              style={{ width: `${(row.count / max) * 100}%`, background: row.label === 'Other' ? 'var(--chart-other)' : color }}
            />
            <span className="bar-list-value">{formatNumber(row.count)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

// One 100% bar split by part, with counts and shares listed underneath.
// parts: [{ label, value, color }]
export function ShareBar({ parts }) {
  const total = parts.reduce((sum, p) => sum + p.value, 0);
  if (total === 0) return <p className="chart-empty">No data for this period.</p>;
  const visible = parts.filter((p) => p.value > 0);
  return (
    <div className="share-bar">
      <div className="share-bar-track" role="img" aria-label={visible.map((p) => `${p.label} ${p.value}`).join(', ')}>
        {visible.map((p) => (
          <span
            key={p.label}
            className="share-bar-seg"
            style={{ flexGrow: p.value, background: p.color }}
            title={`${p.label}: ${p.value}`}
          />
        ))}
      </div>
      <ul className="share-bar-list">
        {parts.map((p) => (
          <li key={p.label}>
            <span className="chart-legend-swatch" style={{ background: p.color }} aria-hidden="true" />
            <span className="share-bar-label">{p.label}</span>
            <span className="share-bar-value">{formatNumber(p.value)}</span>
            <span className="share-bar-pct">{Math.round((p.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function StatTile({ label, value, note, hero = false }) {
  return (
    <div className={`stat-tile ${hero ? 'is-hero' : ''}`}>
      <span className="stat-tile-label">{label}</span>
      <span className="stat-tile-value">{value === null || value === undefined ? '–' : formatNumber(value)}</span>
      {note && <span className="stat-tile-note">{note}</span>}
    </div>
  );
}

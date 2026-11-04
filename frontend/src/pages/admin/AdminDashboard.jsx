import { useEffect, useState } from 'react';
import { getAdminChartStats, getAdminStats } from '../../api';
import AdminLayout from '../../components/admin/AdminLayout';
import { BarList, ChartCard, ColumnChart, ShareBar, StatTile } from '../../components/admin/Charts';
import usePageTitle from '../../hooks/usePageTitle';

const STATUS_SERIES = [
  { key: 'confirmed', label: 'Confirmed', color: 'var(--chart-confirmed)' },
  { key: 'cancelled', label: 'Cancelled', color: 'var(--chart-cancelled)' },
  { key: 'other', label: 'Other', color: 'var(--chart-other)' },
];

const shortDate = (iso) =>
  new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${iso}T12:00:00`));

const hourLabel = (hour) => `${String(hour).padStart(2, '0')}:00`;

// Statuses other than confirmed/cancelled (rescheduled, completed) fold into "Other".
function splitStatuses(counts) {
  const { confirmed = 0, cancelled = 0, ...rest } = counts;
  return { confirmed, cancelled, other: Object.values(rest).reduce((a, b) => a + b, 0) };
}

function AdminDashboard() {
  usePageTitle('admin');
  const [stats, setStats] = useState(null);
  const [charts, setCharts] = useState(null);
  const [error, setError] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    const filters = {};
    if (dateFrom) filters.date_from = dateFrom;
    if (dateTo) filters.date_to = dateTo;
    let cancelled = false;
    Promise.all([getAdminStats(filters), getAdminChartStats(filters)])
      .then(([statsData, chartData]) => {
        if (cancelled) return;
        setStats(statsData);
        setCharts(chartData);
        setError('');
      })
      .catch(() => { if (!cancelled) setError('Could not load stats. Your session may have expired; log in again.'); });
    return () => { cancelled = true; };
  }, [dateFrom, dateTo]);

  const filtered = Boolean(dateFrom || dateTo);
  const period = filtered ? 'In the selected dates' : 'All time';

  const byDate = (charts?.appointments_by_date ?? []).map(({ date, ...counts }) => ({
    label: shortDate(date),
    values: splitStatuses(counts),
  }));
  // Only show an "Other" series when there is something in it.
  const dateSeries = STATUS_SERIES.filter((s) => s.key !== 'other' || byDate.some((r) => r.values.other));
  const status = splitStatuses(charts?.appointments_by_status ?? {});
  const byHour = (charts?.appointments_by_hour ?? []).map((r) => ({ label: hourLabel(r.hour), values: { count: r.count } }));
  const total = stats?.total_appointments ?? 0;
  const cancelRate = total ? Math.round(((stats?.cancelled ?? 0) / total) * 100) : 0;

  return (
    <AdminLayout title="Dashboard" lede="Bookings made through the site, and what the doctor directory contains.">
      {error && <div className="admin-error" role="alert">{error}</div>}

      <div className="admin-filters">
        <div className="field">
          <label className="field-label" htmlFor="dash-from">From</label>
          <input id="dash-from" className="input" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label" htmlFor="dash-to">To</label>
          <input id="dash-to" className="input" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        {filtered && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setDateFrom(''); setDateTo(''); }}>
            Clear dates
          </button>
        )}
      </div>

      <div className="stat-tiles" aria-live="polite">
        <StatTile hero label="Appointments" value={stats?.total_appointments} note={period} />
        <StatTile label="Confirmed" value={stats?.confirmed_upcoming} note={period} />
        <StatTile label="Cancelled" value={stats?.cancelled} note={total ? `${cancelRate}% of bookings` : period} />
        <StatTile label="Patients" value={stats?.total_patients} note="All time" />
        <StatTile label="Doctors" value={stats?.total_doctors} note="In the directory" />
      </div>

      {charts && (
        <div className="dash-grid">
          <ChartCard
            className="dash-span-2"
            title="Appointments by date"
            subtitle={`${period}, by appointment date`}
            legend={dateSeries.map(({ label, color }) => ({ label, color }))}
            table={{
              columns: ['Date', ...dateSeries.map((s) => s.label)],
              rows: byDate.map((r) => [r.label, ...dateSeries.map((s) => r.values[s.key] || 0)]),
            }}
          >
            <ColumnChart rows={byDate} series={dateSeries} />
          </ChartCard>

          <ChartCard title="Booking status" subtitle={period}>
            <ShareBar
              parts={STATUS_SERIES
                .filter((s) => s.key !== 'other' || status.other)
                .map((s) => ({ label: s.label, value: status[s.key], color: s.color }))}
            />
          </ChartCard>

          <ChartCard
            title="Appointments by specialty"
            subtitle={period}
            table={{
              columns: ['Specialty', 'Appointments'],
              rows: charts.appointments_by_specialty.map((r) => [r.label, r.count]),
            }}
          >
            <BarList rows={charts.appointments_by_specialty} color="var(--chart-single)" />
          </ChartCard>

          <ChartCard
            className="dash-span-2"
            title="Busiest booking hours"
            subtitle={`${period}, appointments by start time`}
            table={{ columns: ['Hour', 'Appointments'], rows: byHour.map((r) => [r.label, r.values.count]) }}
          >
            <ColumnChart
              rows={byHour}
              series={[{ key: 'count', label: 'Appointments', color: 'var(--chart-single)' }]}
            />
          </ChartCard>

          <ChartCard
            className="dash-span-2"
            title="Doctors by specialty"
            subtitle="Top 10 in the directory"
            table={{
              columns: ['Specialty', 'Doctors'],
              rows: charts.doctors_by_specialty.map((r) => [r.label, r.count]),
            }}
          >
            <BarList rows={charts.doctors_by_specialty} color="var(--chart-single)" />
          </ChartCard>

          <ChartCard
            title="Doctors by city"
            subtitle="Top 8 in the directory"
            table={{ columns: ['City', 'Doctors'], rows: charts.doctors_by_city.map((r) => [r.label, r.count]) }}
          >
            <BarList rows={charts.doctors_by_city} color="var(--chart-single)" />
          </ChartCard>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminDashboard;

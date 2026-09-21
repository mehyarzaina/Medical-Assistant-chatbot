import './AvailabilitySchedule.css';

function AvailabilitySchedule({ schedule, loading }) {
  if (loading) return <p className="availability-status">Loading availability…</p>;
  if (!schedule || schedule.length === 0) {
    return <p className="availability-status">No availability on file.</p>;
  }
  return (
    <ul className="availability-list">
      {schedule.map((day) => (
        <li key={day.day_name} className="availability-row">
          <span className="availability-day">{day.day_name}</span>
          <span className="availability-time">{day.from_time} – {day.to_time}</span>
        </li>
      ))}
    </ul>
  );
}

export default AvailabilitySchedule;
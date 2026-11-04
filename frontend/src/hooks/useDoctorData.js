import { useEffect, useState } from 'react';
import { getAvailableSlots, getDoctor, getDoctorAvailability, getDoctorInsurance } from '../api';

// Results are stored with the request they answer, so "loading" is simply
// "the stored result is for a different request" and effects never reset state.

// Profile, weekly hours and accepted insurance for one doctor.
export function useDoctor(doctorId) {
  const [result, setResult] = useState({ id: null });

  useEffect(() => {
    let cancelled = false;
    Promise.all([getDoctor(doctorId), getDoctorAvailability(doctorId), getDoctorInsurance(doctorId)])
      .then(([doctor, availability, insurance]) => {
        if (cancelled) return;
        setResult({
          id: doctorId,
          doctor,
          schedule: availability.schedule || [],
          insurance: insurance.insurance_companies || [],
        });
      })
      .catch(() => { if (!cancelled) setResult({ id: doctorId, error: true }); });
    return () => { cancelled = true; };
  }, [doctorId]);

  const ready = result.id === doctorId;
  return {
    loading: !ready,
    error: ready && !!result.error,
    doctor: ready ? result.doctor : null,
    schedule: ready ? result.schedule ?? [] : [],
    insurance: ready ? result.insurance ?? [] : [],
  };
}

// Open time slots for a doctor on one date.
export function useSlots(doctorId, date) {
  const key = doctorId && date ? `${doctorId}|${date}` : null;
  const [result, setResult] = useState({ key: null, slots: [] });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    getAvailableSlots(doctorId, date)
      .then((data) => {
        if (cancelled) return;
        // The backend may return time strings, {date, time} objects, or {times: [...]}.
        const raw = data.times || data || [];
        setResult({ key, slots: raw.map((s) => (typeof s === 'string' ? s : s.time)) });
      })
      .catch((err) => { if (!cancelled) setResult({ key, slots: [], error: err.message }); });
    return () => { cancelled = true; };
  }, [key, doctorId, date]);

  const ready = result.key === key;
  return {
    loading: !!key && !ready,
    error: ready ? result.error ?? null : null,
    slots: ready ? result.slots : [],
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

export function getDoctors({ specialties = [], locations = [], insurances = [] } = {}) {
  const params = new URLSearchParams();
  specialties.forEach((s) => params.append('specialty', s));
  locations.forEach((l) => params.append('location', l));
  insurances.forEach((i) => params.append('insurance', i));
  const query = params.toString();
  return apiFetch(`/doctors${query ? `?${query}` : ''}`);
}

export function getDoctor(doctorId) {
  return apiFetch(`/doctors/${doctorId}`);
}

export function getDoctorInsurance(doctorId) {
  return apiFetch(`/doctors/${doctorId}/insurance`);
}

export function getInsuranceCompanies() {
  return apiFetch('/insurance');
}

export function getAvailableSlots(doctorId, date) {
  const params = new URLSearchParams({ doctor_id: doctorId, date });
  return apiFetch(`/appointments/available-slots?${params.toString()}`);
}

export function bookAppointment(payload) {
  return apiFetch('/appointments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function recommendDoctors(query, topK = 3, daysAhead = 7) {
  return apiFetch('/doctors/recommend', {
    method: 'POST',
    body: JSON.stringify({ query, top_k: topK, days_ahead: daysAhead }),
  });
}

export async function sendChatMessage(sessionId, message) {
  return apiFetch("/chat", {
    method: "POST",
    body: JSON.stringify({ session_id: sessionId, message }),
  });
}


export async function getAppointment(appointmentId, token) {
  return apiFetch(`/appointments/${appointmentId}?token=${encodeURIComponent(token)}`);
}

export async function cancelAppointment(appointmentId, accessToken, reason) {
  return apiFetch("/appointments/cancel", {
    method: "POST",
    body: JSON.stringify({ appointment_id: appointmentId, access_token: accessToken, reason }),
  });
}

export async function rescheduleAppointment(appointmentId, accessToken, newDate, newTime) {
  return apiFetch("/appointments/reschedule", {
    method: "POST",
    body: JSON.stringify({
      appointment_id: appointmentId,
      access_token: accessToken,
      new_date: newDate,
      new_time: newTime,
    }),
  });
}


export async function requestCode(email) {
  return apiFetch("/auth/request-code", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyCode(email, code) {
  return apiFetch("/auth/verify-code", {
    method: "POST",
    body: JSON.stringify({ email, code }),
  });
}

export async function getMyAppointments(email, sessionToken) {
  const params = new URLSearchParams({ patient_email: email, session_token: sessionToken });
  return apiFetch(`/appointments?${params.toString()}`);
}

export function getDoctorAvailability(doctorId) {
  return apiFetch(`/doctors/${doctorId}/availability`);
}

import { getAdminToken } from './utils/adminAuth';

async function apiFetchAdmin(path, options = {}) {
  const token = getAdminToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Token': token || '',
    },
    ...options,
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new Error(errorBody?.detail || `Request failed: ${response.status}`);
  }
  return response.json();
}

export function adminLogin(password) {
  return apiFetch('/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });
}

export function adminListAppointments(filters = {}) {
  const params = new URLSearchParams(filters);
  return apiFetchAdmin(`/admin/appointments?${params.toString()}`);
}

export function adminListPatients() {
  return apiFetchAdmin('/admin/patients');
}

export function adminCreateDoctor(doctor) {
  return apiFetchAdmin('/admin/doctors', {
    method: 'POST',
    body: JSON.stringify(doctor),
  });
}

export function adminUpdateDoctor(doctorId, updates) {
  return apiFetchAdmin(`/admin/doctors/${doctorId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export function adminDeleteDoctor(doctorId) {
  return apiFetchAdmin(`/admin/doctors/${doctorId}`, { method: 'DELETE' });
}

export function adminListInsuranceCompanies() {
  return getInsuranceCompanies(); // public endpoint, already exists
}

export function adminCreateInsuranceCompany(name) {
  return apiFetchAdmin('/admin/insurance', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function getAdminStats(filters = {}) {
  const params = new URLSearchParams(filters);
  const query = params.toString();
  return apiFetchAdmin(`/admin/stats${query ? `?${query}` : ''}`);
}

export function getAdminSpecialties() {
  return apiFetchAdmin('/admin/specialties');
}

export function adminGetDoctor(doctorId) {
  return getDoctor(doctorId); // public endpoint, reuse as-is
}
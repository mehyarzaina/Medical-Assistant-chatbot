# Zaina Medical – demo video narration

Written by watching each recording frame by frame. Every line belongs to one screen.
The code before a line, like `0-1`, gives the GIF frames it plays over. Frames not listed (blank loading screens) are dropped.

`build_video.py` holds each screen for exactly as long as its line takes to say, so the voice always matches the picture.

**Making the audio:** run `python build_video.py --print-text` and paste each clip's text into ElevenLabs.
It puts a 1.5-second pause between lines. Save the result as `audio/NN.mp3`. The builder finds those pauses to split the audio back into lines.

---

## 1. Home page and Arabic – `01_home_and_arabic.gif`

- `0-1` This is Zaina Medical, a bilingual health assistant for patients in Jordan. The first slide says it simply: describe how you feel, and find the right doctor.
- `2-4` The second slide: specialists are matched by meaning to what you described.
- `5-7` And the third: pick an open time, then manage it from your email.
- `8-10` One click switches the whole site to Arabic, and the layout flips to read from right to left.
- `11-12` Another click brings it back to English.

## 2. The assistant – `02_chatbot_and_history.gif`

- `0-2` This is the health assistant. I describe my problem in plain words: my knee hurts when I climb stairs.
- `3-3` Like a receptionist, it first asks a few short questions: how bad the pain is, whether there's swelling, and whether walking is hard.
- `4-5` I answer: about six out of ten, a little swelling, and I live in Amman.
- `6-9` It then suggests specialists in Amman who treat knee pain, each with a profile button, right inside the chat.
- `10-12` Every chat is saved in the sidebar. Here is an earlier one, about thumb pain.
- `13-14` And I can switch back to the knee chat, right where I left it.

## 3. Finding a doctor – `03_doctors_filter_profile.gif`

- `0-0` The Find a doctor page lists all 1,168 doctors, with filters for specialty, city, insurance and availability.
- `1-3` Choosing "free slots this week" keeps only doctors with an open appointment in the next seven days. That leaves 278.
- `4-5` Show more opens a doctor's weekly hours.
- `6-7` And View profile opens the full page, with the doctor's details, weekly hours, insurance, and a button to book.

## 4. Booking – `04_booking.gif`

- `0-1` Booking takes one page. First I pick a day: Monday, the ninth of November.
- `2-5` Then one of the open times, ten thirty. The summary on the right updates as I go.
- `6-12` Next, I fill in my name, phone number and email, and agree to the privacy policy.
- `13-15` Then I confirm the booking.
- `16-16` Done. The appointment is booked, and a confirmation email is on its way.

## 5. Confirmation email and Google Calendar – `05_email_and_calendar.gif`

- `0-2` In Gmail, the confirmation arrives within seconds.
- `3-5` It shows the doctor, the date and the time, with buttons to cancel or reschedule.
- `6-7` The booking is also added to Google Calendar, on Monday at ten thirty.
- `8-10` The event includes the patient's name, email and phone, and a reminder thirty minutes before.

## 6. My appointments – `06_my_appointments_code.gif`

- `0-4` The My appointments page needs no account. I enter my email, and the site sends me a six-digit code.
- `6-11` The code arrives by email, and it expires after ten minutes.
- `12-15` I type it in and verify.
- `16-17` Now I can see every appointment booked with this email, with its status, and buttons to reschedule or cancel.

## 7. Rescheduling – `07_reschedule_email_calendar.gif`

- `0-3` To reschedule, the page shows the current appointment and the doctor's open days. I pick Tuesday, the tenth.
- `4-9` Then a new time, one PM, and confirm.
- `10-10` The appointment has been moved.
- `16-20` The patient gets an email showing the previous time and the new one: Tuesday, the tenth of November, at one PM.
- `21-22` And in Google Calendar, the event has moved from Monday to Tuesday at one.

## 8. Cancelling – `08_cancel_email_calendar.gif`

- `0-8` Cancelling works straight from the email. The Cancel button opens a secure page for that one appointment.
- `9-10` I confirm, and the appointment is cancelled, freeing the time for other patients.
- `12-19` A cancellation email follows right away.
- `20-20` And the event is gone from Google Calendar.

## 9. Admin dashboard – `09_admin_dashboard.gif`

- `0-1` Behind the scenes, there's an admin area protected by a password.
- `2-4` The dashboard shows the key numbers: appointments, confirmed, cancelled, patients and doctors. Hovering over a bar shows its exact numbers.
- `5-6` Further down, bookings by specialty and by hour, and doctors by specialty and by city.
- `7-9` The Appointments tab lists every booking with its status.
- `10-15` In Doctors, the admin can add, edit or delete any doctor.
- `16-17` Patients and insurance companies have their own tabs too.

## 10. Privacy and about – `10_legal_and_about.gif`

- `0-2` Finally, the site has a privacy policy written with Jordan's Personal Data Protection Law in mind,
- `3-3` terms of use,
- `4-4` and a cookie policy.
- `5-5` The About page explains what the assistant does and how it's built, with React, FastAPI, MongoDB, vector search and a language model. Thanks for watching.

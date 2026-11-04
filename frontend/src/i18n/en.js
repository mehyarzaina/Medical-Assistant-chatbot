const en = {
  brand: 'Zaina Medical',
  langToggle: { label: 'العربية', aria: 'Switch to Arabic' },

  demoBanner: {
    text: 'Portfolio demo — not a real medical service. Bookings are not sent to doctors.',
    link: 'Learn more',
  },

  nav: {
    label: 'Main navigation',
    home: 'Home',
    chat: 'Assistant',
    doctors: 'Find a doctor',
    appointments: 'My appointments',
    about: 'About',
    admin: 'Admin',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
  },

  footer: {
    label: 'Legal',
    rights: '© {year} Zaina Medical. A non-commercial portfolio project.',
    privacy: 'Privacy',
    terms: 'Terms',
    cookies: 'Cookies',
    dataSource: 'Doctor profiles and health articles: public listings on Altibbi. Not affiliated with Altibbi.',
  },

  common: {
    back: 'Back',
    close: 'Close',
    loading: 'Loading…',
    tryAgain: 'Something went wrong. Please try again.',
    skipToContent: 'Skip to main content',
  },

  titles: {
    home: 'Find and book a doctor',
    chat: 'Health assistant',
    doctors: 'Find a doctor',
    appointments: 'My appointments',
    reschedule: 'Reschedule appointment',
    cancel: 'Cancel appointment',
    about: 'About',
    privacy: 'Privacy policy',
    terms: 'Terms of use',
    cookies: 'Cookie policy',
    notFound: 'Page not found',
  },

  welcome: {
    eyebrow: 'Doctor search and booking',
    title: 'Describe how you feel. Find the right doctor.',
    lede: 'Tell the assistant what is going on in Arabic or English. It asks a few questions, suggests doctors whose specialty fits, and shows their open times.',
    ctaChat: 'Talk to the assistant',
    ctaDoctors: 'Browse doctors',
    scroll: 'Scroll to how it works',
    howTitle: 'How it works',
    howLede: 'Four steps from a question to a booked time.',
    steps: [
      { title: 'Describe your symptoms', body: 'Write the way you would to a receptionist. No medical terms or menus needed.' },
      { title: 'Answer a few questions', body: 'The assistant asks about duration and severity to narrow down the specialty.' },
      { title: 'Review suggested doctors', body: 'See matching doctors with their specialty, location and weekly hours.' },
      { title: 'Pick a time', body: 'Choose an open slot. Your confirmation email has links to cancel or reschedule.' },
    ],
    featuresTitle: 'What you can do',
    featuresLede: 'Use the assistant, or search the directory yourself.',
    features: [
      { title: 'Ask a health question', body: 'Answers are based on articles from a medical content library, with a reminder to see a doctor when it matters.' },
      { title: 'Get doctor suggestions', body: 'Search works on meaning, so a loose description like “my thumb hurts when I grip” still finds relevant specialists.' },
      { title: 'Book, cancel or reschedule', body: 'Manage a booking from the links in your email, or verify your email on the My appointments page.' },
      { title: 'Filter the directory', body: 'Narrow doctors by specialty, city or accepted insurance.' },
    ],
    noticeTitle: 'Not a substitute for a doctor',
    noticeBody: 'The assistant can make mistakes and does not diagnose or treat. In an emergency, call 911 or go to the nearest emergency department.',
    finalTitle: 'Ready to start?',
  },

  about: {
    title: 'About Zaina Medical',
    tagline: 'A bilingual assistant for finding a suitable doctor and booking a time, built as a portfolio project.',
    whatTitle: 'What it does',
    whatBody: 'You describe your symptoms in Arabic or English. The assistant asks short follow-up questions, then searches doctor profiles for specialties that match. For general health questions, it looks up related articles and summarises them.',
    howTitle: 'How it is built',
    howBody: 'React front end, FastAPI back end, MongoDB for doctors and bookings, a vector search index for matching, and a large language model for the conversation.',
    limitsTitle: 'Limits',
    limitsBody: 'This is a demonstration. The assistant does not diagnose conditions or replace professional care, and its answers can be wrong. Doctor details come from public listings and may be out of date. Bookings made here are not sent to the doctors.',
  },

  chat: {
    title: 'Health assistant',
    intro: 'Describe your symptoms or ask a health question. Replies come in the language you write in.',
    privacyNote: 'Don’t share your name, ID number or other identifying details. Messages are processed by an AI provider. In an emergency, call 911.',
    privacyLink: 'How we handle your data',
    placeholder: 'Type your message…',
    inputLabel: 'Message',
    send: 'Send',
    typing: 'The assistant is typing…',
    error: 'The assistant couldn’t reply. Please try again.',
    log: 'Conversation',
    you: 'You',
    assistant: 'Assistant',
    newChat: 'New conversation',
  },

  doctors: {
    title: 'Find a doctor',
    searchLabel: 'Search by doctor name',
    searchPlaceholder: 'Doctor name',
    loading: 'Loading doctors…',
    loadError: 'Couldn’t load doctors: {error}',
    empty: 'No doctors match these filters.',
    count: '{count} doctors',
    dataNote: 'Doctor names and profiles are shown in Arabic, as listed in the source directory.',
  },

  filters: {
    label: 'Filter doctors',
    specialty: 'Specialty',
    location: 'City',
    insurance: 'Insurance',
    clear: 'Clear filters',
    noOptions: 'No options',
  },

  doctor: {
    viewProfile: 'View profile',
    profileOf: 'View profile of {name}',
    seeMore: 'Show more',
    seeLess: 'Show less',
    availability: 'Weekly hours',
    insurance: 'Accepted insurance',
    book: 'Book appointment',
    location: 'Location',
    phone: 'Phone',
    loadError: 'Couldn’t load this doctor’s profile.',
    noAvailability: 'No hours on file.',
    loadingAvailability: 'Loading hours…',
    sourceLink: 'Original listing on Altibbi',
  },

  days: {
    'الأحد': 'Sunday',
    'الاحد': 'Sunday',
    'الاثنين': 'Monday',
    'الإثنين': 'Monday',
    'الثلاثاء': 'Tuesday',
    'الأربعاء': 'Wednesday',
    'الاربعاء': 'Wednesday',
    'الخميس': 'Thursday',
    'الجمعة': 'Friday',
    'السبت': 'Saturday',
  },

  booking: {
    title: 'Book with {name}',
    date: 'Date',
    times: 'Available times',
    loadingSlots: 'Loading times…',
    slotsError: 'Couldn’t load times: {error}',
    noSlots: 'No open times on this date. Try another day.',
    name: 'Full name',
    email: 'Email',
    phone: 'Phone number',
    emailHint: 'We send the confirmation and the cancel/reschedule links here.',
    consent: 'I agree to the processing of the details above to book this appointment, as described in the {privacy}. I understand this is a demo and the doctor will not be notified.',
    consentPrivacy: 'privacy policy',
    submit: 'Confirm booking for {time}',
    submitting: 'Booking…',
    successTitle: 'Appointment booked',
    successBody: 'With {name} on {date} at {time}.',
    successEmail: 'A confirmation email is on its way to {email}.',
    done: 'Done',
    required: 'Required',
  },

  myAppointments: {
    title: 'My appointments',
    emailIntro: 'Enter the email you used to book. We’ll send you a 6-digit code.',
    emailLabel: 'Email',
    sendCode: 'Send code',
    sending: 'Sending…',
    codeIntro: 'Enter the 6-digit code we sent to {email}.',
    codeLabel: 'Verification code',
    verify: 'Verify',
    verifying: 'Verifying…',
    otherEmail: 'Use a different email',
    none: 'No appointments found for this email.',
    reschedule: 'Reschedule',
    cancel: 'Cancel',
    status: { confirmed: 'Confirmed', cancelled: 'Cancelled' },
  },

  reschedule: {
    title: 'Reschedule with {name}',
    current: 'Currently booked for {date} at {time}.',
    newDate: 'New date',
    pick: 'Pick a time',
    confirm: 'Confirm new time: {time}',
    submitting: 'Rescheduling…',
    successTitle: 'Appointment rescheduled',
    successBody: 'With {name}, now on {date} at {time}.',
    missingToken: 'This link is incomplete. Open it again from your email.',
  },

  cancel: {
    title: 'Cancel appointment',
    question: 'Cancel your appointment with {name} on {date} at {time}?',
    confirm: 'Yes, cancel appointment',
    keep: 'Keep appointment',
    cancelling: 'Cancelling…',
    doneTitle: 'Appointment cancelled',
    doneBody: 'Your appointment with {name} has been cancelled.',
  },

  notFound: {
    code: '404',
    title: 'This page doesn’t exist',
    body: 'The link may be broken or the page may have moved.',
    home: 'Go to home page',
  },

  legal: {
    updated: 'Last updated: {date}',
    demoNotice: 'Zaina Medical is a non-commercial portfolio project, not a registered healthcare provider. These policies describe how the demo actually handles data.',
    privacy: {
      title: 'Privacy policy',
      sections: [
        {
          h: 'Who this applies to',
          p: ['This policy covers the Zaina Medical demo website and its assistant. It is written with Jordan’s Personal Data Protection Law (Law No. 24 of 2023) in mind.'],
        },
        {
          h: 'What we collect, and why',
          list: [
            'Chat messages: to generate the assistant’s replies. Kept for 30 minutes of inactivity, then deleted automatically.',
            'Booking details (name, email, phone, doctor, date and time): to record the appointment and email you a confirmation with cancel and reschedule links.',
            'Email address on the My appointments page: to send a one-time verification code, which expires after 10 minutes.',
            'Language preference: stored in your browser so the site remembers Arabic or English.',
          ],
          p: ['We collect only what each feature needs. There are no accounts, no analytics, no advertising trackers and no social media embeds.'],
        },
        {
          h: 'Health information',
          p: ['Symptoms you type in the chat are health data, which the law treats as sensitive. Only type what you are comfortable sharing, and do not include your name, national ID number or other identifying details in the chat. By sending a message you consent to it being processed to produce a reply.'],
        },
        {
          h: 'Services that process your data',
          list: [
            'Groq: runs the AI model that writes the assistant’s replies (servers in the United States).',
            'Upstash: temporary storage for chat history and verification codes.',
            'MongoDB Atlas: stores doctors and bookings.',
            'Zilliz Cloud: search index of doctor profiles and articles (no personal data from you).',
            'Google (Gmail and Google Calendar): sends confirmation emails and logs bookings in the site owner’s calendar.',
          ],
          p: ['Some of these services are outside Jordan, so using the chat or booking means your data is transferred abroad. We do not sell or share your data for marketing.'],
        },
        {
          h: 'How long we keep it',
          p: ['Chat history: 30 minutes after your last message. Verification codes: 10 minutes. Bookings and the contact details attached to them: until you ask for deletion or the demo database is reset.'],
        },
        {
          h: 'Your rights',
          p: ['You can ask to see, correct or delete your data, withdraw consent, or object to its use. You can cancel a booking at any time from your confirmation email. For other requests, contact the site owner through the portfolio or CV where you found this demo. You may also complain to the data protection authority in Jordan.'],
        },
        {
          h: 'Security',
          p: ['Booking links carry secret tokens, verification codes expire after 10 minutes, and admin pages are password protected. No system is perfectly secure, so please keep identifying details out of the chat.'],
        },
        {
          h: 'Children',
          p: ['The site is not intended for people under 18. A parent or guardian should book on a child’s behalf.'],
        },
      ],
    },
    terms: {
      title: 'Terms of use',
      sections: [
        {
          h: 'A demonstration, not a medical service',
          p: ['Zaina Medical is a portfolio project. It is not a clinic, a hospital or a licensed healthcare provider. Bookings made here are stored for demonstration only and are not sent to the doctors listed.'],
        },
        {
          h: 'No medical advice',
          p: ['The assistant provides general information and doctor suggestions. It does not diagnose, treat or prescribe, and it can be wrong. Always consult a qualified doctor about your health. In an emergency, call 911 or go to the nearest emergency department.'],
        },
        {
          h: 'Doctor information',
          p: ['Doctor names, specialties, locations and hours come from public listings on Altibbi and may be incomplete or out of date. Zaina Medical is not affiliated with, endorsed by or sponsored by Altibbi or the doctors listed. Contact a clinic directly to make a real appointment.'],
        },
        {
          h: 'Fees and refunds',
          p: ['The site is free to use. We do not take payments, so there is nothing to refund. If paid features are ever added, a refund policy will be published before any payment is taken.'],
        },
        {
          h: 'Acceptable use',
          list: [
            'Don’t enter someone else’s personal details without their permission.',
            'Don’t try to break, overload or gain unauthorised access to the site.',
            'Don’t use the assistant to produce harmful or illegal content.',
          ],
        },
        {
          h: 'Liability',
          p: ['The site is provided “as is”, without guarantees of accuracy or availability. To the extent the law allows, the owner is not liable for decisions made based on its content.'],
        },
        {
          h: 'Governing law',
          p: ['These terms are governed by the laws of the Hashemite Kingdom of Jordan.'],
        },
        {
          h: 'Changes',
          p: ['These terms may be updated. The date at the top shows the latest version.'],
        },
      ],
    },
    cookies: {
      title: 'Cookie policy',
      sections: [
        {
          h: 'We don’t use cookies',
          p: ['This site sets no cookies. It has no analytics, advertising or social media trackers, and fonts are served from our own server rather than a third party.'],
        },
        {
          h: 'Browser storage we do use',
          list: [
            '“lang”: remembers whether you chose Arabic or English. Stays until you clear your browser data.',
            'Admin session token: only stored if you sign in to the admin pages.',
          ],
          p: ['Both are needed for the site to work the way you asked, so no consent banner is required. If analytics or other optional tracking is added later, we will ask for your consent first.'],
        },
        {
          h: 'Clearing it',
          p: ['You can remove this data at any time by clearing site data in your browser settings.'],
        },
      ],
    },
  },
};

export default en;

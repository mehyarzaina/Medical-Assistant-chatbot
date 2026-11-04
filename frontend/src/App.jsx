import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Sidebar from './components/Sidebar';
import SiteFooter from './components/SiteFooter';
import DemoBanner from './components/DemoBanner';
import Welcome from './pages/Welcome';
import Chat from './pages/Chat';
import Doctors from './pages/Doctors';
import DoctorProfile from './pages/DoctorProfile';
import BookAppointment from './pages/BookAppointment';
import MyAppointments from './pages/MyAppointments';
import Reschedule from './pages/Reschedule';
import Cancel from './pages/Cancel';
import About from './pages/About';
import LegalPage from './pages/LegalPage';
import NotFound from './pages/NotFound';
import { useLanguage } from './i18n/useLanguage';
import './styles/layout.css';
import AdminRoute from './components/AdminRoute';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminPatients from './pages/admin/AdminPatients';
import AdminInsurance from './pages/admin/AdminInsurance';
import AdminDoctors from './pages/admin/AdminDoctors';

// New route → start at the top, like a normal page load.
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppShell() {
  const { t } = useLanguage();
  const { pathname } = useLocation();
  // The chat page is a full-height app view: it fills the screen under the banner,
  // and a footer would push the input bar off screen.
  const isChat = pathname === '/chat';

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">{t('common.skipToContent')}</a>
      <Sidebar />
      <div className={`app-content ${isChat ? 'app-content-fill' : ''}`}>
        <DemoBanner />
        <main id="main-content" tabIndex={-1}>
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/doctors/:doctorId" element={<DoctorProfile />} />
            <Route path="/doctors/:doctorId/book" element={<BookAppointment />} />
            <Route path="/appointments" element={<MyAppointments />} />
            <Route path="/appointments/:appointmentId/reschedule" element={<Reschedule />} />
            <Route path="/appointments/:appointmentId/cancel" element={<Cancel />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy" element={<LegalPage doc="privacy" />} />
            <Route path="/terms" element={<LegalPage doc="terms" />} />
            <Route path="/cookies" element={<LegalPage doc="cookies" />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin/dashboard"
              element={<AdminRoute><AdminDashboard /></AdminRoute>}
            />
            <Route
              path="/admin/appointments"
              element={<AdminRoute><AdminAppointments /></AdminRoute>}
            />
            <Route path="/admin/doctors" element={<AdminRoute><AdminDoctors /></AdminRoute>} />
            <Route path="/admin/patients" element={<AdminRoute><AdminPatients /></AdminRoute>} />
            <Route path="/admin/insurance" element={<AdminRoute><AdminInsurance /></AdminRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        {!isChat && <SiteFooter />}
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell />
    </BrowserRouter>
  );
}

export default App;

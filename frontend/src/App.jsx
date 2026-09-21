import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Welcome from './pages/Welcome';
import Chat from './pages/Chat';
import Doctors from './pages/Doctors';
import MyAppointments from './pages/MyAppointments';
import Reschedule from './pages/Reschedule';
import Cancel from './pages/Cancel';
import About from './pages/About';
import './styles/layout.css';
import AdminRoute from './components/AdminRoute';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointments from './pages/admin/AdminAppointments';
import AdminPatients from './pages/admin/AdminPatients';
import AdminInsurance from './pages/admin/AdminInsurance';
import AdminDoctors from './pages/admin/AdminDoctors';


function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar />
        <main className="app-content">
          <Routes>
            <Route path="/" element={<Welcome />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/doctors" element={<Doctors />} />
            <Route path="/appointments" element={<MyAppointments />} />
            <Route path="/appointments/:appointmentId/reschedule" element={<Reschedule />} />
            <Route path="/appointments/:appointmentId/cancel" element={<Cancel />} />
            <Route path="/about" element={<About />} />
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

          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;



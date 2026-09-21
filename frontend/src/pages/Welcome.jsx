import { Link } from 'react-router-dom';
import NetworkCanvas from '../components/NetworkCanvas';
import './Welcome.css';

function Welcome() {
  return (
    <div className="welcome-page">
      <section className="welcome-hero">
        <NetworkCanvas />
        <div className="welcome-hero-content">
          <h1>Book a doctor's appointment, without the phone tag</h1>
          <p className="welcome-lede">
            Tell the assistant what's going on, get matched to the right doctor,
            and book a real open slot — all in one place.
          </p>
          <Link to="/chat" className="welcome-cta">Start chatting</Link>
        </div>
      </section>

      <section className="welcome-explainer">
        <h2>What you can do here</h2>
        <div className="explainer-grid">
          <div className="explainer-card">
            <h3>Chat with the assistant</h3>
            <p>Describe your symptoms or what kind of care you need in plain language, and get matched to a relevant doctor.</p>
          </div>
          <div className="explainer-card">
            <h3>Get a doctor recommendation</h3>
            <p>The assistant searches doctor profiles by meaning, not just keywords, so it can match you even from a loose description.</p>
          </div>
          <div className="explainer-card">
            <h3>Book, cancel, or reschedule</h3>
            <p>Pick an open time slot and book directly. You'll get an email confirmation with one-click cancel and reschedule links.</p>
          </div>
          <div className="explainer-card">
            <h3>Browse doctors yourself</h3>
            <p>Prefer to look around on your own? Search and filter the full doctor directory by specialty, location, or insurance.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Welcome;
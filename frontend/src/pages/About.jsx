import BackButton from "../components/BackButton";
import "./About.css";

export default function About() {
  return (
    <div className="about-page">
      <BackButton />

      <div className="about-hero">
        <h1>About Zaina Medical</h1>
        <p className="about-tagline">
          Arabic-language health guidance, grounded in real medical knowledge —
          and a faster way to find and book the right doctor.
        </p>
      </div>

      <section className="about-section">
        <h2>What it does</h2>
        <p>
          Zaina Medical is a bilingual (Arabic/English) health assistant built for
          patients who want clear answers and a straightforward way to see a doctor.
          Ask a health question and get a response grounded in real medical
          articles — not the assistant's own guesses. Describe your symptoms and it
          will ask a few follow-up questions, then recommend real doctors who
          actually match, with live availability pulled straight from the doctors'
          own schedules.
        </p>
      </section>

      <section className="about-section">
        <h2>Who it's for</h2>
        <p>
          Anyone who'd rather ask a health question in their own language and get
          a grounded, straightforward answer — and anyone who wants to skip the
          back-and-forth of finding a doctor, checking specialties, and calling
          around for appointment times.
        </p>
      </section>

      <section className="about-section about-disclaimer">
        <h2>What it isn't</h2>
        <p>
          Zaina Medical does not diagnose conditions or replace professional
          medical care. Information is sourced from trusted medical articles to
          support your understanding — always consult a licensed doctor for
          diagnosis, treatment, or anything urgent.
        </p>
      </section>


    </div>
  );
}
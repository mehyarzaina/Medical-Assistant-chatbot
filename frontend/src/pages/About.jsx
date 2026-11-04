import BackButton from "../components/BackButton";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";
import "./About.css";

export default function About() {
  const { t } = useLanguage();
  usePageTitle("about");

  return (
    <div className="about-page">
      <BackButton />

      <div className="about-hero">
        <h1>{t("about.title")}</h1>
        <p className="about-tagline">{t("about.tagline")}</p>
      </div>

      <section className="about-section">
        <h2>{t("about.whatTitle")}</h2>
        <p>{t("about.whatBody")}</p>
      </section>

      <section className="about-section">
        <h2>{t("about.howTitle")}</h2>
        <p>{t("about.howBody")}</p>
      </section>

      <section className="about-section about-disclaimer">
        <h2>{t("about.limitsTitle")}</h2>
        <p>{t("about.limitsBody")}</p>
      </section>
    </div>
  );
}

import BackButton from "../components/BackButton";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";
import "./LegalPage.css";

// Bump when the wording of any policy changes.
const LAST_UPDATED = "2026-11-04";

export default function LegalPage({ doc }) {
  const { t, lang } = useLanguage();
  usePageTitle(doc);
  const content = t(`legal.${doc}`);
  const updated = new Date(`${LAST_UPDATED}T00:00:00`).toLocaleDateString(
    lang === "ar" ? "ar-JO" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <article className="legal-page">
      <BackButton />
      <h1>{content.title}</h1>
      <p className="legal-updated">{t("legal.updated", { date: updated })}</p>
      <p className="legal-notice">{t("legal.demoNotice")}</p>

      {content.sections.map((section) => (
        <section key={section.h} className="legal-section">
          <h2>{section.h}</h2>
          {section.list && (
            <ul>
              {section.list.map((item) => <li key={item}>{item}</li>)}
            </ul>
          )}
          {section.p?.map((para) => <p key={para}>{para}</p>)}
        </section>
      ))}
    </article>
  );
}

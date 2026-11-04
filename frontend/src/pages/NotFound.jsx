import { Link } from "react-router-dom";
import { useLanguage } from "../i18n/useLanguage";
import usePageTitle from "../hooks/usePageTitle";
import "./NotFound.css";

export default function NotFound() {
  const { t } = useLanguage();
  usePageTitle("notFound");

  return (
    <div className="not-found">
      <p className="not-found-code" aria-hidden="true">{t("notFound.code")}</p>
      <h1>{t("notFound.title")}</h1>
      <p>{t("notFound.body")}</p>
      <Link to="/" className="not-found-link">{t("notFound.home")}</Link>
    </div>
  );
}

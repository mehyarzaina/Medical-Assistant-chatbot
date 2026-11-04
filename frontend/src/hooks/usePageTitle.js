import { useEffect } from 'react';
import { useLanguage } from '../i18n/useLanguage';

// Sets the browser tab title to "<page> · <brand>" in the current language.
export default function usePageTitle(titleKey) {
  const { t } = useLanguage();
  useEffect(() => {
    document.title = `${t(`titles.${titleKey}`)} · ${t('brand')}`;
  }, [t, titleKey]);
}

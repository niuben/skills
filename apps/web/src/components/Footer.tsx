import { useTranslation } from 'react-i18next';

export function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="footer">
      <div className="container">{t('footer')}</div>
    </footer>
  );
}

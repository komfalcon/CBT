import { useTranslation } from 'react-i18next';

function App() {
  const { t } = useTranslation();

  return (
    <main className="min-h-screen bg-background p-4 text-text-primary">
      <h1 className="text-xl font-semibold">{t('welcome')}</h1>
    </main>
  );
}

export default App;

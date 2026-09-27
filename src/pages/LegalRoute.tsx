import { useEffect } from 'react';
import LegalLayout from '@/components/LegalLayout';
import { legalPageBySlug } from '@/content/legalPages';
import { goTo } from '@/lib/navigate';
import { useLang, useT } from '@/lib/i18n';

const LegalRoute = ({ slug }: { slug: string }) => {
  const lang = useLang();
  const t = useT();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const page = legalPageBySlug(slug);
  if (!page) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="t-16 text-foreground">{t('Seite nicht gefunden.', 'Page not found.')}</p>
        <button type="button" onClick={() => goTo('/')} className="btn-pill btn-secondary">
          {t('Zur App', 'Go to app')}
        </button>
      </div>
    );
  }
  const { Body } = page;
  const title = lang === 'en' ? page.titleEn : page.title;
  const todosCount = lang === 'en' ? page.todosEn.length : page.todos.length;
  return (
    <LegalLayout title={title} updated={page.updated} openCount={todosCount}>
      {Body(lang)}
    </LegalLayout>
  );
};

export default LegalRoute;

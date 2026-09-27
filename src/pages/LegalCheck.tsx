import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { legalPages } from '@/content/legalPages';
import { defaultAccountStatus, fetchAccountStatus, type AccountStatus } from '@/lib/account';
import { goTo } from '@/lib/navigate';
import Todo from '@/components/Todo';
import { useLang, useT } from '@/lib/i18n';

const LegalCheck = () => {
  const [account, setAccount] = useState<AccountStatus | null>(null);
  const lang = useLang();
  const t = useT();

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    fetchAccountStatus()
      .then(setAccount)
      .catch(() => setAccount(defaultAccountStatus));
  }, []);

  if (!account) return <div className="min-h-[100dvh] bg-background" />;

  if (account.role !== 'admin') {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="t-16 text-foreground text-center">{t('Diese Übersicht ist nur für Admins.', 'This overview is admin-only.')}</p>
        <button type="button" onClick={() => goTo('/')} className="btn-pill btn-secondary">
          {t('Zur App', 'Go to app')}
        </button>
      </div>
    );
  }

  const getTodos = (page: (typeof legalPages)[number]) => (lang === 'en' ? page.todosEn : page.todos);
  const total = legalPages.reduce((sum, page) => sum + getTodos(page).length, 0);

  return (
    <div className="min-h-[100dvh] bg-background safe-top safe-bottom">
      <div className="mx-auto w-full px-5" style={{ maxWidth: '640px' }}>
        <div className="flex items-center gap-2 h-14">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? window.history.back() : goTo('/'))}
            className="w-11 h-11 rounded-pill flex items-center justify-center text-foreground"
            aria-label={t('Zurück', 'Back')}
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.6} />
          </button>
          <h1 className="t-20 text-foreground">{t('Rechtliches — offene Stellen', 'Legal — open items')}</h1>
        </div>

        <p className="t-14 text-subtle mb-6">
          {t(
            `Entwurf: Diese Texte ersetzen keine Rechtsberatung. Insgesamt ${total} offene ${total === 1 ? 'Stelle' : 'Stellen'}.`,
            `Draft: These texts do not replace legal advice. A total of ${total} open ${total === 1 ? 'item' : 'items'}.`,
          )}
        </p>

        <div className="space-y-6 pb-16">
          {legalPages.map((page) => {
            const todos = getTodos(page);
            const title = lang === 'en' ? page.titleEn : page.title;
            return (
              <section key={page.slug}>
                <h2 className="t-18 font-medium text-foreground mb-2">
                  {title} ({todos.length})
                </h2>
                {todos.length === 0 ? (
                  <p className="t-14 text-subtle">{t('Keine offenen Stellen.', 'No open items.')}</p>
                ) : (
                  <ul className="space-y-2">
                    {todos.map((todo) => (
                      <li key={todo} className="surface-card p-3 flex flex-wrap items-center gap-2">
                        <Todo>{todo}</Todo>
                        <span className="t-12 text-subtle">
                          {t('auf', 'on')} /{page.slug}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default LegalCheck;

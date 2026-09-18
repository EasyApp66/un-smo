import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { legalPages } from '@/content/legalPages';
import { defaultAccountStatus, fetchAccountStatus, type AccountStatus } from '@/lib/account';
import { goTo } from '@/lib/navigate';
import Todo from '@/components/Todo';

const LegalCheck = () => {
  const [account, setAccount] = useState<AccountStatus | null>(null);

  useEffect(() => {
    fetchAccountStatus()
      .then(setAccount)
      .catch(() => setAccount(defaultAccountStatus));
  }, []);

  if (!account) return <div className="min-h-[100dvh] bg-background" />;

  if (account.role !== 'admin') {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="t-16 text-foreground text-center">Diese Übersicht ist nur für Admins.</p>
        <button type="button" onClick={() => goTo('/')} className="btn-pill btn-secondary">
          Zur App
        </button>
      </div>
    );
  }

  const total = legalPages.reduce((sum, page) => sum + page.todos.length, 0);

  return (
    <div className="min-h-[100dvh] bg-background safe-top safe-bottom">
      <div className="mx-auto w-full px-5" style={{ maxWidth: '640px' }}>
        <div className="flex items-center gap-2 h-14">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? window.history.back() : goTo('/'))}
            className="w-11 h-11 rounded-pill flex items-center justify-center text-foreground"
            aria-label="Zurück"
          >
            <ArrowLeft className="w-5 h-5" strokeWidth={1.6} />
          </button>
          <h1 className="t-20 text-foreground">Rechtliches — offene Stellen</h1>
        </div>

        <p className="t-14 text-subtle mb-6">
          Entwurf: Diese Texte ersetzen keine Rechtsberatung. Insgesamt {total} offene{' '}
          {total === 1 ? 'Stelle' : 'Stellen'}.
        </p>

        <div className="space-y-6 pb-16">
          {legalPages.map((page) => (
            <section key={page.slug}>
              <h2 className="t-18 font-medium text-foreground mb-2">
                {page.title} ({page.todos.length})
              </h2>
              {page.todos.length === 0 ? (
                <p className="t-14 text-subtle">Keine offenen Stellen.</p>
              ) : (
                <ul className="space-y-2">
                  {page.todos.map((todo) => (
                    <li key={todo} className="surface-card p-3 flex flex-wrap items-center gap-2">
                      <Todo>{todo}</Todo>
                      <span className="t-12 text-subtle">auf /{page.slug}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LegalCheck;

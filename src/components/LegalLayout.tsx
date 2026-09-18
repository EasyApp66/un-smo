import { ArrowLeft, AlertTriangle } from 'lucide-react';
import { goTo } from '@/lib/navigate';

export const LegalSection = ({ title, children }: { title?: string; children: React.ReactNode }) => (
  <section className="mb-8">
    {title && <h2 className="t-18 font-medium text-foreground mb-2">{title}</h2>}
    <div className="text-foreground" style={{ fontSize: '15px', lineHeight: 1.7, fontWeight: 300 }}>
      {children}
    </div>
  </section>
);

const LegalLayout = ({
  title,
  updated,
  openCount,
  children,
}: {
  title: string;
  updated: string;
  openCount: number;
  children: React.ReactNode;
}) => (
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
        <h1 className="t-20 text-foreground">{title}</h1>
      </div>

      <p className="t-12 text-subtle mb-4">
        Entwurf: Diese Texte sind Entwürfe und ersetzen keine Rechtsberatung. Vor dem Verkaufsstart muss ein Anwalt
        draufschauen.
      </p>

      {openCount > 0 && (
        <div
          className="flex items-start gap-2 rounded-[6px] border p-3 mb-6"
          style={{
            backgroundColor: 'hsl(45 93% 58% / 0.18)',
            borderColor: 'hsl(45 93% 58%)',
            color: 'hsl(35 80% 22%)',
          }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" strokeWidth={2} />
          <p className="t-14">
            Diese Seite enthält {openCount} offene {openCount === 1 ? 'Stelle' : 'Stellen'}. Bitte vor dem Verkaufsstart
            ausfüllen.
          </p>
        </div>
      )}

      <div className="pb-16">
        {children}
        <p className="t-12 text-subtle mt-8">Letzte Änderung: {updated}</p>
      </div>
    </div>
  </div>
);

export default LegalLayout;

import LegalLayout from '@/components/LegalLayout';
import { legalPageBySlug } from '@/content/legalPages';
import { goTo } from '@/lib/navigate';

const LegalRoute = ({ slug }: { slug: string }) => {
  const page = legalPageBySlug(slug);
  if (!page) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col items-center justify-center gap-4 px-6">
        <p className="t-16 text-foreground">Seite nicht gefunden.</p>
        <button type="button" onClick={() => goTo('/')} className="btn-pill btn-secondary">
          Zur App
        </button>
      </div>
    );
  }
  const { Body } = page;
  return (
    <LegalLayout title={page.title} updated={page.updated} openCount={page.todos.length}>
      <Body />
    </LegalLayout>
  );
};

export default LegalRoute;

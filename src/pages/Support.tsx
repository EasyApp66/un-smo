import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type Language = 'de' | 'en';

const copy = {
  de: {
    title: 'Support',
    intro: 'Du brauchst Hilfe mit UN-SMO?',
    body: 'Schreib uns eine E-Mail und beschreibe kurz, wobei du Unterstützung benötigst. Bitte sende keine Passwörter oder vertraulichen Gesundheitsdaten.',
    action: 'Support kontaktieren',
    response: 'Wir antworten so bald wie möglich.',
    languageLabel: 'Sprache auswählen',
  },
  en: {
    title: 'Support',
    intro: 'Need help with UN-SMO?',
    body: 'Send us an email and briefly describe what you need help with. Please do not send passwords or confidential health information.',
    action: 'Contact support',
    response: 'We will reply as soon as possible.',
    languageLabel: 'Select language',
  },
} as const;

const Support = () => {
  const [language, setLanguage] = useState<Language>('de');
  const content = copy[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = `Support – UN-SMO`;
    return () => {
      document.documentElement.lang = 'de';
      document.title = 'UN-SMO';
    };
  }, [language]);

  return (
    <main className="min-h-[100dvh] bg-background text-foreground safe-top safe-bottom">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-[720px] flex-col px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/favicon-v3.svg" alt="" className="h-10 w-10" />
            <span className="t-18 font-medium">UN-SMO</span>
          </div>
          <div className="flex rounded-pill border border-border bg-card p-1" role="group" aria-label={content.languageLabel}>
            <Button type="button" variant={language === 'de' ? 'default' : 'ghost'} className="h-9 rounded-pill px-4" onClick={() => setLanguage('de')} aria-pressed={language === 'de'}>
              DE
            </Button>
            <Button type="button" variant={language === 'en' ? 'default' : 'ghost'} className="h-9 rounded-pill px-4" onClick={() => setLanguage('en')} aria-pressed={language === 'en'}>
              EN
            </Button>
          </div>
        </header>

        <section className="my-auto py-16">
          <p className="t-14 mb-3 text-muted-foreground">{content.title}</p>
          <h1 className="max-w-[560px] text-[36px] font-light leading-tight sm:text-[44px]">{content.intro}</h1>
          <p className="mt-5 max-w-[600px] text-[16px] font-light leading-7">{content.body}</p>
          <Button asChild className="mt-8 h-12 rounded-pill px-6">
            <a href="mailto:hello@n55.ch?subject=UN-SMO%20Support">{content.action}</a>
          </Button>
          <p className="t-14 mt-4 text-subtle">{content.response}</p>
        </section>

        <footer className="border-t border-border pt-6">
          <a className="t-16 font-medium underline underline-offset-4" href="mailto:hello@n55.ch">
            hello@n55.ch
          </a>
        </footer>
      </div>
    </main>
  );
};

export default Support;
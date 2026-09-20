import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

type Language = 'de' | 'en';

const sections = {
  de: {
    title: 'Datenschutzerklärung',
    subtitle: 'Datenschutz bei UN-SMO',
    updated: 'Stand: 20. September 2026',
    languageLabel: 'Sprache auswählen',
    contact: 'Kontakt',
    items: [
      {
        title: '1. Verantwortliche Stelle',
        body: (
          <p>
            Verantwortlich für die Bearbeitung personenbezogener Daten in UN-SMO ist der Betreiber der App. Fragen zum
            Datenschutz kannst du an <a className="underline underline-offset-4" href="mailto:hello@n55.ch">hello@n55.ch</a> richten.
          </p>
        ),
      },
      {
        title: '2. Nutzung ohne Konto',
        body: (
          <p>
            UN-SMO kann ohne Konto genutzt werden. Angaben zu deinem Tagesziel, deinen Zeiten, Erinnerungen und deinem
            Verlauf werden dann lokal auf deinem Gerät gespeichert. Diese lokalen Angaben werden nicht automatisch an
            den Betreiber übermittelt.
          </p>
        ),
      },
      {
        title: '3. Konto und Synchronisierung',
        body: (
          <p>
            Wenn du freiwillig ein Konto erstellst oder die geräteübergreifende Speicherung nutzt, können deine
            E-Mail-Adresse, Kontokennung und die von dir gespeicherten App-Daten verarbeitet werden. Dazu gehören
            Tagesziele, Wach- und Schlafzeiten, erledigte oder übersprungene Erinnerungen sowie statistische Werte.
            Diese Verarbeitung dient der Anmeldung, Sicherung und Synchronisierung deiner Daten.
          </p>
        ),
      },
      {
        title: '4. Benachrichtigungen',
        body: (
          <p>
            Wenn du Push-Mitteilungen aktivierst, verarbeitet UN-SMO eine technische Geräte- oder Push-Kennung sowie
            die für die Zustellung notwendigen Zeitplanangaben. Du kannst die Erlaubnis jederzeit in den
            Geräteeinstellungen widerrufen.
          </p>
        ),
      },
      {
        title: '5. Käufe und Zahlungen',
        body: (
          <p>
            Falls Käufe über den App Store angeboten werden, verarbeitet Apple die Zahlungs- und Abrechnungsdaten nach
            den eigenen Datenschutzbestimmungen. UN-SMO erhält nur die Informationen, die zur Freischaltung und
            Verwaltung des gekauften Zugangs erforderlich sind.
          </p>
        ),
      },
      {
        title: '6. Weitergabe und Dienstleister',
        body: (
          <p>
            Daten werden nur an technische Dienstleister weitergegeben, soweit dies für Anmeldung, Datenspeicherung,
            Benachrichtigungen, Hosting oder Käufe notwendig ist. Es findet kein Verkauf personenbezogener Daten statt.
          </p>
        ),
      },
      {
        title: '7. Aufbewahrung und Löschung',
        body: (
          <p>
            Lokale Daten bleiben auf deinem Gerät, bis du sie in der App löschst oder die App-Daten entfernst.
            Kontodaten werden gespeichert, solange dein Konto besteht oder gesetzliche Pflichten eine längere
            Aufbewahrung verlangen. Über die Einstellungen kannst du deine Daten exportieren und die Löschung deines
            Kontos anfordern.
          </p>
        ),
      },
      {
        title: '8. Deine Rechte',
        body: (
          <p>
            Je nach anwendbarem Recht kannst du Auskunft, Berichtigung, Löschung, Einschränkung, Übertragung deiner Daten
            oder den Widerruf einer Einwilligung verlangen. Du kannst dich ausserdem an die zuständige
            Datenschutzaufsichtsbehörde wenden. Für Anfragen genügt eine E-Mail an hello@n55.ch.
          </p>
        ),
      },
      {
        title: '9. Änderungen',
        body: <p>Diese Datenschutzerklärung kann angepasst werden, wenn sich die App oder die rechtlichen Anforderungen ändern.</p>,
      },
    ],
  },
  en: {
    title: 'Privacy Policy',
    subtitle: 'Privacy at UN-SMO',
    updated: 'Last updated: September 20, 2026',
    languageLabel: 'Select language',
    contact: 'Contact',
    items: [
      {
        title: '1. Data Controller',
        body: (
          <p>
            The operator of UN-SMO is responsible for processing personal data in the app. For privacy questions,
            contact <a className="underline underline-offset-4" href="mailto:hello@n55.ch">hello@n55.ch</a>.
          </p>
        ),
      },
      {
        title: '2. Use Without an Account',
        body: (
          <p>
            You can use UN-SMO without an account. Your daily target, times, reminders and history are then stored
            locally on your device. This local information is not automatically transmitted to the app operator.
          </p>
        ),
      },
      {
        title: '3. Account and Synchronisation',
        body: (
          <p>
            If you voluntarily create an account or use cross-device storage, we may process your email address,
            account identifier and the app data you save. This may include daily targets, wake and sleep times,
            completed or skipped reminders and statistical values. This processing provides sign-in, backup and data
            synchronisation.
          </p>
        ),
      },
      {
        title: '4. Notifications',
        body: (
          <p>
            If you enable push notifications, UN-SMO processes a technical device or push identifier and the schedule
            details required to deliver them. You may withdraw permission at any time in your device settings.
          </p>
        ),
      },
      {
        title: '5. Purchases and Payments',
        body: (
          <p>
            If purchases are offered through the App Store, Apple processes payment and billing data under its own
            privacy policy. UN-SMO receives only the information required to unlock and manage the purchased access.
          </p>
        ),
      },
      {
        title: '6. Service Providers and Sharing',
        body: (
          <p>
            Data is shared with technical service providers only where required for sign-in, data storage,
            notifications, hosting or purchases. Personal data is not sold.
          </p>
        ),
      },
      {
        title: '7. Retention and Deletion',
        body: (
          <p>
            Local data remains on your device until you delete it in the app or remove the app data. Account data is
            retained while your account exists or for longer where required by law. You can export your data and
            request account deletion in the app settings.
          </p>
        ),
      },
      {
        title: '8. Your Rights',
        body: (
          <p>
            Depending on applicable law, you may request access, correction, deletion, restriction or portability of
            your data, or withdraw consent. You may also contact the competent data protection authority. Send requests
            to hello@n55.ch.
          </p>
        ),
      },
      {
        title: '9. Changes',
        body: <p>This Privacy Policy may be updated when the app or legal requirements change.</p>,
      },
    ],
  },
} as const;

const PrivacyPolicy = () => {
  const [language, setLanguage] = useState<Language>('de');
  const content = sections[language];

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'de' ? 'Datenschutzerklärung – UN-SMO' : 'Privacy Policy – UN-SMO';
    return () => {
      document.documentElement.lang = 'de';
      document.title = 'UN-SMO';
    };
  }, [language]);

  return (
    <main className="min-h-[100dvh] bg-background text-foreground safe-top safe-bottom">
      <div className="mx-auto w-full max-w-[720px] px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
        <header className="mb-10 border-b border-border pb-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/favicon-v3.svg" alt="" className="h-10 w-10" />
              <span className="t-18 font-medium">UN-SMO</span>
            </div>
            <div className="flex rounded-pill border border-border bg-card p-1" role="group" aria-label={content.languageLabel}>
              <Button
                type="button"
                variant={language === 'de' ? 'default' : 'ghost'}
                className="h-9 rounded-pill px-4"
                onClick={() => setLanguage('de')}
                aria-pressed={language === 'de'}
              >
                DE
              </Button>
              <Button
                type="button"
                variant={language === 'en' ? 'default' : 'ghost'}
                className="h-9 rounded-pill px-4"
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
              >
                EN
              </Button>
            </div>
          </div>
          <p className="t-14 mb-2 text-muted-foreground">{content.subtitle}</p>
          <h1 className="text-[36px] font-light leading-tight sm:text-[44px]">{content.title}</h1>
          <p className="t-14 mt-3 text-subtle">{content.updated}</p>
        </header>

        <div>
          {content.items.map((item) => (
            <section key={item.title} className="mb-8">
              <h2 className="t-18 mb-2 font-medium">{item.title}</h2>
              <div className="text-[15px] font-light leading-7 text-foreground">{item.body}</div>
            </section>
          ))}
        </div>

        <footer className="mt-12 border-t border-border pt-6">
          <p className="t-14 text-muted-foreground">{content.contact}</p>
          <a className="t-16 mt-1 inline-block font-medium underline underline-offset-4" href="mailto:hello@n55.ch">
            hello@n55.ch
          </a>
        </footer>
      </div>
    </main>
  );
};

export default PrivacyPolicy;
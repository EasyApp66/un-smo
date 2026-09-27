import Todo from '@/components/Todo';
import { LegalSection } from '@/components/LegalLayout';
import type { Lang } from '@/lib/i18n';

export interface LegalPage {
  slug: string;
  title: string;
  titleEn: string;
  updated: string;
  todos: string[];
  todosEn: string[];
  Body: (lang: Lang) => JSX.Element;
}

const UPDATED = '18. September 2026';
const UPDATED_EN = 'September 18, 2026';

const impressumTodos = [
  'Firmenname, so wie er im Handelsregister steht',
  'Strasse und Nummer',
  'Kontakt-E-Mail für Kundschaft',
  'Telefonnummer, optional',
  'Handelsregisternummer, falls eingetragen',
  'Mehrwertsteuernummer, falls steuerpflichtig — ab 100\u2019000 Franken Jahresumsatz',
];

const impressumTodosEn = [
  'Company name, as registered in the commercial register',
  'Street and number',
  'Contact email for customers',
  'Phone number, optional',
  'Commercial register number, if registered',
  'VAT number, if liable for tax — from CHF 100,000 annual turnover',
];

const datenschutzTodos = [
  'Region der Supabase-Instanz eintragen',
  'Hosting-Anbieter',
  'EU-Vertreter nach Art. 27 DSGVO — prüfen, ob nötig',
];

const datenschutzTodosEn = [
  'Enter region of the Supabase instance',
  'Hosting provider',
  'EU representative under Art. 27 GDPR — check if required',
];

const agbTodos = [
  'mit oder ohne MWST',
  'Gerichtsstand eintragen',
];

const agbTodosEn = [
  'with or without VAT',
  'Enter place of jurisdiction',
];

export const legalPages: LegalPage[] = [
  {
    slug: 'impressum',
    title: 'Impressum',
    titleEn: 'Legal Notice',
    updated: UPDATED,
    todos: impressumTodos,
    todosEn: impressumTodosEn,
    Body: (lang) =>
      lang === 'en' ? (
        <>
          <LegalSection title="Operator">
            <Todo>{impressumTodosEn[0]}</Todo>, owner Ivan Mirosnic, <Todo>{impressumTodosEn[1]}</Todo>, 8805 Richterswil,
            Switzerland.
          </LegalSection>
          <LegalSection title="Contact">
            <Todo>{impressumTodosEn[2]}</Todo>, <Todo>{impressumTodosEn[3]}</Todo>
          </LegalSection>
          <LegalSection title="Register entries">
            <Todo>{impressumTodosEn[4]}</Todo>
            <br />
            <Todo>{impressumTodosEn[5]}</Todo>
          </LegalSection>
          <LegalSection title="Responsible for content">Ivan Mirosnic, address as above.</LegalSection>
        </>
      ) : (
        <>
          <LegalSection title="Betreiber">
            <Todo>{impressumTodos[0]}</Todo>, Inhaber Ivan Mirosnic, <Todo>{impressumTodos[1]}</Todo>, 8805 Richterswil,
            Schweiz.
          </LegalSection>
          <LegalSection title="Kontakt">
            <Todo>{impressumTodos[2]}</Todo>, <Todo>{impressumTodos[3]}</Todo>
          </LegalSection>
          <LegalSection title="Registereinträge">
            <Todo>{impressumTodos[4]}</Todo>
            <br />
            <Todo>{impressumTodos[5]}</Todo>
          </LegalSection>
          <LegalSection title="Verantwortlich für den Inhalt">Ivan Mirosnic, Adresse wie oben.</LegalSection>
        </>
      ),
  },
  {
    slug: 'datenschutz',
    title: 'Datenschutzerklärung',
    titleEn: 'Privacy Policy',
    updated: UPDATED,
    todos: datenschutzTodos,
    todosEn: datenschutzTodosEn,
    Body: (lang) =>
      lang === 'en' ? (
        <>
          <LegalSection title="Data controller">
            The operator named in the legal notice is responsible for processing personal data. Please direct any
            privacy-related inquiries to the contact address stated there.
          </LegalSection>

          <LegalSection title="What data is collected">
            Your email address, if you sign up voluntarily. The information you enter about your smoking behaviour:
            cigarette counts, wake and sleep times, and daily goals. Payment data is processed exclusively by the
            payment provider Stripe and is not held by us. If you enable reminders, a push subscription with a device
            identifier is stored.
          </LegalSection>

          <LegalSection title="Special categories of personal data">
            Information about smoking behaviour is considered health data and thus a special category of personal
            data within the meaning of Art. 5 lit. c revFADP and Art. 9 GDPR. Processing is based exclusively on your
            explicit consent. You can withdraw this consent at any time with effect for the future by deleting your
            account or your data in the settings.
          </LegalSection>

          <LegalSection title="Use without an account">
            The app can be used without an account. In this case, all information remains exclusively on your device
            and is not transmitted to us.
          </LegalSection>

          <LegalSection title="Processors">
            Supabase (database, sign-in, and server functions, server location <Todo>{datenschutzTodosEn[0]}</Todo>).
            Stripe (payment processing, Ireland and the USA). <Todo>{datenschutzTodosEn[1]}</Todo> (operation of the
            website and the app). All service providers are contractually obliged to confidentiality and to process
            data according to our instructions.
          </LegalSection>

          <LegalSection title="Transfer abroad">
            Data is transferred to the USA only where necessary for operation, and relies on the standard contractual
            clauses of the European Commission as well as supplementary safeguards under revFADP.
          </LegalSection>

          <LegalSection title="Retention and deletion">
            Data is retained only as long as necessary for operation or due to statutory retention periods. Using the
            delete button in the settings, you can permanently delete your account and all associated data at any
            time. Invoice data held by Stripe is subject to statutory retention obligations.
          </LegalSection>

          <LegalSection title="Your rights">
            You have the right to access, rectification, erasure, restriction, data portability, and to withdraw your
            consent. In Switzerland you may lodge a complaint with the Federal Data Protection and Information
            Commissioner (FDPIC); in the EU with the supervisory authority responsible for you.
          </LegalSection>

          <LegalSection title="No advertising, no disclosure">
            We do not send advertising, do not sell data, and do not analyse data across users. Should statistical
            tracking be introduced later, this section will be updated beforehand.
          </LegalSection>

          <LegalSection title="Representative in the EU">
            <Todo>{datenschutzTodosEn[2]}</Todo>
          </LegalSection>
        </>
      ) : (
        <>
          <LegalSection title="Verantwortliche Stelle">
            Verantwortlich für die Bearbeitung der Personendaten ist der im Impressum genannte Betreiber. Anfragen zum
            Datenschutz richtest du an die dort angegebene Kontaktadresse.
          </LegalSection>

          <LegalSection title="Welche Daten anfallen">
            E-Mail-Adresse, wenn du dich freiwillig anmeldest. Die von dir eingegebenen Angaben zum Rauchverhalten:
            Zigarettenzahlen, Wach- und Schlafzeiten sowie Tagesziele. Zahlungsdaten werden ausschliesslich beim
            Zahlungsdienstleister Stripe bearbeitet und liegen nicht bei uns. Wenn du Erinnerungen einschaltest, wird ein
            Push-Abonnement mit einer Gerätekennung gespeichert.
          </LegalSection>

          <LegalSection title="Besonders schützenswerte Personendaten">
            Angaben zum Rauchverhalten gelten als Gesundheitsdaten und damit als besonders schützenswerte Personendaten im
            Sinne von Art. 5 lit. c revDSG und Art. 9 DSGVO. Die Bearbeitung beruht ausschliesslich auf deiner
            ausdrücklichen Einwilligung. Du kannst diese Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen,
            indem du dein Konto oder deine Daten in den Einstellungen löschst.
          </LegalSection>

          <LegalSection title="Nutzung ohne Konto">
            Die App ist ohne Konto nutzbar. In diesem Fall bleiben sämtliche Angaben ausschliesslich lokal auf deinem Gerät
            und werden nicht an uns übermittelt.
          </LegalSection>

          <LegalSection title="Auftragsverarbeiter">
            Supabase (Datenbank, Anmeldung und Serverfunktionen, Serverstandort <Todo>{datenschutzTodos[0]}</Todo>).
            Stripe (Zahlungsabwicklung, Irland und USA). <Todo>{datenschutzTodos[1]}</Todo> (Betrieb der Website und der
            App). Alle Dienstleister sind vertraglich zur Vertraulichkeit und zur Bearbeitung nach unseren Weisungen
            verpflichtet.
          </LegalSection>

          <LegalSection title="Übermittlung ins Ausland">
            Eine Übermittlung in die USA erfolgt nur, soweit für den Betrieb nötig, und stützt sich auf die
            Standardvertragsklauseln der Europäischen Kommission sowie auf ergänzende Schutzmassnahmen nach revDSG.
          </LegalSection>

          <LegalSection title="Aufbewahrung und Löschung">
            Daten werden nur so lange aufbewahrt, wie es für den Betrieb oder aufgrund gesetzlicher Aufbewahrungsfristen
            nötig ist. Über den Löschknopf in den Einstellungen kannst du jederzeit dein Konto und alle zugehörigen Daten
            endgültig löschen. Rechnungsdaten bei Stripe unterliegen der gesetzlichen Aufbewahrungspflicht.
          </LegalSection>

          <LegalSection title="Deine Rechte">
            Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und auf Widerruf
            deiner Einwilligung. In der Schweiz kannst du dich beim Eidgenössischen Datenschutz- und
            Öffentlichkeitsbeauftragten (EDÖB) beschweren, in der EU bei der für dich zuständigen Aufsichtsbehörde.
          </LegalSection>

          <LegalSection title="Keine Werbung, keine Weitergabe">
            Wir versenden keine Werbung, verkaufen keine Daten weiter und werten keine Daten über Nutzer hinweg aus. Sollte
            später eine Statistik-Erfassung eingeführt werden, wird dieser Abschnitt vorgängig ergänzt.
          </LegalSection>

          <LegalSection title="Vertretung in der EU">
            <Todo>{datenschutzTodos[2]}</Todo>
          </LegalSection>
        </>
      ),
  },
  {
    slug: 'agb',
    title: 'Allgemeine Geschäftsbedingungen',
    titleEn: 'Terms and Conditions',
    updated: UPDATED,
    todos: agbTodos,
    todosEn: agbTodosEn,
    Body: (lang) =>
      lang === 'en' ? (
        <>
          <LegalSection title="1. Subject matter">
            The subject matter is a digital subscription for an application to gradually reduce cigarette consumption.
          </LegalSection>

          <LegalSection title="2. Prices">
            CHF 4.90 monthly, CHF 29.00 yearly, CHF 79.00 one-time. All prices are{' '}
            <Todo>{agbTodosEn[0]}</Todo>.
          </LegalSection>

          <LegalSection title="3. Trial period">
            Use is free of charge for seven days from the first launch. After that, a subscription is required for the
            extended features.
          </LegalSection>

          <LegalSection title="4. Term and cancellation">
            The subscription automatically renews for the same term unless cancelled by the end of the current period.
            Cancellation is possible at any time via the button in the settings and takes effect at the end of the
            paid period. No pro-rata refund is given for early cancellation, unless mandatory law provides otherwise.
          </LegalSection>

          <LegalSection title="5. “Lifetime” plan">
            The "Lifetime" plan is a one-time payment. No further costs whatsoever arise afterwards: no subscription
            fee, no renewal, no additional payment, no extra costs for future features. Access includes the full
            feature set including all future updates.
            <br />
            <br />
            "Lifetime" refers to the lifespan of the product, not the lifetime of the customer. Should operation of
            the application be discontinued, the following applies: discontinuation will be announced by email at
            least twelve months in advance, access remains fully in place until the announced date, and your own data
            can be exported during this entire period and beyond.
          </LegalSection>

          <LegalSection title="6. Right of withdrawal for customers in the EU">
            Customers residing in the EU have a right of withdrawal of fourteen days. For digital content, this right
            expires as soon as performance has begun with your express consent. During the purchase process you
            therefore confirm: "I request immediate provision and I am aware that my right of withdrawal thereby
            expires." No purchase is possible without this confirmation. Consent is stored with a timestamp.
          </LegalSection>

          <LegalSection title="7. No guarantee of success">
            No specific outcome regarding smoking cessation is owed. The app merely supports self-observation and
            gradual reduction.
          </LegalSection>

          <LegalSection title="8. Applicable law and place of jurisdiction">
            Swiss law applies. The place of jurisdiction is <Todo>{agbTodosEn[1]}</Todo>. Mandatory consumer
            protection provisions of the customer's country of residence remain unaffected.
          </LegalSection>

          <LegalSection title="9. Changes">
            Changes to these terms will be announced by email 30 days in advance.
          </LegalSection>
        </>
      ) : (
        <>
          <LegalSection title="1. Gegenstand">
            Gegenstand ist ein digitales Abonnement für eine Anwendung zur schrittweisen Verringerung des
            Zigarettenkonsums.
          </LegalSection>

          <LegalSection title="2. Preise">
            Monatlich CHF 4.90, jährlich CHF 29.00, einmalig CHF 79.00. Alle Preise verstehen sich{' '}
            <Todo>{agbTodos[0]}</Todo>.
          </LegalSection>

          <LegalSection title="3. Testzeit">
            Die Nutzung ist während sieben Tagen ab erstem Start kostenlos. Danach ist für die erweiterten Funktionen ein
            Abonnement nötig.
          </LegalSection>

          <LegalSection title="4. Laufzeit und Kündigung">
            Das Abonnement verlängert sich jeweils automatisch um dieselbe Laufzeit, sofern es nicht bis zum Ende der
            laufenden Periode gekündigt wird. Die Kündigung ist jederzeit über den Knopf in den Einstellungen möglich und
            wird auf das Ende der bezahlten Periode wirksam. Eine anteilige Rückerstattung bei vorzeitiger Kündigung
            erfolgt nicht, soweit nicht zwingendes Recht etwas anderes vorsieht.
          </LegalSection>

          <LegalSection title="5. Tarif «Lebenslang»">
            Der Tarif «Lebenslang» ist eine einmalige Zahlung. Es fallen danach keinerlei weitere Kosten an: keine
            Abonnementgebühr, keine Verlängerung, keine Nachzahlung, keine Zusatzkosten für künftige Funktionen. Der Zugang
            umfasst den vollen Funktionsumfang einschliesslich aller späteren Aktualisierungen.
            <br />
            <br />
            «Lebenslang» bezieht sich auf die Lebensdauer des Produkts, nicht auf die Lebenszeit der Kundin oder des
            Kunden. Sollte der Betrieb der Anwendung eingestellt werden, gilt: Die Einstellung wird mindestens zwölf Monate
            im Voraus per E-Mail angekündigt, der Zugang bleibt bis zum angekündigten Zeitpunkt vollständig bestehen, und
            die eigenen Daten können während dieser ganzen Zeit sowie darüber hinaus exportiert werden.
          </LegalSection>

          <LegalSection title="6. Widerrufsrecht für Kundschaft in der EU">
            Kundinnen und Kunden mit Wohnsitz in der EU haben ein Widerrufsrecht von vierzehn Tagen. Bei digitalen Inhalten
            erlischt dieses Recht, sobald die Ausführung mit deiner ausdrücklichen Zustimmung begonnen hat. Im Kaufvorgang
            bestätigst du deshalb: «Ich verlange die sofortige Bereitstellung und weiss, dass mein Widerrufsrecht damit
            erlischt.» Ohne diese Bestätigung ist kein Kauf möglich. Die Zustimmung wird mit Zeitstempel gespeichert.
          </LegalSection>

          <LegalSection title="7. Keine Erfolgsgarantie">
            Es wird kein bestimmter Erfolg beim Rauchstopp geschuldet. Die App unterstützt lediglich bei der
            Selbstbeobachtung und der schrittweisen Verringerung.
          </LegalSection>

          <LegalSection title="8. Anwendbares Recht und Gerichtsstand">
            Es gilt Schweizer Recht. Gerichtsstand ist <Todo>{agbTodos[1]}</Todo>. Zwingende
            Verbraucherschutzvorschriften des Wohnsitzstaates bleiben unberührt.
          </LegalSection>

          <LegalSection title="9. Änderungen">
            Änderungen dieser Bedingungen werden 30 Tage im Voraus per E-Mail angekündigt.
          </LegalSection>
        </>
      ),
  },
  {
    slug: 'gesundheitshinweis',
    title: 'Gesundheitshinweis',
    titleEn: 'Health Notice',
    updated: UPDATED,
    todos: [],
    todosEn: [],
    Body: (lang) =>
      lang === 'en' ? (
        <>
          <LegalSection>
            The app is not a medical device and does not replace medical or therapeutic advice.
          </LegalSection>
          <LegalSection>
            The information about recovery processes in the body is general information based on data from the WHO
            and NHS and does not describe an individual course.
          </LegalSection>
          <LegalSection>
            Anyone experiencing symptoms, who is pregnant, or who is taking medication should seek medical advice.
          </LegalSection>
          <LegalSection>
            If there are signs of dependency, the smoking cessation hotline in Switzerland can help at 0848 000 181.
          </LegalSection>
        </>
      ) : (
        <>
          <LegalSection>
            Die App ist kein Medizinprodukt und ersetzt keine ärztliche oder therapeutische Beratung.
          </LegalSection>
          <LegalSection>
            Die Angaben zu Erholungsvorgängen im Körper sind allgemeine Informationen nach Angaben von WHO und NHS und
            beschreiben keinen individuellen Verlauf.
          </LegalSection>
          <LegalSection>
            Wer Beschwerden hat, schwanger ist oder Medikamente einnimmt, soll ärztlichen Rat einholen.
          </LegalSection>
          <LegalSection>
            Bei Anzeichen einer Abhängigkeit hilft in der Schweiz die Rauchstopplinie unter 0848 000 181.
          </LegalSection>
        </>
      ),
  },
];

export const legalPageBySlug = (slug: string) => legalPages.find((page) => page.slug === slug);

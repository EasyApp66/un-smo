import Todo from '@/components/Todo';
import { LegalSection } from '@/components/LegalLayout';

export interface LegalPage {
  slug: string;
  title: string;
  updated: string;
  todos: string[];
  Body: () => JSX.Element;
}

const UPDATED = '18. September 2026';

const impressumTodos = [
  'Firmenname, so wie er im Handelsregister steht',
  'Strasse und Nummer',
  'Kontakt-E-Mail für Kundschaft',
  'Telefonnummer, optional',
  'Handelsregisternummer, falls eingetragen',
  'Mehrwertsteuernummer, falls steuerpflichtig — ab 100\u2019000 Franken Jahresumsatz',
];

const datenschutzTodos = [
  'Region der Supabase-Instanz eintragen',
  'Hosting-Anbieter',
  'EU-Vertreter nach Art. 27 DSGVO — prüfen, ob nötig',
];

const agbTodos = [
  'mit oder ohne MWST',
  'Mindestbetriebsdauer festlegen, z.B. 24 Monate',
  'Gerichtsstand eintragen',
];

export const legalPages: LegalPage[] = [
  {
    slug: 'impressum',
    title: 'Impressum',
    updated: UPDATED,
    todos: impressumTodos,
    Body: () => (
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
    updated: UPDATED,
    todos: datenschutzTodos,
    Body: () => (
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
    updated: UPDATED,
    todos: agbTodos,
    Body: () => (
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

        <LegalSection title="5. Lebenslanger Zugang">
          «Lebenslang» bedeutet: eine einmalige Zahlung, danach Nutzung ohne weitere Kosten, solange die App betrieben
          wird, mindestens jedoch <Todo>{agbTodos[1]}</Todo> ab Kaufdatum. Wird der Betrieb vor Ablauf dieser
          Mindestdauer eingestellt, wird der nicht genutzte Anteil zeitanteilig zurückerstattet.
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
          Es gilt Schweizer Recht. Gerichtsstand ist <Todo>{agbTodos[2]}</Todo>. Zwingende
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
    updated: UPDATED,
    todos: [],
    Body: () => (
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

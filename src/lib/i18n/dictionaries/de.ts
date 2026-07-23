/**
 * German is the source dictionary: its exact shape becomes the `Dictionary`
 * type, so every other language file must provide the same keys.
 */
export const de = {
  nav: {
    dashboard: "Dashboard",
    requests: "Anfragen",
    appointments: "Termine",
    services: "Dienstleistungen",
    hours: "Öffnungszeiten",
    absences: "Urlaub & Schließzeiten",
    profile: "Betrieb",
    faq: "Eigene Fragen",
    conversations: "Gespräche",
    embed: "Einbetten",
    signOut: "Abmelden",
    loggedInAs: (email: string) => `Angemeldet als ${email}`,
  },
  common: {
    language: "Sprache",
    login: "Betriebs-Login",
    openDemo: "Live-Demo öffnen",
    toLogin: "Zum Betriebs-Login",
    forHandwerk: "Für Handwerksbetriebe",
    tagline: "Terminassistent für Handwerksbetriebe",
  },
  vb: {
    metaTitle: "KI-Terminassistent — Verkaufsblatt",
    metaDescription:
      "Terminannahme für Handwerksbetriebe: rund um die Uhr erreichbar, ohne Doppelbuchungen.",
    heroBefore: "Jeder verpasste Anruf ist ein ",
    heroAccent: "verlorener Auftrag",
    heroAfter: ".",
    sub: "Ihre Kunden rufen an, während Sie auf der Leiter stehen oder beim Kunden sind. Der KI-Terminassistent nimmt diese Anfragen entgegen — rund um die Uhr, beantwortet die üblichen Fragen und vergibt Termine aus Ihrem echten Kalender. Sie sehen morgens, was reingekommen ist.",
    trust: "Läuft direkt auf Ihrer Website · Keine Installation beim Kunden",
    numbers: [
      { n: "24/7", title: "Immer erreichbar", body: "Auch abends, am Wochenende und mitten im Einsatz." },
      { n: "0", title: "Doppelbuchungen", body: "Belegte Zeiten werden gar nicht erst angeboten." },
      { n: "1×", title: "Einrichten, fertig", body: "Ein Code-Schnipsel auf Ihrer Website. Kein neues Programm." },
    ],
    featuresTitle: "Was der Assistent für Sie übernimmt",
    featuresBadge: "Neu",
    features: [
      {
        title: "Häufige Fragen beantworten",
        body: "Eigener Menüpunkt im Chat: fünf typische Fragen zum Antippen — und der Kunde kann jederzeit selbst tippen. Antwortet zu Öffnungszeiten, Leistungen, Anfahrt und Richtpreisen.",
      },
      {
        title: "Termine rund um die Uhr",
        body: "Kunden buchen selbst einen freien Termin aus Ihrem echten Kalender — belegte Zeiten sind gesperrt.",
      },
      {
        title: "Notfälle erkennen",
        body: "Dringende Fälle wie Wasserrohrbruch werden erkannt und sofort auf Ihre Notfallnummer verwiesen.",
      },
      {
        title: "Urlaub & Sperrzeiten",
        body: "Tragen Sie Urlaub oder einzelne Sperrtage ein — diese Zeiten bietet der Assistent gar nicht erst an.",
      },
      {
        title: "Fahrzeit einplanen",
        body: "Zwischen zwei Einsätzen bleibt automatisch Zeit für die Anfahrt. Keine unmöglichen Termine mehr.",
      },
      {
        title: "Umbuchen & Absagen",
        body: "Erledigt der Kunde selbst über einen Link — ohne Anruf bei Ihnen. Der Termin wird sofort wieder frei.",
      },
      {
        title: "Fotos entgegennehmen",
        body: "Kunden hängen Bilder an die Anfrage — damit Sie den Aufwand vorab realistisch einschätzen können.",
      },
      {
        title: "Einzugsgebiet prüfen",
        body: "Die Postleitzahl wird direkt bei der Anfrage geprüft — Sie sehen sofort, ob es Ihr Gebiet ist.",
      },
      {
        title: "Alles an einem Ort",
        body: "Anfragen, Termine und Gesprächsverläufe übersichtlich im Dashboard — mit Datenschutz-Einwilligung.",
      },
    ],
    quote:
      "„Der Assistent erfindet nichts. Was Sie nicht hinterlegt haben, behauptet er auch nicht — dann bietet er dem Kunden stattdessen einen Rückruf an.“",
    quoteSub: "Deshalb müssen Sie nicht befürchten, dass Ihren Kunden etwas Falsches zugesagt wird.",
    stepsTitle: "So einfach läuft es",
    steps: [
      { title: "Wir binden es ein", body: "Ein kurzer Code-Schnipsel auf Ihrer Website — der Chat erscheint unten rechts." },
      { title: "Sie tragen Ihr Wissen ein", body: "Öffnungszeiten, Leistungen, Einzugsgebiet und Notfallnummer — einmalig." },
      { title: "Der Assistent übernimmt", body: "Kunden fragen und buchen selbst. Sie sehen jede Anfrage im Dashboard." },
    ],
    offerTitle: "Ihr Angebot",
    priceHeading: "Was es kostet",
    price: "Auf Anfrage",
    priceBody:
      "Der Preis richtet sich nach Betriebsgröße und gewünschtem Umfang. Sagen Sie mir, was Sie brauchen — dann bekommen Sie ein konkretes Angebot.",
    optionsHeading: "Mögliche Zusatzoptionen",
    options: [
      "Einrichtung und Einpflegen Ihrer Betriebsdaten",
      "Automatische Bestätigungs-E-Mails und 24-Stunden-Erinnerung",
      "KI-Antworten auch auf ungewöhnliche Fragen",
    ],
    contactHeading: "Ihr Ansprechpartner",
    contactBody:
      "Gern zeige ich Ihnen den Assistenten in 10 Minuten live — telefonisch oder bei Ihnen im Betrieb. Ohne Verpflichtung.",
    copyHint: "Zum Kopieren antippen",
    copyPhoneLabel: (v: string) => `Telefonnummer ${v} kopieren`,
    copyEmailLabel: (v: string) => `E-Mail-Adresse ${v} kopieren`,
    copied: "Kopiert ✓",
    copyFailed: "Bitte manuell markieren",
    copyDoneAnnounce: (v: string) => `${v} kopiert`,
    copyFailAnnounce: "Kopieren nicht möglich — bitte manuell markieren",
    bandTitle: "Sehen Sie es sich an, wie Ihre Kunden es sehen.",
    bandBody: "Der Assistent ist live — probieren Sie ihn direkt aus.",
  },
  widget: {
    // header + shell
    statusLine: "Antwort meist in wenigen Minuten",
    restart: "Neu starten",
    welcome: (tenant: string) => `Willkommen bei ${tenant}.`,
    footer: "Ihre Angaben werden vertraulich behandelt",
    next: "Weiter",
    back: "Zurück",
    // prompts per step
    prompts: {
      welcome:
        "Ich nehme Ihre Anfrage in wenigen Schritten auf — Sie bekommen zeitnah eine persönliche Rückmeldung.\n\nWie möchten Sie starten?",
      faq: "Fragen Sie mich, was Sie wissen möchten — tippen Sie einfach los oder wählen Sie eine der häufigen Fragen.",
      service: "Um welche Leistung geht es?",
      flaeche: "Wie groß ist die Fläche ungefähr? Eine grobe Schätzung genügt.",
      situation: "Beschreiben Sie kurz Ihre Situation. Je mehr wir wissen, desto besser können wir vorbereiten.",
      fotos: "Haben Sie ein paar Fotos? Das hilft uns enorm, den Aufwand richtig einzuschätzen. (optional)",
      ort: "Wo soll die Arbeit ausgeführt werden?",
      termin: "Wann würde es Ihnen am besten passen? Wählen Sie einen freien Tag und eine freie Uhrzeit.",
      kontakt: "Zum Schluss: Wie erreichen wir Sie?",
      summary: "Bitte prüfen Sie Ihre Angaben — dann schicke ich alles direkt an den Betrieb.",
    },
    // welcome menu cards
    menu: {
      faqTitle: "Häufige Fragen",
      faqDesc: "Öffnungszeiten, Leistungen, Anfahrt — sofort beantwortet.",
      consultTitle: "Beratung / Rückruf",
      consultDesc: "Fragen klären, Kostenvoranschlag oder erst besprechen.",
      bookingTitle: "Termin buchen",
      bookingDesc: "Sie wissen, was gemacht werden soll — Vor-Ort-Termin.",
      emergencyTitle: "Notfall",
      emergencyCall: "Sofort anrufen",
    },
    // path labels shown back in the chat
    pathConsult: "Beratung / Rückruf",
    pathBooking: "Termin buchen",
    pathEmergency: "Notfall",
    // faq step
    faqPlaceholder: "Eigene Frage stellen …",
    faqAria: "Eigene Frage an den Betrieb",
    faqSend: "Frage absenden",
    faqBackToMenu: "← Zurück zum Menü",
    faqRequestCallback: "Rückruf anfordern",
    faqError: "Das konnte ich gerade nicht nachschlagen. Fragen Sie es gern direkt beim Betrieb an.",
    // service
    serviceOther: "Etwas anderes",
    // flaeche
    flaecheQuick: ["bis 5 m²", "5–15 m²", "15–30 m²", "über 30 m²", "weiß ich nicht"],
    flaecheHint: "Wählen Sie einen Bereich oder geben Sie die Fläche ein:",
    flaechePlaceholder: "z. B. 12",
    // situation
    situationPlaceholder:
      "z. B. Altes Bad komplett erneuern, Fliesen und Sanitär raus, barrierefreie Dusche gewünscht …",
    situationNone: "Keine Beschreibung",
    // fotos
    fotosAdd: "Fotos hinzufügen",
    fotosHint: "tippen zum Auswählen · JPG, PNG · bis zu 6",
    fotosRemove: "Foto entfernen",
    fotosSkip: "Überspringen",
    fotosNone: "Keine Fotos",
    fotoAlt: (n: number) => `Foto ${n}`,
    fotosAdded: (n: number) => `${n} ${n === 1 ? "Foto" : "Fotos"} hinzugefügt`,
    nextWithCount: (n: number) => `Weiter (${n})`,
    // ort
    ortLabel: "Adresse",
    ortStreet: "Straße und Hausnummer",
    ortPlz: "PLZ",
    ortCity: "Ort",
    ortErrPlz: "Bitte geben Sie eine fünfstellige PLZ an.",
    ortErrCity: "Bitte geben Sie den Ort an.",
    ortChecking: "Einzugsgebiet wird geprüft …",
    ortCovered: "✓ Sehr gut — zu Ihnen kommen wir.",
    ortNotCovered:
      "Diese Postleitzahl liegt außerhalb unseres üblichen Einzugsgebiets. Sie können die Anfrage trotzdem senden — wir melden uns und sagen Ihnen ehrlich, ob wir es einrichten können.",
    // termin
    terminLoading: "Freie Termine werden geladen …",
    terminRetry: "Erneut versuchen",
    terminNone: "Aktuell sind online keine freien Zeiten in den nächsten Wochen verfügbar.",
    terminNoneCta: "Ohne festen Termin anfragen",
    terminNoneValue: "Kein fester Termin – bitte um Rückmeldung",
    prevMonth: "Vorheriger Monat",
    nextMonth: "Nächster Monat",
    weekdays: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
    slotsCap: (date: string, min: number) => `Freie Zeiten am ${date} (je ${min} Min):`,
    slotsPick: "Bitte wählen Sie oben einen freien Tag (orange).",
    slotTaken: "Bereits vergeben",
    clock: "Uhr",
    // kontakt
    firstName: "Vorname",
    lastName: "Nachname",
    email: "E-Mail-Adresse",
    phone: "Telefonnummer",
    reviewCta: "Anfrage prüfen",
    fixFields: "Bitte prüfen Sie die markierten Felder.",
    // summary
    sumConcern: "Anliegen",
    sumService: "Leistung",
    sumArea: "Fläche",
    sumSituation: "Situation",
    sumPhotos: "Fotos",
    sumLocation: "Ort",
    sumAppointment: "Termin",
    sumName: "Name",
    sumContact: "Kontakt",
    dash: "—",
    photosCount: (n: number) => `${n} ${n === 1 ? "Foto" : "Fotos"}`,
    photosNone: "keine",
    noFixedAppt: "Kein fester Termin",
    edit: "Ändern",
    consent: (tenant: string) =>
      `Ich bin einverstanden, dass ${tenant} meine Angaben speichert und verarbeitet, um meine Anfrage zu bearbeiten. Die Daten werden nicht an Dritte weitergegeben. Ich kann diese Einwilligung jederzeit widerrufen.`,
    submitting: "Wird gesendet …",
    submit: "Anfrage absenden",
    submitError: "Die Anfrage konnte nicht gesendet werden. Bitte versuchen Sie es erneut.",
    // success
    thanks: (name: string) => `Vielen Dank, ${name}!`,
    successWithSlot: (date: string, time: string) =>
      `Ihr Wunschtermin am ${date} um ${time} ist bei uns eingegangen. Wir bestätigen ihn in Kürze.`,
    successNoSlot:
      "Ihre Anfrage ist eingegangen. Wir melden uns zeitnah bei Ihnen — in der Regel innerhalb von 24 Stunden, meist schneller.",
    reference: "Ihre Vorgangsnummer:",
    addToCalendar: "In meinen Kalender eintragen",
    manageAppt: "Termin verschieben oder absagen",
    // default suggested questions (used when the business has none of its own)
    defaultQuestions: [
      "Wann haben Sie geöffnet?",
      "Welche Leistungen bieten Sie an?",
      "Wo finde ich Sie?",
      "Wie erreiche ich Sie?",
      "Was kostet ein Einsatz?",
    ],
    localeTag: "de-DE",
  },
  faq: {
    // full weekday names, Monday-first, for the opening-hours answer
    weekdays: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"],
    clock: "Uhr", // suffix after a time range; "" where the language omits it
    from: "ab", // "Heizungswartung: ab 89,00 €"
    hoursHeading: "Unsere Öffnungszeiten:",
    closedSaturday: "Samstags haben wir geschlossen.",
    closedSunday: "Sonntags haben wir geschlossen.",
    closedPrefix: "Geschlossen:",
    emergencyLine: (phone: string, note: string) => `Im Notfall erreichen Sie uns unter ${phone}.${note}`,
    emergencyViaPhone: (phone: string) => `Bei dringenden Fällen rufen Sie uns bitte direkt an: ${phone}.`,
    addressHeading: "Sie finden uns hier:",
    contactHeading: "So erreichen Sie uns:",
    labelPhone: "Telefon",
    labelEmail: "E-Mail",
    labelEmergency: "Notdienst",
    emailLine: (email: string) => `Sie erreichen uns per E-Mail unter ${email}.`,
    priceNone:
      "Die Kosten hängen vom Aufwand ab. Schildern Sie uns kurz Ihr Anliegen — am besten mit Foto — dann melden wir uns mit einem konkreten Angebot.",
    priceHeading: "Unsere Richtpreise:",
    priceFooter: "Der genaue Preis hängt vom Aufwand ab — wir melden uns mit einem konkreten Angebot.",
    servicesHeading: "Wir bieten:",
    areaLine: (codes: string) => `Wir arbeiten in diesen Postleitzahlen: ${codes}.`,
    areaHint:
      "Geben Sie im Termin-Assistenten einfach Ihre Postleitzahl ein — dann sagen wir Ihnen sofort, ob wir zu Ihnen kommen.",
    fallback: (phoneClause: string) =>
      `Das kann ich Ihnen leider nicht sicher beantworten — da möchte ich Sie nicht falsch informieren.${phoneClause} Soll ich Ihnen einen Rückruf organisieren?`,
    fallbackPhone: (phone: string) => ` Sie erreichen uns auch direkt unter ${phone}.`,
    // instruction appended to the AI system prompt so Claude answers in this language
    aiInstruction: "Antworte auf Deutsch und sieze die Kundschaft.",
    // keywords are matched after the same normalize() the question goes through:
    // lowercased, ä/ö/ü/ß folded to a/o/u/ss, punctuation stripped
    keywords: {
      hours: ["offnungszeit", "geoffnet", "offen", "auf haben", "wann offen", "wann geoffnet", "wann macht", "wann habt", "wann haben sie", "sprechzeit", "wie lange offen", "samstag", "sonntag", "wochenende", "feiertag"],
      emergency: ["notdienst", "notfall", "notruf", "dringend", "sofort", "rohrbruch", "wasserschaden"],
      address: ["adresse", "anschrift", "wo sind", "wo seid", "wo finde", "wo befindet", "standort", "sitz", "anfahrt", "wo ist"],
      contact: ["telefon", "nummer", "anrufen", "durchwahl", "erreichbar", "kontakt", "handy"],
      email: ["email", "e mail", "mailadresse", "mail schreiben"],
      price: ["preis", "kostet", "kosten", "teuer", "gunstig", "angebot", "kostenvoranschlag", "was zahle"],
      services: ["leistung", "machen sie", "macht ihr", "bieten sie", "bietet ihr", "konnen sie", "konnt ihr", "ubernehmen sie", "reparieren", "einbauen", "montieren"],
      area: ["einzugsgebiet", "kommen sie", "kommt ihr", "fahren sie", "gebiet", "umkreis", "postleitzahl", "wohne in", "auch nach"],
    },
  },
};

/** The German shape is the contract every other language must fulfil. */
export type Dictionary = typeof de;

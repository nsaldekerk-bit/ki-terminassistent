# KI-Terminassistent

Ein KI-gestützter Terminassistent für Handwerksbetriebe und andere Dienstleister — einbettbar als Chat-Widget auf der eigenen Webseite.

## Status

Version 1 in Entwicklung: Chat-Widget, Terminbuchung, Dienstleistungen, Kalender, E-Mail-Bestätigung.

Das Datenmodell ist in [docs/data-model.md](docs/data-model.md) dokumentiert.

## Entwicklung

Voraussetzungen: Node.js, PostgreSQL (lokal).

```bash
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000).

## Mitwirken

Beiträge sind willkommen. Bitte öffne für Änderungen einen Pull Request.

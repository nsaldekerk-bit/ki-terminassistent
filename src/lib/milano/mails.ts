/**
 * Texte der Nachrichten, die ein Termin auslöst.
 *
 * In der Demo wandern sie in den Postausgang unter /milano/salon, damit man
 * sie im Verkaufsgespräch aufklappen und vorlesen kann. Beim Ausbau
 * verschickt derselbe Text Resend bzw. der SMTP-Versand — nur der Aufruf
 * ändert sich, nicht der Inhalt.
 */

import {
  PREISE_BESTAETIGT,
  TEAM_BESTAETIGT,
  leistungen,
  preis,
  salon,
  team,
} from "./content";
import type { Termin } from "./store";

/** "2026-09-12" + "10:30" → "Freitag, 12. September, 10:30 Uhr" */
export function langesDatum(datum: string, zeit?: string): string {
  const d = new Date(`${datum}T12:00:00Z`);
  const text = new Intl.DateTimeFormat("de-DE", {
    timeZone: "UTC",
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
  return zeit ? `${text}, ${zeit} Uhr` : text;
}

export function leistungVon(termin: Termin) {
  return leistungen.find((l) => l.id === termin.leistungId);
}

/*
 * Die Seite zeigt alles in eckigen Klammern, was der Inhaber uns noch
 * nicht bestätigt hat. Die Mails müssen sich daran halten — sonst stünde
 * dort ein Platzhaltername, als wäre er echt.
 */

/** Name des Stuhls, in Klammern solange das Team nicht bestätigt ist. */
export function mitarbeiterName(termin: Termin): string {
  const name = team.find((m) => m.id === termin.mitarbeiterId)?.name;
  if (!name) return "deinem Friseur";
  return TEAM_BESTAETIGT ? name : `[${name}]`;
}

/** Preis, in Klammern solange die Preisliste nicht bestätigt ist. */
export function preisText(cent: number): string {
  return PREISE_BESTAETIGT ? preis(cent) : `[${preis(cent)}]`;
}

/** Der Link, mit dem der Gast seinen Termin selbst absagt. */
export function terminLink(code: string, basis: string): string {
  return `${basis}/milano/termin/${code}`;
}

export interface MailText {
  betreff: string;
  text: string;
}

export function bestaetigung(termin: Termin, basis: string): MailText {
  const l = leistungVon(termin);
  return {
    betreff: `Dein Termin bei ${salon.name} — ${langesDatum(termin.datum, termin.von)}`,
    text: [
      `Hallo ${termin.name},`,
      ``,
      `dein Termin steht:`,
      ``,
      `  ${langesDatum(termin.datum, termin.von)}`,
      `  ${l?.name ?? termin.leistungId} · ${termin.minuten} Minuten · ${l ? preisText(l.preisCent) : ""}`,
      `  bei ${mitarbeiterName(termin)}`,
      ``,
      `  ${salon.strasse}, ${salon.plz} ${salon.ort}`,
      ``,
      `Musst du absagen oder verschieben? Das geht selbst, rund um die Uhr:`,
      `${terminLink(termin.code, basis)}`,
      ``,
      `Bitte sag spätestens zwei Stunden vorher ab, dann kann jemand anderes`,
      `den Platz bekommen.`,
      ``,
      `Bis dann`,
      `${salon.name}, ${salon.ort}`,
      `Telefon ${salon.telefon}`,
    ].join("\n"),
  };
}

export function salonInfo(termin: Termin): MailText {
  const l = leistungVon(termin);
  return {
    betreff: `Neue Buchung: ${termin.name}, ${langesDatum(termin.datum, termin.von)}`,
    text: [
      `Neue Buchung über die Webseite.`,
      ``,
      `  Wann:      ${langesDatum(termin.datum, termin.von)}`,
      `  Was:       ${l?.name ?? termin.leistungId} (${termin.minuten} Min., ${l ? preisText(l.preisCent) : ""})`,
      `  Wer:       ${termin.name}`,
      `  Telefon:   ${termin.telefon}`,
      termin.email ? `  E-Mail:    ${termin.email}` : `  E-Mail:    —`,
      `  Stuhl:     ${mitarbeiterName(termin)}`,
      termin.notiz ? `  Notiz:     ${termin.notiz}` : null,
      ``,
      `Buchungsnummer ${termin.code}`,
    ]
      .filter((z) => z !== null)
      .join("\n"),
  };
}

export function erinnerung(termin: Termin, basis: string): MailText {
  const l = leistungVon(termin);
  return {
    betreff: `Morgen: dein Termin bei ${salon.name} um ${termin.von} Uhr`,
    text: [
      `Hallo ${termin.name},`,
      ``,
      `kurze Erinnerung — morgen um ${termin.von} Uhr erwarten wir dich:`,
      ``,
      `  ${l?.name ?? termin.leistungId} · ${termin.minuten} Minuten`,
      `  ${salon.strasse}, ${salon.plz} ${salon.ort}`,
      ``,
      `Passt es doch nicht? Hier absagen, dann rückt jemand nach:`,
      `${terminLink(termin.code, basis)}`,
      ``,
      `Bis morgen`,
      `${salon.name}`,
    ].join("\n"),
  };
}

export function absageAnGast(termin: Termin): MailText {
  return {
    betreff: `Termin abgesagt — ${langesDatum(termin.datum, termin.von)}`,
    text: [
      `Hallo ${termin.name},`,
      ``,
      `dein Termin am ${langesDatum(termin.datum, termin.von)} ist abgesagt.`,
      `Es wird nichts berechnet.`,
      ``,
      `Wenn du einen neuen Platz willst, findest du die freien Zeiten hier:`,
      `${salon.name} — Termin buchen`,
      ``,
      `Bis bald`,
      `${salon.name}`,
    ].join("\n"),
  };
}

export function absageAnSalon(termin: Termin): MailText {
  return {
    betreff: `Absage: ${termin.name}, ${langesDatum(termin.datum, termin.von)}`,
    text: [
      `${termin.name} hat den Termin am ${langesDatum(termin.datum, termin.von)} abgesagt.`,
      ``,
      `Der Platz ist wieder frei und wird auf der Webseite sofort wieder angeboten.`,
      ``,
      `Buchungsnummer ${termin.code}`,
    ].join("\n"),
  };
}

# Budget Dashboard

Ein React + TypeScript + Vite + Tailwind Dashboard zur Planung von Projektaufwand über Sprints, Monate und Gesamtbudget.

## Features

- Monatskalender, fortlaufende Timeline und Balkendiagramm
- Budgetprüfung für Gesamtprojekt, Monat und Sprint-Caps
- Konfigurierbare Sprint-Länge und Sprint-Caps (dynamisch)
- Detailansicht pro ausgewähltem Tag
- Task-Verteilung auf Arbeitstage im zugewiesenen Sprint
- LocalStorage-Persistenz für Tasks, Zeitraum und Budget-Parameter

## Installation

```bash
npm install
npm run dev
```

## Eingabefelder

- `Projektstart` / `Projektende`: Definiert den Auswertungszeitraum.
- `Sprintlänge (Wochen)`: Länge eines Sprints in Wochen.
- `Start Sprint 1`: Referenzdatum für Sprint-Nummerierung.
- `Gesamtbudget (h)`: Maximales Budget für den gesamten Projektzeitraum.
- `Monats-Cap (h)`: Maximales Budget pro Kalendermonat.
- `Sprint-Cap Default (h)`: Fallback-Cap für nicht explizit konfigurierte Sprints.
- `Sprint-Caps`: Individuelle Caps pro Sprintnummer.
- `Tasks`: Name, Sprintnummer und Stunden je Task.

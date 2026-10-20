# Aschenthron

Düsteres Kartenspiel mit zwei Modi: Duell (gegen den Hohlen König) und Rabenblatt (Poker mit Kreaturenkarten).

- `index.html` – das komplette Spiel. Einfach im Browser öffnen.
- `cards/` – die 52 Rabenblatt-Kartenbilder (`pk-<Rang>-<Reich>.jpg`, Reich 0 = Sonnenwacht, 1 = Aschelande, 2 = Nordmark, 3 = Blutmoor).
- `engine.js` – Rabenblatt-Logik (Handbewertung, Teams, Kampf) für Balance-Simulationen mit Node: `const E=require('./engine.js')`.

Balance-Werte stehen im Objekt `K` (in index.html und engine.js gleich halten).
Lokal gibt es kein Speicher-Backend des Artifacts; Fortschritt wird über localStorage gespeichert.

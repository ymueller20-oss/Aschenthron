# Aschenthron · Rabenblatt

Düsteres Karten-Duell: Hold'em mit Kreaturen. Der Showdown ist ein Kampf, und wer besser spielt, gewinnt. Das Duell-Spiel ist entfernt, es gibt nur noch Rabenblatt.

- `index.html` – das komplette Spiel. Einfach im Browser öffnen.
- `cards/` – die 52 Kartenbilder (`pk-<Rang>-<Reich>.jpg`, Reich 0 = Sonnenwacht, 1 = Aschelande, 2 = Nordmark, 3 = Blutmoor).
- `engine.js` – Handbewertung, Teams, Kampf für Balance-Simulationen mit Node.
- `sim/` – Skill-Messung: `ai.js` (KI-Stufen, wird in `index.html` eingefügt), `game.js` (Heads-up-Match ohne Browser), `matrix.js` (alle Stufenpaare), `inject.py` (kopiert `ai.js` in die Seite).

## Wie Können über Glück siegt

1. **Heads-up gegen eine Leiter von sechs Gegnern**, tief gestackt (150 Big Blinds). Jeder Gegner hat eine eigene Schwäche, die man lesen und bestrafen lernt.
2. **Zweistufiger Showdown.** Erst legen beide ihre fünf Karten offen. Dann stellen beide gleichzeitig und verdeckt die Reihenfolge der fünf Bahnen auf. Durch bloßes Umstellen lässt sich etwa jeder dritte verlorene Kampf drehen. Wer immer nach Stärke aufstellt, wird gelesen (Stufe 4 und höher).
3. **Dreifaches Schicksal.** Bei All-in vor dem River werden die restlichen Karten dreimal gelegt, jeder Wurf mit eigenem Kampf, der Pot wird gedrittelt.
4. **Lernhilfen.** Gewinnchance und Pot-Odds, Nachbesprechung der Aufstellung nach verlorenen Kämpfen, Gegner-Lesart am Sitz, nach jedem Duell Genauigkeit, Glücksindex und Aufstellungsmuster.
5. **Könnerwert (Elo)** steigt mit Siegen über stärkere Gegner.

## Gemessenes Gefälle

Heads-up-Freezeout, KI gegen KI (`node sim/matrix.js 40 tag`). Siegquote der höheren Stufe:

| | Stufe 1 Zecher | 2 Rabauke | 3 Vorsichtige | 4 Stetiger | 5 Meuchlerin |
|---|---|---|---|---|---|
| **2** Rabauke | 65 % | | | | |
| **3** Vorsichtige | 90 % | 70 % | | | |
| **4** Stetiger | 100 % | 100 % | 95 % | | |
| **5** Meuchlerin | 100 % | 98 % | 85 % | 70 % | |
| **6** Hohler König | 98 % | 98 % | 93 % | 75 % | siehe unten |

Balance-Werte der Kämpfe stehen im Objekt `K` (in `index.html` und `engine.js` gleich halten).
Lokal gibt es kein Speicher-Backend des Artifacts; Fortschritt wird über localStorage gespeichert.

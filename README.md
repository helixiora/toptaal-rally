# 🚗 TopTaal Rally

Een 3D-taalspel voor de TopTaal personeelsdag, gebouwd met [Three.js](https://threejs.org).

Je rijdt door een Nederlands landschap (molens, tulpenvelden, koeien, een kanaal)
en nadert steeds een splitsing met twee borden. Op het ene bord staat een
grammaticaal correcte zin, op het andere een foute. Kies de goede kant vóór je
de splitsing bereikt — de auto gaat steeds sneller!

## Spelregels

- **←** / **→** (of **A** / **D**, of klik/tik op een bord) om te kiezen.
- Al gekozen? Houd **↑** (of **W**) ingedrukt om naar de splitsing te scheuren —
  zolang je gas geeft loopt er een 🚀-bonusteller. Goed antwoord = bonus erbij,
  fout antwoord = bonus kwijt.
- Goed antwoord: **+100 punten** (met reeks-multiplier tot ×4) en de auto versnelt.
- Fout of te laat: **−1 leven** ❤️ en je ziet de juiste zin met uitleg.
- Na **15 splitsingen** ligt de **finish** 🏁 — elk leven dat je overhoudt is
  +100 bonuspunten. Drie fouten = game over.
- Topscores komen op het lokale **scorebord** (top 10).
- Er zitten 100 zinnenparen in (`src/sentences.js`), dus elke race is anders.
- **P** of **Esc** = pauze.

De zinnen lopen op in moeilijkheid: van A1/A2 (de/het, vervoeging) naar B1/B2
(scheidbare werkwoorden, bijzinnen, betrekkelijke voornaamwoorden). Elke
beurt toont een korte uitleg, zodat het spel ook echt iets leert.

## Draaien

```bash
npm install
npm run dev        # ontwikkelserver, opent op http://localhost:5173
```

## Demo-build (offline, voor op de personeelsdag)

```bash
npm run build      # statische bestanden in dist/
npm run preview    # serveert dist/ lokaal — geen internet nodig
```

De `dist/`-map kan ook op elke statische webserver gezet worden.
Het scorebord staat in `localStorage` van de browser, dus gebruik op de dag
zelf één vaste machine/browser voor de competitie.

## Tips voor de demo

- Klik op **⛶** (rechtsonder) voor volledig scherm op de beamer.
- Geluid aan/uit met **🔊**.
- Scorebord wissen: open de browserconsole en voer uit:
  `localStorage.removeItem("toptaal-rally-scores")`

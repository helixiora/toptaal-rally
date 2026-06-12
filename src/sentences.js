// Zinnenparen voor TopTaal Rally.
// level 1 = A1/A2 (lidwoorden, vervoeging, meervoud)
// level 2 = A2/B1 (woordvolgorde, voltooide tijd, modale werkwoorden, 'er')
// level 3 = B1/B2 (scheidbare werkwoorden, bijzinnen, betrekkelijke voornaamwoorden)

export const SENTENCES = [
  // ---------- Level 1 ----------
  { level: 1, correct: "Het meisje loopt naar school.", wrong: "De meisje loopt naar school.", uitleg: "'Meisje' is een het-woord (verkleinwoord)." },
  { level: 1, correct: "Ik woon in Amsterdam.", wrong: "Ik woont in Amsterdam.", uitleg: "Bij 'ik' krijgt het werkwoord geen -t." },
  { level: 1, correct: "Hij werkt bij TopTaal.", wrong: "Hij werk bij TopTaal.", uitleg: "Bij 'hij' krijgt het werkwoord een -t." },
  { level: 1, correct: "Wij zijn vandaag thuis.", wrong: "Wij bent vandaag thuis.", uitleg: "Bij 'wij' hoort 'zijn'." },
  { level: 1, correct: "Het huis is groot.", wrong: "De huis is groot.", uitleg: "'Huis' is een het-woord." },
  { level: 1, correct: "Ik heb een rode auto.", wrong: "Ik heb een rood auto.", uitleg: "'Auto' is een de-woord: een rode auto." },
  { level: 1, correct: "De kinderen spelen buiten.", wrong: "De kinderen speelt buiten.", uitleg: "Meervoud: de kinderen spelen." },
  { level: 1, correct: "Hij heeft twee broers.", wrong: "Hij heeft twee broeren.", uitleg: "Het meervoud van 'broer' is 'broers'." },
  { level: 1, correct: "Ik ben een beetje moe.", wrong: "Ik is een beetje moe.", uitleg: "Bij 'ik' hoort 'ben'." },
  { level: 1, correct: "Werk jij vandaag?", wrong: "Werkt jij vandaag?", uitleg: "Staat 'jij' achter het werkwoord? Dan vervalt de -t." },
  { level: 1, correct: "De zon schijnt vandaag.", wrong: "De zon schijn vandaag.", uitleg: "De zon = hij/zij: het werkwoord krijgt -t." },
  { level: 1, correct: "Wij hebben honger.", wrong: "Wij heeft honger.", uitleg: "Bij 'wij' hoort 'hebben'." },
  { level: 1, correct: "Het boek ligt op tafel.", wrong: "De boek ligt op tafel.", uitleg: "'Boek' is een het-woord." },
  { level: 1, correct: "Zij eet een appel.", wrong: "Zij eet een appels.", uitleg: "Na 'een' komt enkelvoud: een appel." },
  { level: 1, correct: "Dat is een klein kind.", wrong: "Dat is een kleine kind.", uitleg: "Een + het-woord: bijvoeglijk naamwoord zonder -e." },
  { level: 1, correct: "De koffie is warm.", wrong: "Het koffie is warm.", uitleg: "'Koffie' is een de-woord." },
  { level: 1, correct: "Ik spreek een beetje Nederlands.", wrong: "Ik spreekt een beetje Nederlands.", uitleg: "Bij 'ik' krijgt het werkwoord geen -t." },
  { level: 1, correct: "Er zijn veel kinderen.", wrong: "Er zijn veel kinds.", uitleg: "Het meervoud van 'kind' is 'kinderen'." },
  { level: 1, correct: "De auto's staan op straat.", wrong: "De autos staan op straat.", uitleg: "Meervoud van 'auto': auto's (met apostrof)." },
  { level: 1, correct: "Zij heeft een hond.", wrong: "Zij heb een hond.", uitleg: "Bij 'zij' hoort 'heeft'." },
  { level: 1, correct: "Het weer is mooi vandaag.", wrong: "De weer is mooi vandaag.", uitleg: "'Weer' is een het-woord." },
  { level: 1, correct: "Jullie wonen in Utrecht.", wrong: "Jullie woont in Utrecht.", uitleg: "Bij 'jullie' hoort de meervoudsvorm: wonen." },
  { level: 1, correct: "De kat slaapt op de bank.", wrong: "De kat slaap op de bank.", uitleg: "De kat = hij/zij: het werkwoord krijgt -t." },
  { level: 1, correct: "Wij drinken melk.", wrong: "Wij drinkt melk.", uitleg: "Bij 'wij' hoort de meervoudsvorm: drinken." },
  { level: 1, correct: "Ik heb twee zussen.", wrong: "Ik heb twee zussens.", uitleg: "Het meervoud van 'zus' is 'zussen'." },
  { level: 1, correct: "Het station is ver weg.", wrong: "De station is ver weg.", uitleg: "'Station' is een het-woord." },
  { level: 1, correct: "Mijn vader werkt in de tuin.", wrong: "Mijn vader werken in de tuin.", uitleg: "Mijn vader = hij: werkt (enkelvoud)." },
  { level: 1, correct: "De bloemen zijn mooi.", wrong: "De bloemen is mooi.", uitleg: "Meervoud ('bloemen'): zijn." },
  { level: 1, correct: "Hij drinkt elke ochtend thee.", wrong: "Hij drink elke ochtend thee.", uitleg: "Bij 'hij' krijgt het werkwoord een -t." },
  { level: 1, correct: "Dat is een lekkere appel.", wrong: "Dat is een lekker appel.", uitleg: "'Appel' is een de-woord: een lekkere appel." },
  { level: 1, correct: "Het brood ligt in de kast.", wrong: "Het brood ligt in het kast.", uitleg: "'Kast' is een de-woord." },
  { level: 1, correct: "Zij wonen in een mooi huis.", wrong: "Zij wonen in een mooie huis.", uitleg: "Een + het-woord: mooi zonder -e." },
  { level: 1, correct: "Ik zie drie vogels.", wrong: "Ik zie drie vogelen.", uitleg: "Het meervoud van 'vogel' is 'vogels'." },
  { level: 1, correct: "De lamp staat op het bureau.", wrong: "De lamp staat op de bureau.", uitleg: "'Bureau' is een het-woord." },

  // ---------- Level 2 ----------
  { level: 2, correct: "Morgen ga ik naar de markt.", wrong: "Morgen ik ga naar de markt.", uitleg: "Na 'morgen' komt eerst het werkwoord (inversie)." },
  { level: 2, correct: "Ik heb gisteren hard gewerkt.", wrong: "Ik heb hard gewerkt gisteren.", uitleg: "Tijd ('gisteren') staat vóór het voltooid deelwoord." },
  { level: 2, correct: "Ik kan goed zwemmen.", wrong: "Ik kan goed zwem.", uitleg: "Na 'kan' komt het hele werkwoord: zwemmen." },
  { level: 2, correct: "Hij heeft een boek gelezen.", wrong: "Hij heeft een boek geleest.", uitleg: "'Lezen' is onregelmatig: gelezen." },
  { level: 2, correct: "Wij hebben de film gezien.", wrong: "Wij hebben gezien de film.", uitleg: "Het voltooid deelwoord staat aan het einde." },
  { level: 2, correct: "Zij moet vandaag werken.", wrong: "Zij moet vandaag werkt.", uitleg: "Na 'moet' komt het hele werkwoord: werken." },
  { level: 2, correct: "Gisteren was het koud.", wrong: "Gisteren het was koud.", uitleg: "Na 'gisteren' komt eerst het werkwoord (inversie)." },
  { level: 2, correct: "Ik heb de bus gemist.", wrong: "Ik heb de bus gemisd.", uitleg: "'t Kofschip: missen → gemist (met t)." },
  { level: 2, correct: "Hij is in 1990 geboren.", wrong: "Hij heeft in 1990 geboren.", uitleg: "'Geboren' gaat altijd met 'zijn'." },
  { level: 2, correct: "Er staat een fiets voor de deur.", wrong: "Het staat een fiets voor de deur.", uitleg: "Onbepaald onderwerp: de zin begint met 'er'." },
  { level: 2, correct: "Zij heeft het brood gesneden.", wrong: "Zij heeft het brood gesnijden.", uitleg: "'Snijden' is onregelmatig: gesneden." },
  { level: 2, correct: "Mag ik hier zitten?", wrong: "Mag ik hier zit?", uitleg: "Na 'mag' komt het hele werkwoord: zitten." },
  { level: 2, correct: "We zijn naar school gefietst.", wrong: "We hebben naar school gefietst.", uitleg: "Beweging met een richting: met 'zijn'." },
  { level: 2, correct: "Straks komt de trein.", wrong: "Straks de trein komt.", uitleg: "Na 'straks' komt eerst het werkwoord (inversie)." },
  { level: 2, correct: "Ik ga morgen boodschappen doen.", wrong: "Ik ga morgen doen boodschappen.", uitleg: "Het hele werkwoord staat aan het einde." },
  { level: 2, correct: "Hij heeft gisteren gebeld.", wrong: "Hij heeft gisteren gebelt.", uitleg: "'t Kofschip: bellen → gebeld (met d)." },
  { level: 2, correct: "Wij hebben in de pauze gegeten.", wrong: "Wij hebben in de pauze geëet.", uitleg: "'Eten' is onregelmatig: gegeten." },
  { level: 2, correct: "Ik ben vorig jaar verhuisd.", wrong: "Ik heb vorig jaar verhuisd.", uitleg: "'Verhuizen' gaat met 'zijn': ik ben verhuisd." },
  { level: 2, correct: "Er zijn veel mensen op het feest.", wrong: "Er is veel mensen op het feest.", uitleg: "Meervoud ('mensen'): er zijn." },
  { level: 2, correct: "Kun je me helpen?", wrong: "Kun je me help?", uitleg: "Na 'kun' komt het hele werkwoord: helpen." },
  { level: 2, correct: "Het heeft de hele dag geregend.", wrong: "Het heeft de hele dag geregent.", uitleg: "'t Kofschip: regenen → geregend (met d)." },
  { level: 2, correct: "Ik wil graag koffie drinken.", wrong: "Ik wil graag koffie drink.", uitleg: "Na 'wil' komt het hele werkwoord: drinken." },
  { level: 2, correct: "Vanavond eten we pasta.", wrong: "Vanavond we eten pasta.", uitleg: "Na 'vanavond' komt eerst het werkwoord (inversie)." },
  { level: 2, correct: "Ik heb mijn sleutels verloren.", wrong: "Ik heb mijn sleutels verliesd.", uitleg: "'Verliezen' is onregelmatig: verloren." },
  { level: 2, correct: "Zij kan heel mooi zingen.", wrong: "Zij kan heel mooi zingt.", uitleg: "Na 'kan' komt het hele werkwoord: zingen." },
  { level: 2, correct: "Hij heeft koffie gezet.", wrong: "Hij heeft koffie gezetten.", uitleg: "Zetten → gezet ('t kofschip)." },
  { level: 2, correct: "We zijn om acht uur vertrokken.", wrong: "We hebben om acht uur vertrokken.", uitleg: "'Vertrekken' gaat met 'zijn'." },
  { level: 2, correct: "Ik moet nu naar huis gaan.", wrong: "Ik moet nu naar huis ga.", uitleg: "Na 'moet' komt het hele werkwoord: gaan." },
  { level: 2, correct: "Er ligt een krant op de mat.", wrong: "Het ligt een krant op de mat.", uitleg: "Onbepaald onderwerp: de zin begint met 'er'." },
  { level: 2, correct: "Zij heeft een mooie foto gemaakt.", wrong: "Zij heeft gemaakt een mooie foto.", uitleg: "Het voltooid deelwoord staat aan het einde." },
  { level: 2, correct: "Het heeft vannacht gevroren.", wrong: "Het heeft vannacht gevriest.", uitleg: "'Vriezen' is onregelmatig: gevroren." },
  { level: 2, correct: "In de zomer fietsen we veel.", wrong: "In de zomer we fietsen veel.", uitleg: "Na een tijdsbepaling vooraan: inversie." },
  { level: 2, correct: "Hij heeft hard gelachen.", wrong: "Hij heeft hard gelacht.", uitleg: "'Lachen' is onregelmatig: gelachen." },

  // ---------- Level 3 ----------
  { level: 3, correct: "Ik bel je morgen op.", wrong: "Ik opbel je morgen.", uitleg: "Scheidbaar werkwoord: 'op' gaat naar het einde." },
  { level: 3, correct: "Hij zegt dat hij morgen komt.", wrong: "Hij zegt dat hij komt morgen.", uitleg: "In de bijzin staat het werkwoord achteraan." },
  { level: 3, correct: "De man die daar loopt, is mijn buurman.", wrong: "De man wie daar loopt, is mijn buurman.", uitleg: "Bij de-woorden: 'die'." },
  { level: 3, correct: "Het huis dat te koop staat, is duur.", wrong: "Het huis die te koop staat, is duur.", uitleg: "Bij het-woorden: 'dat'." },
  { level: 3, correct: "Als het regent, blijven we thuis.", wrong: "Als het regent, we blijven thuis.", uitleg: "Na een bijzin volgt inversie: blijven we." },
  { level: 3, correct: "Ik weet niet waar hij woont.", wrong: "Ik weet niet waar woont hij.", uitleg: "Indirecte vraag: het werkwoord staat achteraan." },
  { level: 3, correct: "Zij vroeg of ik mee wilde gaan.", wrong: "Zij vroeg of wilde ik meegaan.", uitleg: "Na 'of' staat het werkwoord achteraan." },
  { level: 3, correct: "Hoewel hij moe was, werkte hij door.", wrong: "Hoewel hij was moe, werkte hij door.", uitleg: "In de bijzin: het werkwoord achteraan." },
  { level: 3, correct: "Hij staat elke dag om zeven uur op.", wrong: "Hij opstaat elke dag om zeven uur.", uitleg: "Scheidbaar werkwoord: 'op' gaat naar het einde." },
  { level: 3, correct: "Dat is de collega met wie ik samenwerk.", wrong: "Dat is de collega met die ik samenwerk.", uitleg: "Na een voorzetsel bij personen: 'wie'." },
  { level: 3, correct: "Ik heb geen zin om te koken.", wrong: "Ik heb geen zin om koken.", uitleg: "Om + te + heel werkwoord." },
  { level: 3, correct: "Nadat we hadden gegeten, gingen we wandelen.", wrong: "Nadat we hadden gegeten, we gingen wandelen.", uitleg: "Na een bijzin volgt inversie: gingen we." },
  { level: 3, correct: "Hij doet alsof hij niets weet.", wrong: "Hij doet alsof hij weet niets.", uitleg: "Na 'alsof' staat het werkwoord achteraan." },
  { level: 3, correct: "Het wordt steeds drukker.", wrong: "Het wordt steeds drukkerder.", uitleg: "Vergrotende trap: druk → drukker." },
  { level: 3, correct: "Ik verheug me op de personeelsdag.", wrong: "Ik verheug me aan de personeelsdag.", uitleg: "Vast voorzetsel: zich verheugen óp." },
  { level: 3, correct: "Zij is benieuwd naar de uitslag.", wrong: "Zij is benieuwd aan de uitslag.", uitleg: "Vast voorzetsel: benieuwd náár." },
  { level: 3, correct: "Ik probeer elke dag Nederlands te oefenen.", wrong: "Ik probeer elke dag Nederlands oefenen.", uitleg: "Proberen + te + heel werkwoord." },
  { level: 3, correct: "Toen ik jong was, woonde ik in Utrecht.", wrong: "Toen ik jong was, ik woonde in Utrecht.", uitleg: "Na een bijzin volgt inversie: woonde ik." },
  { level: 3, correct: "Hij vraagt zich af of het lukt.", wrong: "Hij vraagt zich af of lukt het.", uitleg: "Na 'of' staat het werkwoord achteraan." },
  { level: 3, correct: "Omdat het laat was, ging ik naar huis.", wrong: "Omdat het was laat, ging ik naar huis.", uitleg: "In de bijzin: het werkwoord achteraan." },
  { level: 3, correct: "Zij heeft de afspraak afgezegd.", wrong: "Zij heeft de afspraak gezegd af.", uitleg: "Scheidbaar werkwoord in voltooide tijd: afgezegd." },
  { level: 3, correct: "Ik kijk uit naar het weekend.", wrong: "Ik kijk uit op het weekend.", uitleg: "Vast voorzetsel: uitkijken náár." },
  { level: 3, correct: "Ik denk dat het morgen regent.", wrong: "Ik denk dat het regent morgen.", uitleg: "In de bijzin staat het werkwoord achteraan." },
  { level: 3, correct: "Zij ruimt haar kamer op.", wrong: "Zij opruimt haar kamer.", uitleg: "Scheidbaar werkwoord: 'op' gaat naar het einde." },
  { level: 3, correct: "De vrouw die naast mij woont, is arts.", wrong: "De vrouw wie naast mij woont, is arts.", uitleg: "Bij de-woorden: 'die'." },
  { level: 3, correct: "Het cadeau dat ik kreeg, was prachtig.", wrong: "Het cadeau die ik kreeg, was prachtig.", uitleg: "Bij het-woorden: 'dat'." },
  { level: 3, correct: "Wanneer je klaar bent, mag je gaan.", wrong: "Wanneer je bent klaar, mag je gaan.", uitleg: "In de bijzin: het werkwoord achteraan." },
  { level: 3, correct: "Ik vraag me af waarom hij niet komt.", wrong: "Ik vraag me af waarom komt hij niet.", uitleg: "Indirecte vraag: het werkwoord achteraan." },
  { level: 3, correct: "Hij maakt het licht uit.", wrong: "Hij uitmaakt het licht.", uitleg: "Scheidbaar werkwoord: 'uit' gaat naar het einde." },
  { level: 3, correct: "Ik ben benieuwd of het gaat lukken.", wrong: "Ik ben benieuwd of gaat het lukken.", uitleg: "Na 'of' staat het werkwoord achteraan." },
  { level: 3, correct: "Hij is gestopt met roken.", wrong: "Hij is gestopt met te roken.", uitleg: "Na 'met' geen 'te': stoppen met roken." },
  { level: 3, correct: "Dit is het dorp waar ik ben opgegroeid.", wrong: "Dit is het dorp waar ik ben gegroeid op.", uitleg: "Scheidbaar werkwoord in voltooide tijd: opgegroeid." },
  { level: 3, correct: "Terwijl ik kookte, dekte hij de tafel.", wrong: "Terwijl ik kookte, hij dekte de tafel.", uitleg: "Na een bijzin volgt inversie: dekte hij." },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Trekt zinnen per niveau zonder herhaling; schudt opnieuw als de stapel op is.
export class SentenceDeck {
  constructor() {
    this.reset();
  }
  reset() {
    this.decks = {
      1: shuffle(SENTENCES.filter((s) => s.level === 1)),
      2: shuffle(SENTENCES.filter((s) => s.level === 2)),
      3: shuffle(SENTENCES.filter((s) => s.level === 3)),
    };
  }
  draw(level) {
    if (this.decks[level].length === 0) {
      this.decks[level] = shuffle(SENTENCES.filter((s) => s.level === level));
    }
    return this.decks[level].pop();
  }
}

// Welke niveaus mogen bij vraag n (0-based)? Afgestemd op een race van 15 vragen.
export function levelBand(questionIndex) {
  if (questionIndex < 4) return [1];
  if (questionIndex < 8) return [1, 2];
  if (questionIndex < 11) return [2];
  if (questionIndex < 13) return [2, 3];
  return [3];
}

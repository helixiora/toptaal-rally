import { SentenceDeck, levelBand } from "./sentences.js";
import { qualifies, saveScore } from "./ui.js";

const START_SPEED = 18;
const MAX_SPEED = 120; // = 288 km/u op de teller
const BOOST_MULT = 2.4; // ↑ ingedrukt houden na je keuze
const SPEED_GAIN = 3; // per goed antwoord
const SPEED_LOSS = 6; // per fout antwoord
const BOOST_BONUS_RATE = 45; // bonuspunten per seconde gas geven
const ENGINE_REF = 270; // normalisatie van de snelheid voor het motorgeluid
export const TOTAL_QUESTIONS = 15; // daarna ligt de finish
const FINISH_LIFE_BONUS = 100; // bonus per resterend leven bij de finish
const BASE_POINTS = 100;
const START_LIVES = 3;
const CRUISE_TIME = 2.6; // pauze tussen splitsingen (feedbackmoment)

export class Game {
  constructor(world, ui, audio) {
    this.world = world;
    this.ui = ui;
    this.audio = audio;
    this.deck = new SentenceDeck();

    this.state = "menu"; // menu | playing | paused | dying | celebrating | gameover
    this.phase = "cruise"; // playing: cruise | question | finish
    this.savedEntry = null;
    this.boostHeld = false;
    this.boostBonus = 0;
    this.prevBoosting = false;

    this._bindUI();
    this._bindKeys();
  }

  // ---------- besturing ----------

  _bindUI() {
    const { el } = this.ui;
    el.btnStart.addEventListener("click", () => this.start());
    el.btnAgain.addEventListener("click", () => this.start());
    el.btnToMenu.addEventListener("click", () => this.toMenu());
    el.btnShowLb.addEventListener("click", () => this.ui.showLeaderboard("menu"));
    el.btnGameoverLb.addEventListener("click", () => {
      this._saveHighscoreIfNeeded();
      this.ui.showLeaderboard("gameover", this.savedEntry);
    });
    el.btnLbBack.addEventListener("click", () => this.ui.closeLeaderboard());
    el.btnResume.addEventListener("click", () => this.togglePause());
    el.choiceLeft.addEventListener("click", () => this.select("left"));
    el.choiceRight.addEventListener("click", () => this.select("right"));
    el.btnMute.addEventListener("click", () => {
      this.audio.setMuted(!this.audio.muted);
      el.btnMute.textContent = this.audio.muted ? "🔇" : "🔊";
    });
    el.btnMute.textContent = this.audio.muted ? "🔇" : "🔊";
    el.btnFullscreen.addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    });
    el.nameInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        this._saveHighscoreIfNeeded();
        this.ui.showLeaderboard("gameover", this.savedEntry);
      }
      e.stopPropagation();
    });
  }

  _bindKeys() {
    window.addEventListener("keydown", (e) => {
      if (e.target === this.ui.el.nameInput) return;
      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          this.select("left");
          e.preventDefault();
          break;
        case "ArrowRight":
        case "KeyD":
          this.select("right");
          e.preventDefault();
          break;
        case "ArrowUp":
        case "KeyW":
          this.boostHeld = true;
          e.preventDefault();
          break;
        case "KeyP":
        case "Escape":
          this.togglePause();
          break;
        case "Enter":
        case "Space":
          if (this.state === "menu") this.start();
          else if (this.state === "gameover") this.start();
          else if (this.state === "paused") this.togglePause();
          e.preventDefault();
          break;
      }
    });

    window.addEventListener("keyup", (e) => {
      if (e.code === "ArrowUp" || e.code === "KeyW") this.boostHeld = false;
    });

    // tik op de linker-/rechterhelft van het scherm (touch)
    window.addEventListener("pointerdown", (e) => {
      if (this.state !== "playing" || this.phase !== "question") return;
      if (e.target.closest("button, .screen, #choices, #corner-btns")) return;
      this.select(e.clientX < window.innerWidth / 2 ? "left" : "right");
    });
  }

  // ---------- spelverloop ----------

  start() {
    this.score = 0;
    this.lives = START_LIVES;
    this.streak = 0;
    this.speed = START_SPEED;
    this.questionIndex = 0;
    this.selected = null;
    this.current = null;
    this.savedEntry = null;
    this.boostBonus = 0;
    this.finishBonus = 0;
    this.ui.setBoostBonus(0);
    this.deck.reset();
    this.world.reset();

    this.state = "playing";
    this.phase = "cruise";
    this.cruiseTimer = 1.4;

    this.ui.showPlaying();
    this.ui.hideQuestion();
    this.ui.hideFeedback();
    this._updateHUD();
    this.audio.startSound();
    this.audio.startEngine();
  }

  toMenu() {
    this.state = "menu";
    this.world.reset();
    this.audio.stopEngine();
    this.ui.showMenu();
  }

  togglePause() {
    if (this.state === "playing") {
      this.state = "paused";
      this.ui.showPause();
    } else if (this.state === "paused") {
      this.state = "playing";
      this.ui.showPlaying();
    }
  }

  get multiplier() {
    return 1 + Math.min(3, Math.floor(this.streak / 3));
  }

  _updateHUD() {
    this.ui.updateHUD({
      score: this.score,
      lives: this.lives,
      multiplier: this.multiplier,
      speed: this.speed,
      progress: `${Math.min(this.questionIndex, TOTAL_QUESTIONS)}/${TOTAL_QUESTIONS}`,
    });
  }

  _startQuestion() {
    const band = levelBand(this.questionIndex);
    const level = band[Math.floor(Math.random() * band.length)];
    const pair = this.deck.draw(level);
    const correctSide = Math.random() < 0.5 ? "left" : "right";
    this.current = {
      pair,
      correctSide,
      leftText: correctSide === "left" ? pair.correct : pair.wrong,
      rightText: correctSide === "right" ? pair.correct : pair.wrong,
    };
    this.selected = null;
    this.phase = "question";
    this.boostBonus = 0;
    this.ui.setBoostBonus(0);
    this.ui.hideFeedback();
    this.world.spawnJunction(this.current.leftText, this.current.rightText);
    this.ui.showQuestion(this.current.leftText, this.current.rightText);
  }

  select(side) {
    if (this.state !== "playing" || this.phase !== "question" || !this.current) return;
    if (this.selected === side) return;
    this.selected = side;
    this.world.setLane(side);
    this.world.highlightSign(side);
    this.ui.selectPanel(side);
    this.audio.click();
  }

  _resolve() {
    const { pair, correctSide } = this.current;
    const chosen = this.selected;
    const ok = chosen === correctSide;

    this.world.resolveJunction(chosen, correctSide);
    this.ui.markPanels(chosen, correctSide);
    this.phase = "cruise";
    this.cruiseTimer = CRUISE_TIME;
    this.questionIndex++;

    if (ok) {
      // gasbonus telt alleen bij een goed antwoord; fout = bonus kwijt
      const bonus = Math.floor(this.boostBonus);
      const points = BASE_POINTS * this.multiplier + bonus;
      this.score += points;
      this.streak++;
      this.speed = Math.min(MAX_SPEED, this.speed + SPEED_GAIN);
      this.audio.ding();
      this.world.confettiBurst();
      const bonusTxt = bonus > 0 ? ` (🚀 +${bonus})` : "";
      this.ui.showFeedback(
        `✔ Goed! +${points} punten${bonusTxt} <span class="uitleg">${pair.uitleg}</span>`,
        true
      );
    } else {
      this.lives--;
      this.streak = 0;
      this.speed = Math.max(START_SPEED, this.speed - SPEED_LOSS);
      this.audio.buzz();
      this.world.wobble();
      this.ui.flashRed();
      const reason = chosen === null ? "Te laat!" : "Helaas!";
      this.ui.showFeedback(
        `✘ ${reason} Goed was: “${pair.correct}” <span class="uitleg">${pair.uitleg}</span>`,
        false,
        3000
      );
    }
    this.boostBonus = 0;
    this.ui.setBoostBonus(0);
    this._updateHUD();

    if (this.lives <= 0) {
      this.state = "dying";
      this.dyingTimer = 2.0;
      this.world.spinOut();
      this.audio.stopEngine();
      this.audio.gameOver();
      this.ui.hideQuestion();
    } else if (this.questionIndex >= TOTAL_QUESTIONS) {
      // alle vragen gehad: de finishlijn verschijnt!
      this.phase = "finish";
      this.world.spawnFinish();
    }
  }

  _saveHighscoreIfNeeded() {
    if (this.savedEntry || !this._isHighscore) return;
    const name = this.ui.readName();
    this.savedEntry = saveScore(name || "Anoniem", this.score);
    this._isHighscore = false;
  }

  _gameOver(finished) {
    this.state = "gameover";
    this._isHighscore = qualifies(this.score);
    if (this._isHighscore) this.audio.highscore();
    const title = finished ? "🏁 Finish!" : "Game over!";
    const detail = finished
      ? `Alle ${TOTAL_QUESTIONS} splitsingen voltooid met ${this.lives} ` +
        `${this.lives === 1 ? "leven" : "levens"} over` +
        (this.finishBonus > 0 ? ` — +${this.finishBonus} bonus!` : "!")
      : `Je hebt ${this.questionIndex} van de ${TOTAL_QUESTIONS} splitsingen gehaald.`;
    this.ui.showGameOver({ score: this.score, title, detail, isHighscore: this._isHighscore });
  }

  // ---------- per frame ----------

  update(dt) {
    if (this.state === "paused" || this.state === "menu" || this.state === "gameover") {
      // menu/achtergrond: laat de wereld rustig doorrijden als demo-attract
      const idleSpeed = this.state === "paused" ? 0 : 10;
      this.world.update(this.state === "paused" ? 0 : dt, idleSpeed);
      return;
    }

    if (this.state === "dying") {
      this.speed = Math.max(0, this.speed - dt * 25);
      this.world.setBoost(false);
      this.world.update(dt, this.speed);
      this.dyingTimer -= dt;
      if (this.dyingTimer <= 0) this._gameOver(false);
      return;
    }

    if (this.state === "celebrating") {
      // over de finish: uitrollen onder de confetti
      this.speed = Math.max(12, this.speed - dt * 30);
      this.world.setBoost(false);
      this.world.update(dt, this.speed);
      this.celebrateTimer -= dt;
      if (this.celebrateTimer <= 0) this._gameOver(true);
      return;
    }

    // state === "playing"
    // na je keuze mag je met ↑ extra gas geven: sneller rijden én bonuspunten
    const boosting =
      this.boostHeld && ((this.phase === "question" && !!this.selected) || this.phase === "finish");
    if (boosting && !this.prevBoosting) this.audio.boostWhoosh();
    this.prevBoosting = boosting;
    const effSpeed = this.speed * (boosting ? BOOST_MULT : 1);
    this.world.setBoost(boosting);
    this.world.update(dt, effSpeed);
    this.audio.setEngineSpeed(Math.min(1, Math.max(0, (effSpeed - START_SPEED) / ENGINE_REF)));
    this.ui.setSpeed(Math.round(effSpeed * 2.4));
    if (boosting && this.phase === "question") {
      // de bonusteller loopt alleen zolang je het gaspedaal ingedrukt houdt
      this.boostBonus += dt * BOOST_BONUS_RATE;
      this.ui.setBoostBonus(Math.floor(this.boostBonus));
    }

    if (this.phase === "cruise") {
      this.cruiseTimer -= dt;
      if (this.cruiseTimer <= 0) this._startQuestion();
    } else if (this.phase === "question") {
      const t = this.world.junctionT();
      this.ui.setProgress(t);
      if (t >= 1) this._resolve();
    } else if (this.phase === "finish") {
      if (this.world.finishZ() >= 0) {
        // over de finishlijn!
        this.finishBonus = this.lives * FINISH_LIFE_BONUS;
        this.score += this.finishBonus;
        this.world.confettiBurst();
        this.audio.finishFanfare();
        this.audio.stopEngine();
        this.ui.hideQuestion();
        this.ui.hideFeedback();
        this._updateHUD();
        this.state = "celebrating";
        this.celebrateTimer = 2.2;
      }
    }
  }
}

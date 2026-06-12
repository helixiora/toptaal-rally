// DOM-laag: HUD, schermen en het scorebord (localStorage).

const LB_KEY = "toptaal-rally-scores";
const NAME_KEY = "toptaal-rally-name";
const MAX_SCORES = 10;

export function loadScores() {
  try {
    const scores = JSON.parse(localStorage.getItem(LB_KEY)) || [];
    return Array.isArray(scores) ? scores : [];
  } catch {
    return [];
  }
}

export function qualifies(score) {
  if (score <= 0) return false;
  const scores = loadScores();
  return scores.length < MAX_SCORES || score > scores[scores.length - 1].score;
}

export function saveScore(name, score) {
  const scores = loadScores();
  const entry = { name: name || "Anoniem", score, date: Date.now() };
  scores.push(entry);
  scores.sort((a, b) => b.score - a.score);
  scores.length = Math.min(scores.length, MAX_SCORES);
  localStorage.setItem(LB_KEY, JSON.stringify(scores));
  return entry;
}

export class UI {
  constructor() {
    const $ = (id) => document.getElementById(id);
    this.el = {
      score: $("score"),
      multiplier: $("multiplier"),
      lives: $("lives"),
      speed: $("speed"),
      feedback: $("feedback"),
      boostBonus: $("boost-bonus"),
      choices: $("choices"),
      timerBar: $("timer-bar"),
      choiceLeft: $("choice-left"),
      choiceRight: $("choice-right"),
      flash: $("flash"),
      progress: $("progress"),
      gameoverTitle: $("gameover-title"),
      menuScreen: $("menu-screen"),
      gameoverScreen: $("gameover-screen"),
      lbScreen: $("lb-screen"),
      pauseScreen: $("pause-screen"),
      finalScore: $("final-score"),
      finalDetail: $("final-detail"),
      highscoreEntry: $("highscore-entry"),
      nameInput: $("name-input"),
      lbList: $("lb-list"),
      lbEmpty: $("lb-empty"),
      btnStart: $("btn-start"),
      btnAgain: $("btn-again"),
      btnToMenu: $("btn-to-menu"),
      btnShowLb: $("btn-show-lb"),
      btnGameoverLb: $("btn-gameover-lb"),
      btnLbBack: $("btn-lb-back"),
      btnResume: $("btn-resume"),
      btnMute: $("btn-mute"),
      btnFullscreen: $("btn-fullscreen"),
    };
    this.feedbackTimer = null;
    this.lbReturnScreen = "menu";
  }

  // ---------- HUD ----------

  updateHUD({ score, lives, multiplier, speed, progress }) {
    this.el.score.textContent = score;
    this.el.lives.innerHTML = [0, 1, 2]
      .map((i) => `<span class="${i < lives ? "" : "lost"}">❤️</span>`)
      .join("");
    this.el.progress.textContent = progress;
    this.setSpeed(Math.round(speed * 2.4)); // wereld-eenheden → "km/u"
    if (multiplier > 1) {
      this.el.multiplier.textContent = `×${multiplier} reeks!`;
      this.el.multiplier.classList.add("on");
    } else {
      this.el.multiplier.classList.remove("on");
    }
  }

  // live snelheidsmeter (elke frame aangeroepen, alleen DOM-update bij verandering)
  setSpeed(kmh) {
    if (this._lastKmh === kmh) return;
    this._lastKmh = kmh;
    this.el.speed.textContent = kmh;
  }

  // bonusteller die meeloopt zolang het gaspedaal ingedrukt is
  setBoostBonus(points) {
    if (this._lastBonus === points) return;
    this._lastBonus = points;
    if (points > 0) {
      this.el.boostBonus.textContent = `🚀 +${points}`;
      this.el.boostBonus.classList.add("on");
    } else {
      this.el.boostBonus.classList.remove("on");
    }
  }

  showQuestion(leftText, rightText) {
    this.el.choiceLeft.querySelector(".txt").textContent = leftText;
    this.el.choiceRight.querySelector(".txt").textContent = rightText;
    for (const btn of [this.el.choiceLeft, this.el.choiceRight]) {
      btn.classList.remove("selected", "correct", "wrong");
    }
    this.el.choices.classList.add("show");
    this.setProgress(0);
  }

  hideQuestion() {
    this.el.choices.classList.remove("show");
  }

  selectPanel(side) {
    this.el.choiceLeft.classList.toggle("selected", side === "left");
    this.el.choiceRight.classList.toggle("selected", side === "right");
  }

  markPanels(chosenSide, correctSide) {
    for (const [side, btn] of [["left", this.el.choiceLeft], ["right", this.el.choiceRight]]) {
      btn.classList.remove("selected");
      if (side === correctSide) btn.classList.add("correct");
      else if (side === chosenSide) btn.classList.add("wrong");
    }
  }

  // t: 0 → 1 (1 = bij de splitsing)
  setProgress(t) {
    this.el.timerBar.style.width = `${(1 - t) * 100}%`;
    this.el.timerBar.classList.toggle("urgent", t > 0.7);
  }

  showFeedback(html, ok, duration = 2400) {
    clearTimeout(this.feedbackTimer);
    this.el.feedback.innerHTML = html;
    this.el.feedback.classList.toggle("bad", !ok);
    this.el.feedback.classList.add("show");
    this.feedbackTimer = setTimeout(() => this.el.feedback.classList.remove("show"), duration);
  }

  hideFeedback() {
    clearTimeout(this.feedbackTimer);
    this.el.feedback.classList.remove("show");
  }

  flashRed() {
    this.el.flash.classList.add("on");
    requestAnimationFrame(() =>
      requestAnimationFrame(() => this.el.flash.classList.remove("on"))
    );
  }

  // ---------- schermen ----------

  _setScreen(name) {
    this.el.menuScreen.classList.toggle("show", name === "menu");
    this.el.gameoverScreen.classList.toggle("show", name === "gameover");
    this.el.lbScreen.classList.toggle("show", name === "lb");
    this.el.pauseScreen.classList.toggle("show", name === "pause");
    document.body.classList.toggle("playing", name === "none" || name === "pause");
  }

  showMenu() {
    this._setScreen("menu");
    this.hideFeedback();
    this.hideQuestion();
  }

  showPlaying() {
    this._setScreen("none");
  }

  showPause() {
    this._setScreen("pause");
  }

  showGameOver({ score, title, detail, isHighscore }) {
    this._setScreen("gameover");
    this.el.gameoverTitle.textContent = title;
    this.el.finalScore.textContent = score;
    this.el.finalDetail.textContent = detail;
    this.el.highscoreEntry.classList.toggle("show", isHighscore);
    if (isHighscore) {
      this.el.nameInput.value = localStorage.getItem(NAME_KEY) || "";
      setTimeout(() => this.el.nameInput.focus(), 50);
    }
  }

  readName() {
    const name = this.el.nameInput.value.trim().slice(0, 16);
    if (name) localStorage.setItem(NAME_KEY, name);
    return name;
  }

  showLeaderboard(returnScreen, recentEntry = null) {
    this.lbReturnScreen = returnScreen;
    const scores = loadScores();
    this.el.lbEmpty.style.display = scores.length ? "none" : "block";
    this.el.lbList.innerHTML = scores
      .map((entry, i) => {
        const recent =
          recentEntry && entry.date === recentEntry.date && entry.score === recentEntry.score;
        const medal = ["🥇", "🥈", "🥉"][i] || `${i + 1}.`;
        return `<li class="${recent ? "recent" : ""}">
          <span class="rank">${medal}</span>
          <span class="name"></span>
          <span class="pts">${entry.score}</span>
        </li>`;
      })
      .join("");
    // namen veilig als tekst zetten (geen HTML-injectie via spelersnamen)
    [...this.el.lbList.querySelectorAll(".name")].forEach((el, i) => {
      el.textContent = scores[i].name;
    });
    this._setScreen("lb");
  }

  closeLeaderboard() {
    this._setScreen(this.lbReturnScreen);
  }
}

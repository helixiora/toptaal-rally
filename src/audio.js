// Gesynthetiseerd geluid via WebAudio — geen externe bestanden nodig (offline demo).

export class GameAudio {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem("toptaal-rally-muted") === "1";
    this.engine = null;
  }

  ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 1;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  setMuted(muted) {
    this.muted = muted;
    localStorage.setItem("toptaal-rally-muted", muted ? "1" : "0");
    if (this.master) this.master.gain.value = muted ? 0 : 1;
  }

  tone({ freq = 440, type = "sine", dur = 0.15, vol = 0.2, when = 0, slide = 0 }) {
    this.ensure();
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(this.master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  click() {
    this.tone({ freq: 700, type: "triangle", dur: 0.06, vol: 0.12 });
  }

  ding() {
    this.tone({ freq: 880, type: "sine", dur: 0.12, vol: 0.22 });
    this.tone({ freq: 1320, type: "sine", dur: 0.25, vol: 0.2, when: 0.1 });
  }

  buzz() {
    this.tone({ freq: 160, type: "sawtooth", dur: 0.35, vol: 0.22, slide: -60 });
    this.tone({ freq: 110, type: "square", dur: 0.35, vol: 0.12 });
  }

  startSound() {
    [440, 554, 659, 880].forEach((f, i) =>
      this.tone({ freq: f, type: "triangle", dur: 0.14, vol: 0.16, when: i * 0.11 })
    );
  }

  gameOver() {
    [392, 311, 262, 196].forEach((f, i) =>
      this.tone({ freq: f, type: "triangle", dur: 0.3, vol: 0.18, when: i * 0.22 })
    );
  }

  finishFanfare() {
    [392, 523, 659, 784, 659, 784, 1047, 1319].forEach((f, i) =>
      this.tone({ freq: f, type: "triangle", dur: 0.18, vol: 0.17, when: i * 0.12 })
    );
  }

  highscore() {
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) =>
      this.tone({ freq: f, type: "triangle", dur: 0.16, vol: 0.16, when: i * 0.12 })
    );
  }

  startEngine() {
    this.ensure();
    if (this.engine) return;
    const osc = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc2.type = "triangle";
    osc.frequency.value = 55;
    osc2.frequency.value = 110;
    filter.type = "lowpass";
    filter.frequency.value = 220;
    gain.gain.value = 0.035;
    osc.connect(filter);
    osc2.connect(filter);
    filter.connect(gain).connect(this.master);
    osc.start();
    osc2.start();
    this.engine = { osc, osc2, gain, filter };
  }

  // speed01: 0..1 genormaliseerde snelheid — hoorbaar hogere toeren bij meer vaart
  setEngineSpeed(speed01) {
    if (!this.engine) return;
    const f = 45 + speed01 * 200;
    this.engine.osc.frequency.value = f;
    this.engine.osc2.frequency.value = f * 2;
    this.engine.filter.frequency.value = 180 + speed01 * 1400;
    this.engine.gain.gain.value = 0.03 + speed01 * 0.05;
  }

  boostWhoosh() {
    this.tone({ freq: 90, type: "sawtooth", dur: 0.45, vol: 0.16, slide: 220 });
  }

  stopEngine() {
    if (!this.engine) return;
    const { osc, osc2, gain } = this.engine;
    const t = this.ctx.currentTime;
    gain.gain.linearRampToValueAtTime(0, t + 0.4);
    osc.stop(t + 0.5);
    osc2.stop(t + 0.5);
    this.engine = null;
  }
}

import { World } from "./world.js";
import { UI } from "./ui.js";
import { GameAudio } from "./audio.js";
import { Game } from "./game.js";

const world = new World(document.getElementById("scene"));
const ui = new UI();
const audio = new GameAudio();
const game = new Game(world, ui, audio);
window.game = game; // handig voor debuggen en demo-beheer (bv. scorebord resetten)

window.addEventListener("resize", () => world.onResize());

let last = performance.now();
function loop(now) {
  // dt begrenzen: na tab-switch geen reuzensprong
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;
  game.update(dt);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

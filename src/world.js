import * as THREE from "three";

export const SPAWN_DIST = 240; // afstand waarop een splitsing verschijnt
const ROAD_W = 9;
const DESPAWN_Z = 70;
const WORLD_DEPTH = 464;
const LANE_X = 2.25;

// OutRun-stijl splitsing: de weg splitst rond een lang groen eiland en komt
// daarna weer samen, zodat de auto altijd op doorlopend asfalt blijft.
const NOSE_Z = 55; // lokale z van de splitsingspunt (vóór het portaal op z=0)
const MERGE_END_Z = -45; // lokale z waar de rijstroken weer samenkomen
const X_MAX = 4; // maximale uitwijking van het rijstrookmidden rond het eiland

function smoothstep(t) {
  return t * t * (3 - 2 * t);
}

// afstand van het rijstrookmidden tot de wegas, per lokale z in de splitsing
function laneOffset(localZ) {
  const s = NOSE_Z - localZ; // afgelegde afstand voorbij de splitsingspunt
  if (s <= 0 || s >= 100) return LANE_X;
  if (s < 30) return LANE_X + (X_MAX - LANE_X) * smoothstep(s / 30);
  if (s < 70) return X_MAX;
  return X_MAX - (X_MAX - LANE_X) * smoothstep((s - 70) / 30);
}

const COLORS = {
  sky: 0x87ceeb,
  fog: 0xa9d9f2,
  grass: 0x67b14b,
  road: 0x3c4046,
  water: 0x3f9bd8,
  carBody: 0xff7a1a,
  treeLeaf: 0x2e8b40,
  trunk: 0x6b4a2b,
};

function rand(min, max) {
  return min + Math.random() * (max - min);
}

// Willekeurige x-positie in de berm, buiten de weg en het kanaal (x ≈ -39..-53).
function sceneryX() {
  if (Math.random() < 0.5) return rand(13, 85); // rechts
  return Math.random() < 0.55 ? rand(-13, -36) : rand(-58, -85); // links, om het kanaal heen
}

export class World {
  constructor(container) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(COLORS.sky);
    this.scene.fog = new THREE.Fog(COLORS.fog, 110, 360);

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 600);
    this.camera.position.set(0, 5.4, 11);
    this.camera.lookAt(0, 1.4, -12);

    this.time = 0;
    this.laneTarget = 0;
    this.wobbleT = 0;
    this.spinning = false;
    this.boosting = false;
    this.junction = null; // de actieve splitsing (waar de vraag over gaat)
    this.junctions = []; // alle zichtbare splitsingen (de vorige rolt nog uit beeld)
    this.followJunction = null; // de splitsing waar de auto doorheen rijdt
    this.finish = null; // de finishlijn aan het einde van de race
    this.scrollers = []; // { obj, respawn(obj) } — alles wat met de weg meebeweegt
    this.windmillHubs = [];

    this.camSmoothX = 0;

    this._buildLights();
    this._buildTerrain();
    this._buildScenery();
    this.car = this._buildCar();
    this.scene.add(this.car);
    this._buildConfetti();
    this._buildStreaks();
  }

  // ---------- opbouw ----------

  _buildLights() {
    this.scene.add(new THREE.HemisphereLight(0xcfe9ff, 0x55903f, 1.15));
    const sun = new THREE.DirectionalLight(0xfff4e0, 2.0);
    sun.position.set(45, 70, -25);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -45;
    sun.shadow.camera.right = 45;
    sun.shadow.camera.top = 45;
    sun.shadow.camera.bottom = -45;
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 200;
    this.scene.add(sun);
  }

  _buildTerrain() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(800, 1100),
      new THREE.MeshLambertMaterial({ color: COLORS.grass })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, 0, -250);
    ground.receiveShadow = true;
    this.scene.add(ground);

    const road = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_W, 1100),
      new THREE.MeshLambertMaterial({ color: COLORS.road })
    );
    road.rotation.x = -Math.PI / 2;
    road.position.set(0, 0.02, -250);
    road.receiveShadow = true;
    this.scene.add(road);

    const lineMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });
    for (const side of [-1, 1]) {
      const line = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 1100), lineMat);
      line.rotation.x = -Math.PI / 2;
      line.position.set(side * (ROAD_W / 2 - 0.35), 0.03, -250);
      this.scene.add(line);
    }

    const canal = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 1100),
      new THREE.MeshPhongMaterial({ color: COLORS.water, shininess: 90 })
    );
    canal.rotation.x = -Math.PI / 2;
    canal.position.set(-46, 0.015, -250);
    this.scene.add(canal);

    // middenstrepen
    const dashGeo = new THREE.BoxGeometry(0.18, 0.02, 2.6);
    const dashMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });
    for (let i = 0; i < 58; i++) {
      const dash = new THREE.Mesh(dashGeo, dashMat);
      dash.position.set(0, 0.035, -390 + i * 8);
      this.scene.add(dash);
      this.scrollers.push({ obj: dash, respawn: (o) => (o.position.z -= WORLD_DEPTH) });
    }

    // bermpaaltjes
    const poleGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8);
    const poleMat = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });
    for (let i = 0; i < 16; i++) {
      for (const side of [-1, 1]) {
        const pole = new THREE.Mesh(poleGeo, poleMat);
        pole.position.set(side * (ROAD_W / 2 + 0.8), 0.45, -390 + i * 29);
        this.scene.add(pole);
        this.scrollers.push({ obj: pole, isPole: true, respawn: (o) => (o.position.z -= WORLD_DEPTH) });
      }
    }
  }

  _addScrollingScenery(obj) {
    obj.position.set(sceneryX(), obj.position.y, rand(-390, DESPAWN_Z));
    this.scene.add(obj);
    this.scrollers.push({
      obj,
      respawn: (o) => {
        o.position.z -= 440 + rand(0, 40);
        o.position.x = sceneryX();
      },
    });
  }

  _buildScenery() {
    const trunkMat = new THREE.MeshLambertMaterial({ color: COLORS.trunk });
    const leafMat = new THREE.MeshLambertMaterial({ color: COLORS.treeLeaf });
    for (let i = 0; i < 22; i++) {
      const tree = new THREE.Group();
      const h = rand(2.2, 4);
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, h, 7), trunkMat);
      trunk.position.y = h / 2;
      trunk.castShadow = true;
      const crown = new THREE.Mesh(new THREE.SphereGeometry(rand(1.3, 2.2), 8, 7), leafMat);
      crown.position.y = h + 0.8;
      crown.scale.y = rand(0.9, 1.3);
      crown.castShadow = true;
      tree.add(trunk, crown);
      this._addScrollingScenery(tree);
    }

    for (let i = 0; i < 5; i++) this._addScrollingScenery(this._buildWindmill());
    for (let i = 0; i < 10; i++) this._addScrollingScenery(this._buildCow());
    for (let i = 0; i < 8; i++) this._addScrollingScenery(this._buildTulipField());
    for (let i = 0; i < 7; i++) this._addScrollingScenery(this._buildHouse());
    for (let i = 0; i < 8; i++) {
      const cloud = this._buildCloud();
      cloud.position.y = rand(24, 40);
      this._addScrollingScenery(cloud);
      cloud.position.x = rand(-120, 120);
    }
  }

  _buildWindmill() {
    const mill = new THREE.Group();
    const body = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 2.2, 8, 10),
      new THREE.MeshLambertMaterial({ color: 0x7a5230 })
    );
    body.position.y = 4;
    body.castShadow = true;
    const cap = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 1.6, 10),
      new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
    );
    cap.position.y = 8.8;
    const hub = new THREE.Group();
    hub.position.set(0, 8.2, 1.5);
    const bladeMat = new THREE.MeshLambertMaterial({ color: 0xf0ead8, side: THREE.DoubleSide });
    for (let i = 0; i < 4; i++) {
      const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 5.6), bladeMat);
      blade.position.y = 2.8;
      const arm = new THREE.Group();
      arm.add(blade);
      arm.rotation.z = (i * Math.PI) / 2;
      hub.add(arm);
    }
    hub.userData.spinSpeed = rand(0.5, 1.1);
    this.windmillHubs.push(hub);
    mill.add(body, cap, hub);
    mill.rotation.y = Math.PI; // wieken naar de weg gericht
    mill.scale.setScalar(rand(0.8, 1.25));
    return mill;
  }

  _buildCow() {
    const cow = new THREE.Group();
    const white = new THREE.MeshLambertMaterial({ color: 0xf5f0e8 });
    const black = new THREE.MeshLambertMaterial({ color: 0x2b2b2b });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.7), white);
    body.position.y = 0.85;
    body.castShadow = true;
    const spot1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.74), black);
    spot1.position.set(0.3, 0.95, 0);
    const spot2 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.74), black);
    spot2.position.set(-0.45, 0.75, 0);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.42, 0.45), white);
    head.position.set(0.95, 1.1, 0);
    const legGeo = new THREE.BoxGeometry(0.14, 0.5, 0.14);
    for (const [lx, lz] of [[0.55, 0.2], [0.55, -0.2], [-0.55, 0.2], [-0.55, -0.2]]) {
      const leg = new THREE.Mesh(legGeo, black);
      leg.position.set(lx, 0.25, lz);
      cow.add(leg);
    }
    cow.add(body, spot1, spot2, head);
    cow.rotation.y = rand(0, Math.PI * 2);
    return cow;
  }

  _buildTulipField() {
    const palette = [0xe63946, 0xf4a017, 0xe06bb2, 0xfdfd66, 0xd62865];
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    const rows = 4;
    for (let r = 0; r < rows; r++) {
      ctx.fillStyle = "#" + palette[Math.floor(Math.random() * palette.length)].toString(16).padStart(6, "0");
      ctx.fillRect(0, (64 / rows) * r, 64, 64 / rows);
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const field = new THREE.Mesh(
      new THREE.PlaneGeometry(rand(8, 14), rand(12, 20)),
      new THREE.MeshLambertMaterial({ map: tex })
    );
    field.rotation.x = -Math.PI / 2;
    field.position.y = 0.01;
    const group = new THREE.Group();
    group.add(field);
    return group;
  }

  _buildHouse() {
    const house = new THREE.Group();
    const w = rand(2.6, 3.6);
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(w, 2.4, w),
      new THREE.MeshLambertMaterial({ color: 0xb55a35 })
    );
    body.position.y = 1.2;
    body.castShadow = true;
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(w * 0.85, 1.6, 4),
      new THREE.MeshLambertMaterial({ color: 0x71412a })
    );
    roof.position.y = 3.2;
    roof.rotation.y = Math.PI / 4;
    roof.castShadow = true;
    house.add(body, roof);
    house.rotation.y = rand(-0.3, 0.3);
    return house;
  }

  _buildCloud() {
    const cloud = new THREE.Group();
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    for (let i = 0; i < 3; i++) {
      const puff = new THREE.Mesh(new THREE.SphereGeometry(rand(2, 3.6), 8, 6), mat);
      puff.position.set(i * 2.6 - 2.6, rand(-0.4, 0.4), 0);
      cloud.add(puff);
    }
    return cloud;
  }

  _buildCar() {
    const car = new THREE.Group();
    const bodyMat = new THREE.MeshPhongMaterial({ color: COLORS.carBody, shininess: 80 });
    const glassMat = new THREE.MeshPhongMaterial({ color: 0x223a52, shininess: 130 });
    const darkMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2e });

    // carrosserie: zijprofiel (voorkant, motorkap, riemlijn, kofferbak), geëxtrudeerd
    // shape-x = lengteas; na rotation.y = -90° wordt shape -x de neus (wereld -z)
    const profile = new THREE.Shape();
    profile.moveTo(-2.1, 0.25);
    profile.lineTo(-2.1, 0.7); // voorkant
    profile.lineTo(-1.2, 0.82); // motorkap
    profile.lineTo(1.7, 0.86); // riemlijn
    profile.lineTo(2.1, 0.78); // kofferbak
    profile.lineTo(2.1, 0.3); // achterkant
    profile.closePath();
    const bodyGeo = new THREE.ExtrudeGeometry(profile, { depth: 1.9, bevelEnabled: false });
    bodyGeo.translate(0, 0, -0.95);
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.y = -Math.PI / 2;
    body.castShadow = true;

    // cabine van glas: voorruit, dak, achterruit
    const cabinShape = new THREE.Shape();
    cabinShape.moveTo(-0.95, 0.8);
    cabinShape.lineTo(-0.35, 1.32); // voorruit
    cabinShape.lineTo(0.8, 1.32); // dak
    cabinShape.lineTo(1.5, 0.8); // achterruit
    cabinShape.closePath();
    const cabinGeo = new THREE.ExtrudeGeometry(cabinShape, { depth: 1.66, bevelEnabled: false });
    cabinGeo.translate(0, 0, -0.83);
    const cabin = new THREE.Mesh(cabinGeo, glassMat);
    cabin.rotation.y = -Math.PI / 2;
    cabin.castShadow = true;

    const roofPlate = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 1.2), bodyMat);
    roofPlate.position.set(0, 1.35, 0.22);
    roofPlate.castShadow = true;

    // dakbord in rijschool-stijl met "TopTaal"
    const signCanvas = document.createElement("canvas");
    signCanvas.width = 256;
    signCanvas.height = 72;
    const sctx = signCanvas.getContext("2d");
    sctx.fillStyle = "#ff7a1a";
    sctx.fillRect(0, 0, 256, 72);
    sctx.fillStyle = "#ffffff";
    sctx.font = "bold 44px 'Avenir Next', 'Segoe UI', sans-serif";
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.fillText("TopTaal", 128, 39);
    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const roofSign = new THREE.Mesh(
      new THREE.BoxGeometry(1.45, 0.4, 0.1),
      new THREE.MeshLambertMaterial({ map: signTex })
    );
    roofSign.position.set(0, 1.62, 0.22);
    roofSign.castShadow = true;

    // bumpers, verlichting, kentekenplaten, spiegels, uitlaat
    const bumperGeo = new THREE.BoxGeometry(1.96, 0.16, 0.3);
    for (const bz of [-2.1, 2.1]) {
      const bumper = new THREE.Mesh(bumperGeo, darkMat);
      bumper.position.set(0, 0.34, bz);
      car.add(bumper);
    }
    const headlightMat = new THREE.MeshBasicMaterial({ color: 0xfff2c0 });
    const taillightMat = new THREE.MeshBasicMaterial({ color: 0xd0312d });
    const lightGeo = new THREE.BoxGeometry(0.34, 0.14, 0.06);
    for (const lx of [-0.6, 0.6]) {
      const headlight = new THREE.Mesh(lightGeo, headlightMat);
      headlight.position.set(lx, 0.62, -2.12);
      const taillight = new THREE.Mesh(lightGeo, taillightMat);
      taillight.position.set(lx, 0.68, 2.12);
      car.add(headlight, taillight);
    }
    const plateMat = new THREE.MeshLambertMaterial({ color: 0xf7c948 }); // NL-geel
    const plateGeo = new THREE.BoxGeometry(0.52, 0.15, 0.03);
    for (const pz of [-2.13, 2.13]) {
      const plate = new THREE.Mesh(plateGeo, plateMat);
      plate.position.set(0, 0.44, pz);
      car.add(plate);
    }
    const mirrorGeo = new THREE.BoxGeometry(0.1, 0.12, 0.2);
    for (const mx of [-1.02, 1.02]) {
      const mirror = new THREE.Mesh(mirrorGeo, bodyMat);
      mirror.position.set(mx, 0.95, -0.45);
      car.add(mirror);
    }
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.14, 8), darkMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.set(0.55, 0.29, 2.15);
    car.add(exhaust);

    // wielen: band + naafdop, draaien om hun eigen as via een asgroep
    this.wheels = [];
    const tireGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16);
    const tireMat = new THREE.MeshLambertMaterial({ color: 0x18181a });
    const hubGeo = new THREE.CylinderGeometry(0.17, 0.17, 0.31, 12);
    const hubMat = new THREE.MeshPhongMaterial({ color: 0xc8ccd2, shininess: 100 });
    for (const [wx, wz] of [[0.93, 1.35], [-0.93, 1.35], [0.93, -1.35], [-0.93, -1.35]]) {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.castShadow = true;
      const hub = new THREE.Mesh(hubGeo, hubMat);
      hub.rotation.z = Math.PI / 2;
      const axle = new THREE.Group();
      axle.position.set(wx, 0.42, wz);
      axle.add(tire, hub);
      car.add(axle);
      this.wheels.push(axle);
    }

    car.add(body, cabin, roofPlate, roofSign);
    return car;
  }

  _buildConfetti() {
    this.confetti = [];
    const geo = new THREE.PlaneGeometry(0.24, 0.24);
    const palette = [0xff7a1a, 0x2ecc71, 0xffffff, 0xffd23e, 0x4aa3df];
    for (let i = 0; i < 70; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: palette[i % palette.length],
        side: THREE.DoubleSide,
        transparent: true,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.visible = false;
      this.scene.add(mesh);
      this.confetti.push({ mesh, vel: new THREE.Vector3(), spin: 0, life: 0 });
    }
  }

  _buildStreaks() {
    // "snelheidsstrepen" langs de weg die pas bij hoge snelheid zichtbaar worden
    this.streaks = [];
    const geo = new THREE.BoxGeometry(0.06, 0.06, 7);
    for (let i = 0; i < 26; i++) {
      const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 });
      const streak = new THREE.Mesh(geo, mat);
      this._placeStreak(streak);
      streak.position.z = rand(-250, 40);
      streak.visible = false;
      this.scene.add(streak);
      this.streaks.push(streak);
    }
  }

  _placeStreak(streak) {
    const side = Math.random() < 0.5 ? -1 : 1;
    streak.position.x = side * rand(6.5, 20);
    streak.position.y = rand(0.5, 6);
  }

  // ---------- borden / splitsing ----------

  // Plat vlak langs de splitsing met variabele breedte.
  // edgeFn(localZ) → [xLinks, xRechts] geeft de randen per lokale z.
  _makeStrip(edgeFn, material, y) {
    const segs = 40;
    const positions = [];
    const normals = [];
    const indices = [];
    for (let i = 0; i <= segs; i++) {
      const z = NOSE_Z - ((NOSE_Z - MERGE_END_Z) * i) / segs;
      const [xl, xr] = edgeFn(z);
      positions.push(xl, 0, z, xr, 0, z);
      normals.push(0, 1, 0, 0, 1, 0);
      if (i < segs) {
        const a = i * 2;
        // tegen de klok in gezien van boven, zodat de bovenkant belicht wordt
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    geo.setIndex(indices);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.y = y;
    return mesh;
  }

  _drawPanel(panel, state) {
    const { ctx, canvas, text, side } = panel;
    const bg = { normal: "#0a57a3", selected: "#ff7a1a", correct: "#27ae60", wrong: "#c0392b" }[state];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const r = 28;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.roundRect(6, 6, canvas.width - 12, canvas.height - 12, r);
    ctx.fill();
    ctx.lineWidth = 10;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    // pijlpunt aan de buitenkant
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    const cy = canvas.height / 2;
    if (side === "left") {
      ctx.moveTo(40, cy);
      ctx.lineTo(95, cy - 38);
      ctx.lineTo(95, cy + 38);
    } else {
      ctx.moveTo(canvas.width - 40, cy);
      ctx.lineTo(canvas.width - 95, cy - 38);
      ctx.lineTo(canvas.width - 95, cy + 38);
    }
    ctx.closePath();
    ctx.fill();

    let fontSize = 84;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    do {
      ctx.font = `bold ${fontSize}px 'Avenir Next', 'Segoe UI', sans-serif`;
      fontSize -= 4;
    } while (ctx.measureText(text).width > canvas.width - 260 && fontSize > 30);
    ctx.fillText(text, canvas.width / 2 + (side === "left" ? 45 : -45), cy);
    panel.texture.needsUpdate = true;
  }

  _makePanel(text, side, x) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(6.4, 1.6),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true })
    );
    mesh.position.set(x, 4.15, 0.2);
    const panel = { mesh, texture, canvas, ctx, text, side };
    this._drawPanel(panel, "normal");
    return panel;
  }

  spawnJunction(leftText, rightText) {
    const group = new THREE.Group();
    group.position.z = -SPAWN_DIST;

    // portaal (staat midden in het brede stuk, boven de twee rijstroken)
    const postMat = new THREE.MeshLambertMaterial({ color: 0x8a9097 });
    const postGeo = new THREE.CylinderGeometry(0.14, 0.14, 5.4, 8);
    for (const px of [-7, 7]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, 2.7, 0);
      post.castShadow = true;
      group.add(post);
    }
    const beam = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.32, 0.32), postMat);
    beam.position.y = 5.2;
    group.add(beam);

    const left = this._makePanel(leftText, "left", -X_MAX);
    const right = this._makePanel(rightText, "right", X_MAX);
    group.add(left.mesh, right.mesh);

    // de weg verbreedt zich rond een groen eiland en komt daarna weer samen:
    // één doorlopend wegdek, dus de auto rijdt nergens van het asfalt af
    const surfaceMat = new THREE.MeshLambertMaterial({ color: COLORS.road, side: THREE.DoubleSide });
    const islandMat = new THREE.MeshLambertMaterial({ color: COLORS.grass, side: THREE.DoubleSide });
    const edgeMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2, side: THREE.DoubleSide });
    group.add(
      this._makeStrip((z) => {
        const half = laneOffset(z) + 2.2;
        return [-half, half];
      }, surfaceMat, 0.05)
    );
    group.add(
      this._makeStrip((z) => {
        const half = Math.max(laneOffset(z) - 2.2, 0.02);
        return [-half, half];
      }, islandMat, 0.08)
    );
    for (const side of [-1, 1]) {
      group.add(
        this._makeStrip((z) => {
          const x = side * (laneOffset(z) + 1.9); // sluit aan op de vaste kantstrepen
          return [x - 0.09, x + 0.09];
        }, edgeMat, 0.07)
      );
    }

    // verdrijvingsbord op de punt van de berm
    const chevCanvas = document.createElement("canvas");
    chevCanvas.width = 128;
    chevCanvas.height = 80;
    const cctx = chevCanvas.getContext("2d");
    cctx.fillStyle = "#c0392b";
    cctx.fillRect(0, 0, 128, 80);
    cctx.strokeStyle = "#ffffff";
    cctx.lineWidth = 10;
    for (let i = -2; i < 5; i++) {
      cctx.beginPath();
      cctx.moveTo(i * 36, 80);
      cctx.lineTo(i * 36 + 50, 0);
      cctx.stroke();
    }
    const chevTex = new THREE.CanvasTexture(chevCanvas);
    chevTex.colorSpace = THREE.SRGBColorSpace;
    const chevron = new THREE.Mesh(
      new THREE.BoxGeometry(1.5, 0.9, 0.1),
      new THREE.MeshLambertMaterial({ map: chevTex })
    );
    chevron.position.set(0, 0.75, 42); // op de punt van het eiland, vóór het portaal
    group.add(chevron);

    // witte pijlen op het wegdek vóór het portaal
    const arrowShape = new THREE.Shape();
    arrowShape.moveTo(0, 1.4);
    arrowShape.lineTo(0.7, 0.2);
    arrowShape.lineTo(0.25, 0.2);
    arrowShape.lineTo(0.25, -1.2);
    arrowShape.lineTo(-0.25, -1.2);
    arrowShape.lineTo(-0.25, 0.2);
    arrowShape.lineTo(-0.7, 0.2);
    arrowShape.closePath();
    const arrowGeo = new THREE.ShapeGeometry(arrowShape);
    const arrowMat = new THREE.MeshBasicMaterial({ color: 0xf2f2f2 });
    for (const side of [-1, 1]) {
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.rotation.x = -Math.PI / 2;
      arrow.rotation.z = side * 0.35; // pijl wijst schuin naar de gekozen kant
      arrow.position.set(side * LANE_X, 0.04, NOSE_Z + 8); // vlak vóór de splitsing
      group.add(arrow);
    }

    this.scene.add(group);
    this.junction = { group, panels: { left, right }, resolved: false };
    this.junctions.push(this.junction);
  }

  // 0 bij verschijnen → 1 op het beslismoment (waar de weg zich splitst)
  junctionT() {
    if (!this.junction) return 0;
    if (this.junction.resolved) return 1;
    const t = (this.junction.group.position.z + SPAWN_DIST) / (SPAWN_DIST - NOSE_Z - 1);
    return Math.min(1, Math.max(0, t));
  }

  highlightSign(side) {
    if (!this.junction || this.junction.resolved) return;
    this._drawPanel(this.junction.panels.left, side === "left" ? "selected" : "normal");
    this._drawPanel(this.junction.panels.right, side === "right" ? "selected" : "normal");
  }

  resolveJunction(chosenSide, correctSide) {
    if (!this.junction) return;
    this.junction.resolved = true;
    // bij "te laat" stuurt het spel je over de goede afslag
    this.junction.curveSide = chosenSide || correctSide;
    this.junction.resolveCarX = this.car.position.x;
    this.followJunction = this.junction;
    for (const side of ["left", "right"]) {
      const state = side === correctSide ? "correct" : side === chosenSide ? "wrong" : "normal";
      this._drawPanel(this.junction.panels[side], state);
    }
  }

  _disposeGroup(group) {
    this.scene.remove(group);
    group.traverse((node) => {
      if (node.geometry) node.geometry.dispose();
      if (node.material) {
        if (node.material.map) node.material.map.dispose();
        node.material.dispose();
      }
    });
  }

  _disposeJunction(junction) {
    this._disposeGroup(junction.group);
  }

  clearJunctions() {
    for (const junction of this.junctions) this._disposeJunction(junction);
    this.junctions = [];
    this.junction = null;
    this.followJunction = null;
  }

  // ---------- finish ----------

  spawnFinish() {
    const group = new THREE.Group();
    group.position.z = -130;

    const postMat = new THREE.MeshLambertMaterial({ color: 0x8a9097 });
    const postGeo = new THREE.CylinderGeometry(0.16, 0.16, 5.6, 8);
    for (const px of [-5.8, 5.8]) {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, 2.8, 0);
      post.castShadow = true;
      group.add(post);
    }

    // geblokte balk
    const beamCanvas = document.createElement("canvas");
    beamCanvas.width = 512;
    beamCanvas.height = 64;
    const bctx = beamCanvas.getContext("2d");
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 2; j++) {
        bctx.fillStyle = (i + j) % 2 ? "#161616" : "#ffffff";
        bctx.fillRect(i * 32, j * 32, 32, 32);
      }
    }
    const beamTex = new THREE.CanvasTexture(beamCanvas);
    beamTex.colorSpace = THREE.SRGBColorSpace;
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(12, 0.8, 0.4),
      new THREE.MeshLambertMaterial({ map: beamTex })
    );
    beam.position.y = 5.4;
    group.add(beam);

    // FINISH-bord
    const signCanvas = document.createElement("canvas");
    signCanvas.width = 1024;
    signCanvas.height = 224;
    const sctx = signCanvas.getContext("2d");
    sctx.fillStyle = "#ffffff";
    sctx.fillRect(0, 0, 1024, 224);
    for (let i = 0; i < 32; i++) {
      sctx.fillStyle = i % 2 ? "#161616" : "#ffffff";
      sctx.fillRect(i * 32, 0, 32, 24);
      sctx.fillStyle = (i + 1) % 2 ? "#161616" : "#ffffff";
      sctx.fillRect(i * 32, 200, 32, 24);
    }
    sctx.fillStyle = "#161616";
    sctx.font = "bold 130px 'Avenir Next', 'Segoe UI', sans-serif";
    sctx.textAlign = "center";
    sctx.textBaseline = "middle";
    sctx.fillText("FINISH", 512, 116);
    const signTex = new THREE.CanvasTexture(signCanvas);
    signTex.colorSpace = THREE.SRGBColorSpace;
    const sign = new THREE.Mesh(
      new THREE.PlaneGeometry(6.2, 1.35),
      new THREE.MeshBasicMaterial({ map: signTex })
    );
    sign.position.set(0, 4.2, 0.25);
    group.add(sign);

    // geblokte streep op het wegdek
    const stripCanvas = document.createElement("canvas");
    stripCanvas.width = 192;
    stripCanvas.height = 64;
    const stctx = stripCanvas.getContext("2d");
    for (let i = 0; i < 12; i++) {
      for (let j = 0; j < 4; j++) {
        stctx.fillStyle = (i + j) % 2 ? "#161616" : "#f2f2f2";
        stctx.fillRect(i * 16, j * 16, 16, 16);
      }
    }
    const stripTex = new THREE.CanvasTexture(stripCanvas);
    stripTex.colorSpace = THREE.SRGBColorSpace;
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(ROAD_W, 3),
      new THREE.MeshLambertMaterial({ map: stripTex })
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.y = 0.045;
    group.add(strip);

    this.scene.add(group);
    this.finish = { group };
  }

  finishZ() {
    return this.finish ? this.finish.group.position.z : -Infinity;
  }

  // ---------- besturing & effecten ----------

  setLane(side) {
    this.laneTarget = side === "left" ? -LANE_X : side === "right" ? LANE_X : 0;
  }

  wobble() {
    this.wobbleT = 0.9;
  }

  setBoost(active) {
    this.boosting = active;
  }

  spinOut() {
    this.spinning = true;
  }

  confettiBurst() {
    for (const piece of this.confetti) {
      piece.mesh.visible = true;
      piece.mesh.position.set(
        this.car.position.x + rand(-0.8, 0.8),
        1.4 + rand(0, 0.8),
        this.car.position.z + rand(-1.5, 1.5)
      );
      piece.vel.set(rand(-4, 4), rand(5, 11), rand(-3, 3));
      piece.spin = rand(-10, 10);
      piece.life = rand(0.8, 1.4);
      piece.maxLife = piece.life;
      piece.mesh.material.opacity = 1;
    }
  }

  reset() {
    this.clearJunctions();
    if (this.finish) {
      this._disposeGroup(this.finish.group);
      this.finish = null;
    }
    this.laneTarget = 0;
    this.wobbleT = 0;
    this.spinning = false;
    this.boosting = false;
    this.camera.fov = 60;
    this.camera.updateProjectionMatrix();
    this.car.position.set(0, 0, 0);
    this.car.rotation.set(0, 0, 0);
    for (const piece of this.confetti) piece.mesh.visible = false;
  }

  // ---------- per frame ----------

  update(dt, speed) {
    this.time += dt;

    for (const scroller of this.scrollers) {
      const obj = scroller.obj;
      obj.position.z += dt * speed;
      if (obj.position.z > DESPAWN_Z) scroller.respawn(obj);
      // bermpaaltjes verbergen waar de weg breder is dan normaal
      if (scroller.isPole) {
        obj.visible = true;
        for (const j of this.junctions) {
          const jz = j.group.position.z;
          if (obj.position.z < jz + NOSE_Z + 2 && obj.position.z > jz + MERGE_END_Z - 2) {
            obj.visible = false;
            break;
          }
        }
      }
    }

    if (this.finish) {
      this.finish.group.position.z += dt * speed;
      if (this.finish.group.position.z > 90) {
        this._disposeGroup(this.finish.group);
        this.finish = null;
      }
    }

    // splitsingen scrollen mee; opruimen zodra ze volledig achter de camera zijn
    for (let i = this.junctions.length - 1; i >= 0; i--) {
      const j = this.junctions[i];
      j.group.position.z += dt * speed;
      if (j.group.position.z > 60) {
        this._disposeJunction(j);
        this.junctions.splice(i, 1);
        if (this.junction === j) this.junction = null;
        if (this.followJunction === j) this.followJunction = null;
      }
    }

    for (const hub of this.windmillHubs) {
      hub.rotation.z += dt * hub.userData.spinSpeed;
    }

    // auto: rijstrook kiezen, om het eiland heen rijden, sturen, deinen
    const car = this.car;
    if (this.spinning) {
      car.rotation.y += dt * 9;
      car.position.x += (0 - car.position.x) * Math.min(1, dt * 2);
    } else {
      let targetRot = 0;
      let following = false;
      const fj = this.followJunction;
      if (fj) {
        const localZ = -fj.group.position.z; // positie van de auto binnen de splitsing
        if (localZ <= MERGE_END_Z) {
          // rijstroken zijn weer samengekomen: rustig terug naar het midden
          this.followJunction = null;
          this.laneTarget = 0;
        } else {
          // het rijstrookmidden volgen — het wegdek loopt hier ononderbroken door
          const s = fj.curveSide === "left" ? -1 : 1;
          const ramp = Math.min(1, Math.max(0, (NOSE_Z + 1 - localZ) / 10));
          const lane = s * laneOffset(localZ);
          car.position.x = fj.resolveCarX * (1 - ramp) + lane * ramp;
          this.laneTarget = car.position.x;
          const slope = laneOffset(localZ - 1) - laneOffset(localZ); // zijwaarts per meter
          targetRot = THREE.MathUtils.clamp(-s * slope * 3 * ramp, -0.3, 0.3);
          following = true;
        }
      }
      if (!following) {
        const diff = this.laneTarget - car.position.x;
        car.position.x += diff * Math.min(1, dt * 5);
        targetRot = THREE.MathUtils.clamp(-diff * 0.14, -0.35, 0.35);
      }
      car.rotation.y += (targetRot - car.rotation.y) * Math.min(1, dt * 8);
      car.rotation.z = car.rotation.y * -0.3;
      if (this.wobbleT > 0) {
        this.wobbleT -= dt;
        car.rotation.z += Math.sin(this.wobbleT * 40) * 0.13 * (this.wobbleT / 0.9);
      }
    }
    car.position.y = Math.sin(this.time * 9) * 0.02 * Math.min(1, speed / 20);

    for (const wheel of this.wheels) wheel.rotation.x -= (dt * speed) / 0.42;

    // confetti
    for (const piece of this.confetti) {
      if (!piece.mesh.visible) continue;
      piece.life -= dt;
      if (piece.life <= 0) {
        piece.mesh.visible = false;
        continue;
      }
      piece.vel.y -= 18 * dt;
      piece.mesh.position.addScaledVector(piece.vel, dt);
      piece.mesh.position.z += dt * speed * 0.3;
      piece.mesh.rotation.x += piece.spin * dt;
      piece.mesh.rotation.y += piece.spin * 0.7 * dt;
      piece.mesh.material.opacity = piece.life / piece.maxLife;
    }

    // snelheidsstrepen: alleen zichtbaar als het echt hard gaat
    const streakOpacity = Math.min(0.7, Math.max(0, (speed - 65) / 180));
    for (const streak of this.streaks) {
      streak.visible = streakOpacity > 0.01;
      if (!streak.visible) continue;
      streak.material.opacity = streakOpacity;
      streak.position.z += dt * speed * 1.6;
      if (streak.position.z > 45) {
        streak.position.z -= 290;
        this._placeStreak(streak);
      }
    }

    // camera volgt de auto; meer vaart = wijdere lens en lichte trilling
    this.camSmoothX += (car.position.x * 0.55 - this.camSmoothX) * Math.min(1, dt * 4);
    const shake = Math.min(1, Math.max(0, (speed - 50) / 220)) * 0.07;
    this.camera.position.x = this.camSmoothX + Math.sin(this.time * 29) * shake;
    this.camera.position.y = 5.4 + Math.sin(this.time * 2) * 0.05 + Math.sin(this.time * 37) * shake;
    this.camera.lookAt(car.position.x * 0.7, 1.4, -12);
    const speedNorm = Math.min(1, Math.max(0, (speed - 18) / 130));
    const targetFov = 60 + speedNorm * 12 + (this.boosting ? 6 : 0);
    if (Math.abs(this.camera.fov - targetFov) > 0.05) {
      this.camera.fov += (targetFov - this.camera.fov) * Math.min(1, dt * 5);
      this.camera.updateProjectionMatrix();
    }

    this.renderer.render(this.scene, this.camera);
  }

  onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

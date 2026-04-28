const audio = document.getElementById("bg-audio");
const audioToggle = document.getElementById("audio-toggle");
let audioPlaying = false;
document.addEventListener(
  "click",
  function s() {
    audio
      .play()
      .then(() => {
        audioPlaying = true;
        audioToggle.textContent = "🔊";
      })
      .catch(() => {});
  },
  { once: true },
);
audioToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  if (audioPlaying) {
    audio.pause();
    audioToggle.textContent = "🔇";
    audioPlaying = false;
  } else {
    audio.play();
    audioToggle.textContent = "🔊";
    audioPlaying = true;
  }
});
window.addEventListener("load", () =>
  setTimeout(
    () => document.getElementById("loader").classList.add("hidden"),
    1500,
  ),
);

const canvas = document.getElementById("synth-canvas");
const ctx = canvas.getContext("2d");
let W, H;
function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener("resize", resize);

let speed = 2,
  steer = 0,
  miles = 0,
  raining = false,
  neonSigns = true;
let gridOffset = 0;
const buildings = [];
const raindrops = [];
const stars = [];

for (let i = 0; i < 150; i++)
  stars.push({
    x: Math.random() * 2000 - 500,
    y: Math.random() * H * 0.4,
    size: Math.random() * 2,
    twinkle: Math.random() * Math.PI * 2,
  });

class Building {
  constructor(side, z) {
    this.side = side;
    this.z = z || 1;
    this.width = 40 + Math.random() * 80;
    this.height = 60 + Math.random() * 200;
    this.windows = [];
    const cols = Math.floor(this.width / 20);
    const rows = Math.floor(this.height / 25);
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) {
        this.windows.push({
          r,
          c,
          lit: Math.random() > 0.4,
          color:
            Math.random() > 0.5
              ? "#FF006E"
              : Math.random() > 0.5
                ? "#8338EC"
                : "#06D6A0",
        });
      }
    this.neonText = [
      "CYBER",
      "NEON",
      "RETRO",
      "WAVE",
      "CAFE",
      "BAR",
      "CLUB",
      "ARCADE",
    ][Math.floor(Math.random() * 8)];
    this.neonColor = ["#FF006E", "#8338EC", "#06D6A0", "#FFBE0B"][
      Math.floor(Math.random() * 4)
    ];
  }
}

for (let i = 0; i < 30; i++) {
  buildings.push(new Building("left", 0.1 + i * 0.06));
  buildings.push(new Building("right", 0.1 + i * 0.06));
}

function drawSun() {
  const sunY = H * 0.42;
  const sunR = 80;
  const grad = ctx.createRadialGradient(W / 2, sunY, 0, W / 2, sunY, sunR * 2);
  grad.addColorStop(0, "#FFBE0B");
  grad.addColorStop(0.3, "#FF006E");
  grad.addColorStop(0.6, "#8338EC");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#FFBE0B";
  ctx.beginPath();
  ctx.arc(W / 2, sunY, sunR, Math.PI, 0);
  ctx.fill();
  for (let i = 0; i < 8; i++) {
    const ly = sunY - sunR + i * ((sunR * 2) / 8);
    if (ly < sunY) {
      ctx.fillStyle = "#0D0221";
      ctx.fillRect(0, ly, W, 3);
    }
  }
}

function drawGrid() {
  const vpx = W / 2 + steer * 50;
  const vpy = H * 0.55;
  ctx.strokeStyle = "rgba(255,0,110,0.4)";
  ctx.lineWidth = 1;
  for (let i = -20; i <= 20; i++) {
    const x = vpx + i * 60;
    ctx.beginPath();
    ctx.moveTo(vpx, vpy);
    ctx.lineTo(x < vpx ? 0 : x > vpx ? W : vpx, H);
    ctx.stroke();
  }
  for (let i = 0; i < 30; i++) {
    const t = ((i * 40 + gridOffset) % 600) / 600;
    const y = vpy + (H - vpy) * Math.pow(t, 0.7);
    ctx.strokeStyle = `rgba(131,56,236,${0.1 + t * 0.3})`;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
}

function drawBuildings() {
  buildings.forEach((b) => {
    const perspective = 1 / (b.z + 0.01);
    const bw = b.width * perspective * 0.5;
    const bh = b.height * perspective * 0.5;
    const horizon = H * 0.55;
    const bx =
      b.side === "left"
        ? W / 2 - 150 * perspective - bw + steer * perspective * 20
        : W / 2 + 150 * perspective + steer * perspective * 20;
    const by = horizon - bh + (H - horizon) * (1 - perspective) * 0.1;
    if (bx + bw < -100 || bx > W + 100 || bh < 3) return;
    ctx.fillStyle = `rgba(13,2,33,${0.7 + perspective * 0.3})`;
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = `rgba(255,0,110,${perspective * 0.3})`;
    ctx.strokeRect(bx, by, bw, bh);
    if (bw > 15) {
      const cols = Math.floor(bw / (8 + bw * 0.05));
      const rows = Math.floor(bh / (10 + bh * 0.03));
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) {
          const wIdx = r * cols + c;
          if (wIdx < b.windows.length && b.windows[wIdx].lit) {
            const wx = bx + 3 + c * (bw / cols);
            const wy = by + 3 + r * (bh / rows);
            const ws = Math.max(2, (bw / cols) * 0.6);
            ctx.fillStyle = b.windows[wIdx].color + "88";
            ctx.fillRect(wx, wy, ws, ws * 1.2);
          }
        }
    }
    if (neonSigns && bw > 25 && perspective > 0.3) {
      ctx.save();
      ctx.font = `${Math.max(6, bw * 0.15)}px 'Press Start 2P', monospace`;
      ctx.fillStyle = b.neonColor;
      ctx.shadowColor = b.neonColor;
      ctx.shadowBlur = 15;
      ctx.fillText(b.neonText, bx + 3, by - 5);
      ctx.restore();
    }
  });
}

function drawCar() {
  const cx = W / 2 + steer * 30;
  const cy = H - 80;
  ctx.fillStyle = "#0D0221";
  ctx.beginPath();
  ctx.moveTo(cx - 30, cy);
  ctx.lineTo(cx - 20, cy - 15);
  ctx.lineTo(cx + 20, cy - 15);
  ctx.lineTo(cx + 30, cy);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "#FF006E";
  ctx.lineWidth = 2;
  ctx.stroke();
  const hlGrad = ctx.createRadialGradient(
    cx - 15,
    cy - 5,
    0,
    cx - 15,
    cy - 5,
    150,
  );
  hlGrad.addColorStop(0, "rgba(255,190,11,0.15)");
  hlGrad.addColorStop(1, "transparent");
  ctx.fillStyle = hlGrad;
  ctx.fillRect(cx - 165, cy - 155, 300, 150);
  const hlGrad2 = ctx.createRadialGradient(
    cx + 15,
    cy - 5,
    0,
    cx + 15,
    cy - 5,
    150,
  );
  hlGrad2.addColorStop(0, "rgba(255,190,11,0.15)");
  hlGrad2.addColorStop(1, "transparent");
  ctx.fillStyle = hlGrad2;
  ctx.fillRect(cx - 135, cy - 155, 300, 150);
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = `rgba(255,0,110,${0.3 - i * 0.08})`;
    ctx.beginPath();
    ctx.arc(
      cx - 20 + Math.random() * 4,
      cy + 5 + i * 8,
      3 + Math.random() * 3,
      0,
      Math.PI * 2,
    );
    ctx.fill();
  }
}

function drawRain() {
  if (!raining) return;
  ctx.strokeStyle = "rgba(79,195,247,0.3)";
  ctx.lineWidth = 1;
  for (let i = raindrops.length; i < 200; i++)
    raindrops.push({
      x: Math.random() * W,
      y: Math.random() * H,
      speed: 8 + Math.random() * 12,
      len: 10 + Math.random() * 20,
    });
  raindrops.forEach((d) => {
    ctx.beginPath();
    ctx.moveTo(d.x, d.y);
    ctx.lineTo(d.x - 1, d.y + d.len);
    ctx.stroke();
    d.y += d.speed;
    d.x -= 0.5;
    if (d.y > H) {
      d.y = -d.len;
      d.x = Math.random() * W;
    }
  });
}

function drawStars() {
  stars.forEach((s) => {
    s.twinkle += 0.02;
    const a = 0.3 + Math.sin(s.twinkle) * 0.3;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });
}

function animate() {
  requestAnimationFrame(animate);
  ctx.fillStyle = "#0D0221";
  ctx.fillRect(0, 0, W, H);
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.55);
  skyGrad.addColorStop(0, "#050110");
  skyGrad.addColorStop(0.5, "#1A0533");
  skyGrad.addColorStop(1, "#3D1155");
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H * 0.56);
  drawStars();
  drawSun();
  drawGrid();
  drawBuildings();
  drawCar();
  drawRain();
  gridOffset += speed;
  miles += speed * 0.001;
  buildings.forEach((b) => {
    b.z -= speed * 0.002;
    if (b.z < 0.05) {
      b.z = 1.8;
      b.height = 60 + Math.random() * 200;
    }
  });
  steer *= 0.95;
  document.getElementById("speed-val").textContent = Math.round(speed * 30);
  document.getElementById("miles-val").textContent = miles.toFixed(1);
}

const keys = {};
document.addEventListener("keydown", (e) => {
  keys[e.key] = true;
  if (e.key === "r" || e.key === "R") {
    raining = !raining;
    document.getElementById("rain-btn").classList.toggle("active");
  }
  if (e.key === "n" || e.key === "N") {
    neonSigns = !neonSigns;
    document.getElementById("neon-btn").classList.toggle("active");
  }
  if (e.key === " ") {
    const honk = new AudioContext();
    const o = honk.createOscillator();
    o.frequency.value = 400;
    o.connect(honk.destination);
    o.start();
    o.stop(honk.currentTime + 0.3);
  }
});
document.addEventListener("keyup", (e) => (keys[e.key] = false));

function handleInput() {
  requestAnimationFrame(handleInput);
  if (keys["ArrowUp"] || keys["w"]) speed = Math.min(10, speed + 0.05);
  if (keys["ArrowDown"] || keys["s"]) speed = Math.max(0.5, speed - 0.05);
  if (keys["ArrowLeft"] || keys["a"]) steer = Math.max(-3, steer - 0.1);
  if (keys["ArrowRight"] || keys["d"]) steer = Math.min(3, steer + 0.1);
}
handleInput();

document.getElementById("rain-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  raining = !raining;
  e.target.classList.toggle("active");
});
document.getElementById("neon-btn").addEventListener("click", (e) => {
  e.stopPropagation();
  neonSigns = !neonSigns;
  e.target.classList.toggle("active");
});

let touchStartX = 0;
canvas.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
});
canvas.addEventListener("touchmove", (e) => {
  const dx = e.touches[0].clientX - touchStartX;
  steer = (dx / W) * 6;
  speed = Math.min(10, speed + 0.02);
});

if (window.DeviceOrientationEvent) {
  window.addEventListener("deviceorientation", (e) => {
    if (e.gamma !== null) steer = (e.gamma / 45) * 3;
  });
}

animate();

let sun;
let plants = [];

function setup() {
  createCanvas(800, 600);
  colorMode(HSB, 360, 100, 100);
  sun = new Sun();
}

function draw() {
  background(210, 30, 90);

  // 地面
  noStroke();
  fill(120, 10, 40);
  rect(0, height - 50, width, 50);

  sun.move();
  sun.display();

  // 更新/绘制
  for (let p of plants) p.leanToSun(sun);
  for (let p of plants) {
    p.grow(sun, plants);
    p.display();
  }
}

function mousePressed() {
  if (mouseY > height - 60) plants.push(new Plant(mouseX, height - 50));
}

/* ---------------- Sun ---------------- */
class Sun {
  constructor() {
    this.angle = PI / 4;
    this.intensity = 1.0;
    this.radius = 300;
  }
  move() {
    this.angle = map(sin(frameCount * 0.005), -1, 1, PI / 6, (5 * PI) / 6);
  }
  getPos() {
    const x = width / 2 + this.radius * cos(this.angle);
    const y = height / 2 - this.radius * sin(this.angle);
    return createVector(x, y);
  }
  dirVector() {
    return createVector(-cos(this.angle), sin(this.angle)).normalize();
  }
  display() {
    const pos = this.getPos();
    noStroke();
    fill(50, 100, 100);
    circle(pos.x, pos.y, 40);
  }
}

/* ---------------- Plant ---------------- */
class Plant {
  constructor(x, y) {
    this.base = createVector(x, y);
    this.height = random(20, 40);
    this.angle = -PI / 2;
    this.lightReceived = 0;

    // 视觉/生长参数
    this.stemHue = 120;
    this.stemSat = 80;
    this.stemBri = 80;
    this.baseGrowth = 0.6;
    this.turnSpeed = 0.02;
    this.maxHeight = this.base.y - 200; // 不碰顶
    this.stemWidth = 6;
  }

  stemDir() {
    const theta = this.angle + PI / 2;
    return createVector(sin(theta), -cos(theta));
  }
  tipPos() {
    const dir = this.stemDir();
    return p5.Vector.add(this.base, p5.Vector.mult(dir, this.height));
  }

  leanToSun(sun) {
    const tip = this.tipPos();
    const sPos = sun.getPos();
    const targetAngle = atan2(sPos.y - tip.y, sPos.x - tip.x);
    this.angle = lerp(this.angle, targetAngle, this.turnSpeed);
  }

  grow(sun, others) {
    const sPos = sun.getPos();
    const sDir = sun.dirVector();
    const tip  = this.tipPos();

    const vST = p5.Vector.sub(tip, sPos);
    const along = vST.dot(sDir);
    let dirFactor = 0;
    if (along > 0) {
      const cosTheta = constrain(
        p5.Vector.dot(vST.copy().normalize(), sDir),
        0, 1
      );
      dirFactor = cosTheta;
    }

    // 遮挡
    let occlusion = 0;
    const occlWidth = 8;
    for (const other of others) {
      if (other === this) continue;
      const otherTip = other.tipPos();
      const vSO = p5.Vector.sub(otherTip, sPos);
      const t_j = vSO.dot(sDir);
      const t_i = along;
      if (t_j > 0 && t_j < t_i) {
        const dPerp = p5.Vector.sub(vSO, p5.Vector.mult(sDir, t_j)).mag();
        if (dPerp < occlWidth + this.stemWidth * 0.5) {
          const heightFactor = constrain(other.height / max(1, this.height), 0.6, 1.6);
          occlusion += 0.35 * heightFactor;
        }
      }
    }
    const occlFactor = exp(-occlusion);

    this.lightReceived = sun.intensity * dirFactor * occlFactor;

    // Logistic 生长：越高越慢
    const logistic = max(0, 1 - this.height / this.maxHeight);
    const growth = this.baseGrowth * this.lightReceived * logistic;
    this.height += growth;
    this.height = constrain(this.height, 0, this.maxHeight);

    this.stemBri = map(this.lightReceived, 0, 1, 50, 95, true);
    this.stemSat = map(this.lightReceived, 0, 1, 40, 85, true);
  }

  display() {
    const tip = this.tipPos();
    const dir = this.stemDir();

    // 茎
    stroke(this.stemHue, this.stemSat, this.stemBri);
    strokeWeight(this.stemWidth);
    line(this.base.x, this.base.y, tip.x, tip.y);

    // ===== 🌱 芽叶：数量随高度变化 =====
    // 叶子对数：高度从 30 → maxHeight 对应 1 → 6 对
    const pairs = constrain(floor(map(this.height, 30, this.maxHeight, 1, 3)), 1, 3);
    const baseGap = this.height / (pairs + 1); // 叶柄在茎上的间距
    const open = 0.45; // 左右张开角

    // 茎的法向量（左右）
    const leftN  = createVector(-dir.y, dir.x);
    const rightN = createVector(dir.y, -dir.x);

    noStroke();
    const leafHue = 120;
    const leafSat = clamp(this.stemSat + 10, 0, 100);
    const leafBri = clamp(this.stemBri + 8, 0, 100);
    fill(leafHue, leafSat, leafBri);

    for (let i = 1; i <= pairs; i++) {
      // 叶子沿茎的位置（从顶端往下）
      const attachDist = baseGap * i;
      const anchor = p5.Vector.sub(tip, p5.Vector.mult(dir, attachDist));

      // 叶片尺寸随整体高度轻微增大
      const leafLen = constrain(map(this.height, 30, this.maxHeight, 14, 28), 12, 28);
      const leafWid = leafLen * 0.55;

      // 左叶（🌱泪滴/芽形）
      drawSproutLeaf(anchor, dir, -open, leafLen, leafWid, leftN);

      // 右叶
      drawSproutLeaf(anchor, dir, +open, leafLen, leafWid, rightN);
    }

    // 顶芽
    noStroke();
    fill(leafHue, leafSat, clamp(leafBri + 5, 0, 100));
    circle(tip.x, tip.y, 12);
  }
}

/* --------- 🌱 叶片绘制（芽/泪滴形） ---------
   anchor: 叶柄锚点
   dir    : 茎方向（单位向量）
   open   : 张开角（左右 ±）
   len/w  : 叶长/叶宽
   sideN  : 左右法向，用于轻微外移
------------------------------------------------ */
function drawSproutLeaf(anchor, dir, open, len, wid, sideN) {
  // 叶柄稍微向外偏移一点点，使两片不重叠
  const offset = p5.Vector.add(anchor, p5.Vector.mult(sideN, 0.2 * wid));

  // 叶子的朝向：围绕茎方向微微张开
  const ang = atan2(dir.y, dir.x) + PI + open;

  push();
  translate(offset.x, offset.y);
  rotate(ang);

  // 芽形（泪滴）：用 4 段 bezier 形成圆润的尖头+饱满叶身
  beginShape();
  // 基点（靠近茎）
  vertex(0, 0);
  // 左半边
  bezierVertex(-wid * 0.9, -len * 0.15,  -wid, -len * 0.55,  0, -len);
  // 右半边
  bezierVertex( wid, -len * 0.55,  wid * 0.9, -len * 0.15,  0, 0);
  endShape(CLOSE);
  pop();
}

/* ---------------- utils ---------------- */
function clamp(v, a, b) { return max(a, min(b, v)); }

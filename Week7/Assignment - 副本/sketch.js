let SHOW_LIGHT = true;   // 显示太阳→植物的基准光线
let SHOW_SHADOW = true;  // 显示阴影面（半影/本影）

let sun;
let plants = [];

function keyPressed(){
  if (key === 'l' || key === 'L') SHOW_LIGHT = !SHOW_LIGHT;
  if (key === 's' || key === 'S') SHOW_SHADOW = !SHOW_SHADOW;
}

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
    this.stemHue   = 120;
    this.stemSat   = 80;
    this.stemBri   = 80;
    this.baseGrowth = 0.6;
    this.turnSpeed  = 0.02;
    this.maxHeight  = this.base.y - 200; // 不碰顶
    this.stemWidth  = 6;
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

    // 朝向因素：与光线夹角越小，光越强
    let dirFactor = 0;
    if (along > 0) {
      const cosTheta = constrain(
        p5.Vector.dot(vST.copy().normalize(), sDir), 0, 1
      );
      dirFactor = cosTheta;
    }

    // 可选：基准光线（太阳→顶端）
    if (SHOW_LIGHT) {
      push();
      stroke(50, 100, 100, 0.8 * 100);
      strokeWeight(2);
      line(sPos.x, sPos.y, tip.x, tip.y);
      pop();
    }

    // === 遮挡（面积式） ===
    let occlusion = 0;
    const baseWidth = 8; // 遮挡者“有效宽度”基准，可微调

    for (const other of others) {
      if (other === this) continue;

      const otherTip = other.tipPos();

      // 其它植物与本植物各自在光线方向上的投影
      const vSO = p5.Vector.sub(otherTip, sPos);
      const t_j = vSO.dot(sDir); // 遮挡者距离太阳的“光程”
      const t_i = along;         // 本植物距离太阳的“光程”

      // 只考虑“在前面的遮挡者”
      if (t_j <= 0 || t_j >= t_i) continue;

      // 构建以遮挡者为顶点的光锥楔形
      const effR = baseWidth + other.stemWidth * 0.5;
      const cone = makeShadowCone(sPos, otherTip, effR);

      // 判断本植物顶端是否落入该楔形内
      const inside = pointInWedge(sPos, cone.r1, cone.r2, tip);

      if (inside) {
        // 与中心光线（S->otherTip）越对齐，遮挡越重
        const centerDir = p5.Vector.sub(otherTip, sPos).normalize();
        const cosOff    = p5.Vector.dot(centerDir, vST.copy().normalize());
        const offFactor = map(cosOff, 0.75, 1, 0.15, 1, true);

        // 高矮影响遮挡力度
        const heightFactor = constrain(other.height / max(1, this.height), 0.6, 1.8);
        occlusion += 0.45 * heightFactor * offFactor;

        // 面积可视化：只画到本植物的光程位置（避免铺满画布）
        if (SHOW_SHADOW) {
          const E1 = p5.Vector.add(sPos, p5.Vector.mult(cone.r1, t_i));
          const E2 = p5.Vector.add(sPos, p5.Vector.mult(cone.r2, t_i));

          // 半影：浅色
          noStroke();
          fill(50, 100, 100, 0.12 * 100);
          triangle(sPos.x, sPos.y, E1.x, E1.y, E2.x, E2.y);

          // 本影：更窄更深一层
          const core = makeShadowCone(sPos, otherTip, effR * 0.55);
          const C1   = p5.Vector.add(sPos, p5.Vector.mult(core.r1, t_i));
          const C2   = p5.Vector.add(sPos, p5.Vector.mult(core.r2, t_i));
          fill(50, 100, 100, 0.20 * 100);
          triangle(sPos.x, sPos.y, C1.x, C1.y, C2.x, C2.y);
        }
      }
    }

    const occlFactor = exp(-occlusion);
    this.lightReceived = sun.intensity * dirFactor * occlFactor;

    // Logistic 生长：越高越慢
    const logistic = max(0, 1 - this.height / this.maxHeight);
    const growth   = this.baseGrowth * this.lightReceived * logistic;
    this.height += growth;
    this.height = constrain(this.height, 0, this.maxHeight);

    // 颜色随光量变化
    this.stemBri = map(this.lightReceived, 0, 1, 50, 95, true);
    this.stemSat = map(this.lightReceived, 0, 1, 40, 85, true);

    // 可选：把“有效光段”整体用透明度高亮
    if (SHOW_LIGHT && along > 0) {
      const alpha = map(occlusion, 0, 2.0, 1, 0.25, true);
      push();
      stroke(50, 100, 100, alpha * 100);
      strokeWeight(5);
      line(sPos.x, sPos.y, tip.x, tip.y);
      pop();
    }
  }

  display() {
    const tip = this.tipPos();
    const dir = this.stemDir();

    // 茎
    stroke(this.stemHue, this.stemSat, this.stemBri);
    strokeWeight(this.stemWidth);
    line(this.base.x, this.base.y, tip.x, tip.y);

    // ===== 🌱 芽叶：数量随高度变化 =====
    // 叶子对数：高度从 30 → maxHeight 映射 1 → 3 对
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
  vertex(0, 0);
  bezierVertex(-wid * 0.9, -len * 0.15, -wid, -len * 0.55, 0, -len);
  bezierVertex( wid, -len * 0.55,  wid * 0.9, -len * 0.15, 0, 0);
  endShape(CLOSE);
  pop();
}

/* ---------------- 阴影构造 & 判定 ---------------- */
// 生成从太阳 S 指向遮挡点 P、半径 r 的“光锥楔形”
function makeShadowCone(S, P, r){
  const dir = p5.Vector.sub(P, S).normalize();
  let n = createVector(-dir.y, dir.x); // 左法向

  const B1 = p5.Vector.add(P, p5.Vector.mult(n, r)); // 左边界经过点
  const B2 = p5.Vector.sub(P, p5.Vector.mult(n, r)); // 右边界经过点

  let r1 = p5.Vector.sub(B1, S).normalize();
  let r2 = p5.Vector.sub(B2, S).normalize();

  // 确保 r1→r2 为逆时针（便于 inside 判定）
  if (r1.x * r2.y - r1.y * r2.x < 0) { const tmp = r1; r1 = r2; r2 = tmp; }

  return { r1, r2 };
}

// 判断点 T 是否处于扇形（S, r1, r2）内（包含边界）
function pointInWedge(S, r1, r2, T){
  const rT = p5.Vector.sub(T, S).normalize();
  const c12 = r1.x * r2.y - r1.y * r2.x; // >0 代表 r1→r2 逆时针
  let c1T = r1.x * rT.y - r1.y * rT.x;
  let cT2 = rT.x * r2.y - rT.y * r2.x;
  // 若顺时针，统一取反
  if (c12 < 0){ c1T = -c1T; cT2 = -cT2; }
  return c1T >= 0 && cT2 >= 0;
}

/* ---------------- utils ---------------- */
function clamp(v, a, b) { return max(a, min(b, v)); }

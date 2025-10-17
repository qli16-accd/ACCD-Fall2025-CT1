let posX, posY;
let velX = 0;
let velY = 0;
let noiseOffsetX = 0;
let noiseOffsetY = 1000;
let img;

let dragging = false;
let offsetX, offsetY;

function preload() {
  img = loadImage("pics/image11.jpg");
}

function setup() {
  createCanvas(900, 900);
  colorMode(HSB, 360, 100, 100);
  posX = width / 2;
  posY = height / 2;
}

function draw() {
  background(210, 20, 95, 0.05);

  // 🌊 如果没有拖动，用噪声驱动小幅运动
  if (!dragging) {
    let noiseVX = map(noise(noiseOffsetX), 0, 1, -0.3, 0.3);
    let noiseVY = map(noise(noiseOffsetY), 0, 1, -0.3, 0.3);
    noiseOffsetX += 0.005;
    noiseOffsetY += 0.005;

    velX += noiseVX * 0.2;
    velY += noiseVY * 0.2;

    posX += velX;
    posY += velY;
  }

  // ⚡ 边缘反弹逻辑
  if (posX - 60 < 0) {
    posX = 60;
    velX *= -1;
  }
  if (posX + 60 > width) {
    posX = width - 60;
    velX *= -1;
  }
  if (posY - 60 < 0) {
    posY = 60;
    velY *= -1;
  }
  if (posY + 60 > height) {
    posY = height - 60;
    velY *= -1;
  }

  // ⚙️ 摩擦系数（让星星慢慢停下来）
  velX *= 0.98;
  velY *= 0.98;

  // 🌄 背景图
  tint(0, 0, 100, 15);
  image(img, 0, 0, width, height);

  // 🌈 星星颜色和大小（缓慢变化）
  let hue = map(sin(frameCount * 0.01), -1, 1, 180, 320);
  let angle = frameCount * 0.005;
  let size = 60 + sin(frameCount * 0.01) * 6;

  // 🌟 白描边星星
  push();
  translate(posX, posY);
  rotate(angle);
  stroke(0, 0, 100);
  strokeWeight(2);
  fill(hue, 80, 100, 0.9);
  drawStar(0, 0, size * 0.4, size, 5);
  pop();

  // 💫 发光拖尾
  noStroke();
  fill(hue, 50, 100, 0.05);
  ellipse(posX, posY, size * 3);
}

// ⭐ 绘制星星函数
function drawStar(x, y, radius1, radius2, npoints) {
  let angle = TWO_PI / npoints;
  let halfAngle = angle / 2.0;
  beginShape();
  for (let a = 0; a < TWO_PI; a += angle) {
    let sx = x + cos(a) * radius2;
    let sy = y + sin(a) * radius2;
    vertex(sx, sy);
    sx = x + cos(a + halfAngle) * radius1;
    sy = y + sin(a + halfAngle) * radius1;
    vertex(sx, sy);
  }
  endShape(CLOSE);
}

// 🖱️ 鼠标拖拽控制
function mousePressed() {
  let d = dist(mouseX, mouseY, posX, posY);
  if (d < 60) {
    dragging = true;
    offsetX = posX - mouseX;
    offsetY = posY - mouseY;
    velX = 0;
    velY = 0;
  }
}

function mouseDragged() {
  if (dragging) {
    posX = mouseX + offsetX;
    posY = mouseY + offsetY;
  }
}

function mouseReleased() {
  if (dragging) {
    dragging = false;
    velX = movedX * 0.4;
    velY = movedY * 0.4;
  }
}

let posX, posY;
let noiseOffsetX = 0;
let noiseOffsetY = 1000;
let img, sound;
let volumeSlider, muteButton; // 🎚️ 新增音量控制元件
let isMuted = false;

function preload() {
  img = loadImage("pics/image11.jpg");
  sound = loadSound("BGM/chiikawa.mp3");
}

function setup() {
  createCanvas(900, 900);
  colorMode(HSB, 360, 100, 100);
  posX = width / 2;
  posY = height / 2;

  sound.loop();
  sound.setVolume(0.5); // 默认音量中等

  // 🎚️ 创建音量滑块
  volumeSlider = createSlider(0, 1, 0.5, 0.01);
  volumeSlider.position(20, height + 20);
  volumeSlider.style('width', '200px');

  // 🔇 创建静音按钮
  muteButton = createButton('🔇 Mute');
  muteButton.position(240, height + 18);
  muteButton.mousePressed(toggleMute);
}

function draw() {
  // ✨ 拖尾背景（透明度调小一些）
  background(210, 20, 95, 0.05);

  // 噪声生成非线性速度
  let velX = map(noise(noiseOffsetX), 0, 1, -2.5, 2.5);
  let velY = map(noise(noiseOffsetY), 0, 1, -2.5, 2.5);
  noiseOffsetX += 0.008;
  noiseOffsetY += 0.008;

  posX += velX;
  posY += velY;

  // 边界循环
  if (posX < -50) posX = width + 50;
  if (posX > width + 50) posX = -50;
  if (posY < -50) posY = height + 50;
  if (posY > height + 50) posY = -50;

  // 背景图（轻微叠加）
  tint(0, 0, 100, 15);
  image(img, 0, 0, width, height);

  // 星星颜色与大小变化（放慢节奏）
  let hue = map(sin(frameCount * 0.01), -1, 1, 180, 320);
  let angle = frameCount * 0.005;
  let size = 60 + sin(frameCount * 0.01) * 6;

  // 🌟 白色描边 + 彩色星星
  push();
  translate(posX, posY);
  rotate(angle);
  stroke(0, 0, 100);
  strokeWeight(2);
  fill(hue, 80, 100, 0.9);
  drawStar(0, 0, size * 0.4, size, 5);
  pop();

  // 🌠 发光拖尾
  noStroke();
  fill(hue, 50, 100, 0.05);
  ellipse(posX, posY, size * 3);

  // 🎚️ 动态更新音量
  if (!isMuted) {
    sound.setVolume(volumeSlider.value());
  }
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

// 🔇 静音切换函数
function toggleMute() {
  if (isMuted) {
    sound.setVolume(volumeSlider.value());
    muteButton.html('🔇 Mute');
  } else {
    sound.setVolume(0);
    muteButton.html('🔊 Unmute');
  }
  isMuted = !isMuted;
}

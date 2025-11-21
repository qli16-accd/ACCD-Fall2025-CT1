let classifier;
let imageModelURL = 'https://teachablemachine.withgoogle.com/models/G55tDWd2Dq/';

let handPose;
let hands = [];
let thumbTip, indexTip;

let video;
let label = "";

let heartParticles = [];
let prevMid = null; // 上一帧手指中点，用来算速度

function preload() {
  classifier = ml5.imageClassifier(imageModelURL + 'model.json');
  handPose   = ml5.handPose({ flipped: true });
}

function setup() {
  createCanvas(640, 480);

  // 摄像头（翻转，和镜子一样）
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();

  // 启动分类和手势识别
  classifyVideo();
  handPose.detectStart(video, gotHands);
}

function draw() {
  background(0);
  image(video, 0, 0, width, height);

  // 显示类别标签
  fill(255);
  noStroke();
  textSize(16);
  textAlign(CENTER);
  text(label, width / 2, height - 8);

  // 如果有检测到手
  if (hands.length > 0 && thumbTip && indexTip) {
    // 手指圆点 —— 白色
    fill(255);
    noStroke();
    circle(thumbTip.x, thumbTip.y, 12);
    circle(indexTip.x, indexTip.y, 12);

    // 当前是比心的类别
    if (label === "Heart") {
      // 手指之间的中点
      let midX = (thumbTip.x + indexTip.x) / 2;
      let midY = (thumbTip.y + indexTip.y) / 2;

      // 计算手指移动速度，用来产生惯性
      let vx = 0;
      let vy = 0;
      let speed = 0;
      if (prevMid) {
        vx = midX - prevMid.x;
        vy = midY - prevMid.y;
        speed = sqrt(vx * vx + vy * vy);
      }
      prevMid = createVector(midX, midY);

      // 主爱心大小随速度轻微变化
      let mainSize = 60 + speed * 0.8;
      drawHeart(midX, midY - 20, mainSize);

      // 生成一颗粒子爱心，带着手指的速度飞出
      heartParticles.push(
        new HeartParticle(
          midX,
          midY - 20,
          vx * 0.4,
          vy * 0.4,
          26 + speed * 0.3
        )
      );
    } else {
      // 没在比心时，不再用速度，清空上一帧中点
      prevMid = null;
    }
  } else {
    // 没有手时，也清空上一帧中点
    prevMid = null;
  }

  // 更新 & 绘制所有粒子爱心
  for (let i = heartParticles.length - 1; i >= 0; i--) {
    heartParticles[i].update();
    heartParticles[i].display();
    if (heartParticles[i].isDead()) {
      heartParticles.splice(i, 1);
    }
  }
}

// ---------- 连续分类当前视频帧 ----------
function classifyVideo() {
  classifier.classify(video, gotResult);
}

// 分类结果回调
function gotResult(results, error) {
  if (error) {
    console.error(error);
    return;
  }
  label = results[0].label;
  classifyVideo();
}

// handPose 结果回调
function gotHands(results) {
  hands = results;
  if (hands.length > 0) {
    let hand = hands[0];
    thumbTip = hand.thumb_tip;
    indexTip = hand.index_finger_tip;
  }
}

// ============== 爱心粒子类 ==============
class HeartParticle {
  constructor(x, y, vx, vy, size) {
    this.pos = createVector(x, y);
    // 初速度：带一点手指的速度，再稍微往上飘
    this.vel = createVector(vx, vy - 1.8);
    this.size = size;
    this.life = 1.0; // 1 → 0 渐渐消失
    this.rot = random(-0.4, 0.4); // 初始旋转
  }

  update() {
    this.pos.add(this.vel);
    // 空气阻力 + 轻微向上飘
    this.vel.mult(0.95);
    this.vel.y -= 0.03;

    this.life -= 0.015;
    this.life = max(this.life, 0);
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);

    // 根据水平速度稍微摆动一下
    let extraRot = this.vel.x * 0.05;
    rotate(this.rot + extraRot);

    // 透明度随生命值衰减
    let alpha = this.life * 255;
    drawHeart(0, 0, this.size, 0, alpha);
    pop();
  }

  isDead() {
    return this.life <= 0;
  }
}

// ============== 爱心绘制函数（更圆润） ==============
// x, y 是爱心中心位置，size 是整体大小
// rotation（可选）  alpha（可选）
function drawHeart(x, y, size, rotation = 0, alpha = 255) {
  push();
  translate(x, y);
  rotate(rotation);

  noStroke();
  fill(255, 140, 190, alpha); // 粉色 + 透明度

  // 两个圆 + 一个三角形 构成圆润爱心
  const r = size * 0.3;

  // 上面两瓣圆
  ellipse(-r, -r * 0.4, r * 2, r * 2);
  ellipse( r, -r * 0.4, r * 2, r * 2);

  // 底部三角形尖
  beginShape();
  vertex(-r * 2, -r * 0.1);
  vertex(0,      size * 0.65);
  vertex(r * 2, -r * 0.1);
  endShape(CLOSE);

  pop();
}

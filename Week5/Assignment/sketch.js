let angleSlider;
let swingSlider;

function setup() {
  createCanvas(600, 600);
  angleMode(RADIANS);
  colorMode(HSB, 360, 100, 100);
  noStroke();

  createP("Adjust Arc Angle:");
  angleSlider = createSlider(0, PI / 4, PI / 8, 0.01); 
  swingSlider = createSlider(0, 1, 0.1, 0.01); 
}

function draw() {
  background(0);
  translate(width / 2, height / 2);

  let t = millis() * 0.001;
  let arcOffset = angleSlider.value();

  for (let i = 0; i < 12; i++) {
    let radius = 60 + i * 20;
    let arcWidth = 20;

    let swing = sin(t * 1.5 - i * 0.25) * swingSlider.value();

    let startAngle = PI + arcOffset * 0.3 + swing;
    let endAngle = TWO_PI - arcOffset * 0.3 - swing;

    let hueValue = (i * 30) % 360;

    stroke(hueValue, 90, 100);
    strokeWeight(arcWidth);
    strokeCap(ROUND);
    noFill();
    arc(0, 0, radius * 2, radius * 2, startAngle, endAngle);
  }

  noStroke();
  fill(0);
  circle(0, 0, 100);
}

let thisCanvas = document.getElementById("starfield")
let posX = []
let posY = []
let size = []
let numStars = 800

function setup() {
  createCanvas(600, 600);
  colorMode(HSB, 360, 100, 100);

  for(let i = 0; i < numStars; i ++){
    posX.push(random(width))
    posY[i] = random(height)
    size.push(random(2, 10))
  }
}

function draw() {
  background(0, 0, 0)
  for(let i = 0; i < numStars; i++){
    fill(0, 0, 100)
    circle(posX[i], posY[i], random(size[i], size[i] + 1))
  }
}

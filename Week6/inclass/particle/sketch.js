let particles = []
let PPF = 10

let gravity

function setup() {
  createCanvas(400, 600);
  colorMode(HSB, TWO_PI, 1, 1)
  particles.push(new Particle(random(width),0))
  
  gravity = createVector(0, 0.3)
}

function draw() {
  background(0);
  
  for(let i = 0; i < PPF; i++){
    particles.push(new Particle(random(width),0))
  }
//   if(random() < 0.1){ 
//     particles.push(new Particle(random(width),0))
// }
  console.log(particles.length)
  particles.forEach((p, i)=>{
    if(!p.inBounds()){
      particles.splice(i, 1)
    }
    p.applyForce(gravity)
    p.move()
    p.display()
  })
}
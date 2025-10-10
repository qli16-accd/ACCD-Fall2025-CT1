let cBox = document.getElementById("colorBox");
let colorBtn = document.getElementById("changeColor")
let imgBox = document.getElementById("chiikawaImage")
let imageBtn = document.getElementById("ToggleImage!")

let assignRandomColor = function()
{
    let rComp = 255 * Math.random()
    let gComp = 255 * Math.random()
    let bComp = 255 * Math.random()
    cBox.style.backgroundColor = "rgba("+ rComp +", "+ gComp +", "+ bComp +")"
}

const toggleChiikawaImage = () =>
{
    console.log(imgBox.src)
    if(imgBox.src.includes("chiikawa"))
    {
        imgBox.src = "pics/chiikawa1.png"
    }
}

imageBtn.addEventListener("click", toggleChiikawaImage)
colorBtn.addEventListener("click", assignRandomColor)
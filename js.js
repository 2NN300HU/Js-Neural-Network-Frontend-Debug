let weight1 = new Float64Array(784 * 300);
let bias1 = new Float64Array(300);
let weight2 = new Float64Array(300 * 10);
let bias2 = new Float64Array(10);
let input = new Array(784);
let temp1 = new Array(300);
let temp2 = new Array(10);

let isDrawing = false;

let isSlowMode = false;
const canvasSize = 560;
const realCanvasSize = 280;

document.getElementById("clear").addEventListener("click", clear);
const resultButton = document.getElementById("result");
resultButton.addEventListener("click", expectNumber);
const slowModeCheckBox = document.getElementById("slowMode");
slowModeCheckBox.addEventListener("click", slowMode);
const expect = document.getElementById("expect");
const canvas = document.getElementById("input");
const objectOutline = document.getElementById("detect")
const ctx = canvas.getContext("2d");
const ctx2 = objectOutline.getContext("2d");

const real = document.getElementById("real")
const ctx3 = real.getContext("2d")
clear();

let req = new XMLHttpRequest();
req.open('GET', "./settings.bin");
req.responseType = "arraybuffer";
req.onload = function () {
    if (req.status !== 200) {
        alert("Unexpected status code " + req.status);
        return false
    }
    let buffer = req.response;
    let dataview = new DataView(buffer);
    let off = 12;
    for (let i = 0; i < weight1.length; i++, off += 8) {
        weight1[i] = dataview.getFloat64(off);
    }
    for (let i = 0; i < bias1.length; i++, off += 8) {
        bias1[i] = dataview.getFloat64(off);
    }
    off += 8
    for (let i = 0; i < weight2.length; i++, off += 8) {
        weight2[i] = dataview.getFloat64(off);
    }
    for (let i = 0; i < bias2.length; i++, off += 8) {
        bias2[i] = dataview.getFloat64(off);
    }
}
req.send();

canvas.addEventListener("mousemove", onMouseMove);
document.addEventListener("mousedown", onMouseDown);
document.addEventListener("mouseup", onMouseUp);

function onMouseDown() {
    isDrawing = true;
}

function onMouseUp() {
    isDrawing = false;
}

function slowMode() {
    if (slowModeCheckBox.checked) {
        isSlowMode = true;
        resultButton.disabled = false;
    } else {
        isSlowMode = false;
        resultButton.disabled = true;
    }
}

function foward() {
    temp1.fill(0, 0, 300);
    for (let i = 0; i < 300; i++) {
        for (let j = 0; j < 784; j++) {
            temp1[i] += weight1[j * 300 + i] * input [j];
        }
        temp1[i] += bias1[i];
    }
    for (let i = 0; i < 300; i++) {
        if (temp1[i] < 0) {
            temp1[i] = 0;
        }
    }
    temp2.fill(0, 0, 10);
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 300; j++) {
            temp2[i] += weight2[j * 10 + i] * temp1 [j];
        }
        temp2[i] += bias2[i];
    }
    let maxLabel = 0;
    let max = temp2[0];
    for (let i = 1; i < 10; i++) {
        if (max < temp2[i]) {
            maxLabel = i;
            max = temp2[i];
        }
    }
    return maxLabel
}

function isRowEmpty(pixel, y) {
    if (y >= canvasSize) {
        return false;
    }
    for (let i = 0; i < canvasSize; i++) {
        if (pixel.data[4 * (y * canvasSize + i)] !== 0) {
            return false
        }
    }
    return true
}


function isColumnEmpty(pixel, x) {
    if (x >= canvasSize) {
        return false;
    }
    for (let i = 0; i < canvasSize; i++) {
        if (pixel.data[4 * (i * canvasSize + x)] !== 0) {
            return false
        }
    }
    return true
}

function drawReal() {
    ctx3.clearRect(0, 0, realCanvasSize, realCanvasSize)
    const blockSize = parseInt(realCanvasSize/28)
    for(let i = 0 ; i <28;i++){
        for(let j = 0 ; j < 28 ; j++){
            let tempPixel = 255 - parseInt(input[i*28+j]*255);
            if (tempPixel !=255){
                ctx3.fillStyle = "rgb("+tempPixel+","+tempPixel+","+tempPixel+")";
                ctx3.fillRect(j*blockSize,i*blockSize,blockSize,blockSize);
            }
        }
    }
}

function feed() {
    let pixel = ctx.getImageData(0, 0, canvasSize, canvasSize);
    let leftMargin = 0, rightMargin = 0, upperMargin = 0, underMargin = 0;
    while (isColumnEmpty(pixel, leftMargin)) {
        leftMargin++;
    }
    if (leftMargin === canvasSize) {
        return false;
    }
    while (isColumnEmpty(pixel, canvasSize - rightMargin - 1)) {
        rightMargin++;
    }
    while (isRowEmpty(pixel, upperMargin)) {
        upperMargin++;
    }
    while (isRowEmpty(pixel, canvasSize - underMargin - 1)) {
        underMargin++;
    }

    let objectSize = parseInt((Math.max(canvasSize - leftMargin - rightMargin, canvasSize - underMargin - upperMargin) - 1) / 28) * 28 + 28
    let temp = objectSize + leftMargin + rightMargin - canvasSize;
    leftMargin -= parseInt(temp / 2)
    rightMargin -= temp - parseInt(temp / 2)
    temp = objectSize + upperMargin + underMargin - canvasSize;
    upperMargin -= parseInt(temp / 2)
    underMargin -= temp - parseInt(temp / 2)

    if (leftMargin < 0) {
        leftMargin = 0;
    } else if (rightMargin < 0) {
        leftMargin += rightMargin
    }
    if (upperMargin < 0) {
        upperMargin = 0;
    } else if (underMargin < 0) {
        upperMargin += underMargin;
    }
    let blockSize = objectSize / 28
    ctx2.strokeStyle = "red"
    ctx2.clearRect(0, 0, canvasSize, canvasSize)
    ctx2.strokeRect(leftMargin, upperMargin, objectSize, objectSize);
    input.fill(0, 0, 784);
    for (let i = 0; i < objectSize; i++) {
        for (let j = 0; j < objectSize; j++) {
            input[Math.floor(i / blockSize) * 28 + Math.floor(j / blockSize)] += Math.floor(pixel.data[((i + upperMargin) * canvasSize + j + leftMargin) * 4] / 255);
        }
    }
    for (let i = 0; i < 784; i++) {
        input[i] /= blockSize * blockSize
    }
    drawReal()
    return true;
}

function expectNumber() {
    if (feed()) {
        expect.innerText = String(foward());
    }
}

function clear() {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvasSize, canvasSize);
    ctx2.clearRect(0, 0, canvasSize, canvasSize)
    ctx3.clearRect(0, 0, realCanvasSize, realCanvasSize)
}

function onMouseMove(e) {
    let x = e.offsetX;
    let y = e.offsetY;
    if (isDrawing) {
        ctx.beginPath();
        ctx.arc(x - 20, y - 20, 30, 0, Math.PI * 2);
        ctx.fillStyle = "white";
        ctx.fill();
        if (!isSlowMode) {
            expectNumber();
        }
    }
}

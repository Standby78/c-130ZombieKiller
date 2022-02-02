import { segments, planeSize, segmentSize } from '../constants/constants'
import Tree from '../objects/Tree'
import Zombie from '../objects/Zombie'

export default function testPath() {
    var canvas = document.getElementById("myCanvas");
    var canvasWidth = canvas.width;
    var canvasHeight = canvas.height;
    var ctx = canvas.getContext("2d");
    var canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

    
    // That's how you define the value of a pixel //
    function drawPixel (x, y, r, g, b, a) {
        var index = (x + y * canvasWidth) * 4;

        canvasData.data[index + 0] = r;
        canvasData.data[index + 1] = g;
        canvasData.data[index + 2] = b;
        canvasData.data[index + 3] = a;
    }
    // That's how you update the canvas, so that your //
    // modification are taken in consideration //
    function updateCanvas() {
        ctx.putImageData(canvasData, 0, 0);
    }
    console.log("path");
    const treesMap = [];
    const trees = 2000;
    const vertexArray = new Array(segments*segments).fill(0);
    const treeMap = new Array(segments*segments).fill(0);
    for(let i=0; i<trees; i++) {
        const tree = new Tree(vertexArray, treeMap);
        treesMap.push(tree);
    }

    let worldGrid = [];
    for(let i=0; i<treeMap.length; i +=segments) {
        worldGrid.push(treeMap.slice(i, i+segments))
    }

    console.log(worldGrid);
    //create Zombies
    const zombies = []
    const enemies = 1;
    for(let i=0; i< enemies; i++ ) {
        const zombie = new Zombie(vertexArray, worldGrid);
        zombies.push(zombie);
    }

    worldGrid.forEach((line, index) => {
        line.forEach((value, i) => {
            if(value!==0) {
                drawPixel(i, index, 255, 0, 0, 125)
            }
        })
    })
    zombies.forEach(zombie => {
        zombie.gridPath.forEach(value => {
            drawPixel(value[0], value[1], 0, 255, 0, 125)
        })
    })
    updateCanvas();
}
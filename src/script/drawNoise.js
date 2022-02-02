
export default function drawNoise() {
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

    const segments = 200
    const cx = segments/2;
    const cy = segments/2;
    const maxDist = Math.floor(Math.sqrt(cx*cx+cy*cy))
    for(let x = 0; x<segments; x++) {
        for(let z = 0; z<segments; z++) {
            // const y = Math.floor(simplex.noise(x*0.007, z*0.007)*segments+segments);
            const y = (Math.floor(Math.sqrt((cx-x)*(cx-x)+(cy-z)*(cy-z)))/maxDist)*116;
            drawPixel(x,z,y,y,y,255)
        }
    }
    updateCanvas();
}

import * as THREE from 'three';
import * as dat from 'dat.gui';
import Stats from 'stats.js';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import {Delaunay} from "d3-delaunay";
import Simplex from 'perlin-simplex';

import MouseEvents from './UserInteraction/MouseEventListeners'

import Tree from './objects/Tree';
import Zombie from './objects/Zombie'

const airplane = {
    distance: 300,
    height: 1500, //700 looks cool
    speed: 0.0008
};
const wireframe = false;
const planeSize = 7000;
const segments = 100;
const segmentSize = planeSize / segments;

// const direction = new THREE.Vector3(0, -1, 0);
function init() {
    // const raycaster = new THREE.Raycaster();
    // const mouse = new THREE.Vector2();

    const obstaclesMap = new Array(segments * segments).fill(0);

    let time = 0;
    const newPosition = new THREE.Vector3();
    const scene = new THREE.Scene();
    const fogcolor = new THREE.Color('lightblue');
    scene.background = fogcolor;
    scene.fog = THREE.Fog(fogcolor, 0.0025, 20)

    // create a camera, which defines where we're looking at.
    const camera = new THREE.PerspectiveCamera(32, window.innerWidth / window.innerHeight, 0.1, 12000);

    // create a render and set the size
    const renderer = new THREE.WebGLRenderer({ antialias: true});
    // renderer.setClearColorHex();
    renderer.setClearColor(new THREE.Color(0x002266, 1.0));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMapEnabled = true;
    // // show axes in the screen
    // const axes = new THREE.AxisHelper(200);
    // scene.add(axes);

    camera.position.set(airplane.distance*3, airplane.height, airplane.distance*3);
    camera.lookAt(scene.position);

    let heightMap = [];
    const simplex = new Simplex()
    for(let x = 0; x <= segments; x++) {
        for(let z = 0; z <= segments; z++) {
            const noise = Math.floor(simplex.noise(x * 0.017, z * 0.014) * 195); // brda 0.03/0.04
            let y = Math.floor(noise);
            heightMap[(x * segments) + z] = y;
        }
    }

    var planeGeometry = new THREE.PlaneBufferGeometry(planeSize, planeSize, segments-1, segments-1);
    const landVertices = planeGeometry.attributes.position.array;
    for(var i = 0, j = 2; i < landVertices.length; i++, j += 3) {
        landVertices[j] = heightMap[i];
    }
    // lonely house find top of hill calculation
    const cx = segments / 2;
    const cy = segments / 2;
    const scanWidth = 20;
    let maxY=-400;
    const coords = [];
    const coordsInArray = [];
    for(let x = cx - scanWidth / 2; x < (cx + scanWidth / 2); x++) {
        for(let y = cy - scanWidth / 2; y < (cy + scanWidth / 2); y++) {
            if(heightMap[x * segments + y] >= maxY) {
                maxY = heightMap[x * segments + y];
                coordsInArray[0] = [y, x];
                coords[0] = [(y * (planeSize / segments) - planeSize / 2), (x * (planeSize / segments) - planeSize / 2)];
            }
        }
    }
    // create road from house (+ 1 row offset) to border of map, taking into account the slope of the terrain

    // modify edge endpoint
    const edge = Math.round(Math.random()); // changing x or y?
    const randomOffset = Math.floor(Math.random() * (segments / 2));
    // define the direction, if over middle, go to the furthest edge, apply random offset
    const xEdge = coordsInArray[0][0] > (segments / 2) ? 0 : segments;
    const yEdge = coordsInArray[0][1] > (segments / 2) ? 0 : segments;
    const roadDestination = [xEdge, yEdge];
    roadDestination[edge] = roadDestination[edge] === 0 ? randomOffset : 100 - randomOffset;
    // roadDestination[x, y] holds the destination

    // analyze heightMap, 1 to segments -1, check rows with n -1, row + n - 1, if slope too steep
    // mark as non-traversable - 9.9. this doesnt work well, too many closed loops
    // create alghoritm that will have all slopes, and determine the smallest slope as the place to go?
    const roadSlopeArray =new Array(segments * segments).fill(0);
    for(let y = 0; y < segments - 2; y++) {
        for (let x = 1; x < segments - 2; x++) {
            const currentHeight = heightMap[y * segments + x];
            const maxSlope = Math.floor(currentHeight * 0.1);
            const nextRowAdjecentHeight = heightMap[(y + 1) * segments + x - 1];
            const nextRowHeight = heightMap[(y + 1) * segments + x];
            if(Math.abs(currentHeight - nextRowAdjecentHeight) > maxSlope) {
                roadSlopeArray[(y + 1) * segments + x - 1] = 1;
            }
            if(Math.abs(currentHeight - nextRowHeight) > maxSlope) {
                roadSlopeArray[(y + 1) * segments + x] = 1;
            }
        }
    }
    // too steep points arent road friendly, marked as "1"
    console.log(roadSlopeArray);

    // find path from house to endpoint, using the roadSlopeArray as map

    planeGeometry.verticesNeedUpdate = true;
    planeGeometry.rotateX( - Math.PI / 2 );
    planeGeometry.computeVertexNormals();
    const numberOfCells = 1;
    const housingWidth = 600;
    const newheightMap = [];
    for(let x = 0; x < numberOfCells; x++) {
        let pointX = Math.floor(Math.random() * housingWidth - housingWidth / 2);
        let pointZ = Math.floor(Math.random() *housingWidth - housingWidth / 2);
        newheightMap.push([pointX, pointZ]);
    }

    const delaunay = Delaunay.from(newheightMap);
    const voronoi = delaunay.voronoi([-housingWidth/2,-housingWidth/2,housingWidth/2,housingWidth/2]);
    const cells = voronoi.cellPolygons()
    let cell = cells.next();
    const buildingPositions = []
    while(!cell.done) {
        let twicearea = 0, x = 0, y = 0, nPts = cell.value.length, p1, p2, f;
        for ( var i = 0, j = nPts - 1 ; i < nPts ; j = i++ ) {
            p1 = cell.value[i];
            p2 = cell.value[j];
            f = p1[0] * p2[1] - p2[0] * p1[1];
            twicearea += f;          
            x += ( p1[0] + p2[0] ) * f;
            y += ( p1[1] + p2[1] ) * f;
        }
        f = twicearea * 3;
        if(numberOfCells === 1) {
            buildingPositions.push(coords[0])
        } else {
            buildingPositions.push([Math.floor(x/f) , Math.floor(y/f)])
        }
        cell = cells.next();
    }
    // update colors
    const colors = [];
    const verticesCount = planeGeometry.attributes.position.count;
    for(let i = 0; i < verticesCount; i++) {
        colors.push(0.12, 0.5, 0);
    }
    planeGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    colors.needsUpdate = true;
    var planeMaterial = new THREE.MeshLambertMaterial({color: 0x329751, wireframe , vertexColors: true});
    var plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.receiveShadow = true;
    plane.castShadow = true;

    // create a cube
    const cubeGeometry = new THREE.BoxGeometry(30, 30, 60);
    const cubeMaterial = new THREE.MeshLambertMaterial({color:0xff0000});
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.castShadow = true;
    // position the cube
    cube.position.x = -40;
    cube.position.y = 13;
    cube.position.z = 0;

    // create a sphere
    const sphereGeometry = new THREE.SphereGeometry(40, 20, 20);
    const sphereMaterial = new THREE.MeshLambertMaterial({color: 0x7777ff});
    const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

    // position the sphere
    sphere.position.x = 220;
    sphere.position.y = 144;
    sphere.position.z = 122;
    sphere.castShadow = true;

    const spdirection = new THREE.Vector3(0,-1,0);
    const spobjRaycaster = new THREE.Raycaster();
    spobjRaycaster.set(sphere.position, spdirection);
    let intersects = spobjRaycaster.intersectObject(plane);
    sphere.position.set(sphere.position.x, Math.floor(intersects[0].point.y) + 40, sphere.position.z);

    var geometry = new THREE.BoxBufferGeometry( 2, 2, 2 );
    var material = new THREE.MeshNormalMaterial();
    // camera follows this object
    const mesh = new THREE.Mesh( geometry, material );
    mesh.add(camera);
    
    const gltfLoader = new GLTFLoader();
    gltfLoader.load('house/model2.gltf', (gltf) => {
        const root = gltf.scene;
        root.traverse( function( node ) {
            if ( node.isMesh ) { 
               node.castShadow = true;
            }
        });
        root.position.x = 110;
        root.position.y = 200;
        root.position.z = 110;
        root.scale.x = 20;
        root.scale.y = 20;
        root.scale.z = 20;
        const direction = new THREE.Vector3(0,-1,0);
        const objRaycaster = new THREE.Raycaster();
        // code foro creating multiple insances of houses, low complex, ground turns white??
        let housey = 0;
        let buildings = [];
        for(let i = 0; i < buildingPositions.length; i++) {
            let clonedroot = root.clone();
            buildings.push(clonedroot);
            clonedroot.rotateY(Math.random() * 360);
            clonedroot.position.x = buildingPositions[i][0];
            clonedroot.position.y = 600;
            clonedroot.position.z = buildingPositions[i][1];

            objRaycaster.set(clonedroot.position, direction);
            let intersects = objRaycaster.intersectObject(plane);
            if(i===0 || housey >= Math.floor(intersects[0].point.y)) {
                housey = Math.floor(intersects[0].point.y)-10;
            }
            const houseIntersection = {
                x: Math.floor(((planeSize/2) + clonedroot.position.x) / segmentSize),
                z: Math.floor(((planeSize/2) + clonedroot.position.z) / segmentSize)
            }
            const index = Math.floor((houseIntersection.x - 1) * segments + houseIntersection.z);
            if(numberOfCells > 1) {
                const alterGeometry = [
                    -(segments - 1) * 3,
                    -(segments-1) * 2,
                    -(segments - 1),
                    0,
                    segments - 1,
                    (segments - 1) * 2,
                    (segments - 1) * 3,
                    (segments-1) * 4
                ];

                for (let y = -6; y < 8; y++) {
                    alterGeometry.forEach(indexModifier => {
                        plane.geometry.attributes.position.setY(index + indexModifier + y, housey);
                    })
                }

                planeGeometry.attributes.position.needsUpdate = true;
                planeGeometry.normalizeNormals();
                planeGeometry.computeVertexNormals();
            }

            clonedroot.position.set(clonedroot.position.x, housey, clonedroot.position.z);
            plane.add(clonedroot);
        }
        buildings.forEach((building) => {
            building.position.set(building.position.x, housey, building.position.z);
        })
    });

    let landscapeObjects = [];

    landscapeObjects.push(plane);
    landscapeObjects.push(mesh);

    const treesMap = [];
    const trees = 2000;

    for(let i = 0; i < trees; i++) {
        const tree = new Tree(heightMap, obstaclesMap);
        treesMap.push(tree);
    }

    treesMap.forEach(obj => {
        scene.add(obj.topCone)
    })

    let worldGrid = [];
    for(let i = 0; i < obstaclesMap.length; i += segments) {
        worldGrid.push(obstaclesMap.slice(i, i + segments))
    }

    //create Zombies
    const zombies = {alive: [], killed: [], score: 0}
    const enemies = 20;
    for(let i=0; i< enemies; i++ ) {
        const zombie = new Zombie(heightMap, worldGrid, scene);
        zombies.alive.push(zombie);
    }
    //zombies.alive[0].cube.add(camera);
    zombies.alive.forEach(obj => {
        landscapeObjects.push(obj.cube);
    });
    landscapeObjects.forEach((obj) => scene.add(obj));

    // add subtle ambient lighting
    var ambiColor = "#ffaa00";
    var ambientLight = new THREE.AmbientLight(ambiColor);
    scene.add(ambientLight);

    var pointColor = "0xff5808";
    var directionalLight = new THREE.DirectionalLight(pointColor);
    directionalLight.position.set(-100, 160, -10);
    directionalLight.castShadow = true;
    directionalLight.shadowCameraNear = 2;
    directionalLight.shadowCameraFar = 1200;
    directionalLight.shadowCameraLeft = -1500;
    directionalLight.shadowCameraRight = 1500;
    directionalLight.shadowCameraTop = 1500;
    directionalLight.shadowCameraBottom = -1500;

    directionalLight.distance = 0;
    directionalLight.intensity = 0.9;
    directionalLight.shadowMapHeight = 1024;
    directionalLight.shadowMapWidth = 1024;

    scene.add(directionalLight);

    const updateCamera =() => {
        camera.updateProjectionMatrix();
    }

    const gui = new dat.GUI();
    gui.add(camera, 'fov', 1, 180).onChange(updateCamera);
    gui.add(airplane, 'distance').min(100).max(1000).step(10);
    gui.add(airplane, 'height').min(100).max(4000).step(10);
    gui.add(airplane, 'speed').min(-0.1).max(0.1).step(0.001);
    document.getElementById("WebGL-output").appendChild(renderer.domElement);
    const stats = new Stats(1);
    document.getElementById("WebGL-output").appendChild(stats.dom);
    scene.landscapeObjects = [...landscapeObjects]
    MouseEvents(camera, scene, zombies, heightMap, worldGrid, zombies);
    const render = () => {
        requestAnimationFrame(render);
        time += airplane.speed;
        zombies.alive.forEach(zombie => zombie.move());
        newPosition.x = Math.cos(time)*(airplane.distance)+50;
        newPosition.y = -400;
        newPosition.z = Math.sin(time)*(airplane.distance);
        mesh.lookAt( newPosition );
        // render the scene
        mesh.position.copy(newPosition);
        renderer.render(scene, camera);
        stats.update();
        document.getElementsByClassName('zombies-score score')[0].innerHTML = `Zombies killed: ${zombies.score}`;
        document.getElementsByClassName('zombies-score alive')[0].innerHTML = `Zombies alive: ${zombies.alive.length}`;
    }
    setInterval(() => {
        const spawnedZombie = new Zombie(heightMap, worldGrid, scene);
        zombies.alive.push(spawnedZombie);
        const newZombies = [...scene.landscapeObjects];
        newZombies.push(spawnedZombie.cube);
        scene.landscapeObjects = [...newZombies];
        scene.add(spawnedZombie.cube);
    }, 2000)
    render();
}

// test noise data
// window.onload = testPath;
// window.onload = drawNoise;
window.onload = init;

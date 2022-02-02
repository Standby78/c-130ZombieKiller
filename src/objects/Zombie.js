import * as THREE from 'three';
import * as PF from 'pathfinding';
import { segments, planeSize, segmentSize } from '../constants/constants'

const up = new THREE.Vector3(0, 1, 0);

class Zombie {
    constructor (heightMap, worldGrid, scene) {
        let sceneMapGrid = new PF.Grid(worldGrid);
        const finder = new PF.AStarFinder({
            allowDiagonal: true,
            dontCrossCorners: true
        });

        this.offset = 0;
        this.curvesOffset = 0;
        this.speed = 0.003;
        this.axis = new THREE.Vector3();

        const newZombie = Math.floor(Math.random() * segments);

        this.gridPath = finder.findPath(40, newZombie, 50, 50, sceneMapGrid);
        
        this.speed = (1 / this.gridPath.length) / 40;

        const catmullArray = [];
        this.gridPath.forEach(element => {
            const y = heightMap[element[1]*segments+element[0]] + 4; // MIGHT NEED TO REDO THIS?
            const x = element[0]*segmentSize - planeSize/2 + 6;
            const z = element[1]*segmentSize - planeSize/2 + 6;
            catmullArray.push(new THREE.Vector3(x, y, z));
        })

        this.spline = new THREE.CatmullRomCurve3(catmullArray);

        
        // line for debugging paths through objects
        let gem = new THREE.Geometry();
        let points = this.spline.getPoints(1250);
        for (let i = 0; i < points.length; i++) {
            gem.vertices.push(points[i]);
        }
        const mat = new THREE.LineBasicMaterial({color: 0xffffff});
        const line = new THREE.Line(gem, mat);
        if(scene) {
            scene.add(line);
        }
        // end of line

        const cubeGeometry = new THREE.BoxGeometry(25, 10, 5);
        const cubeMaterial = new THREE.MeshLambertMaterial({color:0xff0000});
        this.cubeGeometry = cubeGeometry;
        this.cubeMaterial = cubeMaterial;
        this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);

        let zombiePathTangent = this.spline.getTangentAt(0).normalize();
        let radians = Math.atan2(zombiePathTangent.x, zombiePathTangent.z);
        this.axis.crossVectors(up, zombiePathTangent).normalize();
        this.cube.quaternion.setFromAxisAngle(up, radians);

        this.cube.castShadow = true;
        this.cube.name = "zombie"
        this.id = this.cube.id;

        this.cube.position.copy(this.spline.getPointAt(this.offset));
    }

    move () {
        if(this.offset < 1) {
            this.offset += this.speed;
            let zombiePathTangent = this.spline.getTangentAt(this.offset).normalize();
            let radians = Math.atan2(zombiePathTangent.x, zombiePathTangent.z);
            this.axis.crossVectors(up, zombiePathTangent).normalize();
            this.cube.quaternion.setFromAxisAngle(up, radians);
            this.cube.position.copy(this.spline.getPointAt(this.offset));
        }
        if(this.offset > 1) {
            this.speed = 0;
        }
    }
    kill () {
        this.cubeGeometry.dispose();
        this.cubeMaterial.dispose();
    }
}

export default Zombie;
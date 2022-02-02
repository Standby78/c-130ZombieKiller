import * as THREE from 'three';
import { segments, planeSize, segmentSize } from '../constants/constants'

const treeDisplacement = 0.85;

class Tree {
    constructor(heightMap, treeMap) {
        const geometry = new THREE.ConeGeometry( 15, 40, 12 );
        const material = new THREE.MeshBasicMaterial( {color: 0x00ff00} );
        this.topCone = new THREE.Mesh( geometry, material );

        let x;
        let z;
        do {
            x = Math.floor(Math.random() * segments);
            z = Math.floor(Math.random() * segments);
        }
        while(treeMap[x * segments + z] !== 0)
        treeMap[x * segments + z] = 1;

        const y = heightMap[z * segments + x];
        x = x * segmentSize - planeSize / 2;
        z = z * segmentSize - planeSize / 2;
        this.topCone.position.set(x + segmentSize * treeDisplacement, y + 12, z + segmentSize * treeDisplacement);
        this.topCone.castShadow = true;
    }
}

export default Tree;

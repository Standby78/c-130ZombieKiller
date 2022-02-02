import * as THREE from 'three';

import {recursiveFlag} from '../constants/constants.js'
import Zombie from '../objects/Zombie'

const MouseEvents = (camera, scene, zombies, vertexArray, worldGrid) => {

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    let interval;

    const addBullet = (scene, plasma) => {
        scene.add(plasma);
    };

    const removeKill = (obj, scene, zombies) => {
        if(obj.name === 'zombie') {
            if(zombies.killed.indexOf(obj.id) != -1) {
                const killed = zombies.alive.filter(zombie => zombie.id == obj.id)
                if(killed > 0) killed[0].kill();
                scene.remove(obj);
                const newZombies = scene.landscapeObjects.filter(zombie => zombie.id != obj.id);
                scene.landscapeObjects = [...newZombies];
                const aliveZombies = zombies.alive.filter(zombie => zombie.id != obj.id);
                zombies.alive = [...aliveZombies];
                const killedId = zombies.killed.indexOf(obj.id);
                const killedArray = [...zombies.killed];
                killedArray.splice(killedId, 1);
                zombies.killed = [...killedArray];
                zombies.score++;
            }
        }
    }

    const onMouseDown = () => {
        interval = window.setInterval(() => {
            const oldMouse =  Object.assign({}, mouse);;
            setTimeout(() => {
                raycaster.setFromCamera( oldMouse, camera );
                var intersects = raycaster.intersectObjects( scene.landscapeObjects, recursiveFlag );
                const object = intersects[0].object;
                let plasmaBall = new THREE.Mesh(new THREE.SphereGeometry(7, 8, 4), new THREE.MeshLambertMaterial({
                    color: "aqua", transparent: true, opacity: 0.3
                }));
                plasmaBall.position.copy(intersects[0].point);
                addBullet(scene, plasmaBall);
                setTimeout(() => { scene.remove(plasmaBall) }, 200)
                if(zombies.killed.indexOf(object.id) == -1) {
                    let killedArray = [...zombies.killed];
                    killedArray.push(object.id);
                    zombies.killed = [...killedArray];
                    setTimeout(() => { removeKill(object, scene, zombies) }, 200);
                }
            },600)
        }, 50)
    }
    const onMouseUp = () => {
        window.clearInterval(interval);
    }

    const onMouseMove = (event) => {
        mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

    window.addEventListener('mousemove', onMouseMove, false );
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);

}

export default MouseEvents;

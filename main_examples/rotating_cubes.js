import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const DEFAULTMASS = 10;

const getRandomColor = () => {
    const maxVal = 16777216;

    let randomNumber = Math.random() * maxVal;
    return randomNumber;
    // .toString(16)
};

class BasicWorldDemo {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        this.collisionConfiguration =
            new Ammo.btDefaultCollisionConfiguration();
        this.dispatcher = new Ammo.btCollisionDispatcher(
            this.collisionConfiguration
        );
        this.broadphase = new Ammo.btDbvtBroadphase();
        this.solver = new Ammo.btSequentialImpulseConstraintSolver();
        this.physicsWorld = new Ammo.btDiscreteDynamicsWorld(
            this.dispatcher,
            this.broadphase,
            this.solver,
            this.collisionConfiguration
        );
        this.physicsWorld.setGravity(new Ammo.btVector3(0, -100, 0));

        this.rotation_speed = 2;

        this.clock = new THREE.Clock();
        this.clock.start();

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowMap;

        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this.renderer.domElement);

        window.addEventListener(
            "resize",
            () => {
                this._OnWindowResize();
            },
            false
        );

        this._distance = 75;

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000;

        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(
            -this._distance,
            this._distance,
            this._distance / 3
        );
        // this.camera.position.set(40, 100, 30);
        this.camera.lookAt(0, 0, 0);

        this.scene = new THREE.Scene();

        let light = new THREE.DirectionalLight(0xffffff);
        light.position.set(40, 100, 30);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.01;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.left = 100.0;
        light.shadow.camera.right = -100.0;
        light.shadow.camera.top = 100.0;
        light.shadow.camera.bottom = -100.0;
        this.scene.add(light);

        // const helper = new THREE.CameraHelper(light.shadow.camera);
        // this.scene.add(helper);

        light = new THREE.AmbientLight(0x404040);
        this.scene.add(light);

        // const helper = new THREE.CameraHelper(light.shadow.camera);
        // this.scene.add(helper);

        // ADDING A SKYBOX
        const loader = new THREE.CubeTextureLoader();
        const skybox_texture = loader.load([
            "resources/images/skybox/posx.bmp",
            "resources/images/skybox/negx.bmp",
            "resources/images/skybox/posy.bmp",
            "resources/images/skybox/negy.bmp",
            "resources/images/skybox/posz.bmp",
            "resources/images/skybox/negz.bmp",
        ]);
        this.scene.background = skybox_texture;

        // ADDING CONTROLS
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();

        // 3D OBJECTS
        this.plane = new THREE.Mesh(
            new THREE.PlaneGeometry(100, 100),
            new THREE.MeshStandardMaterial({
                color: 0xffff00,
                side: THREE.DoubleSide,
            })
        );
        this.plane.castShadow = true;
        this.plane.receiveShadow = true;
        this.plane.rotateX(Math.PI / 2);

        this.scene.add(this.plane);

        this.boxes = [];

        for (var j = 0; j < 10; j++) {
            for (var i = 0; i < 10; i++) {
                let color = getRandomColor();
                let box = new THREE.Mesh(
                    new THREE.BoxGeometry(5, 5, 5),
                    new THREE.MeshStandardMaterial({
                        color: color,
                    })
                );
                box.castShadow = true;
                box.receiveShadow = true;
                box.position.set(
                    i * 10 - 45,
                    5 * Math.floor(Math.random() * 8) + 4,
                    j * 10 - 45
                );
                box.rotateX(Math.floor(Math.random() * 90));
                box.rotateY(Math.floor(Math.random() * 90));

                this.boxes.push(box);
            }
        }

        for (let i = 0; i < this.boxes.length; i++) {
            this.scene.add(this.boxes[i]);
        }

        this.RequestAnimationFrame();
    }

    _OnWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    RequestAnimationFrame() {
        requestAnimationFrame(() => {
            this.renderer.render(this.scene, this.camera);
            this.controls.update();

            // ANIMATIONS HERE
            for (let i = 0; i < this.boxes.length; i++) {
                let box = this.boxes[i];

                box.rotation.x += 0.02;
                box.rotation.y += 0.02;

                // box.position.x += Math.sin(this.clock.getElapsedTime() * this.rotation_speed)
                // box.position.z += Math.cos(this.clock.getElapsedTime() * this.rotation_speed)
            }

            this.RequestAnimationFrame();
        });
    }
}

let APP_ = null;

window.addEventListener("DOMContentLoaded", () => {
    Ammo().then((lib) => {
        Ammo = lib;
        APP_ = new BasicWorldDemo();
    });
});

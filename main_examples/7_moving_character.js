import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RigidBody } from "./RigidBody";

const DEFAULT_MASS = 10;

var camera, scene, renderer, keys;

const getRandomColor = () => {
    const maxVal = 16777216;

    let randomNumber = Math.random() * maxVal;
    return randomNumber;
};

scene = new THREE.Scene();

let characterModel = undefined;
let characterMixer = undefined;
let characterAnimIDLE = undefined;
let characterAnimRUNNING = undefined;

class BasicWorldDemo {
    constructor() {
        this._Initialize();
    }

    async _Initialize() {
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

        renderer = new THREE.WebGLRenderer();
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFShadowMap;

        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(renderer.domElement);

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

        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.x = 10;
        camera.position.y = 10;
        camera.position.z = 10;

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
        scene.add(light);

        // const helper = new THREE.CameraHelper(light.shadow.camera);
        // scene.add(helper);

        light = new THREE.AmbientLight(0x404040);
        scene.add(light);

        // ADDING A SKYBOX
        const loader = new THREE.CubeTextureLoader();
        const skybox_texture = loader.load([
            "images/skybox/posx.bmp",
            "images/skybox/negx.bmp",
            "images/skybox/posy.bmp",
            "images/skybox/negy.bmp",
            "images/skybox/posz.bmp",
            "images/skybox/negz.bmp",
        ]);
        scene.background = skybox_texture;

        // 3D OBJECTS
        const ground = new THREE.Mesh(
            new THREE.BoxGeometry(100, 1, 100),
            new THREE.MeshStandardMaterial({ color: 0xff0000 })
        );
        ground.castShadow = false;
        ground.receiveShadow = true;
        scene.add(ground);

        const rbGround = new RigidBody();
        rbGround.createBox(
            0,
            ground.position,
            ground.quaternion,
            new THREE.Vector3(100, 1, 100)
        );
        rbGround.setRestitution(0.99);

        this.physicsWorld.addRigidBody(rbGround.body);

        this.physicsObjects = [];
        this.tmpTransform = new Ammo.btTransform();

        const gltfLoader = new GLTFLoader();

        function modelLoader() {
            return new Promise((resolve, reject) => {
                gltfLoader.load(
                    "models/ybot.glb",
                    (gltf) => {
                        characterModel = gltf.scene;
                        characterModel.scale.set(0.03, 0.03, 0.03);
                        characterModel.position.y = 3.5;

                        characterModel.receiveShadow = true;
                        characterModel.castShadow = true;

                        characterMixer = new THREE.AnimationMixer(
                            characterModel
                        );
                        characterAnimIDLE = gltf.animations[7];
                        characterAnimRUNNING = gltf.animations[8];

                        characterMixer.clipAction(characterAnimIDLE).play();

                        scene.add(characterModel);
                        resolve();
                    },
                    undefined,
                    reject
                );
            });
        }

        await modelLoader();

        characterModel.attach(camera);
        camera.position.copy(characterModel.position);
        camera.position.y += 150;
        camera.position.z -= 400;

        camera.lookAt(characterModel.position);

        // CONTROLS
        keys = {
            a: false,
            s: false,
            d: false,
            w: false,
        };
        document.body.addEventListener("keydown", function (e) {
            var key = e.code.replace("Key", "").toLowerCase();
            if (keys[key] !== undefined) keys[key] = true;
        });
        document.body.addEventListener("keyup", function (e) {
            var key = e.code.replace("Key", "").toLowerCase();
            if (keys[key] !== undefined) keys[key] = false;
        });

        characterModel.position.z = -50;

        this.previousRequestAnimationTime = null;
        this.RequestAnimationFrame();
    }

    _OnWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    step(timeElapsed) {
        const timeElapsedInSeconds = timeElapsed * 0.001;

        this.physicsWorld.stepSimulation(timeElapsedInSeconds, 10);

        for (let i = 0; i < this.physicsObjects.length; ++i) {
            this.physicsObjects[i].rigidBody.motionState.getWorldTransform(
                this.tmpTransform
            );
            const pos = this.tmpTransform.getOrigin();
            const quat = this.tmpTransform.getRotation();
            const threePos = new THREE.Vector3(pos.x(), pos.y(), pos.z());
            const threeQuat = new THREE.Quaternion(
                quat.x(),
                quat.y(),
                quat.z(),
                quat.w()
            );

            this.physicsObjects[i].mesh.position.copy(threePos);
            this.physicsObjects[i].mesh.quaternion.copy(threeQuat);
        }
    }

    RequestAnimationFrame() {
        requestAnimationFrame((timeElapsed) => {
            if (!characterMixer && !characterModel) {
                this.RequestAnimationFrame();
                return;
            }

            if (this.previousRequestAnimationTime === null) {
                this.previousRequestAnimationTime = timeElapsed;
            }

            this.step(timeElapsed - this.previousRequestAnimationTime);

            let forward = new THREE.Vector3();
            characterModel.getWorldDirection(forward);

            if (keys.w || keys.s) {
                characterMixer.clipAction(characterAnimIDLE).stop();
                characterMixer.clipAction(characterAnimRUNNING).play();
            } else {
                characterMixer.clipAction(characterAnimIDLE).play();
                characterMixer.clipAction(characterAnimRUNNING).stop();
            }

            if (keys.w) characterModel.position.add(forward);
            else if (keys.s) characterModel.position.sub(forward);

            if (keys.a) characterModel.rotateY(0.05);
            else if (keys.d) characterModel.rotateY(-0.05);

            camera.lookAt(characterModel.position);

            characterMixer?.update(this.clock.getDelta());
            renderer.render(scene, camera);

            this.RequestAnimationFrame();
            this.previousRequestAnimationTime = timeElapsed;
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

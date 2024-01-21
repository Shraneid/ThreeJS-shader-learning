import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RigidBody } from "./RigidBody";

const DEFAULT_MASS = 10;
const DEGTORAD = 0.01745327;

const temp = new THREE.Vector3();
const dir = new THREE.Vector3();
const a = new THREE.Vector3();
const b = new THREE.Vector3();

const movementLag = 2;
let movementSpeed = 0.3;
let velocity = 0;

const goal = new THREE.Object3D();
const follow = new THREE.Object3D();

// CONTROLS
const keys = {
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

const getRandomColor = () => {
    const maxVal = 16777216;

    let randomNumber = Math.random() * maxVal;
    return randomNumber;
};

const scene = new THREE.Scene();

let characterModel = undefined;
let characterMixer = undefined;
let characterAnimIDLE = undefined;
let characterAnimRUNNING = undefined;

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
        // this.camera.position.set(
        //     -this._distance,
        //     this._distance,
        //     this._distance / 3
        // );
        // this.camera.position.set(40, 100, 30);
        // this.camera.lookAt(0, 0, 0);

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

        // ADDING CONTROLS
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );
        this.controls.update();

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

        const gltfLoader = new GLTFLoader();

        this.characterModel = undefined;

        gltfLoader.load(
            "models/ybot.glb",
            function (gltf) {
                characterModel = gltf.scene;
                characterModel.scale.set(0.01, 0.01, 0.01);
                characterModel.position.y = 1.5;

                characterMixer = new THREE.AnimationMixer(characterModel);
                characterAnimIDLE = gltf.animations[7];
                characterAnimRUNNING = gltf.animations[8];

                characterMixer.clipAction(characterAnimRUNNING).play();

                scene.add(characterModel);
            },
            undefined,
            undefined
        );

        this.physicsObjects = [];

        this.tmpTransform = new Ammo.btTransform();

        goal.position.z = -movementLag;
        goal.add(this.camera);

        this.previousRequestAnimationTime = null;
        this.RequestAnimationFrame();
    }

    _OnWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
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

            // characterModel.position.z += 0.1;

            if (keys.w) velocity = movementSpeed;
            else if (keys.s) velocity = -movementSpeed;

            characterModel.position.z += velocity;

            if (keys.a) characterModel.rotateY(0.05);
            else if (keys.d) characterModel.rotateY(-0.05);

            a.lerp(characterModel.position, 0.4);
            b.copy(goal.position);

            dir.copy(a).sub(b).normalize();
            const dis = a.distanceTo(b) - movementLag;
            goal.position.addScaledVector(dir, dis);

            // this.camera.position.copy(goal.position);
            // this.camera.lookAt(characterModel.position);

            characterMixer?.update(this.clock.getDelta());

            this.renderer.render(scene, this.camera);
            this.controls.update();

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

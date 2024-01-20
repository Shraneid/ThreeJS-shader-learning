import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RigidBody } from "./RigidBody";

const DEFAULT_MASS = 300;

const getRandomColor = () => {
    const maxVal = 16777216;

    let randomNumber = Math.random() * maxVal;
    return randomNumber;
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

        // ADDING A SKYBOX
        const loader = new THREE.CubeTextureLoader();
        const skybox_texture = loader.load([
            "public/images/skybox/posx.bmp",
            "public/images/skybox/negx.bmp",
            "public/images/skybox/posy.bmp",
            "public/images/skybox/negy.bmp",
            "public/images/skybox/posz.bmp",
            "public/images/skybox/negz.bmp",
        ]);
        this.scene.background = skybox_texture;

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
        this.scene.add(ground);

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

        let isSphere = true;

        for (let j = -4; j < 4; j++) {
            for (let i = -4; i < 4; i++) {
                if (isSphere) {
                    const sphere = new THREE.Mesh(
                        new THREE.SphereGeometry(4),
                        new THREE.MeshStandardMaterial({
                            color: getRandomColor(),
                        })
                    );
                    sphere.position.set(
                        i * 10,
                        Math.random() * 20 + 40,
                        j * 10
                    );
                    sphere.castShadow = true;
                    sphere.receiveShadow = true;

                    this.scene.add(sphere);

                    const rb = new RigidBody();
                    rb.createSphere(1, sphere.position, 4);
                    rb.setRestitution(0.5);
                    rb.setFriction(1);
                    rb.setRollingFriction(1);

                    this.physicsWorld.addRigidBody(rb.body);
                    this.physicsObjects.push({ mesh: sphere, rigidBody: rb });
                } else {
                    const boxWidth = 6;

                    const box = new THREE.Mesh(
                        new THREE.BoxGeometry(boxWidth, boxWidth, boxWidth),
                        new THREE.MeshStandardMaterial({
                            color: getRandomColor(),
                        })
                    );
                    box.position.set(i * 10, Math.random() * 20 + 40, j * 10);
                    box.castShadow = true;
                    box.receiveShadow = true;

                    this.scene.add(box);

                    const rb = new RigidBody();
                    rb.createBox(
                        1,
                        box.position,
                        box.quaternion,
                        new THREE.Vector3(boxWidth, boxWidth, boxWidth)
                    );
                    rb.setRestitution(0.25);
                    rb.setFriction(100);
                    rb.setRollingFriction(500);

                    this.physicsWorld.addRigidBody(rb.body);
                    this.physicsObjects.push({ mesh: box, rigidBody: rb });
                }

                if (Math.random() > 0.5) {
                    isSphere = !isSphere;
                }
            }
        }

        this.tmpTransform = new Ammo.btTransform();

        this.countdown = 1.0;
        this.count = 0;
        this.previousRequestAnimationTime = null;
        this.RequestAnimationFrame();
    }

    _OnWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    spawn() {
        console.log("spawning");
        const scale = Math.random() * 4 + 4;
        const box = new THREE.Mesh(
            new THREE.BoxGeometry(scale, scale, scale),
            new THREE.MeshStandardMaterial({
                color: getRandomColor(),
            })
        );
        box.position.set(Math.random() * 2 - 1, 200.0, Math.random() * 2 - 1);
        box.quaternion.set(0, 0, 0, 1);
        box.castShadow = true;
        box.receiveShadow = true;

        const rb = new RigidBody();
        rb.createBox(
            DEFAULT_MASS,
            box.position,
            box.quaternion,
            new THREE.Vector3(scale, scale, scale),
            null
        );
        rb.setRestitution(0.125);
        rb.setFriction(1);
        rb.setRollingFriction(5);

        this.physicsWorld.addRigidBody(rb.body);
        this.physicsObjects.push({ mesh: box, rigidBody: rb });

        this.scene.add(box);
    }

    step(timeElapsed) {
        const timeElapsedInSeconds = timeElapsed * 0.001;

        this.countdown -= timeElapsedInSeconds;
        if (this.countdown < 0 && this.count < 1000) {
            this.countdown = 0.25;
            this.count += 1;
            this.spawn();
        }

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
            if (this.previousRequestAnimationTime === null) {
                this.previousRequestAnimationTime = timeElapsed;
            }

            this.step(timeElapsed - this.previousRequestAnimationTime);

            this.renderer.render(this.scene, this.camera);
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

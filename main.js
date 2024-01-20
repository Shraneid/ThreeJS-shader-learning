import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import vertexShaderCode from "./shaders/coloured_wave/v.glsl";
import fragmentShaderCode from "./shaders/coloured_wave/f.frag";

const uniformData = {
    u_time: {
        type: "f",
        value: 0.0,
    },
};

var camera, scene, renderer, controls;

scene = new THREE.Scene();

class BasicWorldDemo {
    constructor() {
        this._Initialize();
    }

    async _Initialize() {
        this.clock = new THREE.Clock();
        this.clock.start();

        uniformData.u_time.value = this.clock.getElapsedTime();

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

        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 1000;

        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.x = 40;
        camera.position.y = 30;
        camera.position.z = 30;

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
        // const ground = new THREE.Mesh(
        //     new THREE.BoxGeometry(100, 1, 100),
        //     new THREE.MeshStandardMaterial({ color: 0x00ff00 })
        // );
        // ground.castShadow = false;
        // ground.receiveShadow = true;
        // scene.add(ground);

        const box = new THREE.Mesh(
            new THREE.BoxGeometry(32, 8, 64, 10, 2, 64),
            new THREE.ShaderMaterial({
                wireframe: true,
                uniforms: uniformData,
                vertexShader: vertexShaderCode,
                fragmentShader: fragmentShaderCode,
            })
        );
        box.rotation.y = Math.PI;
        scene.add(box);

        controls = new OrbitControls(camera, renderer.domElement);
        controls.update();

        this.previousRequestAnimationTime = null;
        this.RequestAnimationFrame();
    }

    _OnWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    RequestAnimationFrame() {
        requestAnimationFrame((timeElapsed) => {
            renderer.render(scene, camera);

            uniformData.u_time.value = this.clock.getElapsedTime();

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

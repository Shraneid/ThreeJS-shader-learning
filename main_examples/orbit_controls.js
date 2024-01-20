import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

class BasicWorldDemo {
    constructor() {
        this._Initialize();
    }

    _Initialize() {
        this._clock = new THREE.Clock();
        this._clock.start();

        this._renderer = new THREE.WebGLRenderer();
        this._renderer.shadowMap.enabled = true;
        this._renderer.shadowMap.type = THREE.PCFShadowMap;

        this._renderer.setPixelRatio(window.devicePixelRatio);
        this._renderer.setSize(window.innerWidth, window.innerHeight);

        document.body.appendChild(this._renderer.domElement);

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

        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(-this._distance, 0, 0);
        this._camera.lookAt(0, 0, 0);

        this._scene = new THREE.Scene();

        let light = new THREE.DirectionalLight(0xffffff);
        light.position.set(100, 100, 100);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.01;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        light.shadow.camera.near = 1.0;
        light.shadow.camera.far = 500.0;
        light.shadow.camera.left = 200.0;
        light.shadow.camera.right = -200.0;
        light.shadow.camera.top = 200.0;
        light.shadow.camera.bottom = -200.0;
        this._scene.add(light);

        light = new THREE.AmbientLight(0x404040);
        this._scene.add(light);

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
        this._scene.background = skybox_texture;

        const geometry = new THREE.BoxGeometry(20, 20, 20);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

        this._cube = new THREE.Mesh(geometry, material);

        this._scene.add(this._cube);

        // ADDING CONTROLS
        this._controls = new OrbitControls(
            this._camera,
            this._renderer.domElement
        );
        this._controls.update();

        this._RequestAnimationFrame();
    }

    _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(window.innerWidth, window.innerHeight);
    }

    _RequestAnimationFrame() {
        requestAnimationFrame(() => {
            this._renderer.render(this._scene, this._camera);

            this._cube.rotation.x += 0.01;
            this._cube.rotation.y += 0.02;

            this._controls.update();

            this._RequestAnimationFrame();
        });
    }
}

let _APP = null;

window.addEventListener("DOMContentLoaded", () => {
    _APP = new BasicWorldDemo();
});

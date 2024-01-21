import * as THREE from "three";
import Stats from 'three/examples/jsm/libs/stats.module.js';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import grassVertexShaderCode from "./shaders/11_first_grass_test/grass.glsl";
import grassFragmentShaderCode from "./shaders/11_first_grass_test/grass.frag";
import vertexShaderCode from "./shaders/11_first_grass_test/plane.glsl";
import fragmentShaderCode from "./shaders/11_first_grass_test/plane.frag";

const uniformData = {
    u_time: {
        type: "f",
        value: 0.0,
    },
    // noise_texture: { type: "t", value: new THREE.TextureLoader().load("public/images/noise/Dissolve_Noise_Texture.png") }
    noise_texture: { type: "t", value: new THREE.TextureLoader().load("public/images/noise/perlin.png") }
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
        // const aspect = 1920 / 1080;
        const aspect = 1080 / 1920;
        const near = 1.;
        const far = 1000;

        camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.x = 10;
        camera.position.y = 10;
        camera.position.z = 20;

        // let light = new THREE.DirectionalLight(0xffffff);
        // light.position.set(40, 100, 30);
        // light.target.position.set(0, 0, 0);
        // light.castShadow = true;
        // light.shadow.bias = -0.01;
        // light.shadow.mapSize.width = 2048;
        // light.shadow.mapSize.height = 2048;
        // light.shadow.camera.near = 0.1;
        // light.shadow.camera.far = 500.;
        // light.shadow.camera.left = 100.;
        // light.shadow.camera.right = -100.;
        // light.shadow.camera.top = 100.;
        // light.shadow.camera.bottom = -100.;
        // scene.add(light);

        // const helper = new THREE.CameraHelper(light.shadow.camera);
        // scene.add(helper);

        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);

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

        const planeWidth = 20;

        // 3D OBJECTS
        const plane = new THREE.Mesh(
            new THREE.PlaneGeometry(planeWidth + 1, planeWidth + 1),
            // new THREE.ShaderMaterial({
            //     // wireframe: true,
            //     uniforms: uniformData,
            //     vertexShader: vertexShaderCode,
            //     fragmentShader: fragmentShaderCode,
            // })
            new THREE.MeshBasicMaterial({ color: 'red' })
        );
        plane.rotateX(-Math.PI / 2)

        plane.castShadow = true
        plane.receiveShadow = true;
        scene.add(plane);

        const box = new THREE.Mesh(
            new THREE.BoxGeometry(3, 3, 3),
            new THREE.MeshBasicMaterial({ color: 'blue' })
        );
        box.position.y = 1.5
        box.castShadow = true;
        box.receiveShadow = true;

        scene.add(box)

        const grassGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            -0.11, 0., 0.,
            -0.05, 0., 0.,
            0., 0., 0.,
            0.05, 0., 0.,
            0.11, 0., 0.,
            -0.1, 0.25, 0.,
            -0.05, 0.25, 0.,
            0.05, 0.25, 0.,
            0.1, 0.25, 0.,
            -0.08, 0.5, 0.,
            0., 0.5, 0.,
            0.08, 0.5, 0.,
            -0.05, 0.75, 0.,
            0.05, 0.75, 0.,
            0., 1., 0.,
        ])
        const indices = [
            0, 1, 5,
            5, 6, 1,
            1, 2, 6,
            6, 7, 2,
            2, 3, 7,
            7, 8, 3,
            3, 4, 8,
            5, 6, 9,
            9, 10, 6,
            6, 7, 10,
            10, 11, 7,
            7, 8, 11,
            9, 10, 12,
            12, 13, 10,
            10, 11, 13,
            12, 13, 14
        ]

        grassGeometry.setIndex(indices);
        grassGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

        const grassMaterial = new THREE.ShaderMaterial({
            // wireframe: true,
            uniforms: uniformData,
            vertexShader: grassVertexShaderCode,
            fragmentShader: grassFragmentShaderCode,
            side: THREE.DoubleSide
        })

        const numberOfGrassBlades = 1000;
        const perfectSquareNumberOfGrassBlades = Math.ceil(Math.sqrt(numberOfGrassBlades)) ** 2;
        const grass = new THREE.InstancedMesh(grassGeometry, grassMaterial, perfectSquareNumberOfGrassBlades)

        grass.castShadow = true;
        grass.receiveShadow = true;

        scene.add(grass);

        const dummy = new THREE.Object3D();

        const grassBladesPerAxis = Math.ceil(Math.sqrt(perfectSquareNumberOfGrassBlades));
        const halfPlaneWidth = planeWidth / 2;
        const spacing = planeWidth / (grassBladesPerAxis - 1);

        let index = 0;

        // moving each instance to its position (rotation is done in the vertex shader using a hash function based on position)
        for (let j = 0; j < grassBladesPerAxis; j++) {
            for (let i = 0; i < grassBladesPerAxis; i++) {
                const z = -halfPlaneWidth + j * spacing + (Math.random() * spacing - spacing / 2)
                const x = -halfPlaneWidth + i * spacing + (Math.random() * spacing - spacing / 2)

                dummy.position.set(x, 0., z);
                dummy.updateMatrix();

                grass.setMatrixAt(index++, dummy.matrix);
            }
        }

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

            stats.update()

            uniformData.u_time.value = this.clock.getElapsedTime();

            this.RequestAnimationFrame();
            this.previousRequestAnimationTime = timeElapsed;
        });
    }
}

let APP_ = null;

const stats = new Stats()
document.body.appendChild(stats.dom)

window.addEventListener("DOMContentLoaded", () => {
    Ammo().then((lib) => {
        Ammo = lib;
        APP_ = new BasicWorldDemo();
    });
});

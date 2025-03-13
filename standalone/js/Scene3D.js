import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class Scene3D {
    constructor() {
        this.container = document.getElementById('scene-container');
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.initialized = false;
    }

    init() {
        if (!this.container || this.initialized) return;

        try {
            this.setupScene();
            this.setupCamera();
            this.setupLights();
            this.setupGrid();
            this.setupControls();
            this.animate();
            this.initialized = true;
            console.log('3D Scene initialized successfully');
        } catch (error) {
            console.error('Failed to initialize 3D scene:', error);
        }
    }

    setupScene() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);
    }

    setupCamera() {
        try {
            this.camera = new THREE.PerspectiveCamera(
                75, 
                this.container.clientWidth / this.container.clientHeight, 
                0.1, 
                1000
            );
            this.camera.position.set(10, 10, 10);
            this.camera.lookAt(0, 0, 0);
        } catch (error) {
            console.error('Failed to setup camera:', error);
            throw error;
        }
    }

    setupLights() {
        try {
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(10, 10, 10);
            this.scene.add(ambientLight, directionalLight);
        } catch (error) {
            console.error('Failed to setup lights:', error);
            throw error;
        }
    }

    setupGrid() {
        try {
            const gridHelper = new THREE.GridHelper(20, 20, 0x888888, 0x444444);
            this.scene.add(gridHelper);

            // Add a reference cube
            const geometry = new THREE.BoxGeometry(2, 2, 2);
            const material = new THREE.MeshStandardMaterial({ color: 0x8b0000 });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 1, 0);
            this.scene.add(cube);
        } catch (error) {
            console.error('Failed to setup grid:', error);
            throw error;
        }
    }

    setupControls() {
        try {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.screenSpacePanning = false;
            this.controls.minDistance = 5;
            this.controls.maxDistance = 50;
            this.controls.maxPolarAngle = Math.PI / 2;
        } catch (error) {
            console.error('Failed to setup controls:', error);
            throw error;
        }
    }

    setupEventListeners() {
        try {
            window.addEventListener('resize', () => this.onResize());
        } catch (error) {
            console.error('Failed to setup event listeners:', error);
            throw error;
        }
    }

    onResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        if (!this.initialized) return;
        
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    cleanup() {
        if (this.controls) {
            this.controls.dispose();
        }
        
        if (this.renderer) {
            this.renderer.dispose();
            this.container.removeChild(this.renderer.domElement);
        }

        window.removeEventListener('resize', () => this.onResize());
        
        this.scene = new THREE.Scene();
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.initialized = false;
    }
}

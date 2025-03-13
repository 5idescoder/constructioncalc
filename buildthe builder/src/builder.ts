import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class Shape3D {
    mesh: THREE.Mesh;

    constructor(
        public type: string,
        public color: string,
        public scale: number[]
    ) {
        this.mesh = this.createMesh();
    }

    createMesh(): THREE.Mesh {
        const geometryMap: { [key: string]: any } = {
            box: THREE.BoxGeometry,
            sphere: THREE.SphereGeometry,
            cylinder: THREE.CylinderGeometry,
            cone: THREE.ConeGeometry
        };

        const geometry = new geometryMap[this.type]();
        const material = new THREE.MeshStandardMaterial({ color: this.color });
        const mesh = new THREE.Mesh(geometry, material);
        if (this.scale.length === 3) {
            mesh.scale.set(this.scale[0], this.scale[1], this.scale[2]);
        } else {
            console.error('Scale must be an array of three numbers');
        }
        mesh.userData.type = this.type;
        return mesh;
    }
}

class UIManager {
    constructor(private builder: Builder3D) {
        this.setupEventDelegation();
    }

    setupEventDelegation(): void {
        document.querySelector('.container')?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement;
            if (target.id === 'addShape') this.builder.addShape();
            if (target.id === 'deleteSelected') this.builder.deleteSelected();
            if (target.id === 'resetCamera') this.builder.resetCamera();
        });
    }

    updateShapeList(shapes: THREE.Mesh[], selectedShape: THREE.Mesh | null): void {
        const list = document.getElementById('shapeList');
        if (!list) return;
        
        list.innerHTML = '<h3>Shapes</h3>' + 
            shapes.map((shape, i) => `
                <div class="shape-item ${shape === selectedShape ? 'selected' : ''}" 
                     data-index="${i}">
                    ${shape.userData.type} ${i + 1}
                </div>
            `).join('');
    }
}

export class Builder3D {
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;
    private controls: OrbitControls;
    private shapes: THREE.Mesh[] = [];
    private selectedShape: THREE.Mesh | null = null;
    private ui: UIManager;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.getAspectRatio(), 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.ui = new UIManager(this);
        
        this.initScene();
        this.setupInteraction();
        this.setupTabs();
    }

    private getAspectRatio(): number {
        return (window.innerWidth - 300) / window.innerHeight;
    }

    private initScene(): void {
        this.renderer.setSize(window.innerWidth - 300, window.innerHeight);
        document.getElementById('scene-container')?.appendChild(this.renderer.domElement);
        
        this.camera.position.set(5, 5, 5);
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        
        this.setupLighting();
        this.scene.add(new THREE.GridHelper(20, 20));
        
        this.animate();
    }

    private setupLighting(): void {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        const directional = new THREE.DirectionalLight(0xffffff, 1);
        directional.position.set(5, 5, 5);
        this.scene.add(ambient, directional);
    }

    public addShape(): void {
        const shapeType = (document.getElementById('shapeType') as HTMLSelectElement).value;
        const color = (document.getElementById('shapeColor') as HTMLInputElement).value;
        const scale = ['X', 'Y', 'Z'].map(axis => 
            parseFloat((document.getElementById(`scale${axis}`) as HTMLInputElement).value));

        const shape = new Shape3D(shapeType, color, scale);
        if (this.shapes.length) {
            shape.mesh.position.y = this.shapes[this.shapes.length - 1].position.y + 2;
        }
        
        this.shapes.push(shape.mesh);
        this.scene.add(shape.mesh);
        this.ui.updateShapeList(this.shapes, this.selectedShape);
    }

    public deleteSelected(): void {
        if (this.selectedShape) {
            this.scene.remove(this.selectedShape);
            this.shapes = this.shapes.filter(shape => shape !== this.selectedShape);
            this.selectedShape = null;
            this.ui.updateShapeList(this.shapes, this.selectedShape);
        }
    }

    public resetCamera(): void {
        this.camera.position.set(5, 5, 5);
        this.camera.lookAt(0, 0, 0);
        this.controls.reset();
    }

    private setupTabs(): void {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = (tab as HTMLElement).dataset.tab;
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById(tabId!)?.classList.add('active');
            });
        });
    }

    private setupInteraction(): void {
        window.addEventListener('resize', () => {
            this.camera.aspect = this.getAspectRatio();
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth - 300, window.innerHeight);
        });
    }

    private animate(): void {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

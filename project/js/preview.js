import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { activeTools, tools } from './tools.js';

let scene, camera, renderer, controls;

const COLORS = {
    stud: new THREE.Color('#D2B48C'),
    beam: new THREE.Color('#8B4513'),
    plate: new THREE.Color('#DEB887'),
    joist: new THREE.Color('#A0522D'),
    toolbox: new THREE.Color('#8B4513'),
    toolboxHighlight: new THREE.Color('#CD853F')
};

const LUMBER_DIMENSIONS = {
    stud: { width: 1.5, height: 3.5 },
    beam: { width: 1.5, height: 5.5 },
    plate: { width: 1.5, height: 3.5 },
    joist: { width: 1.5, height: 5.5 }
};

const GRID_SNAP = 0.5; // Half foot increments for snapping
let snapGridHelper;
let isFrameMaterialsActive = false;

let toolboxMesh;
let isToolboxOpen = false;

export function init() {
    const container = document.getElementById('preview-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color('#1a1a1a');

    // Better camera setup
    camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(40, 30, 40);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 100;

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight1.position.set(10, 10, 10);
    scene.add(directionalLight1);

    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(-10, 5, -10);
    scene.add(directionalLight2);

    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.4);
    directionalLight3.position.set(0, -5, 0);
    scene.add(directionalLight3);

    createToolbox();

    window.addEventListener('resize', onWindowResize, false);
    animate();
}

function createLumber(type, length) {
    // Fix the geometry to make studs vertical
    const geometry = new THREE.BoxGeometry(
        LUMBER_DIMENSIONS[type].width / 12,  // width (in feet)
        length,                              // height is now the length
        LUMBER_DIMENSIONS[type].height / 12  // depth (in feet)
    );
    const material = new THREE.MeshStandardMaterial({ 
        color: COLORS[type],
        roughness: 0.6,
        metalness: 0.1
    });
    const lumber = new THREE.Mesh(geometry, material);
    lumber.castShadow = true;
    lumber.receiveShadow = true;
    lumber.userData.isFrameMaterial = true;
    scene.add(lumber);
    return lumber;
}

function createToolbox() {
    const geometry = new THREE.BoxGeometry(4, 3, 3);
    const material = new THREE.MeshStandardMaterial({ 
        color: COLORS.toolbox,
        roughness: 0.8
    });
    toolboxMesh = new THREE.Mesh(geometry, material);
    toolboxMesh.position.set(-15, 1.5, -15); // Position in corner
    scene.add(toolboxMesh);

    // Add click interaction
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();

    renderer.domElement.addEventListener('click', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(toolboxMesh);

        if (intersects.length > 0) {
            toggleToolbox();
        }
    });

    renderer.domElement.addEventListener('mousemove', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObject(toolboxMesh);

        toolboxMesh.material.color = intersects.length > 0 ? 
            COLORS.toolboxHighlight : COLORS.toolbox;
    });

    createSnapGrid(20); // Initial grid size
}

function createSnapGrid(size) {
    if (snapGridHelper) scene.remove(snapGridHelper);
    const divisions = size * 2; // Every 6 inches
    snapGridHelper = new THREE.GridHelper(size, divisions, 0x444444, 0x222222);
    snapGridHelper.visible = false;
    scene.add(snapGridHelper);
}

function toggleToolbox() {
    isToolboxOpen = !isToolboxOpen;
    if (isToolboxOpen) {
        showToolMenu();
    } else {
        hideToolMenu();
    }
}

// Update showToolMenu function
function showToolMenu() {
    const menuItems = document.getElementById('tool-menu-items');
    if (!menuItems) return;
    
    menuItems.innerHTML = '';
    for (const toolId of activeTools) {
        const tool = tools.find(t => t.id === toolId);
        if (!tool) continue;
        
        const button = document.createElement('button');
        button.className = 'block w-full text-left text-red-400 hover:text-red-300 px-2 py-1 transition-colors';
        button.innerHTML = `
            <span class="text-xl mr-2">${tool.icon}</span>
            ${tool.name}
        `;
        button.onclick = () => activateTool(toolId);
        menuItems.appendChild(button);
    }
}

function hideToolMenu() {
    const menu = document.getElementById('tool-menu');
    if (menu) menu.remove();
}

function activateTool(toolId) {
    switch(toolId) {
        case 'frame-materials':
            activateFrameMaterials();
            break;
        case 'foundation-materials':
            // Show foundation grid and controls
            break;
        case 'roof-materials':
            // Show roof editor
            break;
        case 'wall-editor':
            // Show wall placement controls
            break;
    }
}

function activateFrameMaterials() {
    isFrameMaterialsActive = true;
    visualizeFrameMaterials();
    if (snapGridHelper) snapGridHelper.visible = true;
}

function visualizeFrameMaterials() {
    // Clear existing frame elements
    scene.children = scene.children.filter(child => !child.userData.isFrameMaterial);
    
    const length = parseFloat(document.getElementById('length').value) || 20;
    const width = parseFloat(document.getElementById('width').value) || 20;
    const height = parseFloat(document.getElementById('height').value) || 8;
    const spacing = 16 / 12; // 16 inches in feet

    // Function to create a wall of vertical studs
    function createWall(startX, startZ, wallLength, isLengthWise) {
        const studCount = Math.floor(wallLength / spacing);
        
        // Create vertical studs
        for (let i = 0; i <= studCount; i++) {
            const stud = createLumber('stud', height);
            if (isLengthWise) {
                stud.position.set(startX, height/2, startZ + (i * spacing));
                stud.rotation.y = Math.PI / 2;
            } else {
                stud.position.set(startX + (i * spacing), height/2, startZ);
            }
        }
    }

    // Create all four walls
    createWall(-width/2, -length/2, width, false);   // Front wall
    createWall(-width/2, length/2, width, false);    // Back wall
    createWall(-width/2, -length/2, length, true);   // Left wall
    createWall(width/2, -length/2, length, true);    // Right wall

    // Create plates
    function createPlates(y) {
        // Create front and back plates
        const frontPlate = createLumber('plate', width);
        frontPlate.rotation.x = Math.PI / 2;  // Lay flat
        frontPlate.position.set(0, y, -length/2);
        
        const backPlate = createLumber('plate', width);
        backPlate.rotation.x = Math.PI / 2;   // Lay flat
        backPlate.position.set(0, y, length/2);
        
        // Create side plates
        const leftPlate = createLumber('plate', length);
        leftPlate.rotation.set(Math.PI / 2, 0, Math.PI / 2);  // Lay flat
        leftPlate.position.set(-width/2, y, 0);
        
        const rightPlate = createLumber('plate', length);
        rightPlate.rotation.set(Math.PI / 2, 0, Math.PI / 2);  // Lay flat
        rightPlate.position.set(width/2, y, 0);
    }

    // Add bottom plate
    createPlates(LUMBER_DIMENSIONS.plate.height / 24);
    // Add top plate
    createPlates(height - LUMBER_DIMENSIONS.plate.height / 24);
}

function deactivateFrameMaterials() {
    isFrameMaterialsActive = false;
    if (snapGridHelper) snapGridHelper.visible = false;
}

function onWindowResize() {
    const container = document.getElementById('preview-container');
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

export function updatePreview() {
    const toolboxPos = toolboxMesh?.position.clone();
    
    // Clear the scene but save toolbox state
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }

    // Get dimensions from inputs
    const length = parseFloat(document.getElementById('length').value) || 20;
    const width = parseFloat(document.getElementById('width').value) || 20;
    const height = parseFloat(document.getElementById('height').value) || 8;

    // Add grid helper
    const gridSize = Math.max(length, width) * 2;
    const gridDiv = 20;
    const grid = new THREE.GridHelper(gridSize, gridDiv, 0x444444, 0x222222);
    scene.add(grid);

    // Add dimension axes
    const axesHelper = new THREE.AxesHelper(Math.max(length, width, height));
    scene.add(axesHelper);

    // Create geometries for all frames
    const frameGeometry = new THREE.BoxGeometry(length, height, width);
    const foundationGeometry = new THREE.BoxGeometry(length + 2, 1, width + 2); // Slightly larger
    const roofGeometry = new THREE.BoxGeometry(length + 1, 1, width + 1);      // Slightly larger

    // Create frame boxes
    // Main frame (red)
    const mainFrame = new THREE.LineSegments(
        new THREE.EdgesGeometry(frameGeometry),
        new THREE.LineBasicMaterial({ color: 0xff4444 })
    );
    mainFrame.position.y = height / 2; // Move up by half height to sit on grid
    scene.add(mainFrame);

    // Foundation frame (green)
    const foundationFrame = new THREE.LineSegments(
        new THREE.EdgesGeometry(foundationGeometry),
        new THREE.LineBasicMaterial({ color: 0x00ff00 })
    );
    foundationFrame.position.y = -0.5; // Move slightly below grid
    scene.add(foundationFrame);

    // Roof frame (blue)
    const roofFrame = new THREE.LineSegments(
        new THREE.EdgesGeometry(roofGeometry),
        new THREE.LineBasicMaterial({ color: 0x0088ff })
    );
    roofFrame.position.y = height + 0.5; // Place on top of main frame
    scene.add(roofFrame);

    // Add snap grid with building size
    createSnapGrid(Math.max(length, width));
    
    if (isFrameMaterialsActive) {
        visualizeFrameMaterials();
    }

    // Restore lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 10);
    scene.add(directionalLight);

    // Restore toolbox
    createToolbox();
    if (toolboxPos) toolboxMesh.position.copy(toolboxPos);
}

// Update tab switching event listener
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const tabId = tab.getAttribute('data-tab');
        const toolsSidebar = document.getElementById('active-tools-sidebar');
        
        // Update active tab
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active', 'border-red-800', 'text-red-400');
            t.classList.add('text-gray-400', 'hover:text-gray-300');
        });
        tab.classList.add('active', 'border-red-800', 'text-red-400');
        tab.classList.remove('text-gray-400', 'hover:text-gray-300');
        
        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        const activeContent = document.getElementById(tabId);
        activeContent.classList.add('active');
        activeContent.style.display = 'block';
        
        // Show/hide tools sidebar based on preview tab
        if (tabId === 'preview') {
            if (!scene) {
                init();
            }
            toolsSidebar.classList.remove('hidden');
            updatePreview();
            showToolMenu(); // Update tools menu
        } else {
            toolsSidebar.classList.add('hidden');
        }
    });
});

// Add event listener for tool activation
window.addEventListener('activateTool', (event) => {
    const toolId = event.detail;
    activateTool(toolId);
});

export { scene };

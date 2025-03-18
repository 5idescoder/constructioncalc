const tools = [
    {
        id: 'frame-materials',
        name: 'Frame Layout',
        description: 'Show complete frame layout including studs, plates, and corners.',
        icon: '🔨'
    },
    {
        id: 'foundation-materials',
        name: 'Foundation Materials',
        description: 'Visualize and calculate foundation materials including footings and stem walls.',
        icon: '🏗️'
    },
    {
        id: 'roof-materials',
        name: 'Roof Materials',
        description: 'Calculate and visualize rafters, trusses, and roofing materials.',
        icon: '🏠'
    },
    {
        id: 'wall-editor',
        name: 'Wall Editor',
        description: 'Add and modify walls with custom dimensions and openings.',
        icon: '🧱'
    }
];

// Initialize activeTools from localStorage
let activeTools = new Set(JSON.parse(localStorage.getItem('activeTools') || '[]'));

function createToolCard(tool, isActive = false) {
    const card = document.createElement('div');
    card.className = 'tool-card';
    card.dataset.toolId = tool.id;
    
    if (isActive) {
        // Simple button layout for active tools
        card.innerHTML = `
            <button class="active-tool-button">
                <span class="text-2xl">${tool.icon}</span>
                <span class="font-medium">${tool.name}</span>
            </button>
        `;
        card.querySelector('button').onclick = () => activateTool(tool.id);
    } else {
        // Full card layout with description for available tools
        card.innerHTML = `
            <div class="flex items-center gap-3">
                <span class="text-2xl">${tool.icon}</span>
                <div class="flex-1">
                    <h3 class="text-gray-200 font-semibold">${tool.name}</h3>
                    <p class="text-gray-400 text-sm">${tool.description}</p>
                </div>
                <button class="tool-toggle px-3 py-1 rounded text-sm font-medium bg-green-700 hover:bg-green-800 text-white">
                    Add
                </button>
            </div>
        `;
        card.querySelector('.tool-toggle').onclick = () => toggleTool(tool, card);
    }
    
    return card;
}

function toggleTool(tool, card) {
    if (activeTools.has(tool.id)) {
        activeTools.delete(tool.id);
        card.classList.remove('added');
    } else {
        activeTools.add(tool.id);
        card.classList.add('added');
        
        // Animate to global toolbox
        const clone = card.cloneNode(true);
        const rect = card.getBoundingClientRect();
        const toolbox = document.getElementById('global-toolbox');
        const toolboxRect = toolbox.getBoundingClientRect();
        
        clone.style.position = 'fixed';
        clone.style.zIndex = '9999';
        clone.style.width = `${rect.width}px`;
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.transition = 'all 0.5s ease-out';
        document.body.appendChild(clone);
        
        requestAnimationFrame(() => {
            clone.style.transform = 'scale(0.95)';
            clone.style.top = `${toolboxRect.top + 10}px`;
            clone.style.left = `${toolboxRect.left + 10}px`;
            clone.style.width = `${toolboxRect.width - 20}px`;
        });
        
        setTimeout(() => {
            clone.remove();
            updateToolbox();
        }, 500);
    }
    
    localStorage.setItem('activeTools', JSON.stringify([...activeTools]));
    updateToolbox();
}

function updateToolbox() {
    const toolbox = document.getElementById('global-toolbox');
    if (!toolbox) return;
    
    toolbox.innerHTML = '';
    activeTools.forEach(toolId => {
        const tool = tools.find(t => t.id === toolId);
        if (tool) {
            // Create active tool version of card
            const activeCard = createToolCard(tool, true);
            toolbox.appendChild(activeCard);
        }
    });
}

function activateTool(toolId) {
    // Communicate with preview.js
    window.dispatchEvent(new CustomEvent('activateTool', { detail: toolId }));
}

function initTools() {
    const container = document.getElementById('available-tools');
    tools.forEach(tool => {
        container.appendChild(createToolCard(tool));
    });
}

// Export tools array for preview.js
export { initTools, activeTools, tools };

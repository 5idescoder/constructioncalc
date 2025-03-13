import { Scene3D } from './Scene3D.js';

class AI {
    constructor() {
        this.knowledge = {
            'transform': 'Transform tools let you move, rotate, and scale objects in 3D space. Use the gizmos or input exact values.',
            'grid': 'The grid helps with object alignment and scale reference. Each grid unit represents 1 meter by default.',
            'camera': 'Use left mouse to rotate, right mouse to pan, and scroll wheel to zoom the camera.',
            'materials': 'Materials define how objects look. You can adjust color, metalness, roughness, and other properties.',
            'scale': 'Scale adjusts object size. Use uniform scaling to maintain proportions.',
            'rotate': 'Rotation is measured in degrees. You can rotate around X (red), Y (green), or Z (blue) axis.',
            'position': 'Position moves objects in 3D space along X (left/right), Y (up/down), and Z (forward/back) axes.'
        };
    }

    getResponse(message) {
        message = message.toLowerCase();
        for (const [key, value] of Object.entries(this.knowledge)) {
            if (message.includes(key)) {
                return value;
            }
        }
        return "I'm not sure about that specific topic. Try asking about transform, grid, camera, materials, scale, rotate, or position.";
    }
}

export class UI {
    constructor() {
        this.scene3D = new Scene3D();
        this.setupTabSystem();
        this.setupToolbox();
        this.setupAIAssistant();
        this.ai = new AI();
    }

    setupTabSystem() {
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-panel').forEach(panel => {
                    panel.classList.remove('active');
                    panel.style.display = 'none';
                });

                // Add active class to clicked button and corresponding panel
                button.classList.add('active');
                const tabId = button.getAttribute('data-tab');
                const panel = document.getElementById(`${tabId}-tab`);
                if (panel) {
                    panel.classList.add('active');
                    panel.style.display = 'block';

                    // Initialize 3D scene if switching to builder tab
                    if (tabId === 'builder') {
                        requestAnimationFrame(() => this.scene3D.init());
                    }
                }
            });
        });
    }

    setupToolbox() {
        // Toolbox setup code will go here
    }

    setupAIAssistant() {
        const sendButton = document.querySelector('.send-button');
        const chatInput = document.querySelector('.chat-input');
        const chatArea = document.querySelector('.chat-area');

        if (sendButton && chatInput && chatArea) {
            sendButton.addEventListener('click', () => this.sendMessage(chatInput, chatArea));
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage(chatInput, chatArea);
                }
            });
        }
    }

    sendMessage(input, chatArea) {
        const message = input.value.trim();
        if (!message) return;

        this.addMessage(message, 'user', chatArea);
        input.value = '';

        const response = this.ai.getResponse(message);
        setTimeout(() => {
            this.addMessage(response, 'ai', chatArea);
        }, 500);
    }

    addMessage(text, type, chatArea) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = text;
        chatArea.appendChild(messageDiv);
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => new UI());

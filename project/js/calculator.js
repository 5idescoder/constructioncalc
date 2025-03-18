import { updatePreview, scene } from './preview.js';

function calculateMaterials() {
    const length = parseFloat(document.getElementById('length').value) || 0;
    const width = parseFloat(document.getElementById('width').value) || 0;
    const height = parseFloat(document.getElementById('height').value) || 0;
    const studLength = parseFloat(document.getElementById('studLength').value) || 8;
    const beamLength = parseFloat(document.getElementById('beamLength').value) || 8;

    if (length <= 0 || width <= 0 || height <= 0) {
        alert('Please enter valid dimensions greater than 0');
        return;
    }

    if (height > 10) {
        alert('Height cannot exceed 10 feet');
        return;
    }

    const perimeter = 2 * (length + width);
    const linearFeet = perimeter;
    const beamsNeeded = Math.ceil(perimeter / beamLength);
    const perimeterBeams = Math.ceil(perimeter / (2 * beamLength));
    const totalBeams = beamsNeeded + perimeterBeams;
    const studSpacing = 16 / 12;
    const wallLength = perimeter;
    const studsNeeded = Math.ceil(wallLength / studSpacing);
    const platesNeeded = Math.ceil(perimeter / studLength) * 2;
    const wallArea = perimeter * height;
    const sheetrockSheetArea = 32;
    const sheetrockNeeded = Math.ceil(wallArea / sheetrockSheetArea);

    const beamSpacing = 4;
    const interiorBeamPieces = Math.ceil((length / beamSpacing) + (width / beamSpacing));

    const studPrice = parseFloat(document.getElementById('studPrice').value) || 3.98;
    const prices = {
        stud: studPrice,
        plate: studPrice,
        beam: parseFloat(document.getElementById('beamPrice').value) || 12.98,
        sheetrock: parseFloat(document.getElementById('sheetrockPrice').value) || 15.98
    };

    const results = [
        {
            item: `2×4 Studs (16" spacing)`,
            quantity: studsNeeded,
            price: prices.stud,
            size: `2×4×${studLength}ft`
        },
        {
            item: '2×4 Top Plates',
            quantity: platesNeeded / 2,
            price: prices.plate,
            size: `2×4×${studLength}ft`
        },
        {
            item: '2×4 Bottom Plates',
            quantity: platesNeeded / 2,
            price: prices.plate,
            size: `2×4×${studLength}ft`
        },
        {
            item: '2×6 Perimeter Beams (Double Layer)',
            quantity: perimeterBeams * 2,
            price: prices.beam,
            size: `2×6×${beamLength}ft`,
            note: 'Two 2×6 beams nailed and screwed together'
        },
        {
            item: '2×6 Interior Support Beams (4ft spacing)',
            quantity: interiorBeamPieces,
            price: prices.beam,
            size: `2×6×${beamLength}ft`,
            note: 'Single 2×6 beams placed every 4 feet'
        },
        {
            item: '4×8 Sheetrock Sheets',
            quantity: sheetrockNeeded,
            price: prices.sheetrock,
            size: '4×8ft'
        }
    ];

    displayResults(results);
    if (typeof scene !== 'undefined' && scene) {
        updatePreview();
    }
}

function displayResults(results) {
    const resultsList = document.getElementById('resultsList');
    const resultsDiv = document.getElementById('results');
    const totalCostDiv = document.getElementById('totalCost');
    
    resultsList.innerHTML = '';
    let totalCost = 0;

    results.forEach(result => {
        const cost = result.quantity * result.price;
        totalCost += cost;
        
        const li = document.createElement('li');
        li.className = 'border-b border-gray-700 pb-4';
        li.innerHTML = `
            <div>
                <span class="text-gray-300">${result.item}: ${result.quantity} pieces (${result.size})</span>
                ${result.note ? `<br><span class="text-gray-500 text-sm">${result.note}</span>` : ''}
            </div>
            <div class="text-red-400 mt-1">$${cost.toFixed(2)} ($${result.price.toFixed(2)}/piece)</div>
        `;
        resultsList.appendChild(li);
    });

    totalCostDiv.textContent = `Total Cost: $${totalCost.toFixed(2)}`;
    resultsDiv.classList.remove('hidden');
}

// Add event listeners
document.querySelectorAll('input').forEach(input => {
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            calculateMaterials();
        }
    });
});

// Export first, then make global
export { calculateMaterials };
window.calculateMaterials = calculateMaterials;

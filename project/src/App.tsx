import React, { useState, useRef } from 'react';
import { Calculator, Box } from 'lucide-react';
import { Canvas } from '@react-three/fiber';
import { WallPreview } from './components/WallPreview';

interface CalculationResults {
  studs: number;
  topPlates: number;
  bottomPlates: number;
  beams: number;
  sheetrock: number;
  linearFeet: number;
  totalBeams: number;
  totalCost: number;
  materialSizes: {
    studs: string;
    plates: string;
    beams: string;
    sheetrock: string;
  };
}

function App() {
  const [length, setLength] = useState<number>(20);
  const [width, setWidth] = useState<number>(20);
  const [height, setHeight] = useState<number>(8);
  const [activeTab, setActiveTab] = useState<'calculator' | '3d'>('calculator');
  const [results, setResults] = useState<CalculationResults | null>(null);
  const [customPrices, setCustomPrices] = useState({
    stud: 3.98,
    plate: 3.98,
    beam: 12.98,
    sheetrock: 15.98
  });
  const [customDimensions, setCustomDimensions] = useState({
    studLength: 8,
    beamLength: 8
  });
  const previewRef = useRef<{ updatePreview: () => void }>(null);

  const [doors, setDoors] = useState([]);
  const [windows, setWindows] = useState([]);

  const addDoor = () => {
    setDoors([...doors, { width: 80, height: 200, x: 0, y: 0 }]);
  };

  const addWindow = () => {
    setWindows([...windows, { width: 100, height: 100, x: 0, y: 0 }]);
  };

  const updateDoor = (index, updatedDoor) => {
    const newDoors = [...doors];
    newDoors[index] = updatedDoor;
    setDoors(newDoors);
  };

  const updateWindow = (index, updatedWindow) => {
    const newWindows = [...windows];
    newWindows[index] = updatedWindow;
    setWindows(newWindows);
  };

  const calculateMaterials = () => {
    if (length <= 0 || width <= 0 || height <= 0) {
      alert('Please enter valid dimensions greater than 0');
      return;
    }

    const perimeter = 2 * (length + width);
    const linearFeet = perimeter;
    
    // Calculate studs (24" spacing)
    const studSpacing = 24 / 12; // Convert 24 inches to feet
    const longWallStuds = Math.ceil(length / studSpacing) + 1; // Add 1 for end stud
    const shortWallStuds = Math.ceil(width / studSpacing) + 1; // Add 1 for end stud
    const totalStuds = (longWallStuds * 2) + (shortWallStuds * 2); // Two long walls + two short walls
    
    // Calculate plates
    const platesPerWall = Math.ceil(perimeter / customDimensions.studLength);
    const totalPlates = platesPerWall * 2; // Top and bottom plates
    
    // Calculate beams (4ft spacing)
    const beamSpacing = 4; // 4 feet
    const longWallBeams = Math.ceil(length / beamSpacing) + 1;
    const shortWallBeams = Math.ceil(width / beamSpacing) + 1;
    const totalBeams = (longWallBeams * 2) + (shortWallBeams * 2);
    
    // Calculate sheetrock (4x8 sheets = 32 sq ft per sheet)
    const wallArea = perimeter * height;
    const sheetrockSheetArea = 32; // 4x8 = 32 sq ft
    const sheetrockNeeded = Math.ceil(wallArea / sheetrockSheetArea);

    setResults({
      studs: totalStuds,
      topPlates: totalPlates / 2,
      bottomPlates: totalPlates / 2,
      beams: totalBeams,
      sheetrock: sheetrockNeeded,
      linearFeet,
      totalBeams,
      totalCost: 
        totalStuds * customPrices.stud +
        totalPlates * customPrices.plate +
        totalBeams * customPrices.beam +
        sheetrockNeeded * customPrices.sheetrock,
      materialSizes: {
        studs: `2×6×${customDimensions.studLength}ft`,
        plates: `2×4×${customDimensions.studLength}ft`,
        beams: `2×6×${customDimensions.beamLength}ft`,
        sheetrock: '4×8ft'
      }
    });

    // Switch to 3D preview tab after calculation
    setActiveTab('3d');
  };

  const handleDimensionChange = (value: number, setter: (value: number) => void) => {
    setter(value);
    if (activeTab === '3d') {
      // Allow a small delay for state to update
      setTimeout(() => {
        if (previewRef.current) {
          previewRef.current.updatePreview();
        }
      }, 0);
    }
  };

  return (
    <div className="min-h-screen bg-[#2b1717] bg-gradient-to-br from-[#2b1717] via-black to-[#8b0000] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="flex border-b border-gray-700">
          <button
            className={`flex-1 py-4 px-6 text-center ${
              activeTab === 'calculator'
                ? 'border-b-2 border-red-800 text-red-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('calculator')}
          >
            <Calculator className="h-5 w-5 inline-block mr-2" />
            Calculator
          </button>
          <button
            className={`flex-1 py-4 px-6 text-center ${
              activeTab === '3d'
                ? 'border-b-2 border-red-800 text-red-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
            onClick={() => setActiveTab('3d')}
          >
            <Box className="h-5 w-5 inline-block mr-2" />
            3D Preview
          </button>
        </div>

        {activeTab === 'calculator' ? (
          <div className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-center mb-6">
                <Calculator className="h-8 w-8 text-red-400 mr-2" />
                <h1 className="text-2xl font-bold text-gray-200">MetaTims Construction Calculator</h1>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-gray-300 mb-4">Room Dimensions</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Length (feet)
                      </label>
                      <input
                        type="number"
                        value={length}
                        onChange={(e) => handleDimensionChange(Number(e.target.value), setLength)}
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-red-800 focus:ring focus:ring-red-800 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Width (feet)
                      </label>
                      <input
                        type="number"
                        value={width}
                        onChange={(e) => handleDimensionChange(Number(e.target.value), setWidth)}
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-red-800 focus:ring focus:ring-red-800 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Height (feet)
                      </label>
                      <input
                        type="number"
                        value={height}
                        max={10}
                        onChange={(e) => handleDimensionChange(Number(e.target.value), setHeight)}
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-red-800 focus:ring focus:ring-red-800 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-300 mb-4">Material Lengths</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        2×4 Stud/Plate Length (feet)
                      </label>
                      <input
                        type="number"
                        value={customDimensions.studLength}
                        onChange={(e) => setCustomDimensions(prev => ({ ...prev, studLength: Number(e.target.value) }))}
                        step="0.5"
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-red-800 focus:ring focus:ring-red-800 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        2×6 Beam Length (feet)
                      </label>
                      <input
                        type="number"
                        value={customDimensions.beamLength}
                        onChange={(e) => setCustomDimensions(prev => ({ ...prev, beamLength: Number(e.target.value) }))}
                        step="0.5"
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-red-800 focus:ring focus:ring-red-800 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-medium text-gray-300 mb-4">Material Prices ($ per piece)</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        2×4 Price (Studs & Plates)
                      </label>
                      <input
                        type="number"
                        value={customPrices.stud}
                        onChange={(e) => setCustomPrices(prev => ({ ...prev, stud: Number(e.target.value), plate: Number(e.target.value) }))}
                        step="0.01"
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-red-800 focus:ring focus:ring-red-800 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        2×6 Beam Price
                      </label>
                      <input
                        type="number"
                        value={customPrices.beam}
                        onChange={(e) => setCustomPrices(prev => ({ ...prev, beam: Number(e.target.value) }))}
                        step="0.01"
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-red-800 focus:ring focus:ring-red-800 focus:ring-opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300">
                        Sheetrock Price
                      </label>
                      <input
                        type="number"
                        value={customPrices.sheetrock}
                        onChange={(e) => setCustomPrices(prev => ({ ...prev, sheetrock: Number(e.target.value) }))}
                        step="0.01"
                        className="mt-1 block w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:border-red-800 focus:ring focus:ring-red-800 focus:ring-opacity-50"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={calculateMaterials}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-800 hover:bg-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-800 mt-6"
                >
                  Calculate Materials
                </button>

                {results && (
                  <div className="mt-6 bg-gray-900 p-6 rounded-lg">
                    <h2 className="text-xl font-semibold text-red-400 mb-4">Material Breakdown</h2>
                    <div className="space-y-4">
                      <div className="border-b border-gray-700 pb-4">
                        <div className="text-gray-300">2×6 Studs (24" spacing): {results.studs} pieces ({results.materialSizes.studs})</div>
                        )
                        <div className="text-red-400 mt-1">${(results.studs * customPrices.stud).toFixed(2)}</div>
                      </div>
                      <div className="border-b border-gray-700 pb-4">
                        <div className="text-gray-300">2×4 Top Plates: {results.topPlates} pieces ({results.materialSizes.plates})</div>
                        <div className="text-red-400 mt-1">${(results.topPlates * customPrices.plate).toFixed(2)}</div>
                      </div>
                      <div className="border-b border-gray-700 pb-4">
                        <div className="text-gray-300">2×4 Bottom Plates: {results.bottomPlates} pieces ({results.materialSizes.plates})</div>
                        <div className="text-red-400 mt-1">${(results.bottomPlates * customPrices.plate).toFixed(2)}</div>
                      </div>
                      <div className="border-b border-gray-700 pb-4">
                        <div className="text-gray-300">2×6 Beams (4ft spacing): {results.beams} pieces ({results.materialSizes.beams})</div>
                        <div className="text-gray-300 text-sm mt-1">Includes perimeter and interior support beams</div>
                        <div className="text-red-400 mt-1">${(results.beams * customPrices.beam).toFixed(2)}</div>
                      </div>
                      <div className="border-b border-gray-700 pb-4">
                        <div className="text-gray-300">Sheetrock Sheets: {results.sheetrock} pieces ({results.materialSizes.sheetrock})</div>
                        <div className="text-red-400 mt-1">${(results.sheetrock * customPrices.sheetrock).toFixed(2)}</div>
                      </div>
                    </div>
                    <div className="text-xl font-semibold text-red-400 mt-4">
                      Total Cost: ${results.totalCost.toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="relative h-[600px]">
            <Canvas>
              <WallPreview length={length} width={width} height={height} doors={doors} windows={windows} updateDoor={updateDoor} updateWindow={updateWindow} />
            </Canvas>
            <button onClick={addDoor}>Add Door</button>
            <button onClick={addWindow}>Add Window</button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
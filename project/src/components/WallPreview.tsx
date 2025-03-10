import { useRef, useState, useEffect } from 'react';
import { Vector3, Color, Group } from 'three';
import { useFrame, Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';

interface WallPreviewProps {
  length: number;
  width: number;
  height: number;
  doors: { x: number; y: number; width: number; height: number }[];
  windows: { x: number; y: number; width: number; height: number }[];
  updateDoor: (index: number, door: { x: number; y: number; width: number; height: number }) => void;
  updateWindow: (index: number, window: { x: number; y: number; width: number; height: number }) => void;
}

type MaterialType = 'stud' | 'beam' | 'plate' | 'joist' | 'wall' | 'window' | 'door';

interface LumberPiece {
  position: Vector3;
  rotation: Vector3;
  dimensions: Vector3;
  type: MaterialType;
  id: string;
}

const COLORS = {
  stud: new Color('#8B4513'),    // Saddle Brown for studs
  beam: new Color('#4169E1'),    // Royal Blue for beams
  plate: new Color('#DEB887'),   // Burlywood for plates
  joist: new Color('#9370DB'),   // Medium Purple for floor joists
  wall: new Color('#A0522D'),    // Sienna for walls
  window: new Color('#87CEEB'),  // Sky Blue for windows
  door: new Color('#8B0000'),    // Dark Red for doors
};

const LUMBER_DIMENSIONS = {
  stud: { width: 1.5, height: 5.5 },   // 2x6 (actual dimensions)
  beam: { width: 1.5, height: 5.5 },   // 2x6 (actual dimensions)
  plate: { width: 1.5, height: 3.5 },  // 2x4 (actual dimensions)
  joist: { width: 1.5, height: 5.5 },  // 2x6 (actual dimensions)
  wall: { width: 3.5, height: 8 },     // Wall thickness
  window: { width: 3, height: 4 },     // Standard window size
  door: { width: 3, height: 6.67 },    // Standard door size (3x6'8")
};

export function WallPreview({ length = 0, width = 0, height = 0, doors, windows, updateDoor, updateWindow }: WallPreviewProps) {
  const groupRef = useRef<Group>(null);
  const [lumber, setLumber] = useState<LumberPiece[]>([]);
  const [hoveredPiece, setHoveredPiece] = useState<string | null>(null);
  const [selectedStud, setSelectedStud] = useState<string | null>(null);
  const [walls, setWalls] = useState<LumberPiece[]>([]);
  const [openings, setOpenings] = useState<LumberPiece[]>([]);
  const [placementMode, setPlacementMode] = useState<'wall' | 'window' | 'door'>('wall');

  const generateId = () => Math.random().toString(36).substring(2, 11); // Updated method

  const handleStudClick = (studId: string) => {
    const stud = lumber.find(piece => piece.id === studId && piece.type === 'stud');
    if (!stud) return;

    if (placementMode === 'wall') {
      setSelectedStud(studId);
      const wallId = generateId();
      const wallHeight = height;
      const wallWidth = 8; // 8 feet wide wall section
      const wallThickness = LUMBER_DIMENSIONS.wall.width / 12;

      const wallPiece: LumberPiece = {
        id: wallId,
        position: new Vector3(
          stud.position.x,
          wallHeight / 2,
          stud.position.z
        ),
        rotation: stud.rotation,
        dimensions: new Vector3(
          wallThickness,
          wallHeight,
          wallWidth
        ),
        type: 'wall'
      };

      setWalls(prevWalls => [...prevWalls, wallPiece]);
    } else {
      // Add window or door
      const openingType = placementMode;
      const openingDimensions = LUMBER_DIMENSIONS[openingType];
      const openingHeight = openingType === 'door' ? openingDimensions.height : openingDimensions.height;
      const openingWidth = openingDimensions.width;
      
      const openingPiece: LumberPiece = {
        id: generateId(),
        position: new Vector3(
          stud.position.x,
          openingType === 'door' ? openingHeight / 2 : height / 2,
          stud.position.z
        ),
        rotation: stud.rotation,
        dimensions: new Vector3(
          0.5, // Thickness
          openingHeight,
          openingWidth
        ),
        type: openingType
      };

      setOpenings(prevOpenings => [...prevOpenings, openingPiece]);
    }
  };

  useEffect(() => {
    if (length <= 0 || width <= 0 || height <= 0) return;

    const newLumber: LumberPiece[] = [];

    // Add floor joists (24" spacing - 2 feet)
    const joistSpacing = 24; // 2 feet in inches
    const joistCount = Math.ceil((width * 12) / joistSpacing) + 1;
    for (let i = 0; i < joistCount; i++) {
      const z = i * (joistSpacing / 12) - width / 2;
      newLumber.push({
        id: generateId(),
        position: new Vector3(0, LUMBER_DIMENSIONS.joist.height / 24, z),
        rotation: new Vector3(0, 0, 0),
        dimensions: new Vector3(
          length,
          LUMBER_DIMENSIONS.joist.height / 12,
          LUMBER_DIMENSIONS.joist.width / 12
        ),
        type: 'joist'
      });
    }

    // Add wall studs (24" spacing - 2 feet)
    const studSpacing = 24; // 2 feet in inches
    for (let wall = 0; wall < 4; wall++) {
      const isLongWall = wall % 2 === 0;
      const wallLength = isLongWall ? length : width;
      const studCount = Math.ceil((wallLength * 12) / studSpacing) + 1;

      for (let i = 0; i < studCount; i++) {
        const x = isLongWall
          ? i * (studSpacing / 12) - length / 2
          : (wall === 1 ? width / 2 : -width / 2);
        const z = isLongWall
          ? (wall === 0 ? -width / 2 : width / 2)
          : i * (studSpacing / 12) - width / 2;

        newLumber.push({
          id: generateId(),
          position: new Vector3(x, height / 2, z),
          rotation: new Vector3(0, isLongWall ? 0 : Math.PI / 2, 0),
          dimensions: new Vector3(
            LUMBER_DIMENSIONS.stud.width / 12,
            height,
            LUMBER_DIMENSIONS.stud.height / 12
          ),
          type: 'stud'
        });
      }
    }

    // Add plates (top and bottom)
    ['top', 'bottom'].forEach(plateType => {
      const y = plateType === 'top' ? height - LUMBER_DIMENSIONS.plate.height / 24 : LUMBER_DIMENSIONS.plate.height / 24;
      
      for (let wall = 0; wall < 4; wall++) {
        const isLongWall = wall % 2 === 0;
        newLumber.push({
          id: generateId(),
          position: new Vector3(
            isLongWall ? 0 : (wall === 1 ? width / 2 : -width / 2),
            y,
            isLongWall ? (wall === 0 ? -width / 2 : width / 2) : 0
          ),
          rotation: new Vector3(0, isLongWall ? 0 : Math.PI / 2, 0),
          dimensions: new Vector3(
            isLongWall ? length : LUMBER_DIMENSIONS.plate.width / 12,
            LUMBER_DIMENSIONS.plate.height / 12,
            isLongWall ? LUMBER_DIMENSIONS.plate.width / 12 : width
          ),
          type: 'plate'
        });
      }
    });

    // Add beams (4ft spacing)
    const beamSpacing = 48; // 4 feet in inches
    for (let wall = 0; wall < 4; wall++) {
      const isLongWall = wall % 2 === 0;
      const wallLength = isLongWall ? length : width;
      const beamCount = Math.ceil((wallLength * 12) / beamSpacing) + 1;

      for (let i = 0; i < beamCount; i++) {
        const x = isLongWall
          ? i * (beamSpacing / 12) - length / 2
          : (wall === 1 ? width / 2 : -width / 2);
        const z = isLongWall
          ? (wall === 0 ? -width / 2 : width / 2)
          : i * (beamSpacing / 12) - width / 2;

        newLumber.push({
          id: generateId(),
          position: new Vector3(x, height / 2, z),
          rotation: new Vector3(0, isLongWall ? 0 : Math.PI / 2, 0),
          dimensions: new Vector3(
            LUMBER_DIMENSIONS.beam.width / 12,
            height,
            LUMBER_DIMENSIONS.beam.height / 12
          ),
          type: 'beam'
        });
      }
    }

    setLumber(newLumber);
  }, [length, width, height]);

  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.001;
    }
  });

  return (
    <>
      <div className="fixed top-4 right-4 z-50 bg-gray-800 p-4 rounded-lg shadow-lg">
        <div className="flex flex-col gap-2">
          <button
            className={`px-4 py-2 rounded ${placementMode === 'wall' ? 'bg-red-800' : 'bg-gray-700'} text-white hover:bg-red-700 transition-colors`}
            onClick={() => setPlacementMode('wall')}
          >
            Add Wall
          </button>
          <button
            className={`px-4 py-2 rounded ${placementMode === 'window' ? 'bg-red-800' : 'bg-gray-700'} text-white hover:bg-red-700 transition-colors`}
            onClick={() => setPlacementMode('window')}
          >
            Add Window
          </button>
          <button
            className={`px-4 py-2 rounded ${placementMode === 'door' ? 'bg-red-800' : 'bg-gray-700'} text-white hover:bg-red-700 transition-colors`}
            onClick={() => setPlacementMode('door')}
          >
            Add Door
          </button>
        </div>
      </div>

      <Canvas>
        <PerspectiveCamera makeDefault position={[50, 50, 50]} />
        <OrbitControls enableDamping dampingFactor={0.05} />
        
        <group ref={groupRef}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} />
          <directionalLight position={[-10, -10, -5]} intensity={0.8} />
          
          {/* Grid */}
          <gridHelper args={[Math.max(length, width) * 2, Math.max(length, width) * 2]} />
          
          {/* Lumber */}
          {lumber.map((piece) => (
            <mesh
              key={piece.id}
              position={piece.position}
              rotation={[piece.rotation.x, piece.rotation.y, piece.rotation.z]}
              onPointerOver={() => setHoveredPiece(piece.id)}
              onPointerOut={() => setHoveredPiece(null)}
              onClick={() => piece.type === 'stud' && handleStudClick(piece.id)}
            >
              <boxGeometry args={[piece.dimensions.x, piece.dimensions.y, piece.dimensions.z]} />
              <meshStandardMaterial 
                color={COLORS[piece.type]}
                roughness={0.6}
                metalness={0.2}
                emissive={hoveredPiece === piece.id || selectedStud === piece.id ? new Color('#444444') : new Color('#000000')}
                transparent={piece.type === 'stud'}
                opacity={selectedStud === piece.id ? 0.8 : 1}
              />
            </mesh>
          ))}

          {/* Walls */}
          {walls.map((wall) => (
            <mesh
              key={wall.id}
              position={wall.position}
              rotation={[wall.rotation.x, wall.rotation.y, wall.rotation.z]}
            >
              <boxGeometry args={[wall.dimensions.x, wall.dimensions.y, wall.dimensions.z]} />
              <meshStandardMaterial
                color={COLORS.wall}
                roughness={0.7}
                metalness={0.1}
                transparent={true}
                opacity={0.6}
              />
            </mesh>
          ))}

          {/* Windows and Doors */}
          {openings.map((opening) => (
            <mesh
              key={opening.id}
              position={opening.position}
              rotation={[opening.rotation.x, opening.rotation.y, opening.rotation.z]}
            >
              <boxGeometry args={[opening.dimensions.x, opening.dimensions.y, opening.dimensions.z]} />
              <meshStandardMaterial
                color={COLORS[opening.type]}
                roughness={0.3}
                metalness={0.6}
                transparent={true}
                opacity={0.8}
              />
            </mesh>
          ))}

          {/* Render doors */}
          {doors.map((door, index) => (
            <mesh
              key={index}
              position={[door.x, door.y, 0]}
              onPointerMove={(e) => {
                const { x, y } = e.point;
                updateDoor(index, { ...door, x, y });
              }}
            >
              <boxGeometry args={[door.width, door.height, 10]} />
              <meshStandardMaterial color="brown" />
            </mesh>
          ))}

          {/* Render windows */}
          {windows.map((window, index) => (
            <mesh
              key={index}
              position={[window.x, window.y, 0]}
              onPointerMove={(e) => {
                const { x, y } = e.point;
                updateWindow(index, { ...window, x, y });
              }}
            >
              <boxGeometry args={[window.width, window.height, 10]} />
              <meshStandardMaterial color="blue" />
            </mesh>
          ))}
        </group>
      </Canvas>
    </>
  );
}

export default WallPreview;
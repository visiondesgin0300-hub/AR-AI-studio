import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { Compass, Info, MapPin } from 'lucide-react';

interface FloorMapProps {
  selectedBook: Book | null;
  highlightedLocation: { floor: number; aisle: string; shelf: number } | null;
  onSelectBookByCoordinates: (floor: number, aisle: string, shelf: number) => void;
  books: Book[];
}

export default function FloorMap({
  selectedBook,
  highlightedLocation,
  onSelectBookByCoordinates,
  books
}: FloorMapProps) {
  const [currentFloor, setCurrentFloor] = useState<number>(1);

  // Sync floor automatically if a book is highlighted or selected
  useEffect(() => {
    if (highlightedLocation) {
      setCurrentFloor(highlightedLocation.floor);
    } else if (selectedBook) {
      setCurrentFloor(selectedBook.location.floor);
    }
  }, [selectedBook, highlightedLocation]);

  const floors = [
    { num: 1, name: 'Ground Floor / الدور الأول', genre: 'Science & History (العلوم والتاريخ)' },
    { num: 2, name: 'Second Floor / الدور الثاني', genre: 'Math & Computer Science (الرياضيات والحاسوب)' },
    { num: 3, name: 'Third Floor / الدور الثالث', genre: 'Literature, Philosophy & Art (الآداب والفنون)' }
  ];

  // Map coordinates of the aisles on the floor
  // Let the SVG viewbox represent 400x300
  const aisleCoords: { [floor: number]: { [aisle: string]: { x: number; y: number; width: number; height: number; name: string } } } = {
    1: {
      'A': { x: 60, y: 70, width: 40, height: 120, name: 'Aisle A (Physics)' },
      'C': { x: 300, y: 70, width: 40, height: 120, name: 'Aisle C (History)' }
    },
    2: {
      'A': { x: 60, y: 70, width: 40, height: 120, name: 'Aisle A (Advanced Math)' },
      'B': { x: 180, y: 70, width: 40, height: 120, name: 'Aisle B (Computer Science)' }
    },
    3: {
      'A': { x: 60, y: 70, width: 40, height: 120, name: 'Aisle A (Philosophy)' },
      'C': { x: 180, y: 70, width: 40, height: 120, name: 'Aisle C (Art)' },
      'D': { x: 300, y: 70, width: 40, height: 120, name: 'Aisle D (Classical Literature)' }
    }
  };

  // Entrance position
  const entrance = { x: 200, y: 270 };

  const getActiveAisleKey = (): string | null => {
    if (highlightedLocation && highlightedLocation.floor === currentFloor) {
      return highlightedLocation.aisle;
    }
    if (selectedBook && selectedBook.location.floor === currentFloor) {
      return selectedBook.location.aisle;
    }
    return null;
  };

  const activeAisleKey = getActiveAisleKey();
  const currentAisles = aisleCoords[currentFloor] || {};

  // Formulate the path from entrance to the selected Aisle
  const getNavPath = () => {
    if (!activeAisleKey || !currentAisles[activeAisleKey]) return '';
    const target = currentAisles[activeAisleKey];
    const targetX = target.x + target.width / 2;
    const targetY = target.y + target.height - 15; // Point near the bottom of aisle

    // Walk pattern: from entrance (200, 270) up to central corridor (y: 220), then left/right to x, then up to the shelf
    return `M ${entrance.x} ${entrance.y} L 200 220 L ${targetX} 220 L ${targetX} ${targetY}`;
  };

  // Find book belonging to specific Aisle to quick clicking
  const getAisleBooks = (aisleLetter: string) => {
    return books.filter(b => b.location.floor === currentFloor && b.location.aisle === aisleLetter);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm flex flex-col h-full" id="floor-map-container">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Compass className="w-5 h-5 text-indigo-600" />
            Indoor Navigation GPS / المخطط الداخلي للمكتبة
          </h2>
          <p className="text-sm text-slate-500">Real-time localized shelf search and routing vector paths.</p>
        </div>

        {/* Floor selectors */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {floors.map(f => (
            <button
              key={f.num}
              onClick={() => setCurrentFloor(f.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                currentFloor === f.num
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              F{f.num}
            </button>
          ))}
        </div>
      </div>

      {/* Floor description banner */}
      <div className="bg-indigo-50/50 rounded-xl px-4 py-3 mb-6 flex items-start gap-2.5 text-xs text-indigo-900 border border-indigo-50">
        <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-indigo-950">{floors.find(f => f.num === currentFloor)?.name}</p>
          <p className="text-indigo-800/80">Contains Categories: {floors.find(f => f.num === currentFloor)?.genre}</p>
        </div>
      </div>

      {/* Interactive Map Visualizer */}
      <div className="border border-slate-100 rounded-xl bg-slate-50 relative flex-1 flex items-center justify-center p-4 min-h-[300px]">
        {/* Entrance Pin HUD */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-0.5 pointer-events-none">
          <div className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-ping absolute" />
          <div className="w-2.5 h-2.5 bg-rose-600 rounded-full relative" />
          <span className="text-[10px] font-bold text-slate-400 bg-white/95 px-1.5 py-0.5 rounded shadow-sm border border-slate-100 uppercase">Entrance / المدخل</span>
        </div>

        <svg viewBox="0 0 400 300" className="w-full h-full max-h-[320px]">
          {/* Outer walls */}
          <rect x="10" y="10" width="380" height="280" rx="12" fill="none" stroke="#E2E8F0" strokeWidth="3" />
          <rect x="15" y="15" width="370" height="270" rx="8" fill="none" stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />

          {/* Lobby grid desk */}
          <g transform="translate(160, 240)">
            <rect width="80" height="20" rx="4" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
            <text x="40" y="13" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="bold">Main Desk / الاستقبال</text>
          </g>

          {/* Study Tables */}
          <rect x="170" y="150" width="60" height="35" rx="6" fill="#F1F5F9" stroke="#CBD5E1" strokeWidth="1" />
          <circle cx="180" cy="143" r="3" fill="#64748B" />
          <circle cx="200" cy="143" r="3" fill="#64748B" />
          <circle cx="220" cy="143" r="3" fill="#64748B" />
          <circle cx="180" cy="192" r="3" fill="#64748B" />
          <circle cx="200" cy="192" r="3" fill="#64748B" />
          <circle cx="220" cy="192" r="3" fill="#64748B" />
          <text x="200" y="172" textAnchor="middle" fill="#64748B" fontSize="8" fontWeight="medium">Study Area</text>

          {/* Render Aisles */}
          {Object.entries(currentAisles).map(([key, a]) => {
            const isActive = activeAisleKey === key;
            const aisleBooks = getAisleBooks(key);

            return (
              <g key={key} className="cursor-pointer" onClick={() => onSelectBookByCoordinates(currentFloor, key, 1)}>
                {/* Aisle Frame */}
                <rect
                  x={a.x}
                  y={a.y}
                  width={a.width}
                  height={a.height}
                  rx="6"
                  className={`transition-all duration-300 ${
                    isActive
                      ? 'fill-indigo-50 stroke-indigo-600 stroke-[2.5px] shadow-md'
                      : 'fill-white stroke-slate-200 hover:stroke-slate-400 stroke-1'
                  }`}
                />
                
                {/* Books shelf rows indicators inside the Aisle rect */}
                <line x1={a.x + 8} y1={a.y + 25} x2={a.x + a.width - 8} y2={a.y + 25} stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1={a.x + 8} y1={a.y + 55} x2={a.x + a.width - 8} y2={a.y + 55} stroke="#E2E8F0" strokeWidth="1.5" />
                <line x1={a.x + 8} y1={a.y + 85} x2={a.x + a.width - 8} y2={a.y + 85} stroke="#E2E8F0" strokeWidth="1.5" />

                {/* Highlight dot if active shelf match */}
                {isActive && (
                  <circle
                    cx={a.x + a.width / 2}
                    cy={a.y + 40}
                    r="8"
                    className="fill-indigo-600 animate-pulse"
                  />
                )}

                {/* Text identifier */}
                <text
                  x={a.x + a.width / 2}
                  y={a.y + a.height - 10}
                  textAnchor="middle"
                  className={`text-[9px] font-bold ${isActive ? 'fill-indigo-800' : 'fill-slate-500'}`}
                >
                  الرف {key}
                </text>
                
                {/* Top Section Title */}
                <text
                  x={a.x + a.width / 2}
                  y={a.y + 16}
                  textAnchor="middle"
                  className={`text-[8px] font-semibold tracking-wider ${isActive ? 'fill-indigo-600' : 'fill-slate-400'}`}
                >
                  Aisle {key}
                </text>
              </g>
            );
          })}

          {/* Render routing path vector if an aisle is active */}
          {activeAisleKey && (
            <g>
              <path
                d={getNavPath()}
                fill="none"
                stroke="#6366F1"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-indigo-600 animate-dash"
                style={{
                  strokeDasharray: '8',
                  strokeDashoffset: '100',
                  animation: 'dash 3s linear infinite'
                }}
              />
              {/* Highlight Pin over Aisle */}
              {(() => {
                const target = currentAisles[activeAisleKey];
                if (!target) return null;
                const pinX = target.x + target.width / 2;
                const pinY = target.y + 35;
                return (
                  <g transform={`translate(${pinX}, ${pinY - 14})`}>
                    <path
                      d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 12 8 12s8-6.75 8-12c0-4.42-3.58-8-8-8zm0 11c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"
                      fill="#EF4444"
                      transform="scale(0.7) translate(-12, -18)"
                    />
                    <circle cx="0" cy="-6" r="3" fill="white" />
                  </g>
                );
              })()}
            </g>
          )}
        </svg>

        <style>{`
          @keyframes dash {
            to {
              stroke-dashoffset: 0;
            }
          }
        `}</style>
      </div>

      {/* Floating HUD instructions */}
      <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <MapPin className="w-4 h-4 text-rose-500" />
          <span>
            {activeAisleKey ? (
              <span>
                Recommended Book at <strong>Floor {currentFloor}, Aisle {activeAisleKey}</strong>. Dotted navigation guide active.
              </span>
            ) : (
              <span>Click any physical Aisle shelf to discover books placed there.</span>
            )}
          </span>
        </div>

        {activeAisleKey && (
          <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded">
            PATH CALCULATED
          </span>
        )}
      </div>
    </div>
  );
}

// Where things can go on each map. Every round fills these spots differently
// (random type from the list, random chance to stay empty, a little jitter),
// so the room looks natural but never the same twice.
//
// Coordinates are world units (1600×1000). The matching floors, rugs, paths and
// pond are drawn by the client (client/components/MapBackground.tsx).

import type { MapId, PropType } from '../../shared';

export interface Spot {
  x: number;
  y: number;
  types: PropType[];
  /** Chance the spot is used (default 0.8). */
  fill?: number;
  /** Fixed rotation (degrees). Otherwise small items get a random tilt. */
  rot?: number;
}

const ring = (cx: number, cy: number, r: number, n: number, types: PropType[], fill = 0.7): Spot[] =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return { x: Math.round(cx + Math.cos(a) * r), y: Math.round(cy + Math.sin(a) * r * 0.7), types, fill };
  });

export const MAP_SPOTS: Record<MapId, Spot[]> = {
  living: [
    // big pieces
    { x: 800, y: 880, types: ['sofa'], fill: 1, rot: 0 },
    { x: 800, y: 70, types: ['tv'], fill: 1, rot: 0 },
    { x: 800, y: 520, types: ['coffeeTable'], fill: 1, rot: 0 },
    // corners
    { x: 90, y: 90, types: ['plant', 'lamp'] },
    { x: 1510, y: 90, types: ['plant', 'lamp'] },
    { x: 90, y: 910, types: ['plant', 'lamp'] },
    { x: 1510, y: 910, types: ['plant', 'lamp'] },
    // next to the sofa, and cushions on it
    { x: 590, y: 880, types: ['lamp', 'plant'], fill: 0.9 },
    { x: 1010, y: 880, types: ['lamp', 'plant'], fill: 0.9 },
    { x: 700, y: 880, types: ['cushion'], fill: 0.85 },
    { x: 800, y: 885, types: ['cushion'], fill: 0.5 },
    { x: 900, y: 880, types: ['cushion'], fill: 0.85 },
    // on the coffee table
    { x: 745, y: 500, types: ['mug', 'books', 'vase'] },
    { x: 855, y: 540, types: ['mug', 'books', 'vase'] },
    { x: 800, y: 505, types: ['vase', 'mug'], fill: 0.5 },
    // shelf along the TV wall
    { x: 380, y: 70, types: ['books', 'vase', 'plant'] },
    { x: 520, y: 70, types: ['books', 'vase', 'lamp'] },
    { x: 1080, y: 70, types: ['books', 'vase', 'lamp'] },
    { x: 1220, y: 70, types: ['books', 'vase', 'plant'] },
    // armchairs either side of the rug
    { x: 330, y: 520, types: ['chair'], fill: 0.95, rot: 90 },
    { x: 1270, y: 520, types: ['chair'], fill: 0.95, rot: -90 },
    { x: 330, y: 360, types: ['chair'], fill: 0.5, rot: 90 },
    // along the side walls
    { x: 70, y: 340, types: ['plant', 'books', 'cushion'] },
    { x: 70, y: 660, types: ['plant', 'books', 'lamp'] },
    { x: 1530, y: 340, types: ['plant', 'books', 'cushion'] },
    { x: 1530, y: 660, types: ['plant', 'books', 'lamp'] },
    // floor cushions and stray mugs
    { x: 560, y: 400, types: ['cushion'], fill: 0.6 },
    { x: 1040, y: 690, types: ['cushion', 'books'], fill: 0.6 },
    { x: 1200, y: 780, types: ['mug', 'books'], fill: 0.5 },
    { x: 420, y: 760, types: ['mug', 'vase'], fill: 0.4 },
  ],
  kitchen: [
    // counters, fridge, island and dining table
    { x: 320, y: 70, types: ['counter'], fill: 1, rot: 0 },
    { x: 960, y: 70, types: ['counter'], fill: 1, rot: 0 },
    { x: 1450, y: 85, types: ['fridge'], fill: 1, rot: 0 },
    { x: 200, y: 560, types: ['counter'], fill: 1, rot: 90 },
    { x: 860, y: 580, types: ['diningTable'], fill: 1, rot: 0 },
    // on the counters
    { x: 190, y: 70, types: ['toaster', 'pot', 'bottle', 'fruitBowl', 'mug', 'plant'] },
    { x: 320, y: 70, types: ['toaster', 'pot', 'bottle', 'fruitBowl', 'mug', 'plant'] },
    { x: 450, y: 70, types: ['toaster', 'pot', 'bottle', 'fruitBowl', 'mug', 'plant'] },
    { x: 830, y: 70, types: ['toaster', 'pot', 'bottle', 'fruitBowl', 'mug', 'plant'] },
    { x: 960, y: 70, types: ['toaster', 'pot', 'bottle', 'fruitBowl', 'mug', 'plant'] },
    { x: 1090, y: 70, types: ['toaster', 'pot', 'bottle', 'fruitBowl', 'mug', 'plant'] },
    // island items and stools
    { x: 200, y: 430, types: ['fruitBowl', 'pot', 'bottle', 'mug'] },
    { x: 200, y: 560, types: ['mug', 'bottle', 'plant'] },
    { x: 200, y: 690, types: ['pot', 'fruitBowl', 'toaster'] },
    { x: 320, y: 450, types: ['stool'], fill: 0.9 },
    { x: 320, y: 560, types: ['stool'], fill: 0.9 },
    { x: 320, y: 670, types: ['stool'], fill: 0.9 },
    // dining chairs
    { x: 680, y: 580, types: ['chair'], fill: 0.95, rot: 90 },
    { x: 1040, y: 580, types: ['chair'], fill: 0.95, rot: -90 },
    { x: 790, y: 450, types: ['chair'], fill: 0.85, rot: 180 },
    { x: 930, y: 450, types: ['chair'], fill: 0.85, rot: 180 },
    { x: 790, y: 710, types: ['chair'], fill: 0.85, rot: 0 },
    { x: 930, y: 710, types: ['chair'], fill: 0.85, rot: 0 },
    // on the dining table
    { x: 800, y: 560, types: ['fruitBowl', 'bottle', 'mug', 'pot'] },
    { x: 920, y: 600, types: ['fruitBowl', 'bottle', 'mug'] },
    { x: 860, y: 545, types: ['bottle', 'mug', 'plant'], fill: 0.5 },
    // corners and the right wall
    { x: 1520, y: 920, types: ['plant', 'stool'] },
    { x: 80, y: 920, types: ['plant', 'bottle'] },
    { x: 1450, y: 250, types: ['bottle', 'pot'], fill: 0.6 },
    { x: 1520, y: 450, types: ['plant', 'fruitBowl', 'pot'] },
    { x: 1520, y: 620, types: ['plant', 'fruitBowl', 'stool'] },
    { x: 1250, y: 880, types: ['stool', 'pot'], fill: 0.5 },
  ],
  park: [
    // trees and benches
    { x: 190, y: 190, types: ['tree'], fill: 1 },
    { x: 700, y: 140, types: ['tree'], fill: 0.9 },
    { x: 1370, y: 170, types: ['tree'], fill: 1 },
    { x: 1460, y: 820, types: ['tree'], fill: 1 },
    { x: 250, y: 830, types: ['tree'], fill: 0.9 },
    { x: 520, y: 330, types: ['bench'], fill: 1, rot: 0 },
    { x: 1180, y: 900, types: ['bench'], fill: 1, rot: 0 },
    // lamp posts along the path
    { x: 330, y: 330, types: ['lampPost'], fill: 0.9, rot: 0 },
    { x: 860, y: 330, types: ['lampPost'], fill: 0.9, rot: 0 },
    { x: 1150, y: 330, types: ['lampPost'], fill: 0.9, rot: 0 },
    // ducks on and around the pond
    ...ring(1000, 600, 170, 6, ['duck'], 0.65),
    // bushes and rocks
    { x: 90, y: 500, types: ['bush', 'rock'] },
    { x: 420, y: 600, types: ['bush', 'rock'] },
    { x: 620, y: 820, types: ['bush', 'rock'] },
    { x: 1520, y: 500, types: ['bush', 'rock'] },
    { x: 820, y: 900, types: ['bush', 'mushroom'] },
    { x: 520, y: 650, types: ['rock', 'mushroom'] },
    { x: 1290, y: 680, types: ['rock', 'mushroom', 'bush'] },
    // flowers and mushrooms
    { x: 150, y: 650, types: ['flower', 'mushroom'] },
    { x: 360, y: 470, types: ['flower', 'mushroom'] },
    { x: 690, y: 690, types: ['flower', 'mushroom'] },
    { x: 1320, y: 440, types: ['flower', 'mushroom'] },
    { x: 1540, y: 300, types: ['flower', 'mushroom'] },
    { x: 960, y: 860, types: ['flower', 'mushroom'] },
    { x: 450, y: 900, types: ['flower', 'mushroom'] },
    { x: 1020, y: 160, types: ['flower', 'bush'] },
    // bins by the benches
    { x: 650, y: 330, types: ['bin'], fill: 0.9, rot: 0 },
    { x: 1310, y: 900, types: ['bin'], fill: 0.9, rot: 0 },
  ],
};

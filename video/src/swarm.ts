// Where every logo tile sits on a given frame: first streaming left to right in
// rows, then spinning and spiralling into the centre where the brand mark
// appears. Pure functions of the frame, as Remotion renders frames out of order.

import { Easing, interpolate } from "remotion";

import { CENTER, SWARM, TIMELINE, VIDEO_HEIGHT, VIDEO_WIDTH } from "./constants";

export type TileSeed = {
  id: string;
  row: number;
  logoIndex: number;
  /** Position at frame 0. */
  startX: number;
  y: number;
  distance: number;
  /** Frames this tile waits, after convergeStart, before swirling in. */
  delay: number;
  spinDirection: 1 | -1;
};

export type TileFrame = {
  x: number;
  y: number;
  rotation: number;
  scale: number;
  opacity: number;
};

const PITCH = SWARM.tile + SWARM.gap;
const STRIP_WIDTH = SWARM.columns * PITCH;
const GRID_HEIGHT = SWARM.rows * SWARM.tile + (SWARM.rows - 1) * SWARM.gap;
const GRID_TOP = (VIDEO_HEIGHT - GRID_HEIGHT) / 2;
/** Strips start this far left, so that they still cover the frame after travelling. */
const STRIP_START = VIDEO_WIDTH - STRIP_WIDTH;

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const easeStream = Easing.out(Easing.cubic);
const easeConverge = Easing.inOut(Easing.cubic);
const easeSpin = Easing.in(Easing.quad);

function streamOffset(frame: number, distance: number): number {
  return interpolate(frame, [0, TIMELINE.streamEnd], [0, distance], { ...CLAMP, easing: easeStream });
}

/** Lays the rows out and decides when each tile leaves: the ones nearest the centre go first. */
export function seedTiles(logoCount: number): TileSeed[] {
  const seeds = Array.from({ length: SWARM.rows * SWARM.columns }, (_, i): Omit<TileSeed, "delay"> => {
    const row = i % SWARM.rows;
    const column = Math.floor(i / SWARM.rows);
    // Odd rows shift half a tile so the columns don't line up.
    const stagger = row % 2 === 1 ? PITCH / 2 : 0;
    return {
      id: `${row}-${column}`,
      row,
      logoIndex: i % logoCount,
      startX: STRIP_START + stagger + column * PITCH + SWARM.tile / 2,
      y: GRID_TOP + row * PITCH + SWARM.tile / 2,
      distance: SWARM.distance * SWARM.rowSpeeds[row],
      spinDirection: i % 2 === 0 ? 1 : -1,
    };
  });

  const distances = seeds.map((seed) => {
    const x = seed.startX + streamOffset(TIMELINE.convergeStart, seed.distance);
    return Math.hypot(x - CENTER.x, seed.y - CENTER.y);
  });
  const furthest = Math.max(...distances);

  return seeds.map((seed, i) => ({ ...seed, delay: (distances[i] / furthest) * TIMELINE.convergeStagger }));
}

export function tileAt(seed: TileSeed, frame: number): TileFrame {
  const start = TIMELINE.convergeStart + seed.delay;
  const progress = interpolate(frame, [start, start + TIMELINE.convergeDuration], [0, 1], {
    ...CLAMP,
    easing: easeConverge,
  });
  const spin = interpolate(frame, [start - TIMELINE.spinLead, start + TIMELINE.convergeDuration], [0, 1], {
    ...CLAMP,
    easing: easeSpin,
  });

  const dx = seed.startX + streamOffset(frame, seed.distance) - CENTER.x;
  const dy = seed.y - CENTER.y;
  const angle = progress * SWARM.swirl;
  const radius = 1 - progress;

  return {
    x: CENTER.x + (dx * Math.cos(angle) - dy * Math.sin(angle)) * radius,
    y: CENTER.y + (dx * Math.sin(angle) + dy * Math.cos(angle)) * radius,
    rotation: seed.spinDirection * spin * SWARM.turns * 360,
    scale: interpolate(progress, [0, 1], [1, SWARM.endScale]),
    opacity: interpolate(progress, [0.7, 1], [1, 0], CLAMP),
  };
}

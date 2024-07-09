import { createStore } from "solid-js/store";
import { LevelData, levels } from "./LevelData.ts";
import { IDENTITY } from "./Matrix.ts";

export type GameStore = {
  level: LevelData;
  paused: boolean;
  cameraMatrix: Float32Array;
  frame: number;
  // time in seconds, with ms precision
  time: number;
};

export function createGameStore() {
  return createStore<GameStore>({
    level: { ...levels[0] },
    paused: true,
    cameraMatrix: IDENTITY,
    frame: 0,
    time: 0,
  });
}

import { createStore } from "solid-js/store";
import { LevelData, levels } from "./LevelData.ts";
import { IDENTITY } from "./Matrix.ts";
import { BaseFrameTimer, FrameTimer } from "@grinstead/ambush";

export type GameStore = {
  level: LevelData;
  paused: boolean;
  cameraMatrix: Float32Array;
  levelTime: FrameTimer;
};

export function createGameStore() {
  const gameTime = new BaseFrameTimer();

  return createStore<GameStore>({
    level: { ...levels[0] },
    paused: true,
    cameraMatrix: IDENTITY,
    levelTime: gameTime.subtimer(),
  });
}

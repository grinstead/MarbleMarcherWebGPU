import { createStore } from "solid-js/store";
import { Docket } from "@grinstead/ambush";
import { Persisted } from "./Persisted.ts";
import { number, object, record, string } from "zod";

export type GameLoopTypes = "step";

export const ACTIVE_LEVEL_KEY = "most_recent";

export type KeyboardTask =
  | {
      type: "pressed";
      key: string;
    }
  | {
      type: "released";
      key: string;
    }
  | {
      type: "blur";
    };

export type GameTasks = {
  input: KeyboardTask;
  render: null;
};

export type LevelResult = {
  bestTime?: number;
};

export type GameSettings = {
  soundtrackVolume: number;
  soundsVolume: number;
};

export type GameStore = {
  level: number;
  paused: boolean;
  playing: boolean;
  loop: Docket<GameTasks, GameLoopTypes>;
};

export type PersistedData = {
  mostRecentlyPlayed: Persisted<string | undefined>;
  results: Persisted<Record<string, LevelResult>>;
  settings: Persisted<GameSettings>;
};

let _persisted: undefined | PersistedData;

export function persisted(): PersistedData {
  return (_persisted ??= {
    mostRecentlyPlayed: new Persisted(
      "mostRecentlyPlayed",
      string().optional(),
      (str) => str
    ),
    results: new Persisted(
      "results",
      string()
        .optional()
        .transform((str) => (str == null ? {} : JSON.parse(str)))
        .pipe(record(string(), object({ bestTime: number().optional() }))),
      JSON.stringify
    ),
    settings: new Persisted(
      "settings",
      string()
        .optional()
        .transform((str) => (str == null ? {} : JSON.parse(str)))
        .pipe(
          object({
            soundtrackVolume: number().min(0).max(1).default(1),
            soundsVolume: number().min(0).max(1).default(1),
          })
        ),
      JSON.stringify
    ),
  });
}

export function createGameStore() {
  return createStore<GameStore>({
    level: 0,
    paused: false,
    playing: false,
    loop: new Docket<GameTasks, GameLoopTypes>({
      input: { events: ["step"] },
      render: {},
    }),
  });
}

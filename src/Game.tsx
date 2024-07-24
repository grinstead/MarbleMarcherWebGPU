import { SetStoreFunction } from "solid-js/store";
import { GameStore, KeyboardTask } from "./GameStore.ts";
import { GameUI } from "./GameUI.tsx";
import { Level } from "./Level.tsx";
import {
  Show,
  createMemo,
  createSignal,
  onMount,
  untrack,
  useContext,
} from "solid-js";
import {
  GPUWorkQueueContext,
  GameLoop,
  GameLoopContext,
  useGameEngine,
} from "@grinstead/ambush";
import { levels } from "./LevelData.ts";
import { MainMenu } from "./MainMenu.tsx";
import { sounds } from "./hacks.ts";

export type GameProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function Game(props: GameProps) {
  const graphics = useContext(GPUWorkQueueContext)!;
  const gameloop = useContext(GameLoopContext)!;
  const engine = useGameEngine();

  const [isPlaying, setPlaying] = createSignal(false);

  onMount(() => {
    const { audio } = engine;
    for (const sound of Object.values(sounds)) {
      if (Array.isArray(sound)) {
        audio.preloadAll(sound);
      } else {
        audio.preload(sound);
      }
    }
  });

  let held = new Set<string>();

  const mainLoop = createMemo(() => {
    const { store, setStore } = props;
    const { loop } = store;
    const { timer } = gameloop;

    return renderLoopStep;

    function handleInput(e: KeyboardTask) {
      switch (e.type) {
        case "focus":
          setStore("paused", false);
          break;
        case "blur":
          setStore("paused", true);
          held.clear();
          break;
        case "pressed":
          held.add(e.key);
          break;
        case "released":
          held.delete(e.key);
          break;
        default:
          e satisfies never;
      }
    }

    function runEvents() {
      let task = loop.next();

      while (!task.done) {
        switch (task.category) {
          case "input":
            handleInput(task.value);
            break;
          case "render":
            // todo
            break;
          default:
            task satisfies never;
        }

        task = loop.next();
      }
    }

    function renderLoopStep() {
      runEvents();

      if (untrack(() => store.paused)) {
        timer.pause();
      }
    }
  });

  return (
    <>
      <GameLoop.Part step="main" work={mainLoop()} />
      <GameUI store={props.store}>
        <Show
          keyed
          when={isPlaying() && levels[props.store.level]}
          fallback={<MainMenu />}
        >
          {(level) => (
            <Level
              level={level}
              onVictory={() => {
                props.setStore("level", (prev) => prev + 1);
              }}
              heldKeys={held}
            />
          )}
        </Show>
      </GameUI>
      <GameLoop.Part
        passive
        step="render"
        work={() => {
          graphics.hasWork && graphics.runQueued();
        }}
      />
    </>
  );
}

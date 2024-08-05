import { SetStoreFunction } from "solid-js/store";
import {
  GameStore,
  KeyboardTask,
  ACTIVE_LEVEL_KEY,
  persisted,
} from "./GameStore.ts";
import { GameUI } from "./GameUI.tsx";
import {
  Show,
  batch,
  createMemo,
  createSignal,
  onMount,
  useContext,
} from "solid-js";
import {
  GPUWorkQueueContext,
  GameLoop,
  useGameEngine,
} from "@grinstead/ambush";
import { levels } from "./LevelData.ts";
import { genericFractal, MainMenu } from "./MainMenu.tsx";
import { sounds } from "./hacks.ts";
import { LevelWithIntro } from "./LevelWithIntro.tsx";
import { FractalProps } from "./Fractal.tsx";
import { PauseScreen } from "./PauseScreen.tsx";

export type GameProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function Game(props: GameProps) {
  const graphics = useContext(GPUWorkQueueContext)!;
  const engine = useGameEngine();

  const [fractal, setFractal] = createSignal<FractalProps>(genericFractal());
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
    const { store } = props;
    const { loop } = store;

    return renderLoopStep;

    function handleInput(e: KeyboardTask) {
      switch (e.type) {
        case "blur":
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
    }
  });

  function handlePlay(fractal: FractalProps) {
    let mostRecent = persisted().mostRecentlyPlayed.get();
    let mostRecentIndex =
      mostRecent != null ? levels.findIndex((l) => l.title === mostRecent) : -1;

    if (mostRecentIndex < 0) {
      mostRecent = levels[0].title;
      mostRecentIndex = 0;
    }

    batch(() => {
      persisted().mostRecentlyPlayed.set(mostRecent);
      const prev = persisted().results.get();
      if (!prev[mostRecent!]) {
        persisted().results.set({ ...prev, [mostRecent!]: {} });
      }

      props.setStore("level", mostRecentIndex);
      setPlaying(true);
      setFractal(fractal);
    });
  }

  return (
    <>
      <GameLoop.Part step="main" work={mainLoop()} />
      <GameUI store={props.store} setStore={props.setStore}>
        <Show
          keyed
          when={isPlaying() && levels[props.store.level]}
          fallback={<MainMenu onPlay={handlePlay} />}
        >
          {(level) => (
            <LevelWithIntro
              from={fractal()}
              level={level}
              onVictory={(state) => {
                const { level } = props.store;
                const next = level + 1;

                batch(() => {
                  setFractal(state.fractal);

                  const { mostRecentlyPlayed, results } = persisted();

                  let resultsVal = results.get();

                  const from = levels[level].title;
                  const { bestTime } = results.get()[from] ?? {};
                  if (bestTime == null || bestTime > state.time) {
                    resultsVal = {
                      ...resultsVal,
                      [from]: { bestTime: state.time },
                    };
                  }

                  if (next < levels.length) {
                    const to = levels[next].title;
                    if (!resultsVal.hasOwnProperty(to)) {
                      resultsVal = { ...resultsVal, [to]: {} };
                    }

                    props.setStore("level", next);
                    mostRecentlyPlayed.set(to);
                  } else {
                    setPlaying(false);
                    localStorage.removeItem(ACTIVE_LEVEL_KEY);
                    mostRecentlyPlayed.set(undefined);
                  }

                  results.set(resultsVal);
                });
              }}
              heldKeys={held}
            />
          )}
        </Show>
      </GameUI>
      <Show when={props.store.paused}>
        <PauseScreen store={props.store} setStore={props.setStore} />
      </Show>
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

import { SetStoreFunction } from "solid-js/store";
import { GameStore, KeyboardTask, persisted } from "./GameStore.ts";
import { GameUI } from "./GameUI.tsx";
import {
  Show,
  batch,
  createEffect,
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
import { MainMenu } from "./MainMenu.tsx";
import { sounds } from "./hacks.ts";
import { LevelWithIntro } from "./LevelWithIntro.tsx";
import { FractalProps, genericFractal } from "./Fractal.tsx";
import { PauseScreen } from "./PauseScreen.tsx";
import { usePersisted } from "./Persisted.ts";

export type GameProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function Game(props: GameProps) {
  const graphics = useContext(GPUWorkQueueContext)!;
  const engine = useGameEngine();

  const [fractal, setFractal] = createSignal<FractalProps>(genericFractal());

  const settings = usePersisted(persisted().settings);

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

  createEffect(() => {
    engine.audio.setVolume(settings().soundsVolume);
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

  function handlePlay(chosenLevel: number, fractal: FractalProps) {
    batch(() => {
      const title = levels[chosenLevel].title;
      persisted().mostRecentlyPlayed.set(title);
      const prev = persisted().results.get();
      if (!prev[title]) {
        persisted().results.set({ ...prev, [title]: {} });
      }

      props.setStore("level", chosenLevel);
      props.setStore("playing", true);
      setFractal(fractal);
    });
  }

  return (
    <>
      <GameLoop.Part step="main" work={mainLoop()} />
      <GameUI
        store={props.store}
        setStore={props.setStore}
        trapFocus={props.store.playing}
      >
        <Show
          keyed
          when={props.store.playing && levels[props.store.level]}
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
                  if (bestTime == null || bestTime > state.result.bestTime) {
                    resultsVal = {
                      ...resultsVal,
                      [from]: { bestTime: state.result.bestTime },
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
                    props.setStore("playing", false);
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

import { SetStoreFunction, unwrap } from "solid-js/store";
import { GameStore, KeyboardTask } from "./GameStore.ts";
import { GameUI } from "./GameUI.tsx";
import { Level } from "./Level.tsx";
import { Show, createMemo, untrack, useContext } from "solid-js";
import {
  GPUWorkQueueContext,
  GameLoop,
  GameLoopContext,
  VEC_ZERO,
  addVec,
  scale,
  vec,
  vecEqual,
} from "@grinstead/ambush";
import { MatrixBinary, rotateAboutY } from "./Matrix.ts";

export type GameProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function Game(props: GameProps) {
  const graphics = useContext(GPUWorkQueueContext)!;
  const gameloop = useContext(GameLoopContext)!;

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

  const levelTime = createMemo(() => {
    // compels us to recreate the level time every time the level data changes
    JSON.stringify(props.store.level);
    return gameloop.timer.subtimer();
  });

  return (
    <>
      <GameLoop.Part step="main" work={mainLoop()} />
      <GameUI store={props.store} setStore={props.setStore} />
      <Show keyed when={levelTime()}>
        {(timer) => (
          <Level level={props.store.level} timer={timer} heldKeys={held} />
        )}
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

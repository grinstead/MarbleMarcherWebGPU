import { SetStoreFunction } from "solid-js/store";
import { GameStore, GameTasks, KeyboardTask } from "./GameStore.ts";
import { GameUI } from "./GameUI.tsx";
import { Level } from "./Level.tsx";
import {
  batch,
  createEffect,
  createMemo,
  onCleanup,
  untrack,
  useContext,
} from "solid-js";
import {
  GPUWorkQueueContext,
  VEC_ZERO,
  addVec,
  scale,
  vec,
  vecEqual,
} from "@grinstead/ambush";

export type GameProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function Game(props: GameProps) {
  const graphics = useContext(GPUWorkQueueContext)!;

  let held = new Set<string>();

  let nextRenderLoop: undefined | ReturnType<typeof requestAnimationFrame>;

  const baseTimer = createMemo(() => props.store.levelTime.parent);

  createEffect(() => {
    console.log("New Loop", nextRenderLoop != null);
    if (nextRenderLoop != null) {
      cancelAnimationFrame(nextRenderLoop);
    }

    const { store, setStore } = props;
    const { loop } = store;
    const timer = baseTimer();

    let vMarble = VEC_ZERO;

    renderLoopStep();

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

    function moveMarble() {
      const dMarble = vec(
        (held.has("d") ? 1 : 0) - (held.has("a") ? 1 : 0),
        (held.has("w") ? 1 : 0) - (held.has("s") ? 1 : 0)
      );

      vMarble = addVec(vMarble, scale(dMarble, 0.01));

      if (!vecEqual(vMarble, VEC_ZERO)) {
        setStore("level", "marblePosition", (prev) => addVec(prev, vMarble));
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
      timer.markFrame();
      runEvents();
      moveMarble();

      if (graphics.hasWork) graphics.runQueued();

      if (untrack(() => store.paused)) {
        timer.pause();
      }

      nextRenderLoop = requestAnimationFrame(renderLoopStep);
    }
  });

  onCleanup(() => {
    if (nextRenderLoop != null) {
      console.log("loop cancelled");
      cancelAnimationFrame(nextRenderLoop);
    }
  });

  return (
    <>
      <Level {...props.store.level} time={props.store.levelTime} />
      <GameUI store={props.store} setStore={props.setStore} />
    </>
  );
}

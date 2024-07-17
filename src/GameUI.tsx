import {
  Vec,
  addVec,
  createMouseTracker,
  subtractVec,
} from "@grinstead/ambush";
import { Setter, createComputed } from "solid-js";
import { GameStore } from "./GameStore.ts";
import { classnames } from "@grinstead/classnames";

export type GameUIProps = {
  setMouseInput: Setter<Vec>;
  store: GameStore;
};

const PRIMARY_MOUSE_BUTTON = 1;

export function GameUI(props: GameUIProps) {
  const [mouse, trackMouseInElement] = createMouseTracker();

  createComputed<Vec | undefined>((prev) => {
    if (!mouse.tracked) return;

    const input = mouse.pos();
    if (!prev) return input;

    if (mouse.buttons() & PRIMARY_MOUSE_BUTTON) {
      const diff = subtractVec(input, prev);
      props.setMouseInput((curr) => addVec(curr, diff));
    }

    return input;
  });

  // createEffect<Vec>((prevPos) => {
  //   const pos = mouse.pos();

  //   if (!props.store.paused && mouse.buttons()) {
  //     let diff = prevPos ? subtractVec(pos, prevPos) : VEC_ZERO;

  //     diff = scale(diff, 1 / 320);
  //     translate(camera, diff.x, diff.y, 0);

  //     props.setStore("cameraMatrix", camera.snapshot());
  //   }

  //   return pos;
  // });

  return (
    <>
      <div
        ref={(div) => {
          trackMouseInElement(div);
          requestAnimationFrame(() => {
            div.focus();
          });
        }}
        tabIndex={1}
        onkeydown={(e) => {
          props.store.loop.add.input({ type: "pressed", key: e.key });
        }}
        onkeyup={(e) => {
          props.store.loop.add.input({ type: "released", key: e.key });
        }}
        onfocus={() => {
          props.store.loop.add.input({ type: "focus" });
        }}
        onblur={() => {
          props.store.loop.add.input({ type: "blur" });
        }}
        class={classnames("overlay", props.store.paused && "paused")}
      ></div>
    </>
  );
}

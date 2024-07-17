import { GameStore } from "./GameStore.ts";
import { classnames } from "@grinstead/classnames";

export type GameUIProps = {
  store: GameStore;
};

export function GameUI(props: GameUIProps) {
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

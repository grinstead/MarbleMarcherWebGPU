import {
  VEC_ZERO,
  Vec,
  addVec,
  createMouseTracker,
  scale,
  subtractVec,
  vec,
  xyzArray,
} from "@grinstead/ambush";
import {
  IDENTITY,
  MatrixBinary,
  rotateAboutX,
  rotateAboutY,
  translate,
} from "./Matrix.ts";
import { For, Show, createEffect, createRenderEffect } from "solid-js";
import { GameStore } from "./GameStore.ts";
import { SetStoreFunction } from "solid-js/store";
import { classnames } from "@grinstead/classnames";

export type GameUIProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function GameUI(props: GameUIProps) {
  const [mouse, trackMouseInElement] = createMouseTracker();

  const camera = new MatrixBinary();

  createRenderEffect(() => {
    const { marblePosition, startLookDirection, marbleRadius } =
      props.store.level;

    const cameraDistance = 15;

    camera.set(IDENTITY);
    rotateAboutX(camera, -0.3);
    rotateAboutY(camera, startLookDirection);

    let camPos = marblePosition;
    camPos = addVec(
      camPos,
      camera.multVec(vec(0, 0, marbleRadius * cameraDistance))
    );

    camPos = addVec(
      camPos,
      scale(camera.colY(), marbleRadius * cameraDistance * 0.1)
    );

    const mat = camera.snapshot();

    mat.set(xyzArray(camPos), 12);

    props.setStore("cameraMatrix", mat);
  });

  createEffect<Vec>((prevPos) => {
    const pos = mouse.pos();

    if (!props.store.paused && mouse.buttons()) {
      let diff = prevPos ? subtractVec(pos, prevPos) : VEC_ZERO;

      diff = scale(diff, 1 / 320);
      translate(camera, diff.x, diff.y, 0);

      props.setStore("cameraMatrix", camera.snapshot());
    }

    return pos;
  });

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
          if (e.key === "w") {
            translate(camera, 0, 0, 1 / 32);
            props.setStore("cameraMatrix", camera.snapshot());
          }
        }}
        onfocus={() => {
          props.setStore("paused", false);
        }}
        onblur={() => {
          props.setStore("paused", true);
        }}
        class={classnames("overlay", props.store.paused && "paused")}
      ></div>
    </>
  );
}

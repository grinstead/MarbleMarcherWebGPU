import {
  VEC_ZERO,
  Vec,
  createMouseTracker,
  scale,
  subtractVec,
} from "@grinstead/ambush";
import {
  MatrixBinary,
  rotateAboutX,
  rotateAboutY,
  translate,
} from "./Matrix.ts";
import { Setter, createEffect } from "solid-js";

export type GameUIProps = {
  setCameraMatrix: Setter<Float32Array>;
};

export function GameUI(props: GameUIProps) {
  const [mouse, trackMouseInElement] = createMouseTracker();

  const camera = new MatrixBinary();
  rotateAboutX(camera, -0.3);
  rotateAboutY(camera, -2.365);
  translate(camera, -3.40191, 4.14347, -3.48312);
  translate(camera, 0, 1, 0);

  props.setCameraMatrix(camera.snapshot());

  createEffect<Vec>((prevPos) => {
    const pos = mouse.pos();

    if (mouse.buttons()) {
      let diff = prevPos ? subtractVec(pos, prevPos) : VEC_ZERO;

      diff = scale(diff, 1 / 320);
      translate(camera, diff.x, diff.y, 0);

      props.setCameraMatrix(camera.snapshot());
    }

    return pos;
  });

  return (
    <div ref={trackMouseInElement} class="overlay">
      The game engine
    </div>
  );
}

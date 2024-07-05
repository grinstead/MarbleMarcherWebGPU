import {
  VEC_ZERO,
  Vec,
  createMouseTracker,
  scale,
  subtractVec,
} from "@grinstead/ambush";
import {
  IDENTITY,
  MatrixBinary,
  rotateAboutX,
  rotateAboutY,
  translate,
} from "./Matrix.ts";
import {
  For,
  Setter,
  createEffect,
  createRenderEffect,
  createSelector,
  createSignal,
} from "solid-js";
import { levels } from "./LevelData.ts";
import { GameStore } from "./GameStore.ts";
import { SetStoreFunction } from "solid-js/store";

export type GameUIProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function GameUI(props: GameUIProps) {
  const [mouse, trackMouseInElement] = createMouseTracker();

  const isSelected = createSelector(() => props.store.level.title);

  const camera = new MatrixBinary();

  createRenderEffect(() => {
    const { marblePosition, startLookDirection } = props.store.level;

    camera.set(IDENTITY);
    rotateAboutX(camera, -0.3);
    rotateAboutY(camera, startLookDirection);
    translate(camera, marblePosition.x, marblePosition.y, marblePosition.z);
    translate(camera, 0, 1, 0);
    props.setStore("cameraMatrix", camera.snapshot());
  });

  createEffect<Vec>((prevPos) => {
    const pos = mouse.pos();

    if (mouse.buttons()) {
      let diff = prevPos ? subtractVec(pos, prevPos) : VEC_ZERO;

      diff = scale(diff, 1 / 320);
      translate(camera, diff.x, diff.y, 0);

      props.setStore("cameraMatrix", camera.snapshot());
    }

    return pos;
  });

  return (
    <div ref={trackMouseInElement} class="overlay">
      <select
        oninput={(e) => {
          const { value } = e.target as HTMLSelectElement;
          props.setStore("level", levels[value as any as number]);
        }}
      >
        <For each={levels}>
          {(l, i) => (
            <option value={i()} selected={isSelected(l.title)}>
              {l.title}
            </option>
          )}
        </For>
      </select>
    </div>
  );
}

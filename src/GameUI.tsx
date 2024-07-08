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
  Show,
  createEffect,
  createRenderEffect,
  createSelector,
  createSignal,
} from "solid-js";
import { levels } from "./LevelData.ts";
import { GameStore } from "./GameStore.ts";
import { SetStoreFunction } from "solid-js/store";
import { classnames } from "@grinstead/classnames";

export type GameUIProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function GameUI(props: GameUIProps) {
  const [mouse, trackMouseInElement] = createMouseTracker();

  const initialSelected = props.store.level.title;

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

    if (!props.store.paused && mouse.buttons()) {
      let diff = prevPos ? subtractVec(pos, prevPos) : VEC_ZERO;

      diff = scale(diff, 1 / 320);
      translate(camera, diff.x, diff.y, 0);

      props.setStore("cameraMatrix", camera.snapshot());
    }

    return pos;
  });

  return (
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
    >
      <select
        tabIndex={2}
        oninput={(e) => {
          const { value } = e.target as HTMLSelectElement;
          const level = levels.find((l) => l.title === value);
          console.log("setting level", level);
          props.setStore("level", level!);
        }}
      >
        <For each={levels}>
          {(l) => (
            <option value={l.title} selected={l.title === initialSelected}>
              {l.title}
            </option>
          )}
        </For>
      </select>
      <Show when={props.store.paused}>
        <p>Paused</p>
      </Show>
    </div>
  );
}

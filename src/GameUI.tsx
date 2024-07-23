import { JSXElement } from "solid-js";
import { GameStore } from "./GameStore.ts";
import { classnames } from "@grinstead/classnames";
import { loadBounceSounds } from "./hacks.ts";

export type GameUIProps = {
  store: GameStore;
  children: JSXElement;
};

export function GameUI(props: GameUIProps) {
  return (
    <div
      ref={(div) => {
        requestAnimationFrame(() => {
          div.focus();
        });
      }}
      tabIndex={1}
      onkeydown={(e) => {
        loadBounceSounds();
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
    >
      {props.children}
    </div>
  );
}

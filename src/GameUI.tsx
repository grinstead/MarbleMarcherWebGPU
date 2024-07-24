import { JSXElement } from "solid-js";
import { GameStore } from "./GameStore.ts";
import { classnames } from "@grinstead/classnames";
import { useGameEngine } from "@grinstead/ambush";

export type GameUIProps = {
  store: GameStore;
  children: JSXElement;
};

export function GameUI(props: GameUIProps) {
  const engine = useGameEngine();

  return (
    <div
      ref={(div) => {
        requestAnimationFrame(() => {
          div.focus();
        });
      }}
      tabIndex={1}
      onkeydown={(e) => {
        engine.audio.enable();
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

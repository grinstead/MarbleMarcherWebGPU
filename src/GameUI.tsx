import { JSXElement } from "solid-js";
import { GameStore } from "./GameStore.ts";
import { classnames } from "@grinstead/classnames";
import { useGameEngine } from "@grinstead/ambush";

export type GameUIProps = {
  store: GameStore;
  children: JSXElement;
};

export function GameUI(props: GameUIProps) {
  let div: undefined | HTMLDivElement;

  const { timer } = useGameEngine().loop;

  return (
    <div
      ref={(div_) => {
        div = div_;
        requestAnimationFrame(() => {
          div_.focus();
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
        timer.unpause();
        props.store.loop.add.input({ type: "focus" });
      }}
      onblur={() => {
        timer.pause();
        props.store.loop.add.input({ type: "blur" });
        requestAnimationFrame(() => {
          div?.focus();
        });
      }}
      class={classnames("overlay", props.store.paused && "paused")}
    >
      {props.children}
    </div>
  );
}

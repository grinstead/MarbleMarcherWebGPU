import { JSXElement } from "solid-js";
import { GameStore } from "./GameStore.ts";
import { GameLoop, useGameEngine } from "@grinstead/ambush";
import { SetStoreFunction } from "solid-js/store";

export type GameUIProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
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
      onblur={() => {
        timer.pause();
        props.store.loop.add.input({ type: "blur" });
        props.setStore("paused", true);
      }}
      class="overlay"
    >
      {props.children}
      <GameLoop.Part
        step="main"
        work={() => {
          if (div && div !== document.activeElement) {
            div.focus();
          }
        }}
      />
    </div>
  );
}

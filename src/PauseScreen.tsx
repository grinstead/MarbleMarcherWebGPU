import { SetStoreFunction } from "solid-js/store";
import { GameStore } from "./GameStore.ts";
import "./PauseScreen.css";
import { useGameEngine } from "@grinstead/ambush";

export type PauseScreenProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function PauseScreen(props: PauseScreenProps) {
  const { timer } = useGameEngine().loop;

  return (
    <div class="PauseScreen">
      <article class="PauseMenu">
        <h1>Game Paused</h1>
        <button
          onClick={() => {
            props.setStore("paused", false);
            timer.unpause();
          }}
        >
          Continue
        </button>
        <button>Soundtrack On</button>
        <button>Main Menu</button>
      </article>
    </div>
  );
}

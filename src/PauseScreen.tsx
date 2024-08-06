import { SetStoreFunction } from "solid-js/store";
import { GameStore, persisted } from "./GameStore.ts";
import "./PauseScreen.css";
import { useGameEngine } from "@grinstead/ambush";
import { usePersisted } from "./Persisted.ts";
import { batch, onMount } from "solid-js";

export type PauseScreenProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function PauseScreen(props: PauseScreenProps) {
  const { loop, audio } = useGameEngine();
  const { timer } = loop;

  const settings = usePersisted(persisted().settings);

  onMount(() => {
    audio.music()?.pause();
  });

  return (
    <div class="PauseScreen" onClick={unpause}>
      <article
        class="PauseMenu"
        onClick={(e) => {
          // the parent div automatically closes the pause screen when it is
          // clicked on, but we don't want that to happen if the user actually
          // clicked on anything in the pause menu box (which is this <article>)
          e.stopPropagation();
        }}
      >
        <h1>Game Paused</h1>
        <button onClick={unpause}>Continue</button>
        <button
          onClick={(e) => {
            const prev = settings().soundtrackVolume;

            persisted().settings.set({
              ...settings(),
              soundtrackVolume: prev > 0 ? 0 : 1,
            });
          }}
        >
          Music {settings().soundtrackVolume > 0 ? "🔊" : "🔇"}
        </button>
        <button
          onClick={() => {
            const prev = settings().soundsVolume;

            persisted().settings.set({
              ...settings(),
              soundsVolume: prev > 0 ? 0 : 1,
            });
          }}
        >
          Effects {settings().soundsVolume > 0 ? "🔊" : "🔇"}
        </button>
        <button
          onClick={() => {
            batch(() => {
              props.setStore("playing", false);
              props.setStore("paused", false);
            });
          }}
        >
          Main Menu
        </button>
      </article>
    </div>
  );

  function unpause() {
    props.setStore("paused", false);
    timer.unpause();

    if (settings().soundtrackVolume > 0) {
      audio.music()?.play();
    }
  }
}

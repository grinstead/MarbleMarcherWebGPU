import { SetStoreFunction } from "solid-js/store";
import { GameStore } from "./GameStore.ts";
import { levels } from "./LevelData.ts";
import { For } from "solid-js";

export type DebugControlsProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function DebugControls(props: DebugControlsProps) {
  const initialSelected = props.store.level.title;

  return (
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
  );
}

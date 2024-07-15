import { SetStoreFunction } from "solid-js/store";
import { GameStore } from "./GameStore.ts";
import { GameUI } from "./GameUI.tsx";
import { Level } from "./Level.tsx";

export type GameProps = {
  store: GameStore;
  setStore: SetStoreFunction<GameStore>;
};

export function Game(props: GameProps) {
  return (
    <>
      <Level {...props.store.level} time={props.store.levelTime} />
      <GameUI store={props.store} setStore={props.setStore} />
    </>
  );
}

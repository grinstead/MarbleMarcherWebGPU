import "./App.css";
import { AmbushGame, rethrowError } from "@grinstead/ambush";
import { Graphics } from "./Graphics.tsx";
import { Game } from "./Game.tsx";
import { createGameStore } from "./GameStore.ts";

export function Embedded() {
  const [store, setStore] = createGameStore();

  return (
    <AmbushGame class="game" fallback={rethrowError}>
      <Graphics />
      <Game store={store} setStore={setStore} />
    </AmbushGame>
  );
}

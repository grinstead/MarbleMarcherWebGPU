import "./App.css";
import { AmbushGame, E_GPU_NOSUPPORT, GPULoadError } from "@grinstead/ambush";
import { Graphics } from "./Graphics.tsx";
import { Game } from "./Game.tsx";
import { createGameStore } from "./GameStore.ts";

export function Embedded() {
  const [store, setStore] = createGameStore();

  return (
    <AmbushGame
      class="game"
      fallback={(e) => {
        if (e instanceof GPULoadError && e.code === E_GPU_NOSUPPORT) {
          return (
            <div>
              Your Browser does not support WebGPU, consider{" "}
              <a href="https://www.google.com/chrome/dr/download/">Chrome</a>
            </div>
          );
        }

        return <div>{String(e)}</div>;
      }}
    >
      <Graphics />
      <Game store={store} setStore={setStore} />
    </AmbushGame>
  );
}

import "./App.css";
import { Graphics } from "./Graphics.tsx";
import { createGameStore } from "./GameStore.ts";
import {
  E_GPU_NOSUPPORT,
  GPULoadError,
  AmbushGame,
  rethrowError,
} from "@grinstead/ambush";
import { ErrorBoundary } from "solid-js";
import { Game } from "./Game.tsx";
import { DebugControls } from "./DebugControls.tsx";

function App() {
  const [store, setStore] = createGameStore();

  return (
    <>
      <h1 id="logo">Marble Marcher (WebGPU)</h1>
      <ErrorBoundary
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
        <AmbushGame class="game" fallback={rethrowError}>
          <Graphics />
          <Game store={store} setStore={setStore} />
        </AmbushGame>
        <DebugControls store={store} setStore={setStore} />
      </ErrorBoundary>
    </>
  );
}

export default App;

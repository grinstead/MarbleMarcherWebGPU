import "./App.css";
import { Graphics } from "./Graphics.tsx";
import { GameUI } from "./GameUI.tsx";
import { createGameStore } from "./GameStore.ts";
import {
  BaseFrameTimer,
  E_GPU_NOSUPPORT,
  FrameTimer,
  GPUContainer,
  GPULoadError,
  GPUWorkQueue,
  GameLoop,
  lerp,
  useTime,
} from "@grinstead/ambush";
import { ErrorBoundary, batch, createMemo, createSignal } from "solid-js";
import { produce } from "solid-js/store";
import { Game } from "./Game.tsx";
import { DebugControls } from "./DebugControls.tsx";

function App() {
  const [store, setStore] = createGameStore();

  const timer = new BaseFrameTimer();
  const time = useTime(() => timer);
  const fps = createMemo(() => (time(), timer.fps));

  let canvas: undefined | HTMLCanvasElement;

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
        <div class="game">
          <canvas ref={canvas} class="canvas" width={1280} height={720} />
          <GPUContainer canvas={canvas!}>
            <GameLoop.Provider steps={["main", "render"]} timer={timer}>
              <GPUWorkQueue.Provider>
                <Graphics store={store} />
                <Game store={store} setStore={setStore} />
              </GPUWorkQueue.Provider>
            </GameLoop.Provider>
          </GPUContainer>
        </div>
        <pre>
          {Math.floor(time())} in-game seconds / {fps()} fps
        </pre>
        <DebugControls store={store} setStore={setStore} />
      </ErrorBoundary>
    </>
  );
}

export default App;

import "./App.css";
import { Graphics } from "./Graphics.tsx";
import { GameUI } from "./GameUI.tsx";
import { createGameStore } from "./GameStore.ts";
import {
  E_GPU_NOSUPPORT,
  FrameTimer,
  GPUContainer,
  GPULoadError,
  GPUWorkQueue,
  lerp,
  useTime,
} from "@grinstead/ambush";
import { ErrorBoundary, batch, createMemo, createSignal } from "solid-js";
import { produce } from "solid-js/store";
import { Game } from "./Game.tsx";
import { DebugControls } from "./DebugControls.tsx";

function App() {
  const [store, setStore] = createGameStore();

  const time = useTime(() => store.levelTime.parent);
  const fps = createMemo(() => (time(), store.levelTime.fps));

  let canvas: undefined | HTMLCanvasElement;

  let manager: undefined | GPUWorkQueue;
  let renderTimer: undefined | ReturnType<typeof requestAnimationFrame>;

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
            <GPUWorkQueue.Provider
              ref={manager}
              onHasWork={() => {
                renderTimer ??= requestAnimationFrame(render);
              }}
            >
              <Graphics store={store} />
              <Game store={store} setStore={setStore} />
            </GPUWorkQueue.Provider>
          </GPUContainer>
        </div>
        <pre>
          {Math.floor(time())} in-game seconds / {fps()} fps
        </pre>
        <DebugControls store={store} setStore={setStore} />
      </ErrorBoundary>
    </>
  );

  function render() {
    const timer = store.levelTime.parent;

    renderTimer = undefined;
    manager!.runQueued();

    if (store.paused) {
      timer.pause();
    } else {
      timer.markFrame();
    }
  }
}

export default App;

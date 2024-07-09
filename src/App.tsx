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
} from "@grinstead/ambush";
import { ErrorBoundary, batch, createSignal } from "solid-js";
import { produce } from "solid-js/store";

function App() {
  const [store, setStore] = createGameStore();
  const [fps, setFps] = createSignal(0);
  const timer = new FrameTimer();

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
          <canvas ref={canvas} class="canvas" width={640} height={480} />
          <GPUContainer canvas={canvas!}>
            <GPUWorkQueue.Provider
              ref={manager}
              onHasWork={() => {
                renderTimer ??= requestAnimationFrame(render);
              }}
            >
              <Graphics store={store} />
              <GameUI store={store} setStore={setStore} />
            </GPUWorkQueue.Provider>
          </GPUContainer>
        </div>
        <pre>
          {Math.floor(store.time)} in-game seconds / {fps()} fps
        </pre>
      </ErrorBoundary>
    </>
  );

  function render() {
    timer.markFrame();

    renderTimer = undefined;
    manager!.runQueued();

    if (store.paused) {
      timer.pause();
    } else {
      // setFps((prev) => lerp(prev, timer.fps, 0.1));
      setFps(timer.fps);

      setStore(
        produce((state) => {
          state.frame = timer.frame;
          state.time = timer.time / 1000;
        })
      );
    }
  }
}

export default App;

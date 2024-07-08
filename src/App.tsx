import "./App.css";
import { Graphics } from "./Graphics.tsx";
import { GameUI } from "./GameUI.tsx";
import { createGameStore } from "./GameStore.ts";
import { GPUContainer, GPUWorkQueue } from "@grinstead/ambush";
import { createSignal } from "solid-js";

const FPS_WEIGHTING = 0.1;

function App() {
  const [store, setStore] = createGameStore();

  let canvas: undefined | HTMLCanvasElement;

  const [renderTime, setRenderTime] = createSignal<number>();

  let manager: undefined | GPUWorkQueue;
  let renderTimer: undefined | ReturnType<typeof requestAnimationFrame>;

  return (
    <>
      <h1 id="logo">Marble Marcher (WebGPU)</h1>
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
      <p>{Math.round(1000 / (renderTime() ?? 15))} fps</p>
    </>
  );

  function render() {
    const start = performance.now();

    renderTimer = undefined;
    manager!.runQueued();

    requestAnimationFrame(() => {
      const ms = performance.now() - start;
      setRenderTime(
        (prev = ms) => FPS_WEIGHTING * ms + (1 - FPS_WEIGHTING) * prev
      );
    });
  }
}

export default App;

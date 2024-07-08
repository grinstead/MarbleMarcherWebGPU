import "./App.css";
import { Graphics } from "./Graphics.tsx";
import { GameUI } from "./GameUI.tsx";
import { createGameStore } from "./GameStore.ts";
import { GPUContainer, GPUWorkQueue } from "@grinstead/ambush";

function App() {
  const [store, setStore] = createGameStore();

  const canvas = (
    <canvas class="canvas" width={640} height={480} />
  ) as HTMLCanvasElement;

  let manager: undefined | GPUWorkQueue;
  let renderTimer: undefined | ReturnType<typeof requestAnimationFrame>;

  return (
    <>
      <h1 id="logo">Marble Marcher (WebGPU)</h1>
      <div class="game">
        {canvas}
        <GPUContainer canvas={canvas}>
          <GPUWorkQueue.Provider
            ref={manager}
            onHasWork={() => {
              renderTimer ??= requestAnimationFrame(() => {
                renderTimer = undefined;
                manager!.runQueued();
              });
            }}
          >
            <Graphics store={store} />
            <GameUI store={store} setStore={setStore} />
          </GPUWorkQueue.Provider>
        </GPUContainer>
      </div>
    </>
  );
}

export default App;

import "./App.css";
import { Canvas } from "@grinstead/ambush";
import { GameCanvas } from "./GameCanvas.tsx";
import { createSignal } from "solid-js";
import { IDENTITY } from "./Matrix.ts";
import { GameUI } from "./GameUI.tsx";
import { createGameStore } from "./GameStore.ts";

function App() {
  const [store, setStore] = createGameStore();

  return (
    <>
      <h1 id="logo">Marble Marcher (WebGPU)</h1>
      <div class="game">
        <Canvas class="canvas">
          <GameCanvas store={store} />
        </Canvas>
        <GameUI store={store} setStore={setStore} />
      </div>
    </>
  );
}

export default App;

import "./App.css";
import { Canvas } from "@grinstead/ambush";
import { GameCanvas } from "./GameCanvas.tsx";
import { createSignal } from "solid-js";
import { IDENTITY } from "./Matrix.ts";
import { GameUI } from "./GameUI.tsx";

function App() {
  const [cameraMatrix, setCameraMatrix] = createSignal(IDENTITY);

  return (
    <>
      <h1 id="logo">Marble Marcher (WebGPU)</h1>
      <div class="game">
        <Canvas class="canvas">
          <GameCanvas cameraMatrix={cameraMatrix()} />
        </Canvas>
        <GameUI setCameraMatrix={setCameraMatrix} />
      </div>
    </>
  );
}

export default App;

import "./App.css";
import { Canvas } from "@grinstead/ambush";
import { GameCanvas } from "./GameCanvas.tsx";

function App() {
  return (
    <>
      <h1 id="logo">Marble Marcher (WebGPU)</h1>
      <div class="game">
        <Canvas class="canvas">
          <GameCanvas />
        </Canvas>
      </div>
    </>
  );
}

export default App;

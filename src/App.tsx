import "./App.css";
import { Canvas } from "@grinstead/ambush";
import { GameCanvas } from "./GameCanvas.tsx";

function App() {
  return (
    <>
      <h1 id="logo">Marble Marcher (WebGPU)</h1>
      <Canvas id="canvas" width={640} height={480}>
        <GameCanvas />
      </Canvas>
    </>
  );
}

export default App;

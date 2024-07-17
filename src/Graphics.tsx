import {
  RenderPipeline,
  ScalarBinding,
  VectorBinding,
} from "@grinstead/ambush";
import { GameStore } from "./GameStore.ts";
import { frag } from "./frag.ts";

export type GameCanvasProps = {
  store: GameStore;
};

export function Graphics() {
  return (
    <>
      <RenderPipeline
        label="Test Shader"
        code={frag()}
        vertexMain="vertex_main"
        fragmentMain="main"
        draw={4}
      />
      <VectorBinding label="iResolution" group={0} id={1} value={[1280, 720]} />
      <ScalarBinding label="iExposure" group={0} id={12} value={1} />
    </>
  );
}

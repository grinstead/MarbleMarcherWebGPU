import {
  RenderPipeline,
  ScalarBinding,
  VectorBinding,
  useGameEngine,
} from "@grinstead/ambush";
import { frag } from "./frag.ts";

export function Graphics() {
  const { area } = useGameEngine();

  return (
    <>
      <RenderPipeline
        label="Test Shader"
        code={frag()}
        vertexMain="vertex_main"
        fragmentMain="main"
        draw={4}
      />
      <VectorBinding
        label="iResolution"
        group={0}
        id={1}
        value={[area.width, area.height]}
      />
      <ScalarBinding label="iExposure" group={0} id={12} value={1} />
    </>
  );
}

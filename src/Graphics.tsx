import {
  BufferBinding,
  RenderPipeline,
  ScalarBinding,
  VectorBinding,
  rgbArray,
  xyzArray,
} from "@grinstead/ambush";
import { GameStore } from "./GameStore.ts";
import { frag } from "./frag.ts";

export type GameCanvasProps = {
  store: GameStore;
};

export function Graphics(props: GameCanvasProps) {
  return (
    <>
      <RenderPipeline
        label="Test Shader"
        code={frag()}
        vertexMain="vertex_main"
        fragmentMain="main"
        draw={4}
      />
      <BufferBinding
        label="iMat"
        group={0}
        id={0}
        value={props.store.cameraMatrix}
      />
      <VectorBinding label="iResolution" group={0} id={1} value={[1280, 720]} />
      <ScalarBinding
        label="iFracScale"
        group={0}
        id={3}
        value={props.store.level.scale}
      />
      <ScalarBinding
        label="iFracAng1"
        group={0}
        id={4}
        value={(() => {
          const anim = props.store.level.animation.x;

          return (
            props.store.level.angle1 +
            (anim && anim * Math.sin(props.store.frame * 0.015))
          );
        })()}
      />
      <ScalarBinding
        label="iFracAng2"
        group={0}
        id={5}
        value={(() => {
          const anim = props.store.level.animation.y;

          return (
            props.store.level.angle2 +
            (anim && anim * Math.sin(props.store.frame * 0.015))
          );
        })()}
      />
      <VectorBinding
        label="iFracShift"
        group={0}
        id={6}
        value={(() => {
          const anim = props.store.level.animation.z;
          const offset = xyzArray(props.store.level.offset);

          if (anim) {
            offset[1] += anim * Math.sin(props.store.frame * 0.015);
          }

          return offset;
        })()}
      />
      <VectorBinding
        label="iFracCol"
        group={0}
        id={7}
        value={rgbArray(props.store.level.color)}
      />
      <VectorBinding
        label="iMarblePos"
        group={0}
        id={8}
        value={xyzArray(props.store.level.marblePosition)}
      />
      <ScalarBinding
        label="iMarbleRad"
        group={0}
        id={9}
        value={props.store.level.marbleRadius}
      />
      <ScalarBinding
        label="iFlagScale"
        group={0}
        id={10}
        value={
          (props.store.level.isPlanet ? -1 : 1) * props.store.level.marbleRadius
        }
      />
      <VectorBinding
        label="iFlagPos"
        group={0}
        id={11}
        value={xyzArray(props.store.level.flagPosition)}
      />
      <ScalarBinding label="iExposure" group={0} id={12} value={1} />
    </>
  );
}

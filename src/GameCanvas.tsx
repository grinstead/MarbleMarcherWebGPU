import {
  BindGroup,
  CanvasContext,
  Matrix4x4,
  RenderShader,
} from "@grinstead/ambush";
import { useContext } from "solid-js";

const RENDER_QUAD = `
struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) fragUV: vec2f,
}

// just renders 4 points that cover the canvas, all work done in fragment shader
@vertex
fn vertex_main(@builtin(vertex_index) index: u32) -> VertexOutput {
  const fragPoints = array(
    vec2f(0, 0),
    vec2f(1, 0),
    vec2f(0, 1),
    vec2f(1, 1),
  );

  let uv = fragPoints[index];

  return VertexOutput(
    vec4f(2 * uv - 1, 0, 1),
    uv,
  );
}`;

export function GameCanvas() {
  const MyTestShaderCode = `
${RENDER_QUAD}

// matrix expressed in meters, implictly encodes focal length
// because when rendering we shoot out rays from the "sensor"
// which is the square from (-.5, -.5, -1)x(.5, .5, -1), shot
// at the origin, where both of those values have been multiplied
// by the camera
@group(0) @binding(0) var<uniform> camera: mat4x4f;

fn inCamera(position: vec4f) -> vec3f {
  let transformed = camera * position;
  return transformed.xyz / transformed.w;
}

const CIRCLE_ORIGIN = vec3f(0, 0, 10);
const CIRCLE_RADIUS = 1.0f;

struct RayMarchResult {
  closest: vec3f,
  distance: f32,
  steps: i32,
}

fn rayMarch(start: vec3f, direction: vec3f) -> RayMarchResult {
  var steps = 0;
  var position = start;
  loop {
    let distance = length(position - CIRCLE_ORIGIN) - CIRCLE_RADIUS;
  
    if (distance < .01 || steps >= 20) {
      return RayMarchResult(position, distance, steps);
    }

    position += distance * direction;

    continuing {
      steps++;
    }
  }
}

@fragment
fn fragment_main(@location(0) fragUV: vec2f) -> @location(0) vec4f {
  var position = inCamera(vec4f(fragUV - 0.5, -1, 1));
  var dir = normalize(inCamera(vec4f(0, 0, 0, 1)) - position);

  let result = rayMarch(position, dir);

  return select(vec4f(.1, 0, 0, 0), vec4f(0, 1. - f32(result.steps) * .01, 0, 0), result.distance < 1);
}
    
    `;

  const { canvas } = useContext(CanvasContext);

  return (
    <RenderShader
      label="Test Shader"
      code={MyTestShaderCode}
      vertexMain="vertex_main"
      fragmentMain="fragment_main"
      draw={4}
    >
      <BindGroup>
        <Matrix4x4>
          {1} {0} {0} {0}
          {0} {canvas.height / canvas.width} {0} {0}
          {0} {0} {1} {0}
          {0} {0} {0} {1}
        </Matrix4x4>
      </BindGroup>
    </RenderShader>
  );
}

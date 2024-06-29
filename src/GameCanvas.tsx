import {
  BindGroup,
  CanvasContext,
  Matrix4x4,
  RenderShader,
  UniformScalar,
  UniformVector,
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

@group(1) @binding(0) var<uniform> iFracScale: f32;
@group(1) @binding(1) var<uniform> iFracAng1: f32;
@group(1) @binding(2) var<uniform> iFracAng2: f32;
@group(1) @binding(3) var<uniform> iFracShift: vec3f;
@group(1) @binding(4) var<uniform> iFracCol: vec3f;

fn inCamera(position: vec4f) -> vec3f {
  let transformed = camera * position;
  return transformed.xyz / transformed.w;
}

const BACKGROUND_COLOR = vec4f(0.6, 0.8, 1.0, 1.0);
const CIRCLE_ORIGIN = vec3f(0, 0, 40);
const CIRCLE_RADIUS = 1.0f;
const EPSILON = 1e-5;
const FRACTAL_LEVELS = 16;
const LIGHT_DIRECTION = vec3f(-0.36, 0.8, 0.48);
const LIGHT_COLOR = vec3f(1.0, 0.95, 0.8);
const MAX_DISTANCE = 30;
const MAX_STEPS = 1000;
const SHADOW_DARKNESS = 0.7;
const SHADOW_SHARPNESS = 10.0;
const SUN_SHARPNESS = 2.0;
const SUN_SIZE = 0.004;

struct RayMarchResult {
  // The position we ended the ray march in
  endPoint: vec4f,
  // the amount of remaining distance
  headroom: f32,
  minHeadroom: f32,
  distance: f32,
  steps: f32,
}

fn rotX(p: vec4f, a: f32) -> vec4f {
  let c = cos(a);
  let s = sin(a);
  return vec4f(p.x, c * p.y + s * p.z, c * p.z - s * p.y, p.w);
}

fn rotZ(p: vec4f, a: f32) -> vec4f {
  let c = cos(a);
  let s = sin(a);
  return vec4f(c * p.x + s * p.y, c * p.y - s * p.x, p.zw);
}

fn max3(a: f32, b: f32, c: f32) -> f32 {
  return max(max(a, b), c);
}

fn max4(a: f32, b: f32, c: f32, d: f32) -> f32 {
  return max(max(a, b), max(c, d));
}

/////////////////////////////////////////////////////////////////////////////
// Geometry
/////////////////////////////////////////////////////////////////////////////

fn mengerFold(point: vec4f) -> vec4f {
  var p = point;
  
  var a = min(p.x - p.y, 0.0);
  p.x -= a;
  p.y += a;

  a = min(p.x - p.z, 0.0);
  p.x -= a;
  p.z += a;

  a = min(p.y - p.z, 0.0);
  p.y -= a;
  p.z += a;

  return p;
}

fn de_sphere(p: vec3f, r: f32) -> f32 {
	return length(p) - r;
}

fn de_box(p: vec4f, sides: vec3f) -> f32 {
	let a = abs(p.xyz) - sides;
	return (min(max3(a.x, a.y, a.z), 0.0) + length(max(a, vec3f()))) / p.w;
}

fn de_tetrahedron(p: vec3f, r: f32) -> f32 {
	let md = max4(
    -p.x - p.y - p.z,
     p.x + p.y - p.z,
		-p.x + p.y + p.z,
     p.x - p.y + p.z
  );
	return (md - r) / sqrt(3.0);
}

fn de_capsule(p: vec3f, h: f32, r: f32) -> f32 {
	return length(p - vec3f(0, clamp(p.y, -h, h), 0)) - r;
}

fn de_fractal(point: vec4f) -> f32 {
  var p = point;
  for (var i = 0; i < FRACTAL_LEVELS; i++) {
    p = vec4f(abs(p.xyz), p.w);
    p = rotZ(p, iFracAng1);
    p = mengerFold(p);
    p = rotX(p, iFracAng2);
    p *= iFracScale;
    p += vec4f(iFracShift, 0.);
  }

  return de_box(p, vec3f(6.));
}

fn col_fractal(point: vec4f) -> vec4f {
  var orbit = vec3f();
  var p = point;
  for (var i = 0; i < FRACTAL_LEVELS; i++) {
    p = vec4f(abs(p.xyz), p.w);
    p = rotZ(p, iFracAng1);
    p = mengerFold(p);
    p = rotX(p, iFracAng2);
    p *= iFracScale;
    p += vec4f(iFracShift, 0.);
    orbit = max(orbit, p.xyz * iFracCol);
  }

  return vec4f(orbit, 1);
}

fn estimateHeadroom(point: vec4f) -> f32 {
  return de_fractal(point);
}

/////////////////////////////////////////////////////////////////////////////
// Main Code
/////////////////////////////////////////////////////////////////////////////

// http://www.iquilezles.org/www/articles/normalsSDF/normalsSDF.htm
fn calcNormal(point: vec4f) -> vec3f {
  let offset = .5 * EPSILON;
  let k = vec3f(1, -1, 0);
	return normalize(
    k.xyy * estimateHeadroom(point + k.xyyz * offset) +
		k.yyx * estimateHeadroom(point + k.yyxz * offset) +
		k.yxy * estimateHeadroom(point + k.yxyz * offset) +
		k.xxx * estimateHeadroom(point + k.xxxz * offset)
  );
}

fn rayMarch(start: vec4f, direction: vec3f, sharpness: f32) -> RayMarchResult {
  var steps = 0;
  var position = start;
  var distance = 0.;
  var minHeadroom = EPSILON;
  loop {
    let headroom = estimateHeadroom(position);

    if (headroom < minHeadroom || distance > MAX_DISTANCE || steps >= MAX_STEPS) {
      return RayMarchResult(
        position,
        headroom,
        minHeadroom,
        distance,
        f32(steps)
      );
    }

    continuing {
      steps++;
      distance += headroom;
      position += vec4f(headroom * direction, 0);
      minHeadroom = min(minHeadroom, sharpness * headroom / distance);
    }
  }
}


@fragment
fn fragment_main(@location(0) fragUV: vec2f) -> @location(0) vec4f {
  var position = inCamera(vec4f(fragUV - 0.5, -1, 1));
  var dir = normalize(inCamera(vec4f(0, 0, 0, 1)) - position);

  let march = rayMarch(vec4f(position, 1), dir, 1.0);
  if (march.headroom > EPSILON) {
      // The ray did not hit the target
      var color = BACKGROUND_COLOR;
    
      // "spec" for specular
      var sunSpec = dot(dir, LIGHT_DIRECTION) - 1.0 + SUN_SIZE;
      sunSpec = min(exp(sunSpec * SUN_SHARPNESS / SUN_SIZE), 1.);
      color += vec4f(LIGHT_COLOR * sunSpec, 0);
    
      return color;
  }

  var color = col_fractal(march.endPoint);

  let normal = calcNormal(march.endPoint);
  let lightPoint = vec4f(march.endPoint.xyz + normal * EPSILON * 100., 1.);
  let lightMarch = rayMarch(lightPoint, LIGHT_DIRECTION, SHADOW_SHARPNESS);
  var k = lightMarch.minHeadroom * min(lightMarch.distance, 1.0);

  k = max(k, 1.0 - SHADOW_DARKNESS);

  color = vec4f(color.xyz * LIGHT_COLOR * k, 1);
  
  return color;
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
        <Matrix4x4 label="camera">
          {1} {0} {0} {0}
          {0} {canvas.height / canvas.width} {0} {0}
          {0} {0} {1} {0}
          {0} {0} {-10} {1}
        </Matrix4x4>
      </BindGroup>
      <BindGroup>
        <UniformScalar label="iFracScale" type="f32" value={1.8} />
        <UniformScalar label="iFracAng1" type="f32" value={-0.12} />
        <UniformScalar label="iFracAng2" type="f32" value={0.5} />
        <UniformVector label="iFracShift" value={[-2.12, -2.75, 0.49]} />
        <UniformVector label="iFracCol" value={[0.42, 0.38, 0.19]} />
      </BindGroup>
    </RenderShader>
  );
}

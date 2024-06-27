import { RenderShader } from "@grinstead/ambush";

export function GameCanvas() {
  const MyTestShaderCode = `

  struct VertexOutput {
    @builtin(position) position: vec4f,
    @location(0) fragUV: vec2f,
  }
  
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
  }
  
  @fragment
  fn fragment_main(@location(0) fragUV: vec2f) -> @location(0) vec4f {
    return vec4f(0, fragUV.x, fragUV.y, 1);
  }
    
    `;

  return (
    <RenderShader
      label="Test Shader"
      code={MyTestShaderCode}
      vertexMain="vertex_main"
      fragmentMain="fragment_main"
      draw={(run) => run.draw(4)}
    />
  );
}

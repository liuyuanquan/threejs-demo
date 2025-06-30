import * as THREE from 'three'
import World from './index'
import { FullScreenQuad } from 'three/examples/jsm/Addons.js'

function createShaderMaterial(envMap1: THREE.DataTexture, envMap2: THREE.DataTexture) {
  const vertexShader = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `

  const fragmentShader = `
    uniform sampler2D uEnvMap1;
    uniform sampler2D uEnvMap2;

    uniform float uWeight;
    uniform float uIntensity;

    varying vec2 vUv;
    void main() {
      vec3 color0 = texture(uEnvMap1, vUv).rgb;
      vec3 color1 = texture(uEnvMap2, vUv).rgb;
      vec3 color = mix(color0, color1, uWeight);
      gl_FragColor = vec4(color * uIntensity, 1.);
    }
  `

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uEnvMap1: { value: envMap1 },
      uEnvMap2: { value: envMap2 },
      uWeight: { value: 0.5 },
      uIntensity: { value: 0.5 }
    }
  })

  return material
}

export default class DynamicEnv {
  base: World
  rt: THREE.WebGLRenderTarget
  material: THREE.ShaderMaterial
  quad: FullScreenQuad
  private needUpdate = true
  constructor(base: World) {
    this.base = base

    const envMap1 = base.resources['t_env_light.hdr'] as THREE.DataTexture
    const envMap2 = base.resources['t_env_night.hdr'] as THREE.DataTexture
    const envData = envMap1.source.data

    const rt = new THREE.WebGLRenderTarget(envData.width, envData.height, {
      magFilter: THREE.LinearFilter,
      minFilter: THREE.LinearFilter,
      generateMipmaps: false,
      type: THREE.HalfFloatType,
      format: THREE.RGBAFormat,
      colorSpace: THREE.LinearSRGBColorSpace,
      depthBuffer: false
    })
    rt.texture.mapping = THREE.CubeUVReflectionMapping
    this.rt = rt

    this.material = createShaderMaterial(envMap1, envMap2)

    const quad = new FullScreenQuad(this.material)
    this.quad = quad
  }
  update() {
    if (this.needUpdate) {
      this.needUpdate = false
      this.base.renderer.setRenderTarget(this.rt)
      this.quad.render(this.base.renderer)
      this.base.renderer.setRenderTarget(null)
    }
  }
  get envMap() {
    return this.rt.texture
  }
  setWeight(value: number) {
    this.material.uniforms.uWeight.value = value
    this.needUpdate = true
  }
  setIntensity(value: number) {
    this.material.uniforms.uIntensity.value = value
    this.needUpdate = true
  }
}

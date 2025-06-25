import * as kokomi from 'kokomi.js'
import * as THREE from 'three'
import gsap from 'gsap'

import type World from '../index'

import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

const t1 = gsap.timeline()

export default class DynamicEnv extends kokomi.Component {
  declare base: World
  rt: THREE.WebGLRenderTarget
  material: THREE.ShaderMaterial
  quad: kokomi.FullScreenQuad
  constructor(base: World) {
    super(base)

    const envmap1 = kokomi.getEnvmapFromHDRTexture(
      this.base.renderer,
      base.am.items['ut_env_night']
    )
    const envmap2 = kokomi.getEnvmapFromHDRTexture(
      this.base.renderer,
      this.base.am.items['ut_env_light']
    )
    const envData = envmap1?.source.data

    const rt = new THREE.WebGLRenderTarget(envData.width, envData.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType
    })
    rt.texture.mapping = THREE.CubeUVReflectionMapping
    this.rt = rt

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uEnvmap1: {
          value: envmap1
        },
        uEnvmap2: {
          value: envmap2
        },
        // 环境光权重
        uWeight: {
          value: this.base.params.envWeight
        },
        // 环境光强度
        uIntensity: {
          value: this.base.params.envIntensity
        }
      }
    })
    this.material = material

    const quad = new kokomi.FullScreenQuad(material)
    this.quad = quad

    const dynamicEnvFolder = this.base.debug.addFolder('DynamicEnv')
    dynamicEnvFolder
      .add(this.base.params, 'envWeight', 0, 1, 0.01)
      .name('weight')
      .onChange((value: number) => {
        this.setWeight(value)
      })
    dynamicEnvFolder
      .add(this.base.params, 'envIntensity', 0, 1, 0.01)
      .name('intensity')
      .onChange((value: number) => {
        this.setIntensity(value)
      })
  }
  update() {
    this.base.renderer.setRenderTarget(this.rt)
    this.quad.render(this.base.renderer)
    this.base.renderer.setRenderTarget(null)
  }
  get envmap() {
    return this.rt.texture
  }
  setWeight(value: number) {
    this.material.uniforms.uWeight.value = value
  }
  setIntensity(value: number) {
    this.material.uniforms.uIntensity.value = value
  }
  lerpWeight(value: number, duration: number) {
    t1.to(this.material.uniforms.uWeight, {
      value,
      duration,
      ease: 'power2.out'
    })
  }
}

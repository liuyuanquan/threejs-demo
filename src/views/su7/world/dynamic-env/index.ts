import * as kokomi from 'kokomi.js'
import * as THREE from 'three'
import gsap from 'gsap'
import { FullScreenQuad } from 'three-stdlib'

import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

import type World from '../index'

const t1 = gsap.timeline()

export default class DynamicEnv extends kokomi.Component {
  declare base: World
  rt: THREE.WebGLRenderTarget
  quad: kokomi.FullScreenQuad
  material: THREE.ShaderMaterial
  constructor(base: World) {
    super(base)

    const envmap1 = this.getEnvmapFromHDRTexture(
      this.base.renderer,
      base.am.items['ut_env_night']
    )
    const envmap2 = this.getEnvmapFromHDRTexture(
      this.base.renderer,
      this.base.am.items['ut_env_light']
    )

    const envData = envmap1?.source.data

    const rt = new THREE.WebGLRenderTarget(envData.width, envData.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType
    })
    this.rt = rt
    this.envmap.mapping = THREE.CubeUVReflectionMapping

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
        uWeight: {
          value: 0
        },
        uIntensity: {
          value: 1
        }
      }
    })
    this.material = material

    const quad = new FullScreenQuad(material)
    this.quad = quad
  }
  private getEnvmapFromHDRTexture(renderer: THREE.WebGLRenderer, texture: THREE.Texture) {
    const pmremGenerator = new THREE.PMREMGenerator(renderer)
    pmremGenerator.compileEquirectangularShader()
    const envmap = pmremGenerator.fromEquirectangular(texture).texture
    pmremGenerator.dispose()
    return envmap
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

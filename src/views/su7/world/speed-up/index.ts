import * as kokomi from 'kokomi.js'
import * as THREE from 'three'
import * as STDLIB from 'three-stdlib'

import type World from '../index'

import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

export default class SpeedUp extends kokomi.Component {
  declare base: World
  model: STDLIB.GLTF
  uj: kokomi.UniformInjector
  material: THREE.ShaderMaterial
  constructor(base: World) {
    super(base)

    this.model = this.base.am.items['sm_speedup'] as STDLIB.GLTF
    const modelParts = kokomi.flatModel(this.model.scene)

    this.uj = new kokomi.UniformInjector(this.base)
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      uniforms: {
        ...this.uj.shadertoyUniforms,
        uSpeed: {
          value: this.base.params.speed
        },
        uOpacity: {
          value: this.base.params.speedUpOpacity
        }
      }
    })

    const speedupMesh = modelParts[1] as THREE.Mesh
    speedupMesh.material = this.material
  }
  addExisting() {
    this.container.add(this.model.scene)
  }
  update() {
    this.material.uniforms.uSpeed.value = this.base.params.speed
    this.uj.injectShadertoyUniforms(this.material.uniforms)
  }
}

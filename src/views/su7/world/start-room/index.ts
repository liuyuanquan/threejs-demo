import * as kokomi from 'kokomi.js'
import * as THREE from 'three'
import * as STDLIB from 'three-stdlib'

import type World from '../index'

import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

import { MeshReflectorMaterial } from '../utils/meshReflectorMaterial'

export default class StartRoom extends kokomi.Component {
  declare base: World
  model: STDLIB.GLTF
  uj: kokomi.UniformInjector
  lightMat: THREE.MeshStandardMaterial
  ReflecFloor: THREE.Mesh
  floorMat: THREE.MeshPhysicalMaterial
  customFloorMat: kokomi.CustomShaderMaterial
  constructor(base: World) {
    super(base)

    const model = this.base.am.items['sm_startroom'] as STDLIB.GLTF
    this.model = model

    const modelParts = kokomi.flatModel(model.scene)

    const light001 = modelParts[1] as THREE.Mesh
    const lightMat = light001.material as THREE.MeshStandardMaterial
    lightMat.emissive = new THREE.Color(0x000000)
    lightMat.emissiveIntensity = 0
    lightMat.toneMapped = false
    lightMat.transparent = true
    lightMat.alphaTest = 0.1
    this.lightMat = lightMat

    const ReflecFloor = modelParts[2] as THREE.Mesh
    this.ReflecFloor = ReflecFloor
    const floorMat = ReflecFloor.material as THREE.MeshPhysicalMaterial
    floorMat.aoMap = this.base.am.items['ut_startroom_ao']
    floorMat.lightMap = this.base.am.items['ut_startroom_light']
    floorMat.normalMap = this.base.am.items['ut_floor_normal']
    floorMat.roughnessMap = this.base.am.items['ut_floor_roughness']
    floorMat.envMapIntensity = 0
    this.floorMat = floorMat.clone()

    const uj = new kokomi.UniformInjector(this.base)
    this.uj = uj

    const customFloorMat = new kokomi.CustomShaderMaterial({
      baseMaterial: floorMat,
      vertexShader,
      fragmentShader,
      uniforms: {
        ...uj.shadertoyUniforms,
        uColor: {
          value: new THREE.Color(0x000000)
        },
        uSpeed: {
          value: this.base.params.speed
        },
        uReflectMatrix: {
          value: new THREE.Matrix4()
        },
        uReflectTexture: {
          value: null
        },
        uReflectIntensity: {
          value: 0
        },
        uMipmapTextureSize: {
          value: new THREE.Vector2(window.innerWidth, window.innerHeight)
        }
      }
    })
    this.customFloorMat = customFloorMat
    ReflecFloor.material = this.customFloorMat

    this.base.resizer.on('resize', () => {
      this.customFloorMat.uniforms.uMipmapTextureSize.value = new THREE.Vector2(
        window.innerWidth,
        window.innerHeight
      )
    })

    const reflectMat = new MeshReflectorMaterial(this.base, ReflecFloor, {
      resolution: 1024,
      ignoreObjects: [light001, ReflecFloor]
    })
    customFloorMat.uniforms.uReflectMatrix.value = reflectMat._reflectMatrix
    customFloorMat.uniforms.uReflectTexture.value = reflectMat.mipmapFBO.rt.texture

    const startRoomFolder = this.base.debug.addFolder('StartRoom')
    startRoomFolder
      .add(this.base.params, 'startRoomReflector')
      .name('reflector')
      .onChange((value: boolean) => {
        if (value) {
          this.ReflecFloor.material = this.customFloorMat
        } else {
          this.ReflecFloor.material = this.floorMat
        }
      })
  }
  addExisting() {
    this.container.add(this.model.scene)
  }
  update(): void {
    this.customFloorMat.uniforms.uSpeed.value = this.base.params.speed
    this.uj.injectShadertoyUniforms(this.customFloorMat.uniforms)
  }
}

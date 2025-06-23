import * as kokomi from 'kokomi.js'
import * as THREE from 'three'
import * as STDLIB from 'three-stdlib'

import type World from '../index'

export default class StartRoom extends kokomi.Component {
  declare base: World
  model: STDLIB.GLTF
  lightMat: THREE.MeshStandardMaterial
  constructor(base: World) {
    super(base)

    const model = this.base.am.items['sm_startroom'] as STDLIB.GLTF
    this.model = model

    const modelParts = kokomi.flatModel(model.scene)

    const light001 = modelParts[1] as THREE.Mesh
    const lightMat = light001.material as THREE.MeshStandardMaterial
    lightMat.emissive = new THREE.Color(0x000000)
    lightMat.emissiveIntensity = 1
    lightMat.toneMapped = false
    lightMat.transparent = true
    lightMat.alphaTest = 0.1
    this.lightMat = lightMat

    const ReflecFloor = modelParts[2] as THREE.Mesh
    const floorMat = ReflecFloor.material as THREE.MeshPhysicalMaterial
    floorMat.aoMap = this.base.am.items['ut_startroom_ao']
    floorMat.lightMap = this.base.am.items['ut_startroom_light']
    floorMat.normalMap = this.base.am.items['ut_floor_normal']
    floorMat.roughnessMap = this.base.am.items['ut_floor_roughness']
    floorMat.envMapIntensity = 0
  }
  addExisting() {
    this.container.add(this.model.scene)
  }
}

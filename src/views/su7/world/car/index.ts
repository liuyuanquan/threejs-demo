import * as kokomi from 'kokomi.js'
import * as THREE from 'three'
import * as STDLIB from 'three-stdlib'

import type World from '../index'

export default class Car extends kokomi.Component {
  declare base: World
  model: STDLIB.GLTF
  modelParts: THREE.Object3D[]
  bodyMat!: THREE.MeshStandardMaterial
  wheelModel!: THREE.Group
  constructor(base: World) {
    super(base)

    const model = this.base.am.items['sm_car'] as STDLIB.GLTF
    this.model = model

    const modelParts = kokomi.flatModel(model.scene)
    this.modelParts = modelParts

    this.handleModel()

    const carFolder = this.base.debug.addFolder('Car')
    carFolder
      .add(this.base.params, 'carBodyEnvIntensity', 0, 1, 0.01)
      .name('bodyEnvIntensity')
      .onChange((value: number) => {
        this.setBodyEnvIntensity(value)
      })

    carFolder
      .addColor(this.base.params, 'carBodyColor')
      .name('bodyColor')
      .onChange((value: number) => {
        this.bodyMat.color = new THREE.Color(value)
      })
  }
  addExisting() {
    this.container.add(this.model.scene)
  }
  update(): void {
    this.wheelModel?.children.forEach((item) => {
      item.rotateZ(-this.base.params.speed * 0.03)
    })
  }
  private handleModel() {
    const body = this.modelParts[2] as THREE.Mesh
    const bodyMat = body.material as THREE.MeshStandardMaterial
    if (this.base.params.isFurina) {
      bodyMat.color = new THREE.Color(0xffffff)
      bodyMat.map = this.base.am.items['decal']
    } else {
      bodyMat.color = new THREE.Color(0x26d6e9)
    }
    this.bodyMat = bodyMat

    this.modelParts.forEach((item) => {
      if (item instanceof THREE.Mesh) {
        const mat = item.material as THREE.MeshStandardMaterial
        mat.aoMap = this.base.am.items['ut_car_body_ao']
      }
    })

    const Wheel = this.modelParts[35] as THREE.Group
    this.wheelModel = Wheel
  }
  setBodyEnvIntensity(value: number) {
    if (this.bodyMat) {
      this.bodyMat.envMapIntensity = value
    }
  }
}

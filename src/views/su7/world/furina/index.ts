import * as kokomi from 'kokomi.js'
import * as THREE from 'three'

import type World from '../index'

export default class Furina extends kokomi.Component {
  declare base: World
  model = new THREE.Group()
  realModel: THREE.Group
  modelParts: THREE.Object3D[]
  mixer: THREE.AnimationMixer
  actions: Record<string, THREE.AnimationAction> = {}
  currentAction: THREE.AnimationAction | null = null
  isPaused = true
  constructor(base: World) {
    super(base)

    this.realModel = this.base.am.items['driving'] as THREE.Group
    this.model.add(this.realModel)

    this.modelParts = kokomi.flatModel(this.realModel)
    this.modelParts.forEach((item) => {
      if (item instanceof THREE.Mesh) {
        if ((item.material as THREE.MeshPhongMaterial).isMeshPhongMaterial) {
          const newMat = new THREE.MeshBasicMaterial({
            transparent: true,
            map: item.material.map || null
          })
          item.material = newMat
        }
      }
    })

    this.model.scale.setScalar(0.074)
    this.model.rotation.y = Math.PI * 0.5
    this.model.position.set(0.225, 0.15, -0.4)

    this.mixer = new THREE.AnimationMixer(this.model)
    this.addAction('driving', 'driving')
    this.playAction('driving')
    this.mixer.update(1)
  }
  addExisting() {
    this.container.add(this.model)
  }
  update() {
    if (this.isPaused) {
      return
    }
    this.mixer.update(this.base.clock.deltaTime)
  }
  addAction(assetName: string, name: string) {
    const animation = (this.base.am?.items[assetName] as THREE.Group).animations[0]
    const action = this.mixer.clipAction(animation)
    this.actions[name] = action
  }
  playAction(name: string) {
    if (this.currentAction) {
      this.currentAction.fadeOut(0.5)
    }
    const action = this.actions[name]
    action.weight = 1
    action.reset().fadeIn(0.5).play()
    this.currentAction = action
    return action
  }
  setColor(color: THREE.Color) {
    this.modelParts.forEach((item) => {
      if (item instanceof THREE.Mesh) {
        const mat = item.material as THREE.MeshBasicMaterial
        mat.color.set(color)
      }
    })
  }
  pause() {
    this.isPaused = true
  }
  drive() {
    this.isPaused = false
  }
}

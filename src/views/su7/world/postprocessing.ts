import * as kokomi from 'kokomi.js'
import * as POSTPROCESSING from 'postprocessing'

import type World from './index'

export default class PostProcessing extends kokomi.Component {
  declare base: World
  params
  bloom: POSTPROCESSING.BloomEffect
  constructor(base: World) {
    super(base)

    this.params = {}

    const composer = new POSTPROCESSING.EffectComposer(this.base.renderer, {
      multisampling: 8
    })
    // @ts-ignore
    this.base.composer = composer

    composer.addPass(new POSTPROCESSING.RenderPass(this.base.scene, this.base.camera))

    const bloom = new POSTPROCESSING.BloomEffect({
      blendFunction: POSTPROCESSING.BlendFunction.ADD,
      mipmapBlur: true,
      luminanceThreshold: 0,
      luminanceSmoothing: this.base.params.bloomLuminanceSmoothing
    })
    this.bloom = bloom

    const effectPass = new POSTPROCESSING.EffectPass(this.base.camera, bloom)
    composer.addPass(effectPass)
  }
  setLuminanceSmoothing(value: number) {
    this.bloom.luminanceMaterial.smoothing = value
  }
  setIntensity(value: number) {
    this.bloom.intensity = value
  }
}

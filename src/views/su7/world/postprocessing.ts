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

    // 效果合成器 composer，多重采样为 8
    const composer = new POSTPROCESSING.EffectComposer(this.base.renderer, {
      multisampling: 8
    })
    // @ts-ignore
    this.base.composer = composer

    // 渲染通道
    composer.addPass(new POSTPROCESSING.RenderPass(this.base.scene, this.base.camera))

    // Bloom 效果
    const bloom = new POSTPROCESSING.BloomEffect({
      blendFunction: POSTPROCESSING.BlendFunction.ADD, // 使用 ADD 混合函数
      mipmapBlur: true, // 启用 mipmap 模糊
      luminanceThreshold: 0, // 亮度阈值为 0
      luminanceSmoothing: this.base.params.bloomLuminanceSmoothing // 亮度平滑度从 base.params 获取
    })
    this.bloom = bloom

    // 效果通道
    const effectPass = new POSTPROCESSING.EffectPass(this.base.camera, bloom)
    composer.addPass(effectPass)

    const postFolder = this.base.debug.addFolder('Bloom')
    postFolder
      .add(this.base.params, 'bloomLuminanceSmoothing', 0, 2, 0.01)
      .name('luminanceSmoothing')
      .onChange((value: number) => {
        this.setLuminanceSmoothing(value)
      })
    postFolder
      .add(this.base.params, 'bloomIntensity', 0, 2, 0.01)
      .name('intensity')
      .onChange((value: number) => {
        this.setIntensity(value)
      })
  }
  // 设置亮度平滑度
  setLuminanceSmoothing(value: number) {
    this.bloom.luminanceMaterial.smoothing = value
  }
  // 设置强度
  setIntensity(value: number) {
    this.bloom.intensity = value
  }
}

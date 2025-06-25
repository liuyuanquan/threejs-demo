import * as kokomi from 'kokomi.js'
import * as THREE from 'three'
import gsap from 'gsap'
import { createNoise2D } from 'simplex-noise'

import type World from '../index'

const noise2d = createNoise2D()

// 噪声生成
const fbm = ({
  octave = 3, // 噪声层数（层数越多细节越丰富）
  frequency = 2, // 控制噪声频率变化
  amplitude = 0.5, // 控制振幅衰减
  lacunarity = 2, // 控制噪声频率变化
  persistance = 0.5 // 控制振幅衰减
} = {}) => {
  // 分形布朗运动（FBM），通过多层噪声叠加生成更自然的随机值
  let value = 0
  for (let i = 0; i < octave; i++) {
    const noiseValue = noise2d(frequency, frequency)
    value += noiseValue * amplitude
    frequency *= lacunarity // 频率递增
    amplitude *= persistance // 振幅递减
  }
  return value
}

export interface CameraShakeConfig {
  intensity: number
}

export default class CameraShake extends kokomi.Component {
  declare base: World
  private intensity: number
  private tweenedPosOffset: THREE.Vector3

  constructor(base: World, config: Partial<CameraShakeConfig> = {}) {
    super(base)

    this.intensity = config.intensity ?? 1
    this.tweenedPosOffset = new THREE.Vector3(0, 0, 0)

    const cameraShakeFolder = this.base.debug.addFolder('CameraShake')
    cameraShakeFolder
      .add(this.base.params, 'cameraShakeIntensity', 0, 2, 0.01)
      .name('intensity')
      .onChange((value: number) => {
        this.setIntensity(value)
      })
  }

  /**
   * 更新相机震动效果
   */
  update(): void {
    const t = this.base.clock.elapsedTime
    const posOffset = new THREE.Vector3(
      fbm({
        frequency: t * 0.5 + THREE.MathUtils.randFloat(-10000, 0),
        amplitude: 2
      }),
      fbm({
        frequency: t * 0.5 + THREE.MathUtils.randFloat(-10000, 0),
        amplitude: 2
      }),
      fbm({
        frequency: t * 0.5 + THREE.MathUtils.randFloat(-10000, 0),
        amplitude: 2
      })
    ).multiplyScalar(0.1 * this.intensity)

    // 使用更平滑的动画过渡
    gsap.to(this.tweenedPosOffset, {
      x: posOffset.x,
      y: posOffset.y,
      z: posOffset.z,
      duration: 1.2
    })

    this.base.camera.position.add(this.tweenedPosOffset)
  }

  /**
   * 设置震动强度
   * @param value 强度值
   */
  setIntensity(value: number): void {
    this.intensity = Math.max(0, value)
  }
}

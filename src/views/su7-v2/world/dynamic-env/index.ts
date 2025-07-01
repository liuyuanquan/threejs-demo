import * as THREE from 'three'
import { FullScreenQuad } from 'three/examples/jsm/Addons.js'
import World from '../index'
import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

/**
 * 动态环境贴图类，用于混合两种环境贴图并实时更新
 */
export default class DynamicEnv {
  // 基础世界实例
  base: World

  // 渲染目标
  rt: THREE.WebGLRenderTarget

  // 着色器材质
  material: THREE.ShaderMaterial

  // 全屏四边形渲染器
  quad: FullScreenQuad

  // 是否需要更新标志
  needUpdate: boolean = true

  /**
   * 构造函数
   * @param base - World 实例
   */
  constructor(base: World) {
    this.base = base

    // 从资源加载环境贴图
    const envMap1 = base.resources['t_env_light.hdr'] as THREE.DataTexture
    const envMap2 = base.resources['t_env_night.hdr'] as THREE.DataTexture
    const envData = envMap1.source.data

    // 创建渲染目标
    this.rt = new THREE.WebGLRenderTarget(envData.width, envData.height, {
      type: THREE.HalfFloatType, // 使用半浮点类型
      colorSpace: THREE.LinearSRGBColorSpace, // 线性颜色空间
      depthBuffer: false // 禁用深度缓冲
    })
    this.rt.texture.mapping = THREE.CubeUVReflectionMapping // 设置立方体贴图映射方式

    // 创建着色器材质
    this.material = new THREE.ShaderMaterial({
      vertexShader, // 顶点着色器
      fragmentShader, // 片段着色器
      uniforms: {
        uEnvMap1: { value: envMap1 }, // 环境贴图1
        uEnvMap2: { value: envMap2 }, // 环境贴图2
        uWeight: { value: 0.5 }, // 混合权重 (0-1)
        uIntensity: { value: 0.5 } // 强度系数
      }
    })

    // 创建全屏四边形渲染器
    this.quad = new FullScreenQuad(this.material)
  }

  /**
   * 更新环境贴图
   */
  update(): void {
    if (this.needUpdate) {
      this.needUpdate = false

      // 设置渲染目标并渲染
      this.base.renderer.setRenderTarget(this.rt)
      this.quad.render(this.base.renderer)
      this.base.renderer.setRenderTarget(null)
    }
  }

  /**
   * 获取当前环境贴图
   */
  get envMap(): THREE.Texture {
    return this.rt.texture
  }

  /**
   * 设置环境贴图混合权重
   * @param value - 混合权重 (0-1)
   */
  setWeight(value: number): void {
    this.material.uniforms.uWeight.value = value
    this.needUpdate = true
  }

  /**
   * 设置环境贴图强度
   * @param value - 强度值
   */
  setIntensity(value: number): void {
    this.material.uniforms.uIntensity.value = value
    this.needUpdate = true
  }
}

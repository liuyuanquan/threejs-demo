import * as THREE from 'three'
import * as STDLIB from 'three-stdlib'
import World from '../index'
import { REFLECT_LAYER } from '../../const'
import vertexShader from './vert.glsl'
import fragmentShader from './frag.glsl'

export default class Car {
  base: World

  model: STDLIB.GLTF // 车辆GLTF模型
  bodyMat!: THREE.MeshStandardMaterial // 车身材质
  wheel!: THREE.Group // 车轮组

  private cubeRenderTarget: THREE.WebGLCubeRenderTarget | null = null // 立方体渲染目标（环境贴图）
  private probePos = new THREE.Vector4(0, 0, 0, 1) // 探针位置(xyz)和激活状态(w)
  private probeBoxMin = new THREE.Vector3() // 包围盒最小顶点坐标
  private probeBoxMax = new THREE.Vector3() // 包围盒最大顶点坐标
  private uEnvMapIntensity = 1 // 环境贴图强度系数
  private uDiscardOpacity = 1 // 材质透明度阈值

  constructor(base: World) {
    this.base = base

    // 加载模型资源
    const model = base.resources['sm_car.glb'] as STDLIB.GLTF
    this.model = model

    // 初始化车身材质
    const body = model.scene.getObjectByName('body') as THREE.Mesh
    const bodyMat = body.material as THREE.MeshStandardMaterial
    bodyMat.color = new THREE.Color(38 / 255, 214 / 255, 233 / 255)
    this.bodyMat = bodyMat

    // 初始化车轮
    this.wheel = model.scene.getObjectByName('Wheel') as THREE.Group

    // 设置包围盒
    this.updateCarBounding(model.scene)

    // 处理所有网格材质
    model.scene.traverse((item) => {
      if (item instanceof THREE.Mesh) {
        item.layers.enable(REFLECT_LAYER) // 启用反射层

        const mat = item.material as THREE.MeshStandardMaterial
        // 设置环境光遮蔽贴图
        mat.aoMap = base.resources['t_car_body_AO.raw.jpg'] as THREE.Texture

        this.updateCarMaterial(mat)
      }
    })
  }

  /**
   * 更新车辆包围盒信息
   * @param car - 要计算包围盒的3D对象
   */
  private updateCarBounding(car: THREE.Object3D) {
    // 创建新的包围盒对象
    const box = new THREE.Box3()
    // 根据对象几何体计算包围盒
    box.setFromObject(car)

    // 设置探针位置（使用对象位置，w=1表示激活）
    this.probePos.set(car.position.x, car.position.y, car.position.z, 1)
    // 更新包围盒边界
    this.probeBoxMin.copy(box.min)
    this.probeBoxMax.copy(box.max)
  }

  /**
   * 更新车辆材质配置（实现盒投影环境映射）
   * @param material - 要修改的标准网格材质
   */
  private updateCarMaterial(material: THREE.MeshStandardMaterial) {
    material.defines.USE_BOX_PROJECTION = ''
    // 修改内置材质
    material.onBeforeCompile = (shader) => {
      shader.uniforms = {
        ...shader.uniforms,
        // 环境立方体贴图
        cubeCaptureReflectMap: {
          value: this.cubeRenderTarget?.texture || null
        },
        // 模糊环境贴图（预留）
        blurCaptureReflectMap: {
          value: null
        },
        // 环境贴图强度
        vEnvMapIntensity: {
          value: this.uEnvMapIntensity
        },
        // 透明度阈值
        vDiscardOpacity: {
          value: this.uDiscardOpacity
        },
        probeBoxMax: {
          value: this.probeBoxMax
        },
        probeBoxMin: {
          value: this.probeBoxMin
        },
        probePos: {
          value: this.probePos
        }
      }
      shader.vertexShader = vertexShader
      shader.fragmentShader = fragmentShader
    }
    // 标记材质需要重新编译
    material.needsUpdate = true
  }

  addExisting() {
    this.base.scene.add(this.model.scene)
  }

  update() {
    // this.wheel?.children.forEach((item) => {
    //   item.rotateZ(-this.base.params.speed * 0.03)
    // })
  }
}

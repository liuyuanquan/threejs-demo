<template>
  <div
    ref="container"
    class="demo7"
    style="width: 100vw; height: 100vh; position: relative; overflow: hidden"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three/webgpu'
import {
  step,
  normalWorld,
  output,
  texture,
  vec3,
  vec4,
  normalize,
  positionWorld,
  bumpMap,
  cameraPosition,
  color,
  uniform,
  mix,
  uv,
  max
} from 'three/tsl'
import { GUI } from 'three/addons/libs/lil-gui.module.min.js'
import Stats from 'three/addons/libs/stats.module.js'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const container = ref()
const world = ref()

class World {
  container: HTMLDivElement
  scene = new THREE.Scene()
  camera!: THREE.PerspectiveCamera
  renderer = new THREE.WebGPURenderer()
  sun = new THREE.DirectionalLight('#ffffff', 2)
  globe!: THREE.Mesh
  axesHelper = new THREE.AxesHelper(150)
  controls!: OrbitControls
  gui = new GUI()
  stats = new Stats()
  clock = new THREE.Clock()
  // 统一变量（uniforms）
  debugParams = {
    // 白天大气颜色（浅蓝色）
    atmosphereDayColor: uniform(color('#4db2ff')),
    // 黄昏大气颜色（橙棕色）
    atmosphereTwilightColor: uniform(color('#bc490b')),
    // 最小粗糙度值
    roughnessLow: uniform(0.25),
    // 最大粗糙度值
    roughnessHigh: uniform(0.35)
  }
  constructor(container: HTMLDivElement) {
    this.container = container
    this.initCamera()
    this.initRenderer()
    this.initWorld()
    this.initUtils()
    this.initEventListeners()
  }
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      25,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      10000
    )
    this.camera.position.set(4.5, 2, 3)
    this.camera.lookAt(0, 0, 0)
  }
  initRenderer() {
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setClearColor(0x000000, 1)
    this.renderer.setAnimationLoop(this.update.bind(this))
    this.container.appendChild(this.renderer.domElement)
  }
  async initWorld() {
    this.sun.position.set(0, 0, 3)
    this.scene.add(this.sun)
    const sunHelper = new THREE.DirectionalLightHelper(this.sun, 1)
    // this.scene.add(sunHelper)

    // textures
    const textureLoader = new THREE.TextureLoader()
    textureLoader.setPath('https://static.skyreels.ai/webvideo/img/')

    // 加载白天地球纹理
    const dayTexture = textureLoader.load('earth_day_4096.jpg')
    dayTexture.colorSpace = THREE.SRGBColorSpace
    // 各向异性过滤，提升倾斜角度下的纹理质量
    dayTexture.anisotropy = 8

    // 加载夜晚地球纹理（城市灯光）
    const nightTexture = textureLoader.load('earth_night_4096.jpg')
    nightTexture.colorSpace = THREE.SRGBColorSpace
    // 各向异性
    nightTexture.anisotropy = 8

    // 加载包含地形凹凸、粗糙度和云层的复合纹理
    const bumpRoughnessCloudsTexture = textureLoader.load(
      'earth_bump_roughness_clouds_4096.jpg'
    )
    // 各向异性
    bumpRoughnessCloudsTexture.anisotropy = 8

    // 菲涅尔效应计算
    // 获取世界空间下顶点到相机的方向向量
    const viewDirection = positionWorld.sub(cameraPosition).normalize()
    // 视角方向与法线方向的点积越大，说明入射角小，Fresnel 效应越弱；反之则越强，所以用 1 - dot 做了一个反转。
    const fresnel = viewDirection.dot(normalWorld).abs().oneMinus().toVar()

    // 太阳方向计算
    // 地球表面的法线与太阳光方向做点积，点积大于 0 说明面向太阳，为白天；数值靠近负则是背光面，为夜晚。
    const sunOrientation = normalWorld.dot(normalize(this.sun.position)).toVar()

    // 大气颜色计算
    // 根据太阳角度混合白天蓝色和晨昏橙色。
    const atmosphereColor = mix(
      this.debugParams.atmosphereTwilightColor,
      this.debugParams.atmosphereDayColor,
      sunOrientation.smoothstep(-0.25, 0.75)
    )

    // 地球材质设置
    // 创建标准材质用于地球
    const globeMaterial = new THREE.MeshStandardNodeMaterial()

    // 从云图的蓝色通道中提取数据，通过 smoothstep 筛选出云层分布区域。
    const cloudsStrength = texture(bumpRoughnessCloudsTexture, uv()).b.smoothstep(0.2, 1)

    // 混合白天贴图与纯白色，只有云层区域会被叠加到偏白的效果。
    globeMaterial.colorNode = mix(texture(dayTexture), vec3(1), cloudsStrength.mul(2))

    // 从绿通道获取粗糙度信息，并与云层强度取一个最大值，使云层部分看起来更粗糙。
    const roughness = max(
      texture(bumpRoughnessCloudsTexture).g,
      step(0.01, cloudsStrength)
    )
    // 将粗糙度值重新映射到高低范围之间
    globeMaterial.roughnessNode = roughness.remap(
      0,
      1,
      this.debugParams.roughnessLow,
      this.debugParams.roughnessHigh
    )

    // 获取夜晚纹理
    const night = texture(nightTexture)
    // 根据太阳方向计算白天强度
    const dayStrength = sunOrientation.smoothstep(-0.25, 0.5)

    // 根据太阳方向计算大气白天强度
    const atmosphereDayStrength = sunOrientation.smoothstep(-0.5, 1)
    // 使用菲涅尔效应计算最终大气混合强度
    const atmosphereMix = atmosphereDayStrength.mul(fresnel.pow(2)).clamp(0, 1)

    // 首先混合夜晚和白天颜色
    let finalOutput = mix(night.rgb, output.rgb, dayStrength)
    // 然后混合入大气颜色
    finalOutput = mix(finalOutput, atmosphereColor, atmosphereMix)

    // 设置最终材质输出（保持原始alpha通道）
    globeMaterial.outputNode = vec4(finalOutput, output.a)

    // 计算凹凸高度 - 使用纹理的红色通道或云层强度
    const bumpElevation = max(texture(bumpRoughnessCloudsTexture).r, cloudsStrength)
    // 使用凹凸高度设置法线贴图
    globeMaterial.normalNode = bumpMap(bumpElevation)

    // 创建球体几何体（单位球体，64x64分段）
    const sphereGeometry = new THREE.SphereGeometry(1, 64, 64)
    // 创建地球网格
    this.globe = new THREE.Mesh(sphereGeometry, globeMaterial)
    this.scene.add(this.globe)

    // 大气层设置

    // 创建背面透明的材质用于大气层
    const atmosphereMaterial = new THREE.MeshBasicNodeMaterial({
      side: THREE.BackSide,
      transparent: true
    })
    // Fresnel 进行了一次 remap 和 pow(3)，使得在球体边缘处才渐渐显现大气。
    let alpha: any = fresnel.remap(0.73, 1, 1, 0).pow(3)
    // 结合太阳角度，只有在面向太阳的半球才会显得亮一些。
    alpha = alpha.mul(sunOrientation.smoothstep(-0.5, 1))
    // 设置最终大气材质输出
    atmosphereMaterial.outputNode = vec4(atmosphereColor, alpha)

    // 创建大气层网格（比地球稍大）
    const atmosphere = new THREE.Mesh(sphereGeometry, atmosphereMaterial)
    // 将大气层缩放至比地球大4%
    atmosphere.scale.setScalar(1.04)
    this.scene.add(atmosphere)
  }
  initUtils() {
    // this.scene.add(this.axesHelper)

    this.controls = new OrbitControls(this.camera, this.container)
    this.controls.enableDamping = true

    this.gui
      .addColor(
        {
          color: this.debugParams.atmosphereDayColor.value.getHex(THREE.SRGBColorSpace)
        },
        'color'
      )
      .name('atmosphereDayColor')
      .onChange((value) => {
        this.debugParams.atmosphereDayColor.value.set(value)
      })
    this.gui
      .addColor(
        {
          color: this.debugParams.atmosphereTwilightColor.value.getHex(
            THREE.SRGBColorSpace
          )
        },
        'color'
      )
      .name('atmosphereTwilightColor')
      .onChange((value) => {
        this.debugParams.atmosphereTwilightColor.value.set(value)
      })
    this.gui.add(this.debugParams.roughnessLow, 'value', 0, 1, 0.001).name('roughnessLow')
    this.gui
      .add(this.debugParams.roughnessHigh, 'value', 0, 1, 0.001)
      .name('roughnessHigh')
    // this.gui.close()

    container.value.appendChild(this.stats.dom)
  }
  initEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }
  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
  async update() {
    this.controls?.update?.()
    this.stats?.update?.()
    const delta = this.clock.getDelta()
    this.globe.rotation.y += delta * 0.025
    await this.renderer.renderAsync(this.scene, this.camera)
  }
}
onMounted(() => {
  world.value = new World(container.value)
  document.title = 'ThreeJS - 地球'
})
</script>
<style lang="scss"></style>

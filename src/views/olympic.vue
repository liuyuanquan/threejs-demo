<template>
  <div ref="container" class="three-container" />
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import TWEEN from 'three/addons/libs/tween.module.js'

// 容器引用
const container = ref<HTMLDivElement>()

// 冬奥场景类
class WinterOlympicsScene {
  container: HTMLDivElement
  // 核心Three.js对象
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private renderer!: THREE.WebGLRenderer

  // 场景元素
  private olympicRingsGroup = new THREE.Group() // 奥运五环组
  private snowParticles!: THREE.Points // 雪花粒子系统
  private characterModels: THREE.Object3D[] = [] // 角色模型数组
  private environmentModels: THREE.Object3D[] = [] // 环境模型数组

  // 动画相关
  private animationMixer!: THREE.AnimationMixer
  private clock = new THREE.Clock()

  // 工具类
  private textureLoader: THREE.TextureLoader
  private gltfLoader: GLTFLoader
  private loadingManager: THREE.LoadingManager
  private orbitControls!: OrbitControls
  private stats!: Stats
  private debugGUI!: GUI

  // 配置参数
  private config = {
    ambientLight: { intensity: 4.48 },
    snow: {
      particleCount: 1500,
      size: 1,
      opacity: 0.8,
      fallSpeed: { min: 0.1, max: 0.4 },
      swayRange: 0.5
    }
  }

  // 粒子数据
  private particleVelocities: Array<{ x: number; y: number }> = []

  constructor(container: HTMLDivElement) {
    this.container = container
    this.initLoaders()
    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initLights()
    this.loadAssets()
    this.initHelpers()
    this.initEventListeners()
  }

  /** 初始化加载器 */
  private initLoaders() {
    this.loadingManager = new THREE.LoadingManager(
      () => {
        console.log('所有资源加载完成')
        new TWEEN.Tween(this.camera.position)
          .to({ x: 0, y: -1, z: 20 }, 3600)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start()

        // 创建控制器目标点动画
        new TWEEN.Tween(this.orbitControls.target)
          .to({ x: 0, y: 0, z: 5 }, 3600)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .start()
      },
      (url, loaded, total) => console.log(`加载进度: ${loaded}/${total} - ${url}`),
      (url) => console.error(`加载失败: ${url}`)
    )

    this.textureLoader = new THREE.TextureLoader(this.loadingManager)
    this.textureLoader.setPath('/olympic/')

    this.gltfLoader = new GLTFLoader(this.loadingManager)
    this.gltfLoader.setPath('/olympic/')
  }

  /** 初始化场景 */
  private initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = this.textureLoader.load('sky.jpg')
    this.scene.fog = new THREE.Fog(0xffffff, 10, 100)
  }

  /** 初始化相机 */
  private initCamera() {
    const aspect = this.container.clientWidth / this.container.clientHeight
    this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
    this.camera.position.set(0, 30, 100)
    this.camera.lookAt(0, 0, 0)
  }

  /** 初始化渲染器 */
  private initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    this.container.appendChild(this.renderer.domElement)
    this.renderer.setAnimationLoop(this.animate.bind(this))
  }

  /** 初始化灯光系统 */
  private initLights() {
    // 主定向光
    const mainLight = new THREE.DirectionalLight(0xffffff, 1)
    mainLight.position.set(16, 16, 8)
    mainLight.castShadow = true
    mainLight.shadow.mapSize.width = 2048
    mainLight.shadow.mapSize.height = 2048
    mainLight.shadow.camera.near = 0.5
    mainLight.shadow.camera.far = 500
    mainLight.shadow.camera.left = -40
    mainLight.shadow.camera.right = 40
    mainLight.shadow.camera.top = 40
    mainLight.shadow.camera.bottom = -40
    this.scene.add(mainLight)

    // 环境光
    const ambientLight = new THREE.AmbientLight(
      0xcfffff,
      this.config.ambientLight.intensity
    )
    this.scene.add(ambientLight)
  }

  /** 加载所有3D资产 */
  private loadAssets() {
    this.loadGround()
    this.loadFlag()
    this.loadMascots()
    this.loadTrees()
    this.createOlympicRings()
    this.createSnowParticles()
  }

  /** 加载地面模型 */
  private loadGround() {
    this.gltfLoader.load('land.glb', (gltf) => {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material.metalness = 0.1
          child.material.roughness = 0.8

          if (child.name === 'Mesh_2') {
            child.material.metalness = 0.5
            child.receiveShadow = true
          }
        }
      })

      gltf.scene.rotation.y = Math.PI / 4
      gltf.scene.position.set(15, -20, 0)
      gltf.scene.scale.set(0.9, 0.9, 0.9)

      this.scene.add(gltf.scene)
      this.environmentModels.push(gltf.scene)
    })
  }

  /** 加载旗帜模型 */
  private loadFlag() {
    this.gltfLoader.load('flag.glb', (gltf) => {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true

          if (child.name === 'mesh_0001') {
            // 旗帜部分
            child.material.metalness = 0.1
            child.material.roughness = 0.1
            child.material.map = this.textureLoader.load('flag.png')
          }

          if (child.name === '柱体') {
            // 旗杆
            child.material.metalness = 0.6
            child.material.roughness = 0
            child.material.color = new THREE.Color(0xeeeeee)
          }
        }
      })

      gltf.scene.position.set(2, -7, -1)
      gltf.scene.scale.set(4, 4, 4)

      // 设置旗帜动画
      this.animationMixer = new THREE.AnimationMixer(gltf.scene)
      const clipAction = this.animationMixer.clipAction(gltf.animations[0])
      clipAction.play()

      this.scene.add(gltf.scene)
      this.environmentModels.push(gltf.scene)
    })
  }

  /** 加载吉祥物模型 */
  private loadMascots() {
    // 冰墩墩
    this.gltfLoader.load('bingdwendwen.glb', (gltf) => {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (child.name === '皮肤') {
            child.material.metalness = 0.3
            child.material.roughness = 0.8
          }

          if (child.name === '外壳') {
            child.material.transparent = true
            child.material.opacity = 0.4
            child.material.metalness = 0.4
            child.material.roughness = 0
            child.material.refractionRatio = 1.6
            child.castShadow = true
            child.material.envMap = this.textureLoader.load('sky.jpg')
            child.material.envMapIntensity = 1
          }

          if (child.name === '围脖') {
            child.material.transparent = true
            child.material.opacity = 0.6
            child.material.metalness = 0.4
            child.material.roughness = 0.6
          }
        }
      })

      gltf.scene.rotation.y = Math.PI / 24
      gltf.scene.position.set(-5, -11.5, 0)
      gltf.scene.scale.set(24, 24, 24)

      this.scene.add(gltf.scene)
      this.characterModels.push(gltf.scene)
    })

    // 雪容融
    this.gltfLoader.load('xuerongrong.glb', (gltf) => {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true
        }
      })

      gltf.scene.rotation.y = Math.PI / 3
      gltf.scene.position.set(-20, -10.8, 0)
      gltf.scene.scale.set(12, 12, 12)

      this.scene.add(gltf.scene)
      this.characterModels.push(gltf.scene)
    })
  }

  /** 加载树木模型 */
  private loadTrees() {
    const treeMaterial = new THREE.MeshPhysicalMaterial({
      map: this.textureLoader.load('tree.png'),
      transparent: true,
      side: THREE.DoubleSide,
      metalness: 0.2,
      roughness: 0.8
    })

    const treeDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: this.textureLoader.load('tree.png'),
      alphaTest: 0.5
    })

    this.gltfLoader.load('tree.gltf', (gltf) => {
      gltf.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.material = treeMaterial
          child.customDepthMaterial = treeDepthMaterial
        }
      })

      // 主树
      gltf.scene.position.set(14, -9, 0)
      gltf.scene.scale.set(16, 16, 16)
      this.scene.add(gltf.scene)
      this.environmentModels.push(gltf.scene)

      let tree2 = gltf.scene.clone()
      tree2.position.set(10, -8, -15)
      tree2.scale.set(18, 18, 18)
      this.scene.add(tree2)

      let tree3 = gltf.scene.clone()
      tree3.position.set(-18, -8, -16)
      tree3.scale.set(22, 22, 22)
      this.scene.add(tree3)
    })
  }

  /** 创建奥运五环 */
  private createOlympicRings() {
    const ringsConfig = [
      { color: 0x0885c2, position: { x: -250, y: 0, z: 0 } }, // 蓝
      { color: 0x000000, position: { x: -10, y: 0, z: 1 } }, // 黑
      { color: 0xed334e, position: { x: 230, y: 0, z: 0 } }, // 红
      { color: 0xfbb132, position: { x: -125, y: -100, z: -5 } }, // 黄
      { color: 0x1c8b3c, position: { x: 115, y: -100, z: 10 } } // 绿
    ]

    ringsConfig.forEach((ring) => {
      const ringMesh = new THREE.Mesh(
        new THREE.TorusGeometry(100, 10, 10, 50),
        new THREE.MeshLambertMaterial({
          color: new THREE.Color(ring.color),
          side: THREE.DoubleSide
        })
      )

      ringMesh.position.set(ring.position.x, ring.position.y, ring.position.z)
      this.olympicRingsGroup.add(ringMesh)
    })

    this.olympicRingsGroup.scale.set(0.036, 0.036, 0.036)
    this.olympicRingsGroup.position.set(0, 10, -8)
    this.scene.add(this.olympicRingsGroup)
  }

  /** 创建雪花粒子系统 */
  private createSnowParticles() {
    const texture = this.textureLoader.load('snow.png')
    const geometry = new THREE.BufferGeometry()

    // 初始化粒子位置
    const positions = new Float32Array(this.config.snow.particleCount * 3)
    const range = 100

    for (let i = 0; i < this.config.snow.particleCount; i++) {
      const i3 = i * 3
      positions[i3] = Math.random() * range - range / 2 // x
      positions[i3 + 1] = Math.random() * range * 1.5 // y
      positions[i3 + 2] = Math.random() * range - range / 2 // z

      // 存储粒子速度
      this.particleVelocities.push({
        x: ((Math.random() - 0.5) * this.config.snow.swayRange) / 3,
        y:
          this.config.snow.fallSpeed.min +
          Math.random() *
            (this.config.snow.fallSpeed.max - this.config.snow.fallSpeed.min)
      })
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

    // 居中粒子系统
    geometry.computeBoundingBox()
    const center = new THREE.Vector3()
    geometry.boundingBox?.getCenter(center)
    geometry.translate(-center.x, -center.y, -center.z)

    // 创建粒子材质
    const material = new THREE.PointsMaterial({
      size: this.config.snow.size,
      transparent: true,
      opacity: this.config.snow.opacity,
      map: texture,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthTest: false
    })

    this.snowParticles = new THREE.Points(geometry, material)
    this.snowParticles.position.y = -30
    this.scene.add(this.snowParticles)
  }

  /** 初始化辅助工具 */
  private initHelpers() {
    // 坐标轴辅助
    const axesHelper = new THREE.AxesHelper(150)
    // this.scene.add(axesHelper)

    // 轨道控制器
    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement)
    this.orbitControls.target.set(0, 0, 0)
    this.orbitControls.enableDamping = true
    this.orbitControls.enablePan = false
    this.orbitControls.enableZoom = false
    this.orbitControls.minPolarAngle = 1.4
    this.orbitControls.maxPolarAngle = 1.8
    this.orbitControls.minAzimuthAngle = -0.8
    this.orbitControls.maxAzimuthAngle = 0.8

    // 性能统计
    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)

    // 调试UI
    this.debugGUI = new GUI()
    this.debugGUI
      .addFolder('环境光')
      .add(this.config.ambientLight, 'intensity', 0, 10, 0.01)
      .name('强度')
      .onChange((value) => {
        this.scene.children.forEach((child) => {
          if (child instanceof THREE.AmbientLight) {
            child.intensity = value
          }
        })
      })
  }

  /** 初始化事件监听 */
  private initEventListeners() {
    window.addEventListener('resize', this.handleWindowResize.bind(this))
  }

  /** 处理窗口大小变化 */
  private handleWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }

  /** 更新场景 */
  private update() {
    // 旋转奥运五环
    this.olympicRingsGroup.rotation.y += 0.01

    // 更新雪花粒子
    if (this.snowParticles) {
      const positions = this.snowParticles.geometry.attributes.position.array

      for (let i = 0; i < this.config.snow.particleCount; i++) {
        const i3 = i * 3
        positions[i3] += this.particleVelocities[i].x
        positions[i3 + 1] -= this.particleVelocities[i].y // 雪花下落

        // 粒子回收
        if (positions[i3 + 1] < -50) {
          positions[i3 + 1] = 150
          positions[i3] = Math.random() * 200 - 100
          positions[i3 + 2] = Math.random() * 200 - 100
        }
      }

      this.snowParticles.geometry.attributes.position.needsUpdate = true
    }

    // 更新动画混合器
    if (this.animationMixer) {
      this.animationMixer.update(this.clock.getDelta())
    }

    // 更新轨道控制器
    this.orbitControls?.update()
  }

  /** 动画循环 */
  private animate() {
    this.stats.update()
    TWEEN.update()
    this.update()
    this.renderer.render(this.scene, this.camera)
  }
}

// 挂载场景
onMounted(() => {
  if (container.value) {
    new WinterOlympicsScene(container.value)
  }
  document.title = 'Three.js - 冬奥场景'
})
</script>

<style scoped>
.three-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
}
</style>

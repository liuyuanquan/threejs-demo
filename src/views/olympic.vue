<template>
  <div
    ref="container"
    style="width: 100vw; height: 100vh; position: relative; overflow: hidden"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const container = ref()

class World {
  container: HTMLDivElement
  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera
  renderer!: THREE.WebGLRenderer
  progress = 0
  fiveCyclesGroup = new THREE.Group()
  clock = new THREE.Clock()
  mouseX = 0
  mouseY = 0
  windowHalfX = 0
  windowHalfY = 0
  cube!: THREE.Mesh
  land!: THREE.Object3D
  textureLoader: THREE.TextureLoader
  gltfLoader: GLTFLoader
  manager: THREE.LoadingManager
  axesHelper!: THREE.AxesHelper
  stats!: Stats
  gui!: GUI
  controls!: OrbitControls
  constructor(container: HTMLDivElement) {
    this.container = container
    this.windowHalfX = this.container.clientWidth / 2
    this.windowHalfY = this.container.clientHeight / 2
    this.manager = new THREE.LoadingManager()
    this.textureLoader = new THREE.TextureLoader(this.manager)
    this.textureLoader.setPath('https://dragonir.github.io/3d/static/media/')
    this.gltfLoader = new GLTFLoader(this.manager)
    this.gltfLoader.setPath('https://dragonir.github.io/3d/static/media/')
    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initWorld()
    this.initLight()
    this.initUtils()
    this.initEventListeners()
  }
  initScene() {
    this.scene = new THREE.Scene()
    this.scene.background = this.textureLoader.load('sky.f8b8ce554883ed304721.jpg')
  }
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      10000
    )
    this.camera.position.set(0, 30, 100)
    this.camera.lookAt(0, 0, 0)
  }
  initRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    // renderer.shadowMap.enabled = true // 启用渲染器的阴影映射（总开关）
    // 新版three.js的颜色、光照与旧版不兼容，要手动调整
    THREE.ColorManagement.enabled = false
    renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    renderer.setAnimationLoop(this.animate.bind(this))
    this.container.appendChild(renderer.domElement)
    this.renderer = renderer
  }
  initLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1)
    light.position.set(16, 16, 8)
    light.target = this.cube
    light.castShadow = true // 启用阴影
    light.shadow.mapSize.width = 512 * 12 // 阴影贴图宽度
    light.shadow.mapSize.height = 512 * 12 // 阴影贴图高度
    light.shadow.camera.top = 40 // 视锥体上边界
    light.shadow.camera.bottom = -40 // 视锥体下边界
    light.shadow.camera.left = -40 // 视锥体左边界
    light.shadow.camera.right = 40 // 视锥体右边界
    const lightHelper = new THREE.DirectionalLightHelper(light, 1, 0xffffff)
    this.scene.add(lightHelper)
    const lightCameraHelper = new THREE.CameraHelper(light.shadow.camera)
    // this.scene.add(lightCameraHelper)

    const ambientLight = new THREE.AmbientLight(0xffffff, 1)
    this.scene.add(ambientLight)
  }
  initWorld() {
    const cubeGeometry = new THREE.BoxGeometry(0.001, 0.001, 0.001)
    const cubeMaterial = new THREE.MeshLambertMaterial({ color: 0xdc161a })

    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial)
    cube.position.set(0, 0, 0)
    this.cube = cube
    this.scene.add(cube)

    this.manager.onStart = () => {
      console.log('🚀 ~ World ~ initWorld ~ onStart:')
    }
    this.manager.onProgress = async (url, loaded, total) => {
      console.log('🚀 ~ World ~ manager.onProgress= ~ loaded:', url, loaded, total)
    }
    this.manager.onLoad = () => {
      console.log('🚀 ~ World ~ initWorld ~ onLoad:')
    }

    // 地面
    this.gltfLoader.load('land.7188100a8dbff49b41bc.glb', (mesh) => {
      mesh.scene.traverse((child) => {
        console.log('🚀 ~ World ~ mesh.scene.traverse ~ child:', child)
        if (child.isMesh) {
          child.material.metalness = 0.1
          child.material.roughness = 0.8
        }
        // 地面
        if (child.name === 'Mesh_2') {
          child.material.metalness = 0.5
          child.material.roughness = 0.6
          child.receiveShadow = true
        }
        // 围巾
        if (child.name === 'Mesh_17') {
          child.material.metalness = 0.2
          child.material.roughness = 0.8
        }
        // 帽子
        if (child.name === 'Mesh_17') {
          //
        }
      })

      mesh.scene.rotation.y = Math.PI / 4
      mesh.scene.position.set(15, -20, 0)
      mesh.scene.scale.set(0.9, 0.9, 0.9)

      this.land = mesh.scene
      this.scene.add(mesh.scene)
    })

    // 旗帜
    this.gltfLoader.load('flag.73c81d66494359ddbc6e.glb', (mesh) => {
      mesh.scene.traverse((child) => {
        if (child.isMesh) {
          // meshes.push(child)
          child.castShadow = true

          // 旗帜
          if (child.name === 'mesh_0001') {
            child.material.metalness = 0.1
            child.material.roughness = 0.1
            child.material.map = this.textureLoader.load('flag.a12d1476c6ee8e21517a.png')
          }

          // 旗杆
          if (child.name === '柱体') {
            child.material.metalness = 0.6
            child.material.roughness = 0
            child.material.refractionRatio = 1
            child.material.color = new THREE.Color(0xeeeeee)
          }
        }
      })

      mesh.scene.rotation.y = Math.PI / 24
      mesh.scene.position.set(2, -7, -1)
      mesh.scene.scale.set(4, 4, 4)

      // this.scene.add(mesh.scene)
    })

    // bingdwendwen
    this.gltfLoader.load('bingdwendwen.bd7d37ead8bb47ccaa79.glb', (mesh) => {
      console.log('🚀 ~ World ~ loader.load ~ mesh:', mesh)

      mesh.scene.rotation.y = Math.PI / 24
      mesh.scene.position.set(-5, -11.5, 0)
      mesh.scene.scale.set(24, 24, 24)

      // this.scene.add(mesh.scene)
    })

    // xuerongrong
    this.gltfLoader.load('xuerongrong.2de949bd2eb58f3f9516.glb', (mesh) => {
      console.log('🚀 ~ World ~ loader.load ~ mesh:', mesh)

      mesh.scene.rotation.y = Math.PI / 3
      mesh.scene.position.set(-20, -10.8, 0)
      mesh.scene.scale.set(12, 12, 12)

      // this.scene.add(mesh.scene)
    })

    // 树
    this.gltfLoader.load('tree.f250bceb208161a8fcef.gltf', (mesh) => {
      console.log('🚀 ~ World ~ loader.load ~ mesh:', mesh)

      // mesh.scene.rotation.y = Math.PI / 4
      // mesh.scene.position.set(0, 0, 0)
      // mesh.scene.scale.set(0.9, 0.9, 0.9)

      // this.scene.add(mesh.scene)
    })
  }
  initUtils() {
    this.axesHelper = new THREE.AxesHelper(150)
    this.scene.add(this.axesHelper)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 0, 0)
    this.controls.enableDamping = true

    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)

    this.gui = new GUI()
    this.gui.close()
  }
  initEventListeners() {
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }
  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
  update() {
    this.renderer.render(this.scene, this.camera)
  }
  animate() {
    if (this.controls?.enableDamping) {
      this.controls.update()
    }
    this.update()
    this.stats.update()
  }
}
onMounted(() => {
  new World(container.value)
  document.title = 'ThreeJS - 冬奥'
})
</script>

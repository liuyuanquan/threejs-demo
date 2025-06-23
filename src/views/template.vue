<template>
  <div ref="container" class="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref()

class World {
  container: HTMLDivElement
  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera
  renderer!: THREE.WebGLRenderer
  axesHelper!: THREE.AxesHelper
  stats!: Stats
  gui!: GUI
  controls!: OrbitControls
  constructor(container: HTMLDivElement) {
    this.container = container
    this.initScene()
    this.initCamera()
    this.initLight()
    this.initRenderer()
    this.initWorld()
    this.initUtils()
    this.initEventListeners()
  }
  initScene() {
    const scene = new THREE.Scene()
    // scene.fog = new THREE.Fog(0xffffff, 10, 100) // 雾
    this.scene = scene
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
    renderer.shadowMap.enabled = true // 启用渲染器的阴影映射（总开关）
    renderer.setAnimationLoop(this.animate.bind(this))
    this.container.appendChild(renderer.domElement)
    this.renderer = renderer
  }
  initLight() {
    const light = new THREE.DirectionalLight(0xffffff, 1)
    this.scene.add(light)
    const lightHelper = new THREE.DirectionalLightHelper(light, 1)
    this.scene.add(lightHelper)
  }
  initWorld() {
    //
  }
  initUtils() {
    this.axesHelper = new THREE.AxesHelper(150)
    this.scene.add(this.axesHelper)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
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
})
</script>

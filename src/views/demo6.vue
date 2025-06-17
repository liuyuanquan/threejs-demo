<template>
  <div
    ref="container"
    style="width: 100vw; height: 100vh; position: relative; overflow: hidden"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, shallowReactive } from 'vue'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js' // 渲染器通道RenderPass
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js' // Bloom发光
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js' // 高亮发光描边
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const container = ref()
const world = ref()

class World {
  container: HTMLDivElement
  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera
  renderer!: THREE.WebGLRenderer
  axesHelper!: THREE.AxesHelper
  stats!: Stats
  gui!: GUI
  controls!: OrbitControls
  uniforms: any // 着色器的统一变量
  clock: THREE.Clock
  audioLoaded: boolean = false
  audioBuffer!: AudioBuffer
  sound!: THREE.Audio
  soundAnalyser!: THREE.AudioAnalyser
  bloomComposer!: EffectComposer
  constructor(container: HTMLDivElement) {
    this.container = container
    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.uniforms = shallowReactive({
      u_time: { type: 'f', value: 0.0 }, // 时间变量，让物体或波动产生动画
      u_frequency: { type: 'f', value: 0.0 }, // 频率变量，用来从音频分析器获得的频率值，驱动几何体变形。
      u_red: { type: 'f', value: 0.3 }, // 红色分量
      u_green: { type: 'f', value: 1.0 }, // 绿色分量
      u_blue: { type: 'f', value: 0.6 } // 蓝色分量
    })
    this.clock = new THREE.Clock()
    this.initWorld()
    this.initAudio()
    this.initUtils()
    this.initEventListeners()
    this.update()
  }
  initScene() {
    this.scene = new THREE.Scene()
  }
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      10000
    )
    this.camera.position.set(10, 10, 10)
    this.camera.lookAt(0, 0, 0)
  }
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(0x000000, 0.5)
    // this.renderer.render(this.scene, this.camera)
    this.container.appendChild(this.renderer.domElement)

    // 创建渲染通道，用于后期处理
    const renderScene = new RenderPass(this.scene, this.camera)

    // 创建辉光通道，为场景添加发光效果
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
      0.5, // 设置辉光强度
      0.1, // 设置辉光半径
      0.5 // 设置辉光阈值，只有亮度超过此值的像素才会发光
    )

    // 创建效果合成器，用于组合多个后期处理效果
    this.bloomComposer = new EffectComposer(this.renderer)
    // 添加渲染通道
    this.bloomComposer.addPass(renderScene)
    // 添加辉光通道
    this.bloomComposer.addPass(bloomPass)

    // 创建输出通道，用于最终渲染结果的输出
    const outputPass = new OutputPass()
    // 添加输出通道到合成器
    this.bloomComposer.addPass(outputPass)
  }
  async loadShader(url: string) {
    try {
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      return await response.text()
    } catch (error) {
      console.error('Error loading shader:', error)
    }
  }
  async initWorld() {
    const vertexShader = await this.loadShader('/demo6/vertex.glsl')
    const fragmentShader = await this.loadShader('/demo6/fragment.glsl')

    const mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader,
      fragmentShader
    })

    // 创建二十面体几何体，用于雷达效果
    const geo = new THREE.IcosahedronGeometry(4, 30)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.material.wireframe = true
    this.scene.add(mesh)
  }
  initAudio() {
    // 创建音频监听器
    const listener = new THREE.AudioListener()
    // 将监听器添加到相机
    this.camera.add(listener)
    // 创建音频对象
    this.sound = new THREE.Audio(listener)
    this.sound.setLoop(true)
    this.sound.setVolume(0.5)
    // 创建音频加载器
    const audioLoader = new THREE.AudioLoader()
    audioLoader.load('/demo6/Beats.mp3', (buffer) => {
      console.log('🚀 ~ World ~ audioLoader.load ~ buffer:', buffer)
      this.audioBuffer = buffer
      this.audioLoaded = true
    })
    this.soundAnalyser = new THREE.AudioAnalyser(this.sound, 32)
  }
  initUtils() {
    // this.axesHelper = new THREE.AxesHelper(150)
    // this.scene.add(this.axesHelper)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)

    this.gui = new GUI()
    this.gui.close()
  }
  initEventListeners() {
    document.addEventListener('click', () => {
      if (this.audioLoaded) {
        this.sound.setBuffer(this.audioBuffer)
        try {
          if (!this.sound.isPlaying) {
            this.sound.play()
          } else {
            // this.sound.pause()
          }
        } catch (e) {
          console.log('🚀 ~ World ~ document.addEventListener ~ e:', e)
        }
      }
    })
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }
  onWindowResize() {
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
  update() {
    if (this.clock) {
      // 更新时间变量
      this.uniforms.u_time.value = this.clock.getElapsedTime()
    }
    if (this.soundAnalyser) {
      // 更新频率变量，根据音频分析器获取的平均频率
      this.uniforms.u_frequency.value = this.soundAnalyser.getAverageFrequency()
    }
    this.controls?.update?.()
    this.stats?.update?.()
    // 使用效果合成器渲染场景
    this.bloomComposer?.render()
    requestAnimationFrame(this.update.bind(this))
  }
}
onMounted(() => {
  world.value = new World(container.value)
  document.title = 'ThreeJS - 音乐可视化'
})
</script>

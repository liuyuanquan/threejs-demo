<template>
  <div ref="container" class="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three-176'
import { GUI } from 'three-176/examples/jsm/libs/lil-gui.module.min.js'
import Stats from 'three-176/examples/jsm/libs/stats.module.js'
import { OrbitControls } from 'three-176/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three-176/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three-176/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three-176/examples/jsm/postprocessing/UnrealBloomPass.js'
import CustomPass from './custom-pass'
import { NoisePass } from './noise-pass'
import mitt from 'mitt'

const container = ref()
const world = ref()
const eventBus = mitt()

class World {
  container: HTMLDivElement
  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera
  renderer!: THREE.WebGLRenderer
  resources: Record<string, THREE.Texture | THREE.CubeTexture> = {}
  composer!: EffectComposer
  bloomPass!: UnrealBloomPass
  noisePass!: NoisePass
  customPass!: CustomPass
  axesHelper!: THREE.AxesHelper
  stats!: Stats
  gui!: GUI
  controls!: OrbitControls
  clock: THREE.Clock

  constructor(container: HTMLDivElement) {
    this.container = container
    this.initScene()
    this.initLight()
    this.initCamera()
    this.clock = new THREE.Clock()
    this.initLoaders()
    this.initRenderer()
    this.initUtils()
    this.initEventListeners()
    this.update()
    eventBus.on('ready', () => {
      this.initWorld()
    })
  }
  initScene() {
    this.scene = new THREE.Scene()
  }
  initLoaders() {
    const manager = new THREE.LoadingManager()
    manager.onProgress = (url: string, itemsLoaded: number, itemsTotal: number) => {
      console.log(
        'Loading file: ' +
          url +
          '.\nLoaded ' +
          itemsLoaded +
          ' of ' +
          itemsTotal +
          ' files.'
      )
    }
    manager.onLoad = () => {
      console.log('Loading complete!')
      // const displacementTexture = this.resources['displacementTexture']
      // displacementTexture.wrapS = displacementTexture.wrapT = THREE.RepeatWrapping
      // displacementTexture.repeat.set(1, 4)
      // displacementTexture.anisotropy = 16

      // const normalTexture = this.resources['normalTexture']
      // normalTexture.wrapS = normalTexture.wrapT = THREE.RepeatWrapping
      // normalTexture.repeat.set(1, 4)
      // normalTexture.anisotropy = 16
      eventBus.emit('ready')
    }
    manager.onError = (url: string) => {
      console.log('There was an error loading ' + url)
    }
    const textureLoader = new THREE.TextureLoader(manager)

    this.resources['displacementTexture'] = textureLoader.load('osmo/displacement.jpg')
    this.resources['normalTexture'] = textureLoader.load('osmo/NormalMap2.png')
  }
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      34,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      100
    )
    this.camera.position.set(0, 0, 1)
    this.camera.lookAt(0, 0, 0)
    this.camera.zoom = 2
  }
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(0xffffff, 1)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 1.5
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.container.appendChild(this.renderer.domElement)

    // const renderPass = new RenderPass(this.scene, this.camera)

    // const bloomPass = new UnrealBloomPass(
    //   new THREE.Vector2(this.container.clientWidth, this.container.clientHeight),
    //   0.15,
    //   0.3,
    //   0.22
    // )
    // this.bloomPass = bloomPass

    // const noisePass = new NoisePass({
    //   intensity: 0.65,
    //   speed: 0.9
    // })
    // this.noisePass = noisePass

    // const customPass = new CustomPass({
    //   frequency: 3.5,
    //   amplitude: 0.1
    // })
    // this.customPass = customPass

    // const composer = new EffectComposer(this.renderer)
    // composer.addPass(renderPass)
    // composer.addPass(bloomPass)
    // composer.addPass(noisePass)
    // composer.addPass(customPass)

    // this.composer = composer
  }
  initWorld() {
    this.initBackground()
  }
  initLight() {
    const lightPosition = new THREE.Vector3(0, 0, 1)
    const createPointLight = (intensity: number) => {
      const light = new THREE.PointLight(0xffffff, intensity, 100, Math.random() * 10)
      light.position.copy(lightPosition)
      return {
        object: light,
        targetColor: new THREE.Color()
      }
    }
    const createAmbientLight = (intensity: number) => {
      return {
        object: new THREE.AmbientLight(0xffffff, intensity),
        targetColor: new THREE.Color()
      }
    }
    const colors = [
      new THREE.Color('orange'),
      new THREE.Color('red'),
      new THREE.Color('red'),
      new THREE.Color('orange'),
      new THREE.Color('lightblue'),
      new THREE.Color('green'),
      new THREE.Color('blue'),
      new THREE.Color('blue')
    ]
    const lights = [
      createPointLight(2),
      createPointLight(3),
      createPointLight(2.5),
      createPointLight(10),
      createPointLight(2),
      createPointLight(3),
      createAmbientLight(1.5)
    ]
    // for (let index = 0; index < lights.length; index++) {
    //   const colorIndex = Math.min(index, colors.length - 1)
    //   lights[index].object.color.copy(colors[colorIndex])
    // }
    for (const light of lights) {
      this.scene.add(light.object)
    }
  }
  initBackground() {
    const geometry = new THREE.PlaneGeometry(
      (2 * this.container.clientWidth) / this.container.clientHeight,
      2
    )
    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffff00,
      metalness: 0.59,
      roughness: 0.41,
      displacementMap: this.resources.displacementTexture,
      displacementScale: 0.1,
      normalMap: this.resources.normalTexture,
      normalScale: new THREE.Vector2(0.68, 0.75),
      side: THREE.FrontSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    this.scene.add(mesh)

    const backgroundFolder = this.gui.addFolder('Background')
    backgroundFolder.add(material, 'metalness', 0, 1, 0.01)
    backgroundFolder.add(material, 'roughness', 0, 1, 0.01)
    backgroundFolder.add(material, 'displacementScale', 0, 1, 0.01)
    backgroundFolder.add(material.normalScale, 'x', 0, 1, 0.01).name('normalScaleX')
    backgroundFolder.add(material.normalScale, 'y', 0, 1, 0.01).name('normalScaleY')
  }
  initUtils() {
    this.axesHelper = new THREE.AxesHelper(150)
    this.scene.add(this.axesHelper)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)

    this.gui = new GUI()
    // const bloomEffectFolder = this.gui.addFolder('Bloom Effect')
    // bloomEffectFolder.add(this.bloomPass, 'strength', 0, 3, 0.01)
    // bloomEffectFolder.add(this.bloomPass, 'radius', 0, 1, 0.01)
    // bloomEffectFolder.add(this.bloomPass, 'threshold', 0, 1, 0.01)
    // bloomEffectFolder
    //   .add(this.customPass.uniforms.frequency, 'value', 1, 20, 0.1)
    //   .name('frequency')
    // bloomEffectFolder
    //   .add(this.customPass.uniforms.amplitude, 'value', 0, 1, 0.01)
    //   .name('amplitude')

    // const noiseEffectFolder = this.gui.addFolder('Noise Effect')
    // noiseEffectFolder
    //   .add(this.noisePass.uniforms.intensity, 'value', 0, 1, 0.01)
    //   .name('intensity')
    // noiseEffectFolder.add(this.noisePass.uniforms.speed, 'value', 0, 2, 0.1).name('speed')
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
    this.controls?.update?.()
    this.stats?.update?.()
    // if (this.customPass) {
    //   this.customPass.uniforms.offset.value += this.clock.getDelta()
    // }
    // if (this.noisePass) {
    //   this.noisePass.uniforms.time.value += this.clock.getDelta() * 100
    // }
    // this.composer.render()
    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this.update.bind(this))
  }
}
onMounted(() => {
  world.value = new World(container.value)
  document.title = 'FluidLight - Three.js'
})
</script>

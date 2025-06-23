<template>
  <div ref="container" class="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js' // 轨道控制器
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js' // GUI
import Stats from 'three/examples/jsm/libs/stats.module.js' // Stats

const container = ref()

type ParameterEntry = Array<[number, number, number] | THREE.Texture | number>

class World {
  container: HTMLDivElement
  scene!: THREE.Scene
  camera!: THREE.PerspectiveCamera
  renderer!: THREE.WebGLRenderer
  mouseX: number
  mouseY: number
  windowHalfX: number
  windowHalfY: number
  materials: Array<THREE.PointsMaterial>
  parameters: Array<ParameterEntry>
  axesHelper!: THREE.AxesHelper
  stats!: Stats
  gui!: GUI
  controls!: OrbitControls
  constructor(container: HTMLDivElement) {
    this.container = container
    this.mouseX = 0
    this.mouseY = 0
    this.windowHalfX = this.container.clientWidth / 2
    this.windowHalfY = this.container.clientHeight / 2
    this.materials = []
    this.parameters = []

    this.initScene()
    this.initCamera()
    this.initRenderer()
    this.initParticles()
    this.initUtils()
    this.initEventListeners()
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
    this.camera.position.set(30, 30, 30)
    this.camera.lookAt(0, 0, 0)
  }
  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setAnimationLoop(this.animate.bind(this))
    this.container.appendChild(this.renderer.domElement)
  }
  initParticles() {
    const geometry = new THREE.BufferGeometry()
    const vertices = []

    const assignSRGB = (texture: THREE.Texture) => {
      texture.colorSpace = THREE.SRGBColorSpace
    }

    const textureLoader = new THREE.TextureLoader()
    textureLoader.setPath('https://static.skyreels.ai/webvideo/img/')
    const sprite1 = textureLoader.load('snowflake1.png', assignSRGB)
    const sprite2 = textureLoader.load('snowflake2.png', assignSRGB)
    const sprite3 = textureLoader.load('snowflake3.png', assignSRGB)
    const sprite4 = textureLoader.load('snowflake4.png', assignSRGB)
    const sprite5 = textureLoader.load('snowflake5.png', assignSRGB)

    for (let i = 0; i < 10000; i++) {
      const x = Math.random() * 2000 - 1000
      const y = Math.random() * 2000 - 1000
      const z = Math.random() * 2000 - 1000
      vertices.push(x, y, z)
    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

    this.parameters = [
      [[0.9, 0.05, 0.5], sprite1, 10],
      [[1.0, 0.2, 0.5], sprite2, 20],
      [[0.95, 0.1, 0.5], sprite3, 15],
      [[0.8, 0, 0.5], sprite4, 5],
      [[0.85, 0, 0.5], sprite5, 8]
    ]

    for (let i = 0; i < this.parameters.length; i++) {
      const color = this.parameters[i][0] as Array<number>
      const sprite = this.parameters[i][1] as THREE.Texture
      const size = this.parameters[i][2] as number

      this.materials[i] = new THREE.PointsMaterial({
        size: size,
        map: sprite,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        transparent: true
      })
      this.materials[i].color.setHSL(color[0], color[1], color[2], THREE.SRGBColorSpace)

      const particles = new THREE.Points(geometry, this.materials[i])

      particles.rotation.x = Math.random() * 6
      particles.rotation.y = Math.random() * 6
      particles.rotation.z = Math.random() * 6

      this.scene.add(particles)
    }
  }
  initUtils() {
    // this.axesHelper = new THREE.AxesHelper(150);
    // this.scene.add(this.axesHelper);

    // this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    // this.controls.enableDamping = true;

    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)

    this.gui = new GUI()
    const params = {
      texture: true
    }
    this.gui.add(params, 'texture').onChange((value) => {
      for (let i = 0; i < this.materials.length; i++) {
        this.materials[i].map =
          value === true ? (this.parameters[i][1] as THREE.Texture) : null
        this.materials[i].needsUpdate = true
      }
    })
  }
  initEventListeners() {
    window.addEventListener('pointermove', this.onPointerMove.bind(this))
    window.addEventListener('resize', this.onWindowResize.bind(this))
  }
  onWindowResize() {
    this.windowHalfX = this.container.clientWidth / 2
    this.windowHalfY = this.container.clientHeight / 2

    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()

    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
  onPointerMove(event: any) {
    if (event.isPrimary === false) return
    this.mouseX = event.clientX - this.windowHalfX
    this.mouseY = event.clientY - this.windowHalfY
  }
  update() {
    const time = Date.now() * 0.00005

    this.camera.position.x += (this.mouseX - this.camera.position.x) * 0.05
    this.camera.position.y += (-this.mouseY - this.camera.position.y) * 0.05
    this.camera.lookAt(this.scene.position)

    for (let i = 0; i < this.scene.children.length; i++) {
      const object = this.scene.children[i]
      if (object instanceof THREE.Points) {
        object.rotation.y = time * (i < 4 ? i + 1 : -(i + 1))
      }
    }

    for (let i = 0; i < this.materials.length; i++) {
      const color = this.parameters[i][0] as Array<number>
      const h = ((360 * (color[0] + time)) % 360) / 360
      this.materials[i].color.setHSL(h, color[1], color[2], THREE.SRGBColorSpace)
    }

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
  document.title = '雪花 - Three.js'
})
</script>

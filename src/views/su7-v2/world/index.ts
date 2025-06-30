import * as THREE from 'three'
import * as STDLIB from 'three-stdlib'

// @ts-ignore
import { GLTFLoader } from '../lib/GLTFLoader'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

import Stats from 'three/examples/jsm/libs/stats.module.js'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js'
import { RGBELoader, OrbitControls } from 'three/examples/jsm/Addons.js'

import DynamicEnv from './DynamicEnv'
import StartRoom from './StartRoom'
import Car from './Car'

export default class World {
  container: HTMLDivElement
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  camera: THREE.PerspectiveCamera

  dynamicEnv!: DynamicEnv
  startRoom!: StartRoom
  car!: Car

  resources: Record<string, STDLIB.GLTF | THREE.Texture | THREE.DataTexture> = {}

  axesHelper!: THREE.AxesHelper
  controls!: OrbitControls
  stats!: Stats
  gui!: GUI

  constructor(sel = '.container') {
    this.container = document.querySelector(sel) as HTMLDivElement

    this.scene = new THREE.Scene()

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    })
    this.renderer.setSize(this.containerWidth, this.containerHeight)
    this.renderer.setPixelRatio(window.devicePixelRatio)
    this.renderer.setClearColor(0x000000, 0)
    this.container.appendChild(this.renderer.domElement)

    this.camera = new THREE.PerspectiveCamera(
      60,
      this.containerWidth / this.containerHeight,
      0.1,
      2000
    )
    this.camera.position.set(0, 5, 10)
    this.camera.lookAt(0, 0, 0)

    this.initResources(() => {
      document.querySelector('.loader-screen')?.classList.add('hollow')

      this.dynamicEnv = new DynamicEnv(this)
      this.scene.environment = this.dynamicEnv.envMap

      this.startRoom = new StartRoom(this)
      this.startRoom.addExisting()

      this.car = new Car(this)
      this.car.addExisting()
    })

    this.initUtils()
    this.update()
  }
  get containerWidth() {
    return this.container.clientWidth
  }
  get containerHeight() {
    return this.container.clientHeight
  }
  initResources(cb: () => void) {
    const loadingManager = new THREE.LoadingManager(
      () => {
        console.log(`加载完成: `, this.resources)
        cb()
      },
      (url, loaded, total) => {
        console.log(`加载进度: ${loaded}/${total} - ${url}`)
      },
      (url) => {
        console.log(`加载失败: `, url)
      }
    )
    const textureLoader = new THREE.TextureLoader(loadingManager)
    textureLoader.setPath('/threejs-demo/su7-v2/texture/')

    const rgbeLoader = new RGBELoader()
    rgbeLoader.setPath('/threejs-demo/su7-v2/texture/')

    const gltfLoader = new GLTFLoader(loadingManager)
    gltfLoader.setMeshoptDecoder(MeshoptDecoder)
    gltfLoader.setPath('/threejs-demo/su7-v2/mesh/')

    const gltfList = [
      'sm_car.glb',
      'sm_startroom.raw.glb',
      'sm_speedup.glb',
      'sm_size.glb',
      'sm_curvature.glb',
      'sm_windspeed.glb',
      'sm_linecar.glb',
      'sm_carradar.glb',
      'sm_simplecar.glb'
    ]
    gltfList.forEach((url) => {
      gltfLoader.load(url, (gltf: STDLIB.GLTF) => {
        this.resources[url] = gltf
      })
    })

    const textureList = [
      't_saLine.webp',
      't_car_body_AO.raw.jpg',
      't_startroom_ao.raw.jpg',
      't_startroom_light.raw.jpg',
      't_floor_normal.webp',
      't_floor_roughness.webp',
      't_street.webp',
      't_scar_matcap.webp',
      't_cat_car_body_bc.webp',
      't_gm_car_body_bc.webp'
    ]
    textureList.forEach((url) => {
      const texture = textureLoader.load(url)
      if (url === 't_saLine.webp') {
        texture.flipY = false
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.anisotropy = 4
      }
      if (url === 't_car_body_AO.raw.jpg') {
        texture.flipY = false
        texture.channel = 1
        texture.magFilter = THREE.NearestFilter
        texture.minFilter = THREE.NearestFilter
        texture.colorSpace = THREE.LinearSRGBColorSpace
      }
      if (url === 't_startroom_ao.raw.jpg') {
        texture.flipY = false
        texture.channel = 1
        texture.colorSpace = THREE.LinearSRGBColorSpace
      }
      if (url === 't_startroom_light.raw.jpg') {
        texture.flipY = false
        texture.colorSpace = THREE.SRGBColorSpace
        texture.channel = 1
      }
      if (url === 't_floor_normal.webp') {
        texture.flipY = false
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.colorSpace = THREE.LinearSRGBColorSpace
      }
      if (url === 't_floor_roughness.webp') {
        texture.flipY = false
        texture.colorSpace = THREE.LinearSRGBColorSpace
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
      }
      if (url === 't_street.webp') {
        texture.flipY = false
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
      }
      if (url === 't_scar_matcap.webp') {
        texture.flipY = false
      }
      if (url === 't_cat_car_body_bc.webp') {
        texture.flipY = false
      }
      if (url === 't_gm_car_body_bc.webp') {
        texture.flipY = false
      }
      this.resources[url] = texture
    })

    const hdrList = ['t_env_night.hdr', 't_env_light.hdr']
    hdrList.forEach((url) => {
      this.resources[url] = rgbeLoader.load(url)
    })
  }
  initUtils() {
    this.axesHelper = new THREE.AxesHelper(5)
    this.scene.add(this.axesHelper)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true

    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)

    this.gui = new GUI()
    this.gui.close()
  }
  update() {
    this.controls.update()
    this.stats.update()

    this.dynamicEnv?.update()
    this.startRoom?.update()
    this.car?.update()

    this.renderer.render(this.scene, this.camera)
    requestAnimationFrame(this.update.bind(this))
  }
}

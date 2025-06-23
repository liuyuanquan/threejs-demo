import * as kokomi from 'kokomi.js'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import gsap from 'gsap'

import DynamicEnv from './dynamic-env'
import StartRoom from './start-room'
import Car from './car'

import { resources } from './resources'

export default class World extends kokomi.Base {
  params
  dynamicEnv!: DynamicEnv
  startRoom!: StartRoom
  car!: Car

  am: kokomi.AssetManager

  controls!: kokomi.CameraControls
  debug!: dat.GUI
  stats!: kokomi.Stats

  t1 = gsap.timeline()
  t2 = gsap.timeline()
  t3 = gsap.timeline()
  t4 = gsap.timeline()
  t5 = gsap.timeline()
  t6 = gsap.timeline()
  t7 = gsap.timeline()
  t8 = gsap.timeline()
  t9 = gsap.timeline()
  constructor(sel = '.container') {
    super(sel, {
      autoAdaptMobile: true
    })
    ;(window as any).world = this

    this.params = {
      speed: 0,
      cameraPos: {
        x: 0,
        y: 0.8,
        z: -11
      },
      isCameraMoving: false,
      lightAlpha: 0,
      lightIntensity: 0,
      envIntensity: 0,
      envWeight: 0,
      reflectIntensity: 0,
      lightOpacity: 1,
      floorLerpColor: 0,
      carBodyEnvIntensity: 1,
      cameraShakeIntensity: 0,
      bloomLuminanceSmoothing: 1.6,
      bloomIntensity: 1,
      speedUpOpacity: 0,
      cameraFov: 33.4,
      furinaLerpColor: 0,
      isRushing: false,
      disableInteract: false,
      isFurina: window.location.hash === '#furina'
    }

    this.renderer.toneMapping = THREE.CineonToneMapping

    this.am = new kokomi.AssetManager(this, resources, {
      useMeshoptDecoder: true
    })

    this.scene.background = new THREE.Color(0x000000)

    const camera = this.camera as THREE.PerspectiveCamera
    camera.fov = this.params.cameraFov
    camera.updateProjectionMatrix()
    const cameraPos = new THREE.Vector3(
      this.params.cameraPos.x,
      this.params.cameraPos.y,
      this.params.cameraPos.z
    )
    camera.position.copy(cameraPos)
    const lookAt = new THREE.Vector3(0, 0.8, 0)
    camera.lookAt(lookAt)

    const controls = new kokomi.CameraControls(this)
    controls.controls.setTarget(lookAt.x, lookAt.y, lookAt.z)
    this.controls = controls

    this.initHelpers()
    this.initWorld()

    this.update(() => {
      if (this.params.isCameraMoving) {
        this.controls.controls.enabled = false
        this.controls.controls.setPosition(
          this.params.cameraPos.x,
          this.params.cameraPos.y,
          this.params.cameraPos.z
        )
      } else {
        this.controls.controls.enabled = true
      }
    })
  }
  initHelpers() {
    const axesHelper = new THREE.AxesHelper(150)
    this.scene.add(axesHelper)

    this.stats = new kokomi.Stats(this)

    this.debug = new dat.GUI()
  }
  initWorld() {
    this.am.on('ready', () => {
      this.handleAssets()

      this.dynamicEnv = new DynamicEnv(this)
      this.scene.environment = this.dynamicEnv.envmap
      this.dynamicEnv.setWeight(1)

      this.startRoom = new StartRoom(this)
      this.startRoom.addExisting()

      this.car = new Car(this)
      this.car.addExisting()

      // 镜头移动
      this.t1.to(this.params.cameraPos, {
        x: 0,
        y: 0.8,
        z: -7,
        duration: 4,
        ease: 'power2.inOut',
        onStart: () => {
          this.controls.controls.enabled = false
        },
        onUpdate: () => {
          this.controls.controls.setPosition(
            this.params.cameraPos.x,
            this.params.cameraPos.y,
            this.params.cameraPos.z
          )
        },
        onComplete: () => {
          this.controls.controls.enabled = true
        }
      })
    })

    // 灯光出现
    const lightColor = new THREE.Color()
    const blackColor = new THREE.Color('#000000')
    const whiteColor = new THREE.Color('#ffffff')
    this.t2.to(this.params, {
      lightAlpha: 1,
      lightIntensity: 1,
      duration: 4,
      delay: 1,
      ease: 'power2.inOut',
      onUpdate: () => {
        lightColor.copy(blackColor).lerp(whiteColor, this.params.lightAlpha)
        this.startRoom.lightMat.emissive.set(lightColor)
        this.startRoom.lightMat.emissiveIntensity = this.params.lightIntensity
      }
    })

    this.t3
      .to(this.params, {
        envIntensity: 1,
        duration: 4,
        delay: 0.5,
        ease: 'power2.inOut',
        onUpdate: () => {
          this.dynamicEnv.setIntensity(this.params.envIntensity)
        }
      })
      .to(
        this.params,
        {
          envWeight: 1,
          duration: 4,
          ease: 'power2.inOut',
          onUpdate: () => {
            this.dynamicEnv.setWeight(this.params.envWeight)
          }
        },
        '-=2.5'
      )
  }
  handleAssets() {
    const items = this.am.items
    ;(items['ut_car_body_ao'] as THREE.Texture).flipY = false
    ;(items['ut_car_body_ao'] as THREE.Texture).colorSpace = THREE.LinearSRGBColorSpace
    ;(items['ut_car_body_ao'] as THREE.Texture).minFilter = THREE.NearestFilter
    ;(items['ut_car_body_ao'] as THREE.Texture).magFilter = THREE.NearestFilter
    ;(items['ut_car_body_ao'] as THREE.Texture).channel = 1
    ;(items['ut_startroom_ao'] as THREE.Texture).flipY = false
    ;(items['ut_startroom_ao'] as THREE.Texture).colorSpace = THREE.LinearSRGBColorSpace
    ;(items['ut_startroom_ao'] as THREE.Texture).channel = 1
    ;(items['ut_startroom_light'] as THREE.Texture).flipY = false
    ;(items['ut_startroom_light'] as THREE.Texture).colorSpace = THREE.SRGBColorSpace
    ;(items['ut_startroom_light'] as THREE.Texture).channel = 1
    ;(items['ut_floor_normal'] as THREE.Texture).flipY = false
    ;(items['ut_floor_normal'] as THREE.Texture).colorSpace = THREE.LinearSRGBColorSpace
    ;(items['ut_floor_normal'] as THREE.Texture).wrapS = THREE.RepeatWrapping
    ;(items['ut_floor_normal'] as THREE.Texture).wrapT = THREE.RepeatWrapping
    ;(items['ut_floor_roughness'] as THREE.Texture).flipY = false
    ;(items['ut_floor_roughness'] as THREE.Texture).colorSpace =
      THREE.LinearSRGBColorSpace
    ;(items['ut_floor_roughness'] as THREE.Texture).wrapS = THREE.RepeatWrapping
    ;(items['ut_floor_roughness'] as THREE.Texture).wrapT = THREE.RepeatWrapping
    ;(items['decal'] as THREE.Texture).flipY = false
    ;(items['decal'] as THREE.Texture).colorSpace = THREE.LinearSRGBColorSpace
  }
}

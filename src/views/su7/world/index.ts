import * as kokomi from 'kokomi.js'
import * as THREE from 'three'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import { Howl } from 'howler'

import DynamicEnv from './dynamic-env'
import StartRoom from './start-room'
import Car from './car'
import SpeedUp from './speed-up'
import CameraShake from './camera-shake'
import Furina from './furina'

import eventBus from './utils/eventBus'
import { resources } from './resources'

export default class World extends kokomi.Base {
  dynamicEnv!: DynamicEnv // 环境贴图
  startRoom!: StartRoom // 启动房间
  car!: Car
  furina!: Furina
  speedup!: SpeedUp // 速度特效
  environment!: kokomi.Environment
  cameraShake!: CameraShake // 相机抖动
  bgm!: Howl // 音乐
  am: kokomi.AssetManager // 资源管理器

  controls!: kokomi.CameraControls
  debug!: dat.GUI
  stats!: kokomi.Stats

  params

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
      bloomIntensity: 1,
      bloomLuminanceSmoothing: 1.6,
      cameraFov: 33.4,
      cameraPos: {
        x: 0,
        y: 0.8,
        z: -11
      },
      cameraShakeIntensity: 0,
      carBodyColor: 0x26d6e9,
      carBodyEnvIntensity: 1,
      disableInteract: false,
      envIntensity: 0,
      envWeight: 0,
      floorLerpColor: 0,
      furinaLerpColor: 0,
      isCameraMoving: false,
      isRushing: false,
      lightAlpha: 0,
      lightIntensity: 0,
      lightOpacity: 1,
      startRoomReflector: true,
      reflectIntensity: 0,
      speed: 0,
      speedUpOpacity: 0,
      isFurina: false
    }

    this.renderer.toneMapping = THREE.CineonToneMapping

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

    this.am = new kokomi.AssetManager(this, resources, {
      useMeshoptDecoder: true
    })
    this.am.on('ready', () => {
      this.initWorld()
    })

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
  // done
  private initWorld() {
    this.handleAssets()

    this.dynamicEnv = new DynamicEnv(this)
    this.scene.environment = this.dynamicEnv.envmap

    this.startRoom = new StartRoom(this)
    this.startRoom.addExisting()

    this.car = new Car(this)
    this.car.addExisting()

    this.furina = new Furina(this)
    this.furina.addExisting()

    this.speedup = new SpeedUp(this)
    this.speedup.addExisting()

    this.environment = new kokomi.Environment(this, {
      resolution: 512,
      scene: this.scene,
      options: {
        minFilter: THREE.LinearMipMapLinearFilter,
        anisotropy: 0,
        depthBuffer: false,
        generateMipmaps: true
      },
      textureType: THREE.UnsignedByteType,
      ignoreObjects: [this.car.model.scene]
    })

    this.cameraShake = new CameraShake(this)
    this.cameraShake.setIntensity(0)

    this.interactionManager.add(this.car.model.scene)
    this.car.model.scene.addEventListener('click' as keyof THREE.Object3DEventMap, () => {
      this.rush()
    })

    eventBus.on('enter', () => {
      this.params.disableInteract = false
    })

    this.enter()

    this.bgm = new Howl({
      src: 'su7/audio/bgm.mp3',
      loop: true,
      volume: 0.5
    })
    this.bgm.play()
  }
  private enter() {
    // 禁用交互
    this.params.disableInteract = true

    document.querySelector('.loader-screen')?.classList.add('hollow')

    // 镜头移动动画
    this.t1.to(this.params.cameraPos, {
      x: 0,
      y: 0.8,
      z: -7, // 目标位置：更靠近场景
      duration: 4,
      ease: 'power2.inOut',
      onStart: () => {
        this.params.isCameraMoving = true
      },
      onComplete: () => {
        this.params.isCameraMoving = false
        eventBus.emit('enter')
      }
    })

    // 灯光出现动画
    const lightColor = new THREE.Color()
    const blackColor = new THREE.Color(0x000000)
    const whiteColor = new THREE.Color(0xffffff)
    this.t2.to(this.params, {
      lightAlpha: 1, // 灯光透明度从0到1
      lightIntensity: 1, // 灯光强度从0到1
      reflectIntensity: 25,
      furinaLerpColor: 1, // Furina颜色插值
      delay: 1, // 延迟1秒开始
      ease: 'power2.inOut',
      onUpdate: () => {
        // 计算当前灯光颜色（从黑色渐变到白色）
        lightColor.copy(blackColor).lerp(whiteColor, this.params.lightAlpha)

        // 更新场景灯光
        this.startRoom.lightMat.emissive.set(lightColor)
        this.startRoom.lightMat.emissiveIntensity = this.params.lightIntensity

        this.startRoom.customFloorMat.uniforms.uColor.value.set(lightColor)
        this.startRoom.customFloorMat.uniforms.uReflectIntensity.value =
          this.params.reflectIntensity

        // 更新Furina特效颜色
        this.furina?.setColor(lightColor)
      }
    })

    // 环境光动画
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
        '-=2.5' // 与前一动画重叠2.5秒
      )
  }
  private async rush() {
    if (this.params.isRushing) {
      this.rushDone()
      return
    }
    if (this.params.disableInteract) {
      return
    }
    this.params.disableInteract = true
    this.clearAllTweens()

    const floorColor = new THREE.Color()
    const blackColor = new THREE.Color(0x000000)
    const furinaColor = new THREE.Color()
    const furinaFadeColor = new THREE.Color(0x666666)

    this.furina?.drive()

    this.t4
      .to(this.params, {
        speed: 4,
        duration: 2,
        ease: 'power2.out',
        onComplete: () => {
          this.params.isRushing = true
          this.params.disableInteract = false
        }
      })
      .to(this.params, {
        speed: 10,
        duration: 4,
        ease: 'power2.out'
      })

    this.t5.to(this.params, {
      lightOpacity: 0,
      duration: 1,
      ease: 'power2.out',
      onUpdate: () => {
        this.startRoom.lightMat.opacity = this.params.lightOpacity
      }
    })

    this.t6.fromTo(
      this.params,
      {
        floorLerpColor: 0,
        furinaLerpColor: 0
      },
      {
        floorLerpColor: 1,
        furinaLerpColor: 1,
        duration: 4,
        ease: 'none',
        onUpdate: () => {
          floorColor.lerp(blackColor, this.params.floorLerpColor)
          this.startRoom.customFloorMat.uniforms.uColor.value.set(floorColor)

          furinaColor.lerp(furinaFadeColor, this.params.furinaLerpColor)
          this.furina?.setColor(furinaColor)
        }
      }
    )

    this.t7.to(this.params, {
      envIntensity: 0.01,
      duration: 1,
      ease: 'power2.out',
      onUpdate: () => {
        this.dynamicEnv.setIntensity(this.params.envIntensity)
      }
    })

    this.t8.to(this.params, {
      speedUpOpacity: 1,
      cameraFov: 36,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        this.speedup.material.uniforms.uOpacity.value = this.params.speedUpOpacity

        const camera = this.camera as THREE.PerspectiveCamera
        camera.fov = this.params.cameraFov
        camera.updateProjectionMatrix()
      }
    })

    await kokomi.sleep(1000)

    // 流光效果
    this.scene.environment = this.environment.texture

    // 车身抖动
    this.t9.to(this.params, {
      carBodyEnvIntensity: 10,
      cameraShakeIntensity: 1,
      bloomLuminanceSmoothing: 0.4,
      bloomIntensity: 2,
      duration: 4,
      ease: 'power2.out',
      onUpdate: () => {
        this.car.setBodyEnvIntensity(this.params.carBodyEnvIntensity)
        this.cameraShake.setIntensity(this.params.cameraShakeIntensity)
        // this.base.post.setLuminanceSmoothing(this.base.params.bloomLuminanceSmoothing)
        // this.base.post.setIntensity(this.base.params.bloomIntensity)
      }
    })
  }
  private rushDone() {
    if (this.params.disableInteract) {
      return
    }
    this.params.disableInteract = true
    this.clearAllTweens()

    const floorColor = new THREE.Color()
    const whiteColor = new THREE.Color('#ffffff')
    const camera = this.camera as THREE.PerspectiveCamera

    const furinaColor = new THREE.Color()
    const furinaOriginalColor = new THREE.Color('#ffffff')

    this.furina?.pause()

    this.t4.to(this.params, {
      speed: 0,
      duration: 2,
      ease: 'power2.out',
      onComplete: () => {
        this.params.isRushing = false
        this.params.disableInteract = false
      }
    })
    this.t5.to(this.params, {
      lightOpacity: 1,
      duration: 1,
      ease: 'power2.out',
      onUpdate: () => {
        this.startRoom.lightMat.opacity = this.params.lightOpacity
      }
    })
    this.t6.fromTo(
      this.params,
      { floorLerpColor: 0, furinaLerpColor: 0 },
      {
        floorLerpColor: 1,
        furinaLerpColor: 1,
        duration: 4,
        ease: 'none',
        onUpdate: () => {
          floorColor.lerp(whiteColor, this.params.floorLerpColor)
          this.startRoom.customFloorMat.uniforms.uColor.value.set(floorColor)

          furinaColor.lerp(furinaOriginalColor, this.params.furinaLerpColor)
          this.furina?.setColor(furinaColor)
        }
      }
    )
    this.t7.to(this.params, {
      envIntensity: 1,
      duration: 1,
      ease: 'power2.out',
      onUpdate: () => {
        this.dynamicEnv.setIntensity(this.params.envIntensity)
      }
    })
    this.t8.to(this.params, {
      speedUpOpacity: 0,
      cameraFov: 33.4,
      duration: 2,
      ease: 'power2.out',
      onUpdate: () => {
        this.speedup.material.uniforms.uOpacity.value = this.params.speedUpOpacity
        camera.fov = this.params.cameraFov
        camera.updateProjectionMatrix()
      }
    })
    this.t9.to(this.params, {
      carBodyEnvIntensity: 1,
      cameraShakeIntensity: 0,
      bloomLuminanceSmoothing: 1.6,
      bloomIntensity: 1,
      duration: 4,
      ease: 'power2.out',
      onUpdate: () => {
        this.car.setBodyEnvIntensity(this.params.carBodyEnvIntensity)
        this.cameraShake.setIntensity(this.params.cameraShakeIntensity)
        // this.base.post.setLuminanceSmoothing(
        //   this.base.params.bloomLuminanceSmoothing
        // );
        // this.base.post.setIntensity(this.base.params.bloomIntensity);
      }
    })
    this.scene.environment = this.dynamicEnv.envmap
  }
  // done
  private handleAssets() {
    const texture1 = this.am.items['ut_car_body_ao'] as THREE.Texture
    texture1.flipY = false
    texture1.colorSpace = THREE.LinearSRGBColorSpace
    texture1.minFilter = THREE.NearestFilter
    texture1.magFilter = THREE.NearestFilter
    texture1.channel = 1

    const texture2 = this.am.items['ut_startroom_ao'] as THREE.Texture
    texture2.flipY = false
    texture2.colorSpace = THREE.LinearSRGBColorSpace
    texture2.channel = 1

    const texture3 = this.am.items['ut_startroom_light'] as THREE.Texture
    texture3.flipY = false
    texture3.colorSpace = THREE.SRGBColorSpace
    texture3.channel = 1

    const texture4 = this.am.items['ut_floor_normal'] as THREE.Texture
    texture4.flipY = false
    texture4.colorSpace = THREE.LinearSRGBColorSpace
    texture4.wrapS = THREE.RepeatWrapping
    texture4.wrapT = THREE.RepeatWrapping

    const texture5 = this.am.items['ut_floor_roughness'] as THREE.Texture
    texture5.flipY = false
    texture5.colorSpace = THREE.LinearSRGBColorSpace
    texture5.wrapS = THREE.RepeatWrapping
    texture5.wrapT = THREE.RepeatWrapping

    const texture6 = this.am.items['decal'] as THREE.Texture
    texture6.flipY = false
    texture6.colorSpace = THREE.LinearSRGBColorSpace
  }
  //done
  private clearAllTweens() {
    this.t1.clear()
    this.t2.clear()
    this.t3.clear()
    this.t4.clear()
    this.t5.clear()
    this.t6.clear()
    this.t7.clear()
    this.t8.clear()
    this.t9.clear()
  }
  // done
  private initHelpers() {
    const axesHelper = new THREE.AxesHelper(150)
    // this.scene.add(axesHelper)

    this.stats = new kokomi.Stats(this)

    this.debug = new dat.GUI()
  }
}

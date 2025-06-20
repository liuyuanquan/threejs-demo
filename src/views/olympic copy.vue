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
  points!: THREE.Points
  velocities: any[] = []
  mixer!: THREE.AnimationMixer
  ambientLight!: THREE.AmbientLight
  clock = new THREE.Clock()
  mouseX = 0
  mouseY = 0
  windowHalfX = 0
  windowHalfY = 0
  cube!: THREE.Mesh
  land!: THREE.Object3D
  meshes = new Array<THREE.Mesh>()
  debugParams = {
    ambientLight: {
      intensity: 4.48
    }
  }
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
    this.textureLoader.setPath('/olympic/')
    this.gltfLoader = new GLTFLoader(this.manager)
    this.gltfLoader.setPath('/olympic/')
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
    this.scene.background = this.textureLoader.load('sky.jpg')
    this.scene.fog = new THREE.Fog(0xffffff, 10, 100)
  }
  initCamera() {
    this.camera = new THREE.PerspectiveCamera(
      60,
      this.container.clientWidth / this.container.clientHeight,
      0.1,
      1000
    )
    this.camera.position.set(0, -1, 20)
    this.camera.lookAt(0, 0, 0)
  }
  initRenderer() {
    const renderer = new THREE.WebGLRenderer({
      antialias: true
    })
    renderer.setSize(this.container.clientWidth, this.container.clientHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true // 启用渲染器的阴影映射（总开关）
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
    this.scene.add(light)
    const lightHelper = new THREE.DirectionalLightHelper(light, 1, 0xffff00)
    this.scene.add(lightHelper)
    const lightCameraHelper = new THREE.CameraHelper(light.shadow.camera)
    // this.scene.add(lightCameraHelper)

    const ambientLight = new THREE.AmbientLight(
      0xcfffff,
      this.debugParams.ambientLight.intensity
    )
    this.ambientLight = ambientLight
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
    this.gltfLoader.load('land.glb', (mesh) => {
      mesh.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          console.log('🚀 ~ World ~ mesh.scene.traverse ~ child:', child, child.name)
          this.meshes.push(child)
          child.material.metalness = 0.1
          child.material.roughness = 0.8
          if (child.name === 'Mesh_2') {
            child.material.metalness = 0.5
            child.receiveShadow = true
          }
        }
      })

      mesh.scene.rotation.y = Math.PI / 4
      mesh.scene.position.set(15, -20, 0)
      mesh.scene.scale.set(0.9, 0.9, 0.9)

      this.land = mesh.scene
      this.scene.add(mesh.scene)
    })

    // 旗帜
    this.gltfLoader.load('flag.glb', (mesh) => {
      mesh.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          this.meshes.push(child)
          child.castShadow = true

          // 旗帜
          if (child.name === 'mesh_0001') {
            child.material.metalness = 0.1
            child.material.roughness = 0.1
            child.material.map = this.textureLoader.load('flag.png')
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

      // 动画
      let meshAnimation = mesh.animations[0]
      this.mixer = new THREE.AnimationMixer(mesh.scene)

      let animationClip = meshAnimation
      let clipAction = this.mixer.clipAction(animationClip).play()

      animationClip = clipAction.getClip()

      this.scene.add(mesh.scene)
    })

    // bingdwendwen
    this.gltfLoader.load('bingdwendwen.glb', (mesh) => {
      mesh.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          this.meshes.push(child)

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

      mesh.scene.rotation.y = Math.PI / 24
      mesh.scene.position.set(-5, -11.5, 0)
      mesh.scene.scale.set(24, 24, 24)

      this.scene.add(mesh.scene)
    })

    // xuerongrong
    this.gltfLoader.load('xuerongrong.glb', (mesh) => {
      mesh.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          this.meshes.push(child)
          child.castShadow = true
        }
      })

      mesh.scene.rotation.y = Math.PI / 3
      mesh.scene.position.set(-20, -10.8, 0)
      mesh.scene.scale.set(12, 12, 12)

      this.scene.add(mesh.scene)
    })

    let treeMaterial = new THREE.MeshPhysicalMaterial({
      map: this.textureLoader.load('tree.png'),
      transparent: true,
      side: THREE.DoubleSide,
      metalness: 0.2,
      roughness: 0.8,
      depthTest: true,
      depthWrite: false,
      // skinning: false,
      fog: false,
      reflectivity: 0.1
      // refractionRatio: 0
    })

    let treeCustomDepthMaterial = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: this.textureLoader.load('tree.png'),
      alphaTest: 0.5
    })

    // 树
    this.gltfLoader.load('tree.gltf', (mesh) => {
      mesh.scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          this.meshes.push(child)
          child.material = treeMaterial
          child.customDepthMaterial = treeCustomDepthMaterial
        }
      })

      mesh.scene.position.set(14, -9, 0)
      mesh.scene.scale.set(16, 16, 16)
      this.scene.add(mesh.scene)

      let tree2 = mesh.scene.clone()
      tree2.position.set(10, -8, -15)
      tree2.scale.set(18, 18, 18)
      this.scene.add(tree2)

      let tree3 = mesh.scene.clone()
      tree3.position.set(-18, -8, -16)
      tree3.scale.set(22, 22, 22)
      this.scene.add(tree3)
    })

    // 五环
    const fiveCycles = [
      { key: 'cycle_0', color: 0x0885c2, position: { x: -250, y: 0, z: 0 } },
      { key: 'cycle_1', color: 0x000000, position: { x: -10, y: 0, z: 1 } },
      { key: 'cycle_2', color: 0xed334e, position: { x: 230, y: 0, z: 0 } },
      {
        key: 'cycle_3',
        color: 0xfbb132,
        position: { x: -125, y: -100, z: -5 }
      },
      {
        key: 'cycle_4',
        color: 0x1c8b3c,
        position: { x: 115, y: -100, z: 10 }
      }
    ]
    fiveCycles.map((item) => {
      let cycleMesh = new THREE.Mesh(
        new THREE.TorusGeometry(100, 10, 10, 50),
        new THREE.MeshLambertMaterial({
          color: new THREE.Color(item.color),
          side: THREE.DoubleSide
        })
      )

      cycleMesh.castShadow = true
      cycleMesh.position.set(item.position.x, item.position.y, item.position.z)
      this.meshes.push(cycleMesh)
      this.fiveCyclesGroup.add(cycleMesh)
    })
    this.fiveCyclesGroup.scale.set(0.036, 0.036, 0.036)
    this.fiveCyclesGroup.position.set(0, 10, -8)
    this.scene.add(this.fiveCyclesGroup)

    // 雪花
    let texture = this.textureLoader.load('snow.png')
    let pointsGeometry = new THREE.BufferGeometry()
    let pointsMaterial = new THREE.PointsMaterial({
      size: 1,
      transparent: true,
      opacity: 0.8,
      map: texture,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      depthTest: false
    })
    const range = 100
    const particleCount = 1500
    const vertices = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      // 随机位置
      vertices[i3] = Math.random() * range - range / 2 // x
      vertices[i3 + 1] = Math.random() * range * 1.5 // y
      vertices[i3 + 2] = Math.random() * range - range / 2 // z

      // 存储速度（velocityX, velocityY）
      this.velocities.push({
        x: (Math.random() - 0.5) / 3, // velocityX
        y: 0.1 + Math.random() / 3 // velocityY
      })
    }

    pointsGeometry.computeBoundingBox() // 计算包围盒
    const center = new THREE.Vector3()
    pointsGeometry.boundingBox?.getCenter(center) // 获取中心点
    pointsGeometry.translate(-center.x, -center.y, -center.z) // 平移到原点

    pointsGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    this.points = new THREE.Points(pointsGeometry, pointsMaterial)
    this.points.position.y = -30
    this.scene.add(this.points)
  }
  initUtils() {
    this.axesHelper = new THREE.AxesHelper(150)
    this.scene.add(this.axesHelper)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 0, 5)
    this.controls.enableDamping = true
    this.controls.enablePan = false
    this.controls.enableZoom = false
    this.controls.minPolarAngle = 1.4
    this.controls.maxPolarAngle = 1.8
    this.controls.minAzimuthAngle = -0.8
    this.controls.maxAzimuthAngle = 0.8

    this.stats = new Stats()
    document.body.appendChild(this.stats.dom)

    this.gui = new GUI()
    this.gui
      .addFolder('ambientLight')
      .add(this.debugParams.ambientLight, 'intensity', 0, 10, 0.01)
      .onChange((value) => {
        this.ambientLight.intensity = value
      })
    // this.gui.close()
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
    if (this.fiveCyclesGroup) {
      this.fiveCyclesGroup.rotation.y += 0.01
    }

    if (this.points.geometry) {
      const positionAttr = this.points.geometry.attributes.position
      const positions = positionAttr.array

      for (let i = 0; i < 1500; i++) {
        const i3 = i * 3
        positions[i3] += this.velocities[i].x // x += velocityX
        positions[i3 + 1] += this.velocities[i].y // y += velocityY

        // 边界检测（超出范围则重置）
        if (positions[i3 + 1] > 100 * 2) {
          positions[i3 + 1] = 0
        }
      }

      positionAttr.needsUpdate = true // 标记数据已更新
    }

    let time = this.clock.getDelta()
    this.mixer && this.mixer.update(time)

    this.renderer.render(this.scene, this.camera)
  }
  animate() {
    this.controls?.update()
    this.stats.update()
    this.update()
  }
}
onMounted(() => {
  new World(container.value)
  document.title = 'ThreeJS - 冬奥'
})
</script>

<template>
  <div ref="container" class="three-container">
    <div v-if="loadingProcess < 100" class="loading-overlay">
      <div class="loading-progress">{{ loadingProcess }}%</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import TWEEN from 'three/addons/libs/tween.module.js'

// 模型路径
const MODEL_PATHS = {
  land: '/olympic/land.glb',
  tree: '/olympic/tree.gltf',
  bingdwendwen: '/olympic/bingdwendwen.glb',
  xuerongrong: '/olympic/xuerongrong.glb',
  flag: '/olympic/flag.glb'
}

// 容器引用
const container = ref(null)
const loadingProcess = ref(0)

// Three.js 相关变量
let scene, camera, renderer, controls, mixer, snowParticles
let olympicRingsGroup, animationMixer
const clock = new THREE.Clock()
const meshes = [] // 存储所有可交互的网格对象

// 初始化场景
const initScene = () => {
  // 创建场景
  scene = new THREE.Scene()
  scene.background = new THREE.TextureLoader().load('/olympic/sky.jpg')
  scene.fog = new THREE.Fog(0xffffff, 10, 100)

  // 创建相机
  const aspect = window.innerWidth / window.innerHeight
  camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 1000)
  camera.position.set(0, 30, 100)
  camera.lookAt(0, 0, 0)

  // 创建渲染器
  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.value.appendChild(renderer.domElement)

  // 添加光源
  initLights()

  // 初始化控制器
  initControls()

  // 加载模型
  loadModels()

  // 添加窗口大小变化监听
  window.addEventListener('resize', onWindowResize)
}

// 初始化光源
const initLights = () => {
  // 方向光 - 主光源
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(16, 16, 8)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  directionalLight.shadow.camera.near = 0.5
  directionalLight.shadow.camera.far = 500
  directionalLight.shadow.camera.left = -40
  directionalLight.shadow.camera.right = 40
  directionalLight.shadow.camera.top = 40
  directionalLight.shadow.camera.bottom = -40
  scene.add(directionalLight)

  // 环境光
  const ambientLight = new THREE.AmbientLight(0xcfffff, 1)
  scene.add(ambientLight)
}

// 初始化控制器
const initControls = () => {
  controls = new OrbitControls(camera, renderer.domElement)
  controls.target.set(0, 0, 0)
  controls.enableDamping = true
  controls.enablePan = false
  controls.enableZoom = false
  controls.minPolarAngle = 1.4
  controls.maxPolarAngle = 1.8
  controls.minAzimuthAngle = -0.8
  controls.maxAzimuthAngle = 0.8
}

// 加载所有模型
const loadModels = () => {
  const manager = new THREE.LoadingManager(
    () => {
      // 所有资源加载完成
      loadingProcess.value = 100
      animateCameraToStartPosition()
    },
    (url, loaded, total) => {
      // 更新加载进度
      loadingProcess.value = Math.floor((loaded / total) * 100)
    }
  )

  const loader = new GLTFLoader(manager)

  // 加载地面
  loader.load(MODEL_PATHS.land, (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child)
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
    scene.add(gltf.scene)
  })

  // 加载旗帜
  loader.load(MODEL_PATHS.flag, (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child)
        child.castShadow = true

        if (child.name === 'mesh_0001') {
          child.material.metalness = 0.1
          child.material.roughness = 0.1
          child.material.map = new THREE.TextureLoader().load('olympic/flag.png')
        }

        if (child.name === '柱体') {
          child.material.metalness = 0.6
          child.material.roughness = 0
          child.material.color = new THREE.Color(0xeeeeee)
        }
      }
    })

    gltf.scene.position.set(2, -7, -1)
    gltf.scene.scale.set(4, 4, 4)

    // 设置旗帜动画
    animationMixer = new THREE.AnimationMixer(gltf.scene)
    const clipAction = animationMixer.clipAction(gltf.animations[0])
    clipAction.play()

    scene.add(gltf.scene)
  })

  // 加载冰墩墩
  loader.load(MODEL_PATHS.bingdwendwen, (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        meshes.push(child)

        if (child.name === '皮肤') {
          child.material.metalness = 0.3
          child.material.roughness = 0.8
        }

        if (child.name === '外壳') {
          child.material.transparent = true
          child.material.opacity = 0.4
          child.material.metalness = 0.4
          child.material.roughness = 0
          child.castShadow = true
          child.material.envMap = new THREE.TextureLoader().load('/olympic/sky.jpg')
        }

        if (child.name === '围脖') {
          child.material.transparent = true
          child.material.opacity = 0.6
        }
      }
    })

    gltf.scene.position.set(-5, -11.5, 0)
    gltf.scene.scale.set(24, 24, 24)
    scene.add(gltf.scene)
  })

  // 加载雪容融
  loader.load(MODEL_PATHS.xuerongrong, (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true
        meshes.push(child)
      }
    })

    gltf.scene.position.set(-20, -10.8, 0)
    gltf.scene.scale.set(12, 12, 12)
    scene.add(gltf.scene)
  })

  // 加载树木
  const treeMaterial = new THREE.MeshPhysicalMaterial({
    map: new THREE.TextureLoader().load('/olympic/tree.png'),
    transparent: true,
    side: THREE.DoubleSide,
    metalness: 0.2,
    roughness: 0.8
  })

  const treeDepthMaterial = new THREE.MeshDepthMaterial({
    depthPacking: THREE.RGBADepthPacking,
    map: new THREE.TextureLoader().load('/olympic/tree.png'),
    alphaTest: 0.5
  })

  loader.load(MODEL_PATHS.tree, (gltf) => {
    gltf.scene.traverse((child) => {
      if (child.isMesh) {
        child.material = treeMaterial
        child.customDepthMaterial = treeDepthMaterial
        meshes.push(child)
      }
    })

    // 主树
    gltf.scene.position.set(14, -9, 0)
    gltf.scene.scale.set(16, 16, 16)
    scene.add(gltf.scene)

    // 克隆树
    const treePositions = [
      { x: 10, y: -8, z: -15, scale: 18 },
      { x: -18, y: -8, z: -16, scale: 22 }
    ]

    treePositions.forEach((pos) => {
      const treeClone = gltf.scene.clone()
      treeClone.position.set(pos.x, pos.y, pos.z)
      treeClone.scale.set(pos.scale, pos.scale, pos.scale)
      scene.add(treeClone)
    })
  })

  // 创建奥运五环
  createOlympicRings()

  // 创建雪花粒子
  createSnowParticles()
}

// 创建奥运五环
const createOlympicRings = () => {
  olympicRingsGroup = new THREE.Group()

  const ringsConfig = [
    { color: 0x0885c2, position: { x: -250, y: 0, z: 0 } }, // 蓝色
    { color: 0x000000, position: { x: -10, y: 0, z: 1 } }, // 黑色
    { color: 0xed334e, position: { x: 230, y: 0, z: 0 } }, // 红色
    { color: 0xfbb132, position: { x: -125, y: -100, z: -5 } }, // 黄色
    { color: 0x1c8b3c, position: { x: 115, y: -100, z: 10 } } // 绿色
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
    olympicRingsGroup.add(ringMesh)
    meshes.push(ringMesh)
  })

  olympicRingsGroup.scale.set(0.036, 0.036, 0.036)
  olympicRingsGroup.position.set(0, 10, -8)
  scene.add(olympicRingsGroup)
}

// 创建雪花粒子系统
const createSnowParticles = () => {
  const texture = new THREE.TextureLoader().load('/olympic/snow.png')
  const geometry = new THREE.BufferGeometry()

  const particleCount = 1500
  const range = 100
  const positions = new Float32Array(particleCount * 3)
  const velocities = []

  // 初始化粒子位置和速度
  for (let i = 0; i < particleCount; i++) {
    const i3 = i * 3
    positions[i3] = Math.random() * range - range / 2
    positions[i3 + 1] = Math.random() * range * 1.5
    positions[i3 + 2] = Math.random() * range - range / 2

    velocities.push({
      x: (Math.random() - 0.5) / 3,
      y: 0.1 + Math.random() / 3
    })
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  // 居中粒子系统
  geometry.computeBoundingBox()
  const center = new THREE.Vector3()
  geometry.boundingBox.getCenter(center)
  geometry.translate(-center.x, -center.y, -center.z)

  // 创建粒子材质
  const material = new THREE.PointsMaterial({
    size: 1,
    transparent: true,
    opacity: 0.8,
    map: texture,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
    depthTest: false
  })

  snowParticles = new THREE.Points(geometry, material)
  snowParticles.position.y = -30
  scene.add(snowParticles)
}

// 动画相机到起始位置
const animateCameraToStartPosition = () => {
  new TWEEN.Tween(camera.position)
    .to({ x: 0, y: -1, z: 20 }, 3600)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start()

  new TWEEN.Tween(controls.target)
    .to({ x: 0, y: 0, z: 5 }, 3600)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start()
}

// 窗口大小变化处理
const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

// 动画循环
const animate = () => {
  requestAnimationFrame(animate)

  const delta = clock.getDelta()

  // 更新控制器
  controls.update()

  // 更新Tween动画
  TWEEN.update()

  // 更新动画混合器
  if (animationMixer) {
    animationMixer.update(delta)
  }

  // 旋转奥运五环
  if (olympicRingsGroup) {
    olympicRingsGroup.rotation.y += 0.01
  }

  // 更新雪花粒子
  if (snowParticles) {
    const positions = snowParticles.geometry.attributes.position.array

    for (let i = 0; i < 1500; i++) {
      const i3 = i * 3
      positions[i3] -= 0.1 // 轻微水平移动
      positions[i3 + 1] -= 0.2 // 下落速度

      // 粒子回收
      if (positions[i3 + 1] < -50) {
        positions[i3 + 1] = 100
        positions[i3] = Math.random() * 100 - 50
      }
    }

    snowParticles.geometry.attributes.position.needsUpdate = true
  }

  renderer.render(scene, camera)
}

// 初始化点击事件
const initClickEvent = () => {
  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  const onClick = (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObjects(meshes)

    if (intersects.length > 0) {
      console.log('Clicked object:', intersects[0].object)
    }
  }

  window.addEventListener('click', onClick)

  // 返回清理函数
  return () => {
    window.removeEventListener('click', onClick)
  }
}

// 组件挂载时初始化
onMounted(() => {
  initScene()
  const cleanupClickEvent = initClickEvent()

  // 组件卸载时清理
  onUnmounted(() => {
    window.removeEventListener('resize', onWindowResize)
    cleanupClickEvent()

    if (renderer) {
      renderer.dispose()
    }
  })
})
</script>

<style scoped>
.three-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 100;
}

.loading-progress {
  color: white;
  font-size: 2rem;
  font-family: Arial, sans-serif;
}
</style>

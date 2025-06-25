<template>
  <div ref="container" class="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js' // 轨道控制器
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js' // GUI

interface StarParameters {
  color: [number, number, number]
  sprite: THREE.Texture
  size: number
}

const container = ref<HTMLElement>()
let scene: THREE.Scene
let width: number
let height: number
let depth = 1400
let camera: THREE.Camera
let zAxisNumber: number // 声明相机在z轴的位置
let sphereGroup: THREE.Group
let materials: THREE.PointsMaterial[] = [] // 声明点材质
let parameters: StarParameters[] // 声明点的参数
let zprogress: number // 声明点在z轴上移动的进度
let zprogress_second: number // 声明同上（第二个几何点）
let particles_first: THREE.Points[] // 声明粒子1
let particles_init_position: number // 声明粒子1的初始化位置
let particles_second: THREE.Points[] // 声明粒子2
let cloudParameter_first: any // 声明流动的云对象1（包含路径、云实例）
let cloudParameter_second: any // 声明流动的云对象2（包含路径、云实例）
let renderCloudMove_first: any // 声明云流动的渲染函数1
let renderCloudMove_second: any // 声明云流动的渲染函数1
let renderHumanMove: any
let renderer: THREE.WebGLRenderer
let controls: OrbitControls

const initScene = () => {
  const distance = width / 2 / Math.tan(Math.PI / 12)
  zAxisNumber = Math.floor(distance - depth / 2)

  scene = new THREE.Scene()
  // 在场景中添加雾的效果，Fog参数分别代表‘雾的颜色’、‘开始雾化的视线距离’、刚好雾化至看不见的视线距离’
  scene.fog = new THREE.Fog(0x000000, 0, 10000)

  initSceneBg()

  initSceneSphere()

  particles_init_position = -zAxisNumber - depth / 2
  zprogress = particles_init_position
  zprogress_second = particles_init_position * 2
  particles_first = initSceneStar(zprogress)
  particles_second = initSceneStar(zprogress_second)

  cloudParameter_first = initTubeRoute(
    [
      new THREE.Vector3(-width / 10, 0, -depth / 2),
      new THREE.Vector3(-width / 4, height / 8, 0),
      new THREE.Vector3(-width / 4, 0, zAxisNumber)
    ],
    400,
    200
  )
  cloudParameter_second = initTubeRoute(
    [
      new THREE.Vector3(width / 8, height / 8, -depth / 2),
      new THREE.Vector3(width / 8, height / 8, zAxisNumber)
    ],
    200,
    100
  )
  renderCloudMove_first = initCloudMove(cloudParameter_first, 0.0002)
  renderCloudMove_second = initCloudMove(cloudParameter_second, 0.0008, 0.001)

  renderHumanMove = initSceneHuman()
}

// 加载背景（盒模型背景，视角在盒子里面，看到的是盒子内部）
const initSceneBg = () => {
  new THREE.TextureLoader().load('/threejs-demo/demo3/images/sky.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    const geometry = new THREE.BoxGeometry(width, height, depth)
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide
    })
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)
  })

  new THREE.TextureLoader().load('/threejs-demo/demo3/images/ground.png', (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace
    const geometry = new THREE.PlaneGeometry(width, 400) // 设置地面大小
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true // 支持透明背景
    })
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.set(0, -200, 0)
    scene.add(mesh)
  })
}

// 加载球体
const initSceneSphere = () => {
  new THREE.TextureLoader().load('/threejs-demo/demo3/images/earth_bg.png', (texture) => {
    // texture.colorSpace = THREE.SRGBColorSpace
    const geometry = new THREE.SphereGeometry(50, 64, 32)
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      blendDstAlpha: 1
    })
    const mesh = new THREE.Mesh(geometry, material)
    sphereGroup = new THREE.Group()
    sphereGroup.position.set(-400, 200, -200)
    sphereGroup.add(mesh)
    scene.add(sphereGroup)
  })
}

//  加载星星
const initSceneStar = (initZposition: number, starCount: number = 50) => {
  // 预定义星星参数配置
  parameters = [
    {
      color: [0.6, 1.0, 0.75], // 使用HSL颜色模式 (H, S, L)
      sprite: new THREE.TextureLoader().load('/threejs-demo/demo3/images/starflake1.png'),
      size: 50
    },
    {
      color: [0.0, 0.0, 1.0],
      sprite: new THREE.TextureLoader().load('/threejs-demo/demo3/images/starflake2.png'),
      size: 20
    }
  ]

  // 初始化顶点数据
  const vertices = []
  for (let i = 0; i < starCount; i++) {
    const x = THREE.MathUtils.randFloatSpread(width) // x
    const y = Math.random() * height * 0.5 // y (0到height/2)
    const z = THREE.MathUtils.randFloatSpread(depth * 0.5) + (zAxisNumber - depth * 0.25) // z
    vertices.push(x, y, z)
  }

  // 创建共享几何体
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
  geometry.computeBoundingSphere() // 计算边界球体提升渲染性能

  const stars: THREE.Points[] = []
  const baseRotation = {
    x: THREE.MathUtils.randFloatSpread(0.3),
    y: THREE.MathUtils.randFloatSpread(0.3),
    z: THREE.MathUtils.randFloatSpread(0.3)
  }

  // 创建不同材质的星星组
  parameters.forEach(({ color, sprite, size }, i) => {
    materials[i] = new THREE.PointsMaterial({
      size,
      map: sprite,
      blending: THREE.AdditiveBlending,
      depthTest: true,
      transparent: true,
      alphaTest: 0.01
    })
    materials[i].color.setHSL(...color)

    const particle = new THREE.Points(geometry, materials[i])
    particle.rotation.set(baseRotation.x, baseRotation.y, baseRotation.z)
    particle.position.z = initZposition

    stars.push(particle)
    scene.add(particle)
  })

  return stars
}

// 星星动画
const renderStarMove = () => {
  const time = Date.now() * 0.00005
  zprogress += 1
  zprogress_second += 1
  if (zprogress >= zAxisNumber + depth / 2) {
    zprogress = particles_init_position
  }
  if (zprogress_second >= zAxisNumber + depth / 2) {
    zprogress_second = particles_init_position * 2
  }
  particles_first.forEach((item) => {
    item.position.setZ(zprogress)
  })
  particles_second.forEach((item) => {
    item.position.setZ(zprogress_second)
  })
  // 更新材质颜色（创建色彩循环效果）
  materials.forEach((material, i) => {
    const [hue, saturation, lightness] = parameters[i].color
    const cyclicalHue = (hue + time) % 1 // 确保hue在0-1范围内循环
    material.color.setHSL(cyclicalHue, saturation, lightness)
  })
}

// 初始化流动路径
const initTubeRoute = (route: any, geometryWidth?: number, geometryHeight?: number) => {
  const curve = new THREE.CatmullRomCurve3(route, false) // 从一系列的点创建一条平滑的三维样条曲线
  const tubeGeometry = new THREE.TubeGeometry(curve, 100, 2, 50, false)
  const tubeMaterial = new THREE.MeshBasicMaterial({
    opacity: 0,
    transparent: true
  })
  const tube = new THREE.Mesh(tubeGeometry, tubeMaterial)
  scene.add(tube)

  const clondGeometry = new THREE.PlaneGeometry(geometryWidth, geometryHeight)
  const cloudTexture = new THREE.TextureLoader().load(
    '/threejs-demo/demo3/images/cloud.png'
  )
  const clondMaterial = new THREE.MeshBasicMaterial({
    map: cloudTexture,
    blending: THREE.AdditiveBlending,
    depthTest: false,
    transparent: true
  })
  const cloud = new THREE.Mesh(clondGeometry, clondMaterial)
  scene.add(cloud)

  return {
    cloud,
    curve
  }
}

// 初始化云的运动函数
const initCloudMove = (
  cloudParameter: any,
  speed: number,
  scaleSpeed = 0.0006,
  maxScale = 1,
  startScale = 0
) => {
  let cloudProgress = 0
  return () => {
    if (startScale < maxScale) {
      startScale += scaleSpeed
      cloudParameter.cloud.scale.setScalar(startScale)
    }
    if (cloudProgress > 1) {
      cloudProgress = 0
      startScale = 0
    } else {
      cloudProgress += speed
      if (cloudParameter.curve) {
        const point = cloudParameter.curve.getPoint(cloudProgress)
        if (point && point.x) {
          cloudParameter.cloud.position.set(point.x, point.y, point.z)
        }
      }
    }
  }
}

// 加载人物
const initSceneHuman = () => {
  const humanTexture = new THREE.TextureLoader().load(
    '/threejs-demo/demo3/images/login_human.png'
  )
  humanTexture.colorSpace = THREE.SRGBColorSpace
  const geometry = new THREE.PlaneGeometry(154, 190) // 设置平面大小
  const material = new THREE.MeshBasicMaterial({
    map: humanTexture,
    transparent: true, // 支持透明背景
    alphaTest: 0.01
  })
  const humanPlane = new THREE.Mesh(geometry, material)
  humanPlane.position.set(150, 150, 0) // 设置初始位置
  scene.add(humanPlane)

  // 动画效果
  const animateHuman = () => {
    const time = Date.now() * 0.001
    humanPlane.position.y = Math.sin(time) * 20 + 130 // 模拟上下浮动
  }

  return animateHuman
}

const initLight = () => {
  const ambientLight = new THREE.AmbientLight(0xffffff, 1) // 环境光
  scene.add(ambientLight)

  const pointLight = new THREE.PointLight(0x0655fd, 5, 0) // 点光源
  pointLight.position.set(0, 100, -200)
  scene.add(pointLight)

  const lightHelper = new THREE.PointLightHelper(pointLight, 20)
  lightHelper.visible = false
  scene.add(lightHelper)
}

const initCamera = () => {
  camera = new THREE.PerspectiveCamera(15, width / height, 1, 30000)
  camera.position.set(0, 0, zAxisNumber)
  camera.lookAt(new THREE.Vector3(0, 0, 0))
}

const initRender = () => {
  renderer = new THREE.WebGLRenderer({
    antialias: true, // 抗锯齿
    alpha: true
  })
  renderer.setSize(width, height)
  renderer.shadowMap.enabled = true // 开启阴影贴图
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.setPixelRatio(window.devicePixelRatio) // 设备像素比
  renderer.setClearColor(0x000000, 0.5) // 背景颜色
  renderer.outputColorSpace = THREE.SRGBColorSpace // sRGB 颜色空间（默认）
  ;(container.value as HTMLElement).appendChild(renderer.domElement)
}

const initOrbitControls = () => {
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true // 启用惯性效果
  controls.dampingFactor = 0.05 // 惯性系数
  controls.screenSpacePanning = false // 保持平面平移
  controls.maxPolarAngle = Math.PI // 垂直旋转限制
  // controls.minDistance = 5 // 最小缩放距离
  // controls.maxDistance = 500 // 最大缩放距离
  controls.target.set(0, 0, 0)
  controls.enabled = false
  controls.update()
}

const initAxesHelper = () => {
  const axesHelper = new THREE.AxesHelper(2000)
  axesHelper.visible = false
  scene.add(axesHelper)
}

const initUtils = () => {
  initOrbitControls()
  initAxesHelper()
}

const animate = () => {
  requestAnimationFrame(animate)
  if (controls?.enableDamping) {
    controls.update()
  }
  // 星球自转
  if (sphereGroup) {
    sphereGroup.rotateY(0.001)
  }
  // 星星移动
  renderStarMove()
  // 云移动
  renderCloudMove_first()
  renderCloudMove_second()
  // 人移动
  renderHumanMove()
  renderer.render(scene, camera)
}

onMounted(() => {
  width = container.value?.clientWidth as number
  height = container.value?.clientHeight as number
  initScene()
  initLight()
  initCamera()
  initRender()
  initUtils()
  animate()
  document.title = '登录 - Three.js'
})
</script>

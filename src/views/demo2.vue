<template>
  <div ref="container" class="container"></div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js' // 轨道控制器
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min.js' // GUI
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

const container = ref()
const scene = new THREE.Scene()
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let ambientLight: THREE.AmbientLight
let directionalLight: THREE.DirectionalLight
let originalMesh: THREE.Mesh // 原始的mesh
let meshGroup: THREE.Group

const obj = {
  color: 0xff0000,
  specular: 0xffffff,
  rotate: false,
  directionalLight: {
    x: 0,
    y: 500,
    z: 0
  }
}

const initMesh = () => {
  const geometry = new THREE.BoxGeometry(50, 50, 50)
  /* prettier-ignore */
  const uvData = new Float32Array([
    1, 1, 0, 1, 1, 0, 0, 0, // 右
    1, 1, 0, 1, 1, 0, 0, 0, // 左

    1, 1, 1, 0, 0, 1, 0, 0, // 上
    1, 1, 1, 0, 0, 1, 0, 0, // 下

    0, 1, 1, 1, 0, 0, 1, 0, // 前
    0, 1, 1, 1, 0, 0, 1, 0, // 后
  ])
  geometry.attributes.uv = new THREE.BufferAttribute(uvData, 2)
  const texture = new THREE.TextureLoader().load('/threejs-demo/girl.jpg')
  texture.colorSpace = THREE.SRGBColorSpace
  const material = new THREE.MeshPhongMaterial({
    // color: obj.color,
    shininess: 30, // 高光部分的亮度，默认30
    specular: obj.specular, // 材质的高光颜色
    map: texture
  })
  originalMesh = new THREE.Mesh(geometry, material)
  meshGroup = new THREE.Group()
  meshGroup.position.y = -25

  for (let x = 0; x < 10; x++) {
    for (let y = 0; y < 10; y++) {
      const clonedMesh = originalMesh.clone() // 克隆一个新的mesh，共享geometry和material
      clonedMesh.position.set(-x * 75, 0, -y * 75)
      meshGroup.add(clonedMesh)
      console.log(
        '🚀 ~ file: demo2.vue:49 ~ clonedMesh.position.set(-x * 75, 0, -y * 75):',
        clonedMesh.getWorldPosition(new THREE.Vector3())
      )
    }
  }
  scene.add(meshGroup)

  // 地面
  const planeTexture = new THREE.TextureLoader().load('/girl2.jpg')
  planeTexture.wrapS = THREE.RepeatWrapping
  planeTexture.wrapT = THREE.RepeatWrapping
  planeTexture.repeat.set(10, 10)
  const planeGeometry = new THREE.PlaneGeometry(725, 725)
  const planeMaterial = new THREE.MeshBasicMaterial({
    // side: THREE.DoubleSide,
    // map: planeTexture,
    transparent: true
  })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotateX(-Math.PI / 2)
  plane.translateX(-725 / 2 + 25)
  plane.translateY(725 / 2 - 25)
  plane.translateZ(-75)
  // scene.add(plane)
}

const initLight = () => {
  // 环境光
  ambientLight = new THREE.AmbientLight(0x404040, 1) // 柔和的白光
  scene.add(ambientLight)

  // 点光源
  const pointLight = new THREE.PointLight(0xffffff, 4.0, 1000)
  pointLight.decay = 0.0
  pointLight.position.set(50, 0, 50)
  pointLight.castShadow = true
  scene.add(pointLight)

  const lightHelper = new THREE.PointLightHelper(pointLight, 1)
  scene.add(lightHelper)

  // 平行光
  directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(0, 500, 0)
  scene.add(directionalLight)
}

const initCamera = () => {
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  camera = new THREE.PerspectiveCamera(90, width / height, 0.1, 2000)
  camera.position.set(75, 75, 75)
}

const initRender = () => {
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  renderer = new THREE.WebGLRenderer({
    antialias: true, // 抗锯齿
    alpha: true
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio) // 设备像素比
  renderer.setClearColor(0x000000, 0.5) // 背景颜色
  container.value.appendChild(renderer.domElement)
}

const initOrbitControls = () => {
  controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true // 启用惯性效果
  controls.dampingFactor = 0.05 // 惯性系数
  controls.screenSpacePanning = false // 保持平面平移
  controls.maxPolarAngle = Math.PI // 垂直旋转限制
  // controls.minDistance = 5 // 最小缩放距离
  // controls.maxDistance = 500 // 最大缩放距离
  // controls.target.set(-5 * 75, 0, -5 * 75)
  controls.target.set(0, 0, 0)
  controls.update()
}

const initAxesHelper = () => {
  const axesHelper = new THREE.AxesHelper(50)
  axesHelper.setColors(0xff0000, 0x00ff00, 0x0000ff)
  scene.add(axesHelper)

  const fontLoader = new FontLoader()
  fontLoader.load(
    'https://threejs.org/examples/fonts/helvetiker_regular.typeface.json',
    (font) => {
      const textGeo1 = new TextGeometry('X', {
        font,
        size: 3,
        depth: 0
      })
      const textMat1 = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const xText = new THREE.Mesh(textGeo1, textMat1)
      xText.position.set(51, -1.5, 0)
      scene.add(xText)

      const textGeo2 = new TextGeometry('Y', {
        font,
        size: 3,
        depth: 0
      })
      const textMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const yText = new THREE.Mesh(textGeo2, textMat2)
      yText.position.set(-1.2, 51, 0)
      scene.add(yText)

      const textGeo3 = new TextGeometry('Z', {
        font,
        size: 3,
        depth: 0
      })
      const textMat3 = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const zText = new THREE.Mesh(textGeo3, textMat3)
      zText.position.set(-1.5, -1.5, 51)
      scene.add(zText)
    }
  )
}

const initGridHelper = () => {
  const gridHelper = new THREE.GridHelper(725, 5, 0xff0000, 0xff0000)
  gridHelper.translateX(-725 / 2 + 25)
  gridHelper.translateY(-100)
  gridHelper.translateZ(-725 / 2 + 25)
  scene.add(gridHelper)
}

const initGui = () => {
  const gui = new GUI()
  gui.domElement.style.right = '0px'

  gui.add(obj, 'rotate').name('rotate')

  const guiObjectFolder = gui.addFolder('材质')
  const guiAmbientLightFolder = gui.addFolder('环境光').close()
  const guiDirectionalLightFolder = gui.addFolder('平行光').close()

  guiObjectFolder
    .addColor(obj, 'color')
    .name('color')
    .onChange((value) => {
      const material = originalMesh.material as THREE.MeshPhongMaterial
      material.color.set(value)
    })

  guiObjectFolder
    .addColor(obj, 'specular')
    .name('specular')
    .onChange((value) => {
      const material = originalMesh.material as THREE.MeshPhongMaterial
      material.specular.set(value)
    })

  guiAmbientLightFolder.add(ambientLight, 'intensity', 0, 100).step(0.1)

  guiDirectionalLightFolder
    .add(obj.directionalLight, 'x', -500, 500)
    .step(1)
    .onChange((value) => {
      directionalLight.position.setX(value)
    })

  guiDirectionalLightFolder
    .add(obj.directionalLight, 'y', -500, 500)
    .step(1)
    .onChange((value) => {
      directionalLight.position.setY(value)
    })

  guiDirectionalLightFolder
    .add(obj.directionalLight, 'z', -500, 500)
    .step(1)
    .onChange((value) => {
      directionalLight.position.setZ(value)
    })
}

const initUtils = () => {
  initOrbitControls()
  initAxesHelper()
  initGridHelper()
  initGui()
}

const animate = () => {
  requestAnimationFrame(animate)

  if (controls?.enableDamping) controls.update()

  if (obj.rotate) {
    if (meshGroup.children.length > 0) {
      meshGroup.children.forEach((mesh) => {
        mesh.rotation.x -= Math.PI / 900
        mesh.rotation.y += Math.PI / 450
        mesh.rotation.z -= Math.PI / 300
      })
    }
  }

  renderer.render(scene, camera)
}

const handleResize = () => {
  if (!container.value || !renderer || !camera) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  renderer.setSize(width, height)
  camera.aspect = width / height // 更新相机参数
  camera.updateProjectionMatrix() // 必须调用以应用更改
}

onMounted(() => {
  initMesh()
  initLight()
  initCamera()
  initRender()
  initUtils()
  animate()
  window.addEventListener('resize', handleResize)
  // @ts-ignore
  window.THREE = THREE
  document.title = '阵列 - Three.js'
})
</script>

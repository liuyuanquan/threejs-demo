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
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'

const container = ref()
const scene = new THREE.Scene()
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let ambientLight: THREE.AmbientLight
let su7Group: THREE.Group
let gui: GUI

const initMesh = () => {
  const gltfLoader = new GLTFLoader()
  gltfLoader.setPath('/public/demo4/')
  // 必须在使用前调用 setMeshoptDecoder 加载压缩文件
  gltfLoader.setMeshoptDecoder(MeshoptDecoder)
  gltfLoader.load(
    // '/sm_car.gltf',
    'xiaomi_su7.glb',
    (gltf) => {
      console.log('🚀 ~ gltfLoader.load ~ gltf:', gltf.scene)

      gltf.scene.traverse((child) => {
        if (child.name === 'body') {
          // 修改车身颜色
          const mesh = child as THREE.Mesh
          // mesh.material = (mesh.material as THREE.MeshStandardMaterial).clone()
          const material = mesh.material as THREE.MeshStandardMaterial
          material.color.set(0xb76e79)
        }
      })

      const model = gltf.scene.getObjectByName('Sketchfab_model')
      if (model) {
        model.rotation.z = -0.817
        const guiObjectFolder = gui.addFolder('汽车')
        guiObjectFolder
          .add(model!.rotation, 'z')
          .min(-10)
          .max(10)
          .step(0.001)
          .name('rotation.z')
      }

      su7Group = new THREE.Group()
      su7Group.add(gltf.scene)

      // 计算并居中
      const box = new THREE.Box3().setFromObject(su7Group)
      const center = box.getCenter(new THREE.Vector3())

      su7Group.position.x = -center.x
      su7Group.position.y = -center.y
      su7Group.position.z = -center.z

      scene.add(su7Group)
    },
    (xhr) => {
      console.log('🚀 ~ gltfLoader.load ~ xhr:', (xhr.loaded / xhr.total) * 100 + '%')
    },
    (error) => {
      console.log('🚀 ~ gltfLoader.load ~ error:', error)
    }
  )
}

const initLight = () => {
  // 环境光
  ambientLight = new THREE.AmbientLight(0xffffff, 1) // 柔和的白光
  scene.add(ambientLight)

  // 点光源1
  const pointLight = new THREE.PointLight(0xffffff, 4.0, 1000, 0.0)
  pointLight.position.set(10, 10, 10)
  pointLight.castShadow = true
  scene.add(pointLight)

  const lightHelper = new THREE.PointLightHelper(pointLight, 0.5)
  // scene.add(lightHelper)

  // 点光源2
  const pointLight2 = new THREE.PointLight(0xffffff, 4.0, 1000, 0.0)
  pointLight2.position.set(-10, 10, -10)
  pointLight2.castShadow = true
  scene.add(pointLight2)

  const lightHelper2 = new THREE.PointLightHelper(pointLight2, 0.5)
  // scene.add(lightHelper2)
}

const initCamera = () => {
  const width = container.value.clientWidth
  const height = container.value.clientHeight
  camera = new THREE.PerspectiveCamera(13, width / height, 1, 3000)
  camera.position.set(50, 0, 50)
  camera.lookAt(0, 0, 0)
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
  // controls.screenSpacePanning = false // 保持平面平移
  controls.maxPolarAngle = Math.PI // 垂直旋转限制
  controls.target.set(0, 0, 0)
  controls.update()
}

const initAxesHelper = () => {
  const axesHelper = new THREE.AxesHelper(5)
  axesHelper.setColors(0xff0000, 0x00ff00, 0x0000ff)
  // scene.add(axesHelper)

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
      xText.position.set(6, -1.5, 0)
      // scene.add(xText)

      const textGeo2 = new TextGeometry('Y', {
        font,
        size: 3,
        depth: 0
      })
      const textMat2 = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const yText = new THREE.Mesh(textGeo2, textMat2)
      yText.position.set(-1.2, 6, 0)
      // scene.add(yText)

      const textGeo3 = new TextGeometry('Z', {
        font,
        size: 3,
        depth: 0
      })
      const textMat3 = new THREE.MeshBasicMaterial({ color: 0xffffff })
      const zText = new THREE.Mesh(textGeo3, textMat3)
      zText.position.set(-1.5, -1.5, 6)
      // scene.add(zText)
    }
  )
}

const initGridHelper = () => {
  const gridHelper = new THREE.GridHelper(725, 5, 0xff0000, 0xff0000)
  gridHelper.visible = false
  scene.add(gridHelper)
}

const initGui = () => {
  gui = new GUI()
  gui.domElement.style.right = '0px'

  // .onChange((value) => {
  //   // const material = originalMesh.material as THREE.MeshPhongMaterial
  //   // material.color.set(value)
  // })
}

const initUtils = () => {
  initOrbitControls()
  initAxesHelper()
  initGui()
  initGridHelper()
}

let clock = new THREE.Clock()
const speed = new THREE.Vector3(1, 0, 0)
const animate = () => {
  // console.log('🚀 ~ camera:', camera.position)
  // console.log('🚀 ~ controls:', controls.target)

  if (controls?.enableDamping) {
    controls.update()
  }

  // 相机平移
  // const A = controls.target
  // const dir = camera.getWorldDirection(A)
  // const time = Math.sin(((Date.now() / 1000) * Math.PI) / 30)
  // const dis = dir.clone().multiplyScalar(time >= 0 ? -0.05 : 0.05)
  // camera.position.add(dis)

  // 汽车匀速运动
  if (su7Group) {
    const spt = clock.getDelta() //两帧渲染时间间隔(秒)
    const dis = speed.clone().multiplyScalar(spt)
    su7Group.position.add(dis)
  }

  renderer.render(scene, camera)
  requestAnimationFrame(animate)
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
  document.title = '汽车 - Three.js'
})
</script>

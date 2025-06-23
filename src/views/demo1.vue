<template>
  <div ref="container" class="container">
    <div v-if="loading" class="loading-overlay">
      <div class="loader"></div>
      <p>场景加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// 核心库引入
import { ref, onMounted, onUnmounted } from 'vue' // Vue 响应式API和生命周期钩子
import * as THREE from 'three' // Three.js核心库
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js' // 轨道控制器
import Stats from 'three/examples/jsm/libs/stats.module.js' // 性能监视器

// DOM元素引用
const container = ref<HTMLElement>() // 主容器DOM引用
const loading = ref(true) // 加载状态标志

// Three.js核心对象
const scene = new THREE.Scene() // 创建场景实例
let renderer: THREE.WebGLRenderer // 渲染器实例
let camera: THREE.PerspectiveCamera // 透视相机实例
let controls: OrbitControls // 轨道控制器实例
let animationId: number // 动画帧ID
let mesh: THREE.Mesh
let stats: Stats

/**
 * 初始化场景光源系统
 * 创建并配置场景中的各类光源
 * @function
 */
const initLights = () => {
  // 环境光 - 提供基础照明，避免完全黑暗的区域
  // 参数: (颜色, 强度)
  const ambientLight = new THREE.AmbientLight(0x404040, 2)
  scene.add(ambientLight)

  // 点光源 - 模拟灯泡效果的主光源
  // 参数: (颜色, 强度, 距离, 衰减率)
  const pointLight = new THREE.PointLight(0xffffff, 2.0, 1000)
  pointLight.decay = 0.0 // 禁用物理衰减
  pointLight.position.set(20, 20, 20) // 设置光源位置(X,Y,Z)
  pointLight.castShadow = true // 启用阴影投射
  scene.add(pointLight)
  // 点光源辅助器 - 可视化光源位置
  const lightHelper = new THREE.PointLightHelper(pointLight, 1) // 参数: (光源, 辅助线尺寸)
  scene.add(lightHelper)

  // 平行光
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  directionalLight.position.set(0, 15, 15)
  scene.add(directionalLight)
  // 平行光辅助器
  const dirLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1, 0xffff00)
  scene.add(dirLightHelper)
}

/**
 * 初始化场景物体
 * 创建并配置场景中的3D对象
 * @function
 */
const initObjects = () => {
  // 创建立方体几何体
  // 参数: (宽度, 高度, 深度)
  const geometry = new THREE.BoxGeometry(15, 15, 15)
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
  const texture = new THREE.TextureLoader().load('/girl.jpg')
  const material = new THREE.MeshLambertMaterial({
    // color: 0xff0000, // 基础颜色
    // transparent: true, // 启用透明度
    // opacity: 0.4, // 透明度值(0-1)
    map: texture
  })

  // 创建网格对象(几何体+材质)
  mesh = new THREE.Mesh(geometry, material)
  mesh.position.set(0, 0, 0) // 设置物体位置
  mesh.castShadow = true // 启用阴影投射
  scene.add(mesh) // 添加到场景

  // 创建地面平面
  // const groundGeometry = new THREE.PlaneGeometry(100, 100)
  // const groundMaterial = new THREE.MeshStandardMaterial({
  //   color: 0xcccccc,
  //   side: THREE.DoubleSide,
  // })
  // const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  // ground.rotation.x = -Math.PI / 2 // 旋转90度使平面水平
  // ground.position.y = -5 // 下移5个单位
  // ground.receiveShadow = true // 接收阴影
  // scene.add(ground)

  // 测试BufferGeometry
  const geometry1 = new THREE.BufferGeometry()
  // 创建一个简单的矩形. 在这里我们左上和右下顶点被复制了两次。
  // 因为在两个三角面片里，这两个顶点都需要被用到。
  const vertices = new Float32Array([
    // 第一个三角形（逆时针）
    0, 0, 0, 10, 10, 0, 0, 10, 0,
    // 第二个三角形（逆时针）
    10, 10, 0, 0, 0, 0, 10, 0, 0
  ])
  // itemSize = 3 因为每个顶点都是一个三元组。
  geometry1.attributes.position = new THREE.BufferAttribute(vertices, 3)

  const material1 = new THREE.PointsMaterial({
    color: 0x00ff00,
    size: 1
  })
  // const mesh1 = new THREE.Mesh(geometry1, material1)
  const mesh1 = new THREE.Points(geometry1, material1)
  // mesh1.rotateZ(Math.PI)
  scene.add(mesh1)
}

/**
 * 初始化相机系统
 * 创建并配置场景相机
 * @function
 */
const initCamera = () => {
  if (!container.value) return // 安全校验

  // 获取容器尺寸
  const width = container.value.clientWidth
  const height = container.value.clientHeight

  /**
   * 创建透视相机
   * 参数说明:
   * @param {number} 60 - 视野角度(FOV)，单位度
   * @param {number} width/height - 宽高比
   * @param {number} 0.1 - 近裁剪面(小于此值不渲染)
   * @param {number} 1000 - 远裁剪面(大于此值不渲染)
   */
  camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 1000)
  camera.position.set(60, 0, 0) // 设置相机位置(X, Y, Z)
  camera.lookAt(0, 0, 0) // 设置相机焦点

  // @ts-ignore
  window.camera = camera
}

/**
 * 初始化渲染器
 * 创建并配置WebGL渲染器
 * @function
 */
const initRenderer = () => {
  if (!container.value) return // 安全校验

  // 创建WebGL渲染器
  renderer = new THREE.WebGLRenderer({
    antialias: true, // 开启抗锯齿
    alpha: true, // 启用透明度通道
    powerPreference: 'high-performance' // 高性能模式
  })

  // 启用物理正确光照
  // renderer.physicallyCorrectLights = true
  // 启用阴影映射
  // renderer.shadowMap.enabled = true
  // 设置阴影类型为软阴影
  // renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // 更新渲染器尺寸
  updateRendererSize()
  // 将渲染器的DOM元素添加到容器
  container.value.appendChild(renderer.domElement)
}

/**
 * 更新渲染器尺寸
 * 响应式调整渲染器尺寸和相机参数
 * @function
 */
const updateRendererSize = () => {
  if (!container.value || !renderer || !camera) return

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  // 设置渲染器尺寸
  renderer.setSize(width, height)
  // 设置设备像素比(限制最大值2避免性能问题)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // 更新相机参数
  camera.aspect = width / height
  camera.updateProjectionMatrix() // 必须调用以应用更改
}

/**
 * 初始化轨道控制器
 * 创建并配置场景交互控制器
 * @function
 */
const initControls = () => {
  if (!renderer) return

  // 创建轨道控制器
  // 参数: (相机实例, 渲染器DOM元素)
  controls = new OrbitControls(camera, renderer.domElement)

  // 控制器配置
  controls.enableDamping = true // 启用惯性效果
  controls.dampingFactor = 0.05 // 惯性系数
  controls.screenSpacePanning = false // 保持平面平移
  controls.maxPolarAngle = Math.PI // 垂直旋转限制
  controls.minDistance = 5 // 最小缩放距离
  controls.maxDistance = 500 // 最大缩放距离

  //@ts-ignore
  window.cameraControls = controls
}

/**
 * 初始化坐标轴辅助
 * 创建XYZ三色坐标轴，便于场景方向参考
 * @function
 */
const initAxes = () => {
  // 创建坐标轴辅助器
  const axesHelper = new THREE.AxesHelper(150)

  // 坐标轴颜色说明：
  // X轴(红色) Y轴(绿色) Z轴(蓝色)
  scene.add(axesHelper)
}

/**
 * 动画循环
 * 每一帧更新场景状态并重新渲染
 * @function
 */
const animate = () => {
  stats.update()

  // 请求下一帧动画
  animationId = requestAnimationFrame(animate)

  // 更新控制器(如果启用了阻尼效果)
  if (controls?.enableDamping) controls.update()

  // mesh.rotation.x += 0.01
  // mesh.rotation.y += 0.01
  // mesh.rotation.z += 0.01

  // 渲染场景
  renderer.render(scene, camera)

  // 场景加载完成后隐藏加载状态
  if (loading.value) {
    loading.value = false
  }
}

/**
 * 窗口大小变化处理
 * 响应式调整渲染器和相机
 * @function
 */
const handleResize = () => {
  updateRendererSize()
}

/**
 * 清理资源
 * 组件卸载时释放内存和移除事件监听
 * @function
 */
const cleanup = () => {
  // 取消动画循环
  cancelAnimationFrame(animationId)

  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize)

  // 清理控制器
  if (controls) {
    controls.dispose() // 释放控制器资源
  }

  // 移除渲染器DOM元素
  if (container.value && renderer?.domElement) {
    container.value.removeChild(renderer.domElement)
  }
}

/**
 * 主初始化函数
 * 按顺序初始化所有场景组件
 * @function
 */
const init = () => {
  stats = new Stats()
  document.body.appendChild(stats.domElement)

  // 初始化顺序很重要
  initCamera() // 1. 初始化相机
  initLights() // 2. 初始化光源
  initObjects() // 3. 初始化物体
  initAxes() // 4. 初始化坐标轴辅助
  initRenderer() // 5. 初始化渲染器
  initControls() // 6. 初始化控制器

  // 添加窗口大小变化监听
  window.addEventListener('resize', handleResize)

  // 开始动画循环
  animate()
}

// 组件生命周期
onMounted(() => {
  // 组件挂载时初始化场景
  init()

  document.title = 'Basic - Three.js'
})

onUnmounted(() => {
  // 组件卸载时清理资源
  cleanup()
})
</script>

<style scoped>
/* 加载状态样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  z-index: 100;
}

/* 加载动画 */
.loader {
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>

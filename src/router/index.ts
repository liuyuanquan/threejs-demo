import { createRouter, createWebHistory } from 'vue-router'

// 1. 使用 import.meta.glob 获取所有 views 下的 .vue 文件
const pageModules = import.meta.glob('../views/*.vue')

// 2. 动态生成路由
const routes = Object.entries(pageModules).map(([filePath, component]) => {
  // 提取文件名（如 ../views/demo1.vue → demo1）
  const routeName = filePath.replace('../views/', '').replace('.vue', '')

  return {
    path: `/${routeName}`,
    name: routeName,
    component, // 直接使用动态导入的组件
    meta: {
      title: `${routeName} 示例`
    }
  }
})

// 3. 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router

import { createRouter, createWebHistory } from 'vue-router'

const pageModules = import.meta.glob([
  '../views/*.vue',
  '../views/*/index.vue' // 匹配所有一级目录下的 index.vue
])

const BLACKLIST = ['template']

const routes = Object.entries(pageModules)
  .map(([filePath, component]) => {
    let routePath, routeName

    if (filePath.includes('/index.vue')) {
      // 处理类似 ../views/su7/index.vue → /su7
      routeName = filePath.split('/')[2] // 提取 su7
      routePath = `/${routeName}`
    } else {
      // 处理类似 ../views/demo1.vue → /demo1
      routeName = filePath.replace('../views/', '').replace('.vue', '')
      routePath = `/${routeName}`
    }

    return {
      path: routePath,
      name: routeName,
      component,
      meta: {
        title: `${routeName} 示例`
      }
    }
  })
  .filter((route) => !BLACKLIST.includes(route.name)) // 过滤黑名单

// 3. 创建路由实例
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

export default router

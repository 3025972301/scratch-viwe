/**
 * router/index.ts
 *
 * Automatic routes for `./src/pages/*.vue`
 */

// Composables
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from 'vue-router/auto-routes'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, savedPosition) {
    // 如果有保存的位置（如使用浏览器后退按钮），恢复该位置
    if (savedPosition) {
      return savedPosition
    }
    // 否则滚动到页面顶部
    return { top: 0, behavior: 'smooth' }
  }
})

// 路由守卫 - 保护管理后台路由
router.beforeEach(async (to, from, next) => {
  // 检查是否是管理后台路由
  if (to.path.startsWith('/admin')) {
    // 动态导入 auth store 以避免循环依赖
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    await authStore.init()

    if (!authStore.isAuthenticated) {
      // 未登录，重定向到登录页
      next({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else if (to.path === '/login') {
    // 已登录用户访问登录页，重定向到管理后台
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()
    await authStore.init()

    if (authStore.isAuthenticated) {
      next('/admin')
    } else {
      next()
    }
  } else {
    next()
  }
})

// Workaround for https://github.com/vitejs/vite/issues/11804
router.onError((err, to) => {
  if (err?.message?.includes?.('Failed to fetch dynamically imported module')) {
    if (localStorage.getItem('vuetify:dynamic-reload')) {
      console.error('Dynamic import error, reloading page did not fix it', err)
    } else {
      console.log('Reloading page to fix dynamic import error')
      localStorage.setItem('vuetify:dynamic-reload', 'true')
      location.assign(to.fullPath)
    }
  } else {
    console.error(err)
  }
})

router.isReady().then(() => {
  localStorage.removeItem('vuetify:dynamic-reload')
})

export default router

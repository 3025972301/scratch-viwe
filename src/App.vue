<template>
  <v-app>
    <!-- 全局路由加载进度条 -->
    <v-progress-linear
      v-if="isRouteLoading"
      color="primary"
      indeterminate
      height="3"
      class="route-loading-bar"
    ></v-progress-linear>

    <v-main>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isRouteLoading = ref(false)
let loadingTimeout = null

// 监听路由变化显示加载状态
router.beforeEach((to, from, next) => {
  // 只在不同路由之间切换时显示加载
  if (to.path !== from.path) {
    isRouteLoading.value = true
  }
  next()
})

router.afterEach(() => {
  // 延迟关闭加载状态，确保过渡动画完成
  if (loadingTimeout) clearTimeout(loadingTimeout)
  loadingTimeout = setTimeout(() => {
    isRouteLoading.value = false
  }, 300)
})

// 路由加载错误时也关闭加载状态
router.onError(() => {
  isRouteLoading.value = false
})
</script>

<style>
/* 路由加载进度条样式 */
.route-loading-bar {
  position: fixed !important;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('authToken') || null)
  const user = ref(null)
  const loading = ref(false)

  // 检查是否已登录
  const isAuthenticated = computed(() => !!token.value)

  // 登录
  async function login(username, password) {
    loading.value = true
    try {
      const result = await api.auth.login(username, password)

      if (result.success) {
        token.value = result.token
        user.value = result.user
        localStorage.setItem('authToken', result.token)
        return { success: true }
      }

      return { success: false, message: '登录失败' }
    } catch (error) {
      return { success: false, message: error.message || '登录失败' }
    } finally {
      loading.value = false
    }
  }

  // 登出
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('authToken')
  }

  // 初始化 - 验证现有 token
  async function init() {
    if (token.value) {
      try {
        const result = await api.auth.verify()
        if (result.valid) {
          user.value = result.user
        } else {
          logout()
        }
      } catch (error) {
        logout()
      }
    }
  }

  // 获取当前用户信息
  function getCurrentUser() {
    return user.value
  }

  return {
    token,
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    init,
    getCurrentUser
  }
})

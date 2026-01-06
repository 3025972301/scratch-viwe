import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('authToken') || null)
  const user = ref(null)
  const loading = ref(false)

  // 检查是否已登录
  const isAuthenticated = computed(() => !!token.value)

  // 检查是否是管理员
  const isAdmin = computed(() => user.value?.role === 'admin')

  // 检查是否是学生
  const isStudent = computed(() => user.value?.role === 'student')

  // 获取用户角色
  const userRole = computed(() => user.value?.role || null)

  // 获取关联的学生ID
  const studentId = computed(() => user.value?.studentId || null)

  // 登录
  async function login(username, password) {
    loading.value = true
    try {
      const result = await api.auth.login(username, password)

      if (result.success) {
        token.value = result.token
        user.value = result.user
        localStorage.setItem('authToken', result.token)
        return { success: true, user: result.user }
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

  // 修改密码
  async function changePassword(oldPassword, newPassword) {
    try {
      const result = await api.auth.changePassword(oldPassword, newPassword)
      return result
    } catch (error) {
      return { success: false, message: error.message || '修改密码失败' }
    }
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
    isAdmin,
    isStudent,
    userRole,
    studentId,
    login,
    logout,
    changePassword,
    init,
    getCurrentUser
  }
})

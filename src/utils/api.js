// API 配置
// 生产环境使用相对路径（前后端同域），开发环境使用本地服务器
const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3002/api')

// 获取 token
function getToken() {
  return localStorage.getItem('authToken')
}

// 通用请求函数
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  }

  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(url, {
    ...options,
    headers
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }))
    throw new Error(error.error || '请求失败')
  }

  return response.json()
}

// API 方法
export const api = {
  // 认证
  auth: {
    login: (username, password) =>
      request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      }),
    verify: () => request('/auth/verify'),
    changePassword: (oldPassword, newPassword) =>
      request('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ oldPassword, newPassword })
      })
  },

  // 用户管理
  users: {
    getAll: () => request('/users'),
    getById: (id) => request(`/users/${id}`),
    create: (data) =>
      request('/users', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id, data) =>
      request(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      request(`/users/${id}`, {
        method: 'DELETE'
      })
  },

  // 学生
  students: {
    getAll: () => request('/students'),
    getById: (id) => request(`/students/${id}`),
    create: (data) =>
      request('/students', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id, data) =>
      request(`/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      request(`/students/${id}`, {
        method: 'DELETE'
      })
  },

  // 项目
  projects: {
    getAll: () => request('/projects'),
    getAllAdmin: () => request('/projects/all'),
    getPending: () => request('/projects/pending'),
    getMy: () => request('/projects/my'),
    getById: (id) => request(`/projects/${id}`),
    getByStudent: (studentId) => request(`/projects/student/${studentId}`),
    create: (data) =>
      request('/projects', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    update: (id, data) =>
      request(`/projects/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      }),
    delete: (id) =>
      request(`/projects/${id}`, {
        method: 'DELETE'
      }),
    review: (id, action, reason = '') =>
      request(`/projects/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ action, reason })
      }),
    incrementViews: (id) =>
      request(`/projects/${id}/view`, {
        method: 'POST'
      }),
    toggleLike: (id, unlike = false) =>
      request(`/projects/${id}/like`, {
        method: 'POST',
        body: JSON.stringify({ unlike })
      })
  },

  // 文件上传
  upload: {
    thumbnail: async (file) => {
      const formData = new FormData()
      formData.append('thumbnail', file)

      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/upload/thumbnail`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '上传失败' }))
        throw new Error(error.error || '上传失败')
      }

      return response.json()
    },

    sb3File: async (file) => {
      const formData = new FormData()
      formData.append('sb3File', file)

      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/upload/sb3`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '上传失败' }))
        throw new Error(error.error || '上传失败')
      }

      return response.json()
    },

    avatar: async (file) => {
      const formData = new FormData()
      formData.append('avatar', file)

      const token = getToken()
      const response = await fetch(`${API_BASE_URL}/upload/avatar`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: '上传失败' }))
        throw new Error(error.error || '上传失败')
      }

      return response.json()
    }
  },

  // 备份恢复
  backup: {
    // 导出数据
    export: () => request('/backup/export'),

    // 导入数据（JSON 格式）
    import: (data, clearExisting = false) =>
      request('/backup/import', {
        method: 'POST',
        body: JSON.stringify({ data, clearExisting })
      }),

    // 从 SQLite 导入
    importSqlite: (students, projects, clearExisting = false) =>
      request('/backup/import-sqlite', {
        method: 'POST',
        body: JSON.stringify({ students, projects, clearExisting })
      })
  }
}

// 获取完整的文件 URL
export function getFileUrl(path) {
  if (!path) return ''
  if (path.startsWith('http') || path.startsWith('data:')) return path
  // 生产环境：前后端同域，直接使用相对路径
  // 开发环境：需要拼接服务器地址
  if (import.meta.env.PROD) {
    return path
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3002/api'
  const baseUrl = apiUrl.replace(/\/api$/, '')
  return `${baseUrl}${path}`
}

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '@/utils/api'

export const useAppStore = defineStore('app', () => {
  const students = ref([])
  const projects = ref([])
  const loading = ref(false)
  const error = ref(null)

  // 从 localStorage 加载已点赞的项目ID列表
  const likedProjects = ref(new Set(JSON.parse(localStorage.getItem('likedProjects') || '[]')))
  // 从 sessionStorage 加载已浏览的项目ID列表（会话级别，防止刷新重复计数）
  const viewedProjects = ref(new Set(JSON.parse(sessionStorage.getItem('viewedProjects') || '[]')))

  // 检查项目是否已点赞
  const isLiked = (projectId) => likedProjects.value.has(String(projectId))

  // 保存点赞状态到 localStorage
  function saveLikedProjects() {
    localStorage.setItem('likedProjects', JSON.stringify([...likedProjects.value]))
  }

  // 保存浏览状态到 sessionStorage
  function saveViewedProjects() {
    sessionStorage.setItem('viewedProjects', JSON.stringify([...viewedProjects.value]))
  }

  // 获取所有学生
  const getStudents = computed(() => students.value)

  // 获取所有项目
  const getProjects = computed(() => projects.value)

  // 根据ID获取学生
  const getStudentById = (id) => {
    return students.value.find(s => s.id === String(id))
  }

  // 根据ID获取项目
  const getProjectById = (id) => {
    return projects.value.find(p => p.id === String(id))
  }

  // 获取学生的所有项目
  const getProjectsByStudent = (studentId) => {
    return projects.value.filter(p => p.studentId === String(studentId))
  }

  // 加载数据
  async function loadData() {
    loading.value = true
    error.value = null
    try {
      const [studentsData, projectsData] = await Promise.all([
        api.students.getAll(),
        api.projects.getAll()
      ])
      students.value = studentsData
      projects.value = projectsData
    } catch (e) {
      console.error('加载数据失败:', e)
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  // 添加学生
  async function addStudent(student) {
    const newStudent = await api.students.create(student)
    students.value.push(newStudent)
    return newStudent
  }

  // 更新学生
  async function updateStudent(id, updates) {
    const updatedStudent = await api.students.update(id, updates)
    const index = students.value.findIndex(s => s.id === String(id))
    if (index !== -1) {
      students.value[index] = updatedStudent
    }
    return updatedStudent
  }

  // 删除学生
  async function deleteStudent(id) {
    await api.students.delete(id)
    students.value = students.value.filter(s => s.id !== String(id))
    // 同时删除该学生的所有项目
    projects.value = projects.value.filter(p => p.studentId !== String(id))
    return true
  }

  // 添加项目
  async function addProject(project) {
    const newProject = await api.projects.create(project)
    projects.value.push(newProject)
    return newProject
  }

  // 更新项目
  async function updateProject(id, updates) {
    const updatedProject = await api.projects.update(id, updates)
    const index = projects.value.findIndex(p => p.id === String(id))
    if (index !== -1) {
      projects.value[index] = updatedProject
    }
    return updatedProject
  }

  // 删除项目
  async function deleteProject(id) {
    await api.projects.delete(id)
    projects.value = projects.value.filter(p => p.id !== String(id))
    return true
  }

  // 增加浏览量（会话级别防重复）
  async function incrementViews(projectId) {
    const id = String(projectId)
    // 如果本次会话已经浏览过，不再重复计数
    if (viewedProjects.value.has(id)) {
      return
    }

    try {
      const result = await api.projects.incrementViews(projectId)
      const project = projects.value.find(p => p.id === id)
      if (project) {
        project.views = result.views
      }
      // 标记为已浏览
      viewedProjects.value.add(id)
      saveViewedProjects()
    } catch (e) {
      console.error('增加浏览量失败:', e)
    }
  }

  // 点赞/取消点赞
  async function toggleLike(projectId) {
    const id = String(projectId)
    const alreadyLiked = likedProjects.value.has(id)

    try {
      const result = await api.projects.toggleLike(projectId, alreadyLiked)
      const project = projects.value.find(p => p.id === id)
      if (project) {
        project.likes = result.likes
      }

      // 切换点赞状态
      if (alreadyLiked) {
        likedProjects.value.delete(id)
      } else {
        likedProjects.value.add(id)
      }
      saveLikedProjects()
    } catch (e) {
      console.error('点赞失败:', e)
    }
  }

  return {
    students,
    projects,
    loading,
    error,
    getStudents,
    getProjects,
    getStudentById,
    getProjectById,
    getProjectsByStudent,
    isLiked,
    loadData,
    addStudent,
    updateStudent,
    deleteStudent,
    addProject,
    updateProject,
    deleteProject,
    incrementViews,
    toggleLike
  }
})

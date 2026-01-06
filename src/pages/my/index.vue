<template>
  <StudentLayout>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h5 mb-4">欢迎回来，{{ studentName }}</h1>
      </v-col>
    </v-row>

    <v-row>
      <!-- 统计卡片 -->
      <v-col cols="12" sm="6" md="3">
        <v-card color="primary" variant="flat">
          <v-card-text class="d-flex align-center">
            <v-icon size="48" class="mr-4">mdi-folder-multiple</v-icon>
            <div>
              <div class="text-h4">{{ stats.total }}</div>
              <div class="text-body-2">全部作品</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card color="success" variant="flat">
          <v-card-text class="d-flex align-center">
            <v-icon size="48" class="mr-4">mdi-check-circle</v-icon>
            <div>
              <div class="text-h4">{{ stats.approved }}</div>
              <div class="text-body-2">已通过</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card color="warning" variant="flat">
          <v-card-text class="d-flex align-center">
            <v-icon size="48" class="mr-4">mdi-clock-outline</v-icon>
            <div>
              <div class="text-h4">{{ stats.pending }}</div>
              <div class="text-body-2">待审核</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card color="error" variant="flat">
          <v-card-text class="d-flex align-center">
            <v-icon size="48" class="mr-4">mdi-close-circle</v-icon>
            <div>
              <div class="text-h4">{{ stats.rejected }}</div>
              <div class="text-body-2">被拒绝</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 快捷操作 -->
    <v-row class="mt-4">
      <v-col cols="12">
        <h2 class="text-h6 mb-3">快捷操作</h2>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card to="/my/upload" hover>
          <v-card-text class="text-center py-6">
            <v-icon size="48" color="primary" class="mb-2">mdi-upload</v-icon>
            <div class="text-h6">上传新作品</div>
            <div class="text-grey">分享你的 Scratch 创作</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card to="/my/projects" hover>
          <v-card-text class="text-center py-6">
            <v-icon size="48" color="success" class="mb-2">mdi-folder-open</v-icon>
            <div class="text-h6">管理作品</div>
            <div class="text-grey">查看和编辑你的作品</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card to="/my/profile" hover>
          <v-card-text class="text-center py-6">
            <v-icon size="48" color="info" class="mb-2">mdi-account-edit</v-icon>
            <div class="text-h6">个人资料</div>
            <div class="text-grey">更新你的信息</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 最近作品 -->
    <v-row class="mt-4" v-if="recentProjects.length > 0">
      <v-col cols="12">
        <div class="d-flex justify-space-between align-center mb-3">
          <h2 class="text-h6">最近作品</h2>
          <v-btn to="/my/projects" variant="text" size="small">
            查看全部
            <v-icon end>mdi-arrow-right</v-icon>
          </v-btn>
        </div>
      </v-col>
      <v-col
        v-for="project in recentProjects"
        :key="project.id"
        cols="12"
        sm="6"
        md="4"
      >
        <v-card>
          <v-img
            :src="getFileUrl(project.thumbnail)"
            height="140"
            cover
            class="bg-grey-lighten-3"
          >
            <template v-slot:placeholder>
              <div class="d-flex align-center justify-center fill-height">
                <v-icon size="48" color="grey-lighten-1">mdi-image</v-icon>
              </div>
            </template>
            <template v-slot:error>
              <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                <v-icon size="48" color="grey-lighten-1">mdi-image</v-icon>
              </div>
            </template>
            <v-chip
              :color="getStatusColor(project.status)"
              size="small"
              class="ma-2"
            >
              {{ getStatusText(project.status) }}
            </v-chip>
          </v-img>
          <v-card-title class="text-body-1">{{ project.title }}</v-card-title>
          <v-card-subtitle>
            {{ formatDate(project.createdAt) }}
          </v-card-subtitle>
        </v-card>
      </v-col>
    </v-row>

    <!-- 加载状态 -->
    <div v-if="loading" class="d-flex justify-center py-8">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api, getFileUrl } from '@/utils/api'
import StudentLayout from '@/layouts/StudentLayout.vue'

const authStore = useAuthStore()
const loading = ref(false)
const projects = ref([])
const student = ref(null)

const studentName = computed(() => {
  return student.value?.name || authStore.user?.displayName || '同学'
})

const stats = computed(() => {
  return {
    total: projects.value.length,
    approved: projects.value.filter(p => p.status === 'approved').length,
    pending: projects.value.filter(p => p.status === 'pending').length,
    rejected: projects.value.filter(p => p.status === 'rejected').length
  }
})

const recentProjects = computed(() => {
  return projects.value.slice(0, 3)
})

function getStatusColor(status) {
  switch (status) {
    case 'approved': return 'success'
    case 'pending': return 'warning'
    case 'rejected': return 'error'
    default: return 'grey'
  }
}

function getStatusText(status) {
  switch (status) {
    case 'approved': return '已通过'
    case 'pending': return '待审核'
    case 'rejected': return '被拒绝'
    default: return '未知'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

async function loadData() {
  loading.value = true
  try {
    projects.value = await api.projects.getMy()

    if (authStore.studentId) {
      student.value = await api.students.getById(authStore.studentId)
    }
  } catch (error) {
    console.error('加载数据失败:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

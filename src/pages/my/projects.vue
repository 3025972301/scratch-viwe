<template>
  <StudentLayout>
    <v-row>
      <v-col>
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h5">我的作品</h1>
          <v-btn color="primary" to="/my/upload">
            <v-icon start>mdi-plus</v-icon>
            上传新作品
          </v-btn>
        </div>

        <!-- 筛选标签 -->
        <v-chip-group v-model="statusFilter" class="mb-4">
          <v-chip filter value="all">全部 ({{ projects.length }})</v-chip>
          <v-chip filter value="approved" color="success">
            已通过 ({{ approvedCount }})
          </v-chip>
          <v-chip filter value="pending" color="warning">
            待审核 ({{ pendingCount }})
          </v-chip>
          <v-chip filter value="rejected" color="error">
            被拒绝 ({{ rejectedCount }})
          </v-chip>
        </v-chip-group>

        <!-- 空状态 -->
        <v-card v-if="filteredProjects.length === 0 && !loading">
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="grey" class="mb-4">mdi-folder-open-outline</v-icon>
            <div class="text-h6">暂无作品</div>
            <div class="text-grey mb-4">快去上传你的第一个作品吧！</div>
            <v-btn color="primary" to="/my/upload">
              <v-icon start>mdi-upload</v-icon>
              上传作品
            </v-btn>
          </v-card-text>
        </v-card>

        <!-- 作品列表 -->
        <v-row v-else>
          <v-col
            v-for="project in filteredProjects"
            :key="project.id"
            cols="12"
            sm="6"
            md="4"
          >
            <v-card class="h-100 d-flex flex-column">
              <v-img
                :src="getFileUrl(project.thumbnail)"
                height="160"
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

              <v-card-title>{{ project.title }}</v-card-title>

              <v-card-subtitle>
                <v-icon size="small" start>mdi-clock</v-icon>
                {{ formatDate(project.createdAt) }}
                <span class="mx-2">|</span>
                <v-icon size="small" start>mdi-eye</v-icon>
                {{ project.views || 0 }}
                <v-icon size="small" class="ml-2" start>mdi-heart</v-icon>
                {{ project.likes || 0 }}
              </v-card-subtitle>

              <v-card-text class="flex-grow-1">
                <div class="description-text text-grey-darken-1">
                  {{ project.description || '暂无描述' }}
                </div>

                <!-- 拒绝原因 -->
                <v-alert
                  v-if="project.status === 'rejected' && project.rejectReason"
                  type="error"
                  density="compact"
                  variant="tonal"
                  class="mt-3"
                >
                  <div class="text-caption font-weight-bold">拒绝原因：</div>
                  {{ project.rejectReason }}
                </v-alert>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-btn
                  v-if="project.status === 'approved'"
                  variant="text"
                  size="small"
                  :to="`/project/${project.id}`"
                >
                  <v-icon start>mdi-eye</v-icon>
                  查看
                </v-btn>
                <v-btn
                  variant="text"
                  size="small"
                  @click="openEditDialog(project)"
                >
                  <v-icon start>mdi-pencil</v-icon>
                  编辑
                </v-btn>
                <v-spacer></v-spacer>
                <v-btn
                  icon
                  size="small"
                  variant="text"
                  color="error"
                  @click="confirmDelete(project)"
                >
                  <v-icon>mdi-delete</v-icon>
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>

        <!-- 加载状态 -->
        <div v-if="loading" class="d-flex justify-center py-8">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
        </div>
      </v-col>
    </v-row>

    <!-- 编辑对话框 -->
    <v-dialog v-model="editDialog" max-width="600" scrollable>
      <v-card>
        <v-card-title>编辑作品</v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-form ref="formRef">
            <v-text-field
              v-model="form.title"
              label="作品标题"
              :rules="[v => !!v || '标题不能为空']"
              required
            ></v-text-field>

            <v-textarea
              v-model="form.description"
              label="作品描述"
              rows="3"
            ></v-textarea>

            <v-textarea
              v-model="form.instructions"
              label="操作说明"
              rows="2"
              placeholder="如：使用方向键移动，空格键跳跃"
            ></v-textarea>

            <v-switch
              v-model="form.allowDownload"
              label="允许下载 sb3 文件"
              color="primary"
            ></v-switch>

            <v-alert
              v-if="editingProject?.status === 'approved'"
              type="warning"
              density="compact"
              variant="tonal"
              class="mt-2"
            >
              修改已通过的作品后需要重新审核
            </v-alert>
          </v-form>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="editDialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="saveProject" :loading="saving">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title>确认删除</v-card-title>
        <v-card-text>
          确定要删除作品 "<strong>{{ deletingProject?.title }}</strong>" 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="deleteProject" :loading="deleting">
            删除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { api, getFileUrl } from '@/utils/api'
import StudentLayout from '@/layouts/StudentLayout.vue'

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const projects = ref([])
const statusFilter = ref('all')

const editDialog = ref(false)
const editingProject = ref(null)
const formRef = ref(null)
const form = ref({
  title: '',
  description: '',
  instructions: '',
  allowDownload: true
})

const deleteDialog = ref(false)
const deletingProject = ref(null)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const approvedCount = computed(() => projects.value.filter(p => p.status === 'approved').length)
const pendingCount = computed(() => projects.value.filter(p => p.status === 'pending').length)
const rejectedCount = computed(() => projects.value.filter(p => p.status === 'rejected').length)

const filteredProjects = computed(() => {
  if (statusFilter.value === 'all') return projects.value
  return projects.value.filter(p => p.status === statusFilter.value)
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
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    loading.value = false
  }
}

function openEditDialog(project) {
  editingProject.value = project
  form.value = {
    title: project.title,
    description: project.description || '',
    instructions: project.instructions || '',
    allowDownload: project.allowDownload !== false
  }
  editDialog.value = true
}

async function saveProject() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    await api.projects.update(editingProject.value.id, {
      title: form.value.title,
      description: form.value.description,
      instructions: form.value.instructions,
      allowDownload: form.value.allowDownload
    })
    showMessage('作品已更新')
    editDialog.value = false
    await loadData()
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    saving.value = false
  }
}

function confirmDelete(project) {
  deletingProject.value = project
  deleteDialog.value = true
}

async function deleteProject() {
  deleting.value = true
  try {
    await api.projects.delete(deletingProject.value.id)
    showMessage('作品已删除')
    deleteDialog.value = false
    await loadData()
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    deleting.value = false
  }
}

function showMessage(text, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.description-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>

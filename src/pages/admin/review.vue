<template>
  <AdminLayout>
    <v-row>
      <v-col>
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h5">作品审核</h1>
          <v-chip :color="pendingProjects.length > 0 ? 'warning' : 'success'">
            {{ pendingProjects.length }} 个待审核
          </v-chip>
        </div>

        <v-card v-if="pendingProjects.length === 0 && !loading">
          <v-card-text class="text-center py-8">
            <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
            <div class="text-h6">没有待审核的作品</div>
            <div class="text-grey">所有作品都已审核完成</div>
          </v-card-text>
        </v-card>

        <v-row v-else>
          <v-col
            v-for="project in pendingProjects"
            :key="project.id"
            cols="12"
            md="6"
            lg="4"
          >
            <v-card class="h-100 d-flex flex-column">
              <v-img
                :src="getFileUrl(project.thumbnail)"
                height="180"
                cover
                class="bg-grey-lighten-3"
              >
                <template v-slot:placeholder>
                  <div class="d-flex align-center justify-center fill-height">
                    <v-icon size="64" color="grey-lighten-1">mdi-image</v-icon>
                  </div>
                </template>
                <template v-slot:error>
                  <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                    <v-icon size="64" color="grey-lighten-1">mdi-image</v-icon>
                  </div>
                </template>
              </v-img>

              <v-card-title class="pb-1">{{ project.title }}</v-card-title>

              <v-card-subtitle>
                <v-icon size="small" start>mdi-account</v-icon>
                {{ getStudentName(project.studentId) }}
                <span class="mx-2">|</span>
                <v-icon size="small" start>mdi-clock</v-icon>
                {{ formatDate(project.createdAt) }}
              </v-card-subtitle>

              <v-card-text class="flex-grow-1">
                <div class="text-body-2 text-grey-darken-1 description-text">
                  {{ project.description || '暂无描述' }}
                </div>

                <div class="mt-3" v-if="project.instructions">
                  <div class="text-caption text-grey">操作说明：</div>
                  <div class="text-body-2">{{ project.instructions }}</div>
                </div>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-btn
                  variant="text"
                  size="small"
                  @click="previewProject(project)"
                >
                  <v-icon start>mdi-eye</v-icon>
                  预览
                </v-btn>

                <v-spacer></v-spacer>

                <v-btn
                  color="error"
                  variant="text"
                  size="small"
                  @click="openRejectDialog(project)"
                >
                  <v-icon start>mdi-close</v-icon>
                  拒绝
                </v-btn>

                <v-btn
                  color="success"
                  variant="flat"
                  size="small"
                  @click="approveProject(project)"
                  :loading="reviewingId === project.id"
                >
                  <v-icon start>mdi-check</v-icon>
                  通过
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

    <!-- 拒绝原因对话框 -->
    <v-dialog v-model="rejectDialog" max-width="500">
      <v-card>
        <v-card-title>拒绝作品</v-card-title>
        <v-card-text>
          <div class="mb-4">
            确定要拒绝作品 "<strong>{{ rejectingProject?.title }}</strong>" 吗？
          </div>
          <v-textarea
            v-model="rejectReason"
            label="拒绝原因（可选）"
            placeholder="请输入拒绝原因，方便学生了解需要修改的地方"
            rows="3"
            variant="outlined"
          ></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="rejectDialog = false">取消</v-btn>
          <v-btn
            color="error"
            variant="flat"
            @click="rejectProject"
            :loading="reviewingId === rejectingProject?.id"
          >
            确认拒绝
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 预览对话框 -->
    <v-dialog v-model="previewDialog" max-width="900" scrollable>
      <v-card v-if="previewingProject">
        <v-card-title class="d-flex align-center">
          <span>{{ previewingProject.title }}</span>
          <v-spacer></v-spacer>
          <v-btn icon variant="text" @click="previewDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text class="pa-0">
          <div v-if="previewingProject.sb3File" class="scratch-preview">
            <ScratchPlayer
              :sb3-url="previewingProject.sb3File"
              :project-name="previewingProject.title"
              :allow-download="previewingProject.allowDownload"
            />
          </div>
          <div v-else-if="previewingProject.scratchUrl" class="scratch-preview">
            <iframe
              :src="previewingProject.scratchUrl.replace('/projects/', '/embed/').replace(/\/$/, '')"
              width="100%"
              height="450"
              frameborder="0"
              allowfullscreen
            ></iframe>
          </div>
          <div v-else class="pa-8 text-center">
            <v-icon size="64" color="grey">mdi-file-question</v-icon>
            <div class="text-grey mt-2">该作品没有可预览的内容</div>
          </div>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-text>
          <v-row>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">作者</div>
              <div>{{ getStudentName(previewingProject.studentId) }}</div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-caption text-grey">提交时间</div>
              <div>{{ formatDate(previewingProject.createdAt) }}</div>
            </v-col>
            <v-col cols="12" v-if="previewingProject.description">
              <div class="text-caption text-grey">描述</div>
              <div>{{ previewingProject.description }}</div>
            </v-col>
            <v-col cols="12" v-if="previewingProject.instructions">
              <div class="text-caption text-grey">操作说明</div>
              <div>{{ previewingProject.instructions }}</div>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="error"
            variant="text"
            @click="previewDialog = false; openRejectDialog(previewingProject)"
          >
            <v-icon start>mdi-close</v-icon>
            拒绝
          </v-btn>
          <v-btn
            color="success"
            variant="flat"
            @click="approveProject(previewingProject); previewDialog = false"
            :loading="reviewingId === previewingProject.id"
          >
            <v-icon start>mdi-check</v-icon>
            通过
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { api, getFileUrl } from '@/utils/api'
import AdminLayout from '@/layouts/AdminLayout.vue'
import ScratchPlayer from '@/components/ScratchPlayer.vue'

const loading = ref(false)
const pendingProjects = ref([])
const students = ref([])
const reviewingId = ref(null)

const rejectDialog = ref(false)
const rejectingProject = ref(null)
const rejectReason = ref('')

const previewDialog = ref(false)
const previewingProject = ref(null)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

async function loadData() {
  loading.value = true
  try {
    const [projectsData, studentsData] = await Promise.all([
      api.projects.getPending(),
      api.students.getAll()
    ])
    pendingProjects.value = projectsData
    students.value = studentsData
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    loading.value = false
  }
}

function getStudentName(studentId) {
  const student = students.value.find(s => s.id === studentId)
  return student?.name || '未知学生'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

function previewProject(project) {
  previewingProject.value = project
  previewDialog.value = true
}

function openRejectDialog(project) {
  rejectingProject.value = project
  rejectReason.value = ''
  rejectDialog.value = true
}

async function approveProject(project) {
  reviewingId.value = project.id
  try {
    await api.projects.review(project.id, 'approve')
    showMessage('作品已通过审核')
    pendingProjects.value = pendingProjects.value.filter(p => p.id !== project.id)
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    reviewingId.value = null
  }
}

async function rejectProject() {
  if (!rejectingProject.value) return

  reviewingId.value = rejectingProject.value.id
  try {
    await api.projects.review(rejectingProject.value.id, 'reject', rejectReason.value)
    showMessage('作品已拒绝')
    pendingProjects.value = pendingProjects.value.filter(p => p.id !== rejectingProject.value.id)
    rejectDialog.value = false
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    reviewingId.value = null
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
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.scratch-preview iframe {
  display: block;
}
</style>

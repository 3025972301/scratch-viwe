<template>
  <AdminLayout>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">
        <v-icon class="mr-2">mdi-folder-multiple</v-icon>
        作品管理
      </h1>
      <v-spacer></v-spacer>
      <v-btn color="primary" to="/admin/upload">
        <v-icon start>mdi-plus</v-icon>
        上传新作品
      </v-btn>
    </div>

    <!-- 作品列表 -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="store.projects"
        :search="search"
        class="elevation-0"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="搜索作品"
              single-line
              hide-details
              variant="outlined"
              density="compact"
              class="mx-4"
              style="max-width: 300px"
            ></v-text-field>
          </v-toolbar>
        </template>

        <template v-slot:item.thumbnail="{ item }">
          <v-avatar size="50" rounded="lg">
            <v-img v-if="item.thumbnail" :src="getFileUrl(item.thumbnail)"></v-img>
            <v-icon v-else>mdi-image</v-icon>
          </v-avatar>
        </template>

        <template v-slot:item.student="{ item }">
          {{ getStudentName(item.studentId) }}
        </template>

        <template v-slot:item.award="{ item }">
          <v-chip v-if="item.award" size="small" color="warning">
            {{ item.award }}
          </v-chip>
          <span v-else class="text-grey">-</span>
        </template>

        <template v-slot:item.allowDownload="{ item }">
          <v-icon :color="item.allowDownload !== false ? 'success' : 'grey'">
            {{ item.allowDownload !== false ? 'mdi-check-circle' : 'mdi-close-circle' }}
          </v-icon>
        </template>

        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon size="small" variant="text" :to="`/project/${item.id}`">
            <v-icon>mdi-eye</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" @click="openEditDialog(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 编辑对话框 -->
    <v-dialog v-model="dialog" max-width="600">
      <v-card>
        <v-card-title>编辑作品</v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-select
              v-model="formData.studentId"
              :items="studentOptions"
              label="学生"
              :rules="[v => !!v || '请选择学生']"
              required
            ></v-select>

            <v-text-field
              v-model="formData.title"
              label="作品标题"
              :rules="[v => !!v || '标题不能为空']"
              required
            ></v-text-field>

            <v-textarea
              v-model="formData.description"
              label="作品描述"
              rows="3"
            ></v-textarea>

            <v-textarea
              v-model="formData.instructions"
              label="操作说明"
              rows="3"
            ></v-textarea>

            <v-text-field
              v-model="formData.scratchUrl"
              label="Scratch 嵌入链接"
            ></v-text-field>

            <v-select
              v-model="formData.award"
              :items="awardOptions"
              label="获奖情况"
              clearable
            ></v-select>

            <v-switch
              v-model="formData.allowDownload"
              label="允许下载源文件"
              color="primary"
              hint="关闭后用户将无法下载 .sb3 源文件"
              persistent-hint
            ></v-switch>

            <v-file-input
              v-model="thumbnailFile"
              label="更换缩略图"
              accept="image/*"
              prepend-icon="mdi-image"
              @update:model-value="handleThumbnailUpload"
            ></v-file-input>

            <v-img
              v-if="thumbnailPreview || formData.thumbnail"
              :src="thumbnailPreview || getFileUrl(formData.thumbnail)"
              max-height="100"
              max-width="150"
              class="mt-2 rounded"
            ></v-img>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialog = false" :disabled="saving">取消</v-btn>
          <v-btn color="primary" @click="saveProject" :disabled="!formValid || saving" :loading="saving">
            保存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 删除确认对话框 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">
          <v-icon start color="error">mdi-alert</v-icon>
          确认删除
        </v-card-title>
        <v-card-text>
          确定要删除作品 <strong>{{ projectToDelete?.title }}</strong> 吗？
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteProject">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { api, getFileUrl } from '@/utils/api'
import AdminLayout from '@/layouts/AdminLayout.vue'

const store = useAppStore()

const search = ref('')
const dialog = ref(false)
const deleteDialog = ref(false)
const formValid = ref(false)
const form = ref(null)
const thumbnailFile = ref(null)
const thumbnailPreview = ref('')
const projectToDelete = ref(null)
const saving = ref(false)

const formData = ref({
  id: '',
  studentId: null,
  title: '',
  description: '',
  instructions: '',
  scratchUrl: '',
  thumbnail: '',
  award: null,
  allowDownload: true
})

const awardOptions = [
  '一等奖',
  '二等奖',
  '三等奖',
  '优秀奖',
  '最佳创意奖',
  '最佳技术奖'
]

const headers = [
  { title: '缩略图', key: 'thumbnail', sortable: false },
  { title: '作品名称', key: 'title' },
  { title: '作者', key: 'student' },
  { title: '奖项', key: 'award' },
  { title: '下载', key: 'allowDownload', sortable: false },
  { title: '浏览量', key: 'views' },
  { title: '点赞', key: 'likes' },
  { title: '上传时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

const studentOptions = computed(() => {
  return store.students.map(s => ({
    title: s.name,
    value: s.id
  }))
})

function getStudentName(studentId) {
  const student = store.getStudentById(studentId)
  return student ? student.name : '未知'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function openEditDialog(project) {
  formData.value = { ...project }
  thumbnailFile.value = null
  thumbnailPreview.value = ''
  dialog.value = true
}

function handleThumbnailUpload(file) {
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      thumbnailPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else {
    thumbnailPreview.value = ''
  }
}

async function saveProject() {
  saving.value = true
  try {
    const projectData = { ...formData.value }

    // 如果有新上传的缩略图，先上传
    if (thumbnailFile.value) {
      const result = await api.upload.thumbnail(thumbnailFile.value)
      projectData.thumbnail = result.url
    }

    await store.updateProject(projectData.id, projectData)
    dialog.value = false
  } catch (error) {
    console.error('保存作品失败:', error)
  } finally {
    saving.value = false
  }
}

function confirmDelete(project) {
  projectToDelete.value = project
  deleteDialog.value = true
}

function deleteProject() {
  if (projectToDelete.value) {
    store.deleteProject(projectToDelete.value.id)
    projectToDelete.value = null
    deleteDialog.value = false
  }
}

onMounted(() => {
  store.loadData()
})
</script>

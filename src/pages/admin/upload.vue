<template>
  <AdminLayout>
    <h1 class="text-h4 font-weight-bold mb-6">
      <v-icon class="mr-2">mdi-upload</v-icon>
      上传作品
    </h1>

    <v-row>
      <v-col cols="12" md="8">
        <v-card>
          <v-card-text>
            <v-form ref="form" v-model="formValid">
              <!-- 选择学生 -->
              <v-select
                v-model="formData.studentId"
                :items="studentOptions"
                label="选择学生"
                :rules="[v => !!v || '请选择学生']"
                prepend-inner-icon="mdi-account"
                required
              ></v-select>

              <!-- 作品标题 -->
              <v-text-field
                v-model="formData.title"
                label="作品标题"
                :rules="[v => !!v || '标题不能为空']"
                prepend-inner-icon="mdi-format-title"
                required
              ></v-text-field>

              <!-- 作品描述 -->
              <v-textarea
                v-model="formData.description"
                label="作品描述"
                rows="3"
                prepend-inner-icon="mdi-text"
                placeholder="介绍一下这个作品..."
              ></v-textarea>

              <!-- 操作说明 -->
              <v-textarea
                v-model="formData.instructions"
                label="操作说明"
                rows="3"
                prepend-inner-icon="mdi-keyboard"
                placeholder="如何操作这个作品？例如：使用方向键控制..."
              ></v-textarea>

              <!-- 上传方式选择 -->
              <v-radio-group v-model="uploadType" inline class="mb-4">
                <v-radio label="Scratch 在线链接" value="url"></v-radio>
                <v-radio label="上传 .sb3 文件" value="file"></v-radio>
              </v-radio-group>

              <!-- Scratch URL -->
              <v-text-field
                v-if="uploadType === 'url'"
                v-model="formData.scratchUrl"
                label="Scratch 项目嵌入链接"
                prepend-inner-icon="mdi-link"
                placeholder="https://scratch.mit.edu/projects/xxxx/embed"
                hint="从 Scratch 网站获取嵌入链接"
                persistent-hint
              ></v-text-field>

              <!-- 上传 sb3 文件 -->
              <v-file-input
                v-if="uploadType === 'file'"
                v-model="sb3File"
                label="选择 .sb3 文件"
                accept=".sb3"
                prepend-icon="mdi-file-code"
              ></v-file-input>

              <!-- 上传缩略图 -->
              <v-file-input
                v-model="thumbnailFile"
                label="作品缩略图"
                accept="image/*"
                prepend-icon="mdi-image"
                @update:model-value="handleThumbnailChange"
              ></v-file-input>

              <v-img
                v-if="thumbnailPreview"
                :src="thumbnailPreview"
                max-height="150"
                max-width="200"
                class="mt-2 mb-4 rounded"
              ></v-img>

              <!-- 奖项 -->
              <v-select
                v-model="formData.award"
                :items="awardOptions"
                label="获奖情况（可选）"
                prepend-inner-icon="mdi-trophy"
                clearable
              ></v-select>

              <!-- 下载权限 -->
              <v-switch
                v-model="formData.allowDownload"
                label="允许下载源文件"
                color="primary"
                hint="关闭后用户将无法下载 .sb3 源文件"
                persistent-hint
              ></v-switch>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="resetForm">重置</v-btn>
            <v-btn color="primary" @click="submitProject" :disabled="!formValid" :loading="submitting">
              <v-icon start>mdi-upload</v-icon>
              上传作品
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-help-circle</v-icon>
            上传帮助
          </v-card-title>
          <v-card-text>
            <h4 class="mb-2">如何获取 Scratch 嵌入链接？</h4>
            <ol class="mb-4">
              <li>打开 Scratch 官网上的项目页面</li>
              <li>点击"复制链接"按钮</li>
              <li>在链接末尾添加 <code>/embed</code></li>
            </ol>

            <v-alert type="info" variant="tonal" density="compact">
              <strong>示例格式：</strong><br>
              <code class="text-caption">https://scratch.mit.edu/projects/123456/embed</code>
            </v-alert>

            <v-divider class="my-4"></v-divider>

            <h4 class="mb-2">关于 .sb3 文件</h4>
            <p class="text-body-2">
              .sb3 是 Scratch 3.0 的项目文件格式。
              可以从 Scratch 编辑器中通过"文件 > 保存到电脑"导出。
            </p>
          </v-card-text>
        </v-card>

        <v-card class="mt-4" v-if="store.students.length === 0">
          <v-card-text class="text-center">
            <v-icon size="48" color="warning" class="mb-2">mdi-alert</v-icon>
            <p>还没有添加学生</p>
            <v-btn color="primary" to="/admin/students" size="small">
              先添加学生
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 成功提示 -->
    <v-snackbar v-model="snackbar" color="success" timeout="3000">
      作品上传成功！
      <template v-slot:actions>
        <v-btn variant="text" @click="snackbar = false">关闭</v-btn>
      </template>
    </v-snackbar>

    <!-- 错误提示 -->
    <v-snackbar v-model="errorSnackbar" color="error" timeout="5000">
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="errorSnackbar = false">关闭</v-btn>
      </template>
    </v-snackbar>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { api } from '@/utils/api'
import AdminLayout from '@/layouts/AdminLayout.vue'

const store = useAppStore()

const form = ref(null)
const formValid = ref(false)
const submitting = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')
const snackbar = ref(false)
const uploadType = ref('url')
const sb3File = ref(null)
const thumbnailFile = ref(null)
const thumbnailPreview = ref('')

const formData = ref({
  studentId: null,
  title: '',
  description: '',
  instructions: '',
  scratchUrl: '',
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

const studentOptions = computed(() => {
  return store.students.map(s => ({
    title: s.name + (s.grade ? ` (${s.grade})` : ''),
    value: s.id
  }))
})

function handleThumbnailChange(file) {
  if (file) {
    // 预览图片
    const reader = new FileReader()
    reader.onload = (e) => {
      thumbnailPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else {
    thumbnailPreview.value = ''
  }
}

function resetForm() {
  formData.value = {
    studentId: null,
    title: '',
    description: '',
    instructions: '',
    scratchUrl: '',
    award: null,
    allowDownload: true
  }
  sb3File.value = null
  thumbnailFile.value = null
  thumbnailPreview.value = ''
  uploadType.value = 'url'
}

async function submitProject() {
  submitting.value = true

  try {
    const projectData = {
      studentId: formData.value.studentId,
      title: formData.value.title,
      description: formData.value.description,
      instructions: formData.value.instructions,
      award: formData.value.award,
      allowDownload: formData.value.allowDownload
    }

    // 上传缩略图
    if (thumbnailFile.value) {
      const thumbnailResult = await api.upload.thumbnail(thumbnailFile.value)
      projectData.thumbnail = thumbnailResult.url
    }

    // 上传 sb3 文件或使用 URL
    if (uploadType.value === 'url') {
      projectData.scratchUrl = formData.value.scratchUrl
    } else if (sb3File.value) {
      const sb3Result = await api.upload.sb3File(sb3File.value)
      projectData.sb3File = sb3Result.url
    }

    await store.addProject(projectData)
    snackbar.value = true
    resetForm()
  } catch (error) {
    console.error('上传失败:', error)
    errorMessage.value = error.message || '上传失败，请重试'
    errorSnackbar.value = true
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  store.loadData()
})
</script>

<template>
  <StudentLayout>
    <h1 class="text-h5 mb-4">
      <v-icon class="mr-2">mdi-upload</v-icon>
      上传作品
    </h1>

    <v-row>
      <v-col cols="12" md="8">
        <v-alert type="info" variant="tonal" class="mb-4">

          上传的作品需要管理员审核后才会公开显示
        </v-alert>

        <v-card>
          <v-card-text>
            <v-form ref="formRef" v-model="formValid">
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

              <!-- 下载权限 -->
              <v-switch
                v-model="formData.allowDownload"
                label="允许下载源文件"
                color="primary"
                hint="关闭后其他用户将无法下载 .sb3 源文件"
                persistent-hint
              ></v-switch>
            </v-form>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="resetForm">重置</v-btn>
            <v-btn color="primary" @click="submitProject" :disabled="!formValid" :loading="submitting">
              <v-icon start>mdi-upload</v-icon>
              提交作品
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

            <v-divider class="my-4"></v-divider>

            <h4 class="mb-2">审核流程</h4>
            <p class="text-body-2">
              提交后作品将进入审核队列，管理员审核通过后会在首页展示。
              你可以在"我的作品"页面查看审核状态。
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 成功提示 -->
    <v-snackbar v-model="successSnackbar" color="success" timeout="3000">
      作品提交成功，等待管理员审核！
    </v-snackbar>

    <!-- 错误提示 -->
    <v-snackbar v-model="errorSnackbar" color="error" timeout="5000">
      {{ errorMessage }}
    </v-snackbar>
  </StudentLayout>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '@/utils/api'
import StudentLayout from '@/layouts/StudentLayout.vue'

const router = useRouter()

const formRef = ref(null)
const formValid = ref(false)
const submitting = ref(false)
const successSnackbar = ref(false)
const errorSnackbar = ref(false)
const errorMessage = ref('')
const uploadType = ref('url')
const sb3File = ref(null)
const thumbnailFile = ref(null)
const thumbnailPreview = ref('')

const formData = ref({
  title: '',
  description: '',
  instructions: '',
  scratchUrl: '',
  allowDownload: true
})

function handleThumbnailChange(file) {
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

function resetForm() {
  formData.value = {
    title: '',
    description: '',
    instructions: '',
    scratchUrl: '',
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
      title: formData.value.title,
      description: formData.value.description,
      instructions: formData.value.instructions,
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

    await api.projects.create(projectData)
    successSnackbar.value = true
    resetForm()

    // 2秒后跳转到我的作品
    setTimeout(() => {
      router.push('/my/projects')
    }, 2000)
  } catch (error) {
    console.error('上传失败:', error)
    errorMessage.value = error.message || '上传失败，请重试'
    errorSnackbar.value = true
  } finally {
    submitting.value = false
  }
}
</script>

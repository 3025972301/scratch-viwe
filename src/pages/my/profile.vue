<template>
  <StudentLayout>
    <v-row>
      <v-col cols="12" md="8" lg="6">
        <h1 class="text-h5 mb-4">个人资料</h1>

        <v-card>
          <v-card-text>
            <v-form ref="profileFormRef">
              <!-- 头像 -->
              <div class="text-center mb-6">
                <v-avatar size="120" class="mb-3">
                  <v-img
                    v-if="form.avatar"
                    :src="getFileUrl(form.avatar)"
                    cover
                  />
                  <v-icon v-else size="64" color="grey">mdi-account</v-icon>
                </v-avatar>
                <div>
                  <v-btn
                    variant="outlined"
                    size="small"
                    @click="$refs.avatarInput.click()"
                    :loading="uploadingAvatar"
                  >
                    <v-icon start>mdi-camera</v-icon>
                    更换头像
                  </v-btn>
                  <input
                    ref="avatarInput"
                    type="file"
                    accept="image/*"
                    style="display: none"
                    @change="uploadAvatar"
                  >
                </div>
              </div>

              <v-text-field
                v-model="form.name"
                label="姓名"
                :rules="[v => !!v || '姓名不能为空']"
                required
              ></v-text-field>

              <v-text-field
                v-model="form.grade"
                label="年级/班级"
                placeholder="例如：三年级一班"
              ></v-text-field>

              <v-textarea
                v-model="form.bio"
                label="个人简介"
                rows="3"
                placeholder="介绍一下自己吧..."
              ></v-textarea>
            </v-form>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="flat" @click="saveProfile" :loading="savingProfile">
              保存资料
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- 修改密码 -->
        <v-card class="mt-4">
          <v-card-title>修改密码</v-card-title>
          <v-card-text>
            <v-form ref="passwordFormRef">
              <v-text-field
                v-model="passwordForm.oldPassword"
                label="当前密码"
                type="password"
                :rules="[v => !!v || '请输入当前密码']"
                required
              ></v-text-field>

              <v-text-field
                v-model="passwordForm.newPassword"
                label="新密码"
                type="password"
                :rules="[
                  v => !!v || '请输入新密码',
                  v => v.length >= 6 || '密码至少6个字符'
                ]"
                required
              ></v-text-field>

              <v-text-field
                v-model="passwordForm.confirmPassword"
                label="确认新密码"
                type="password"
                :rules="[
                  v => !!v || '请确认新密码',
                  v => v === passwordForm.newPassword || '两次密码不一致'
                ]"
                required
              ></v-text-field>
            </v-form>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="flat" @click="changePassword" :loading="changingPassword">
              修改密码
            </v-btn>
          </v-card-actions>
        </v-card>

        <!-- 账号信息 -->
        <v-card class="mt-4">
          <v-card-title>账号信息</v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-account</v-icon>
                </template>
                <v-list-item-title>用户名</v-list-item-title>
                <v-list-item-subtitle>{{ user?.username }}</v-list-item-subtitle>
              </v-list-item>
              <v-list-item>
                <template v-slot:prepend>
                  <v-icon>mdi-shield-account</v-icon>
                </template>
                <v-list-item-title>账号类型</v-list-item-title>
                <v-list-item-subtitle>学生账号</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
      {{ snackbarText }}
    </v-snackbar>
  </StudentLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { api, getFileUrl } from '@/utils/api'
import StudentLayout from '@/layouts/StudentLayout.vue'

const authStore = useAuthStore()
const user = computed(() => authStore.user)

const profileFormRef = ref(null)
const passwordFormRef = ref(null)
const avatarInput = ref(null)

const savingProfile = ref(false)
const changingPassword = ref(false)
const uploadingAvatar = ref(false)

const form = ref({
  name: '',
  grade: '',
  bio: '',
  avatar: ''
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

async function loadProfile() {
  if (!authStore.studentId) return

  try {
    const student = await api.students.getById(authStore.studentId)
    form.value = {
      name: student.name || '',
      grade: student.grade || '',
      bio: student.bio || '',
      avatar: student.avatar || ''
    }
  } catch (error) {
    showMessage(error.message, 'error')
  }
}

async function uploadAvatar(event) {
  const file = event.target.files[0]
  if (!file) return

  uploadingAvatar.value = true
  try {
    const result = await api.upload.avatar(file)
    form.value.avatar = result.url
    showMessage('头像上传成功')
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    uploadingAvatar.value = false
  }
}

async function saveProfile() {
  const { valid } = await profileFormRef.value.validate()
  if (!valid) return

  if (!authStore.studentId) {
    showMessage('未关联学生信息', 'error')
    return
  }

  savingProfile.value = true
  try {
    await api.students.update(authStore.studentId, {
      name: form.value.name,
      grade: form.value.grade,
      bio: form.value.bio,
      avatar: form.value.avatar
    })
    showMessage('资料已保存')
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    savingProfile.value = false
  }
}

async function changePassword() {
  const { valid } = await passwordFormRef.value.validate()
  if (!valid) return

  changingPassword.value = true
  try {
    const result = await authStore.changePassword(
      passwordForm.value.oldPassword,
      passwordForm.value.newPassword
    )

    if (result.success) {
      showMessage('密码修改成功')
      passwordForm.value = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      passwordFormRef.value.reset()
    } else {
      showMessage(result.message || '修改失败', 'error')
    }
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    changingPassword.value = false
  }
}

function showMessage(text, color = 'success') {
  snackbarText.value = text
  snackbarColor.value = color
  snackbar.value = true
}

onMounted(() => {
  loadProfile()
})
</script>

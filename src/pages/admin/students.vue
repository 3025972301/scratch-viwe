<template>
  <AdminLayout>
    <div class="d-flex align-center mb-6">
      <h1 class="text-h4 font-weight-bold">
        <v-icon class="mr-2">mdi-account-group</v-icon>
        学生管理
      </h1>
      <v-spacer></v-spacer>
      <v-btn color="primary" @click="openAddDialog">
        <v-icon start>mdi-plus</v-icon>
        添加学生
      </v-btn>
    </div>

    <!-- 学生列表 -->
    <v-card>
      <v-data-table
        :headers="headers"
        :items="store.students"
        :search="search"
        class="elevation-0"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-text-field
              v-model="search"
              prepend-inner-icon="mdi-magnify"
              label="搜索学生"
              single-line
              hide-details
              variant="outlined"
              density="compact"
              class="mx-4"
              style="max-width: 300px"
            ></v-text-field>
          </v-toolbar>
        </template>

        <template v-slot:item.avatar="{ item }">
          <v-avatar size="40" color="primary">
            <v-img v-if="item.avatar" :src="getFileUrl(item.avatar)"></v-img>
            <span v-else>{{ item.name.charAt(0) }}</span>
          </v-avatar>
        </template>

        <template v-slot:item.projectCount="{ item }">
          <v-chip size="small" color="primary">
            {{ getProjectCount(item.id) }}
          </v-chip>
        </template>

        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>

        <template v-slot:item.actions="{ item }">
          <v-btn icon size="small" variant="text" @click="openEditDialog(item)">
            <v-icon>mdi-pencil</v-icon>
          </v-btn>
          <v-btn icon size="small" variant="text" color="error" @click="confirmDelete(item)">
            <v-icon>mdi-delete</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>

    <!-- 添加/编辑对话框 -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>
          {{ isEditing ? '编辑学生' : '添加学生' }}
        </v-card-title>
        <v-card-text>
          <v-form ref="form" v-model="formValid">
            <v-text-field
              v-model="formData.name"
              label="姓名"
              :rules="[v => !!v || '姓名不能为空']"
              required
            ></v-text-field>

            <v-text-field
              v-model="formData.grade"
              label="年级/班级"
              placeholder="例如: 五年级一班"
            ></v-text-field>

            <v-textarea
              v-model="formData.bio"
              label="个人简介"
              rows="3"
              placeholder="简单介绍一下这位同学..."
            ></v-textarea>

            <v-file-input
              v-model="avatarFile"
              label="头像"
              accept="image/*"
              prepend-icon="mdi-camera"
              @update:model-value="handleAvatarUpload"
            ></v-file-input>

            <v-img
              v-if="avatarPreview || formData.avatar"
              :src="avatarPreview || getFileUrl(formData.avatar)"
              max-height="100"
              max-width="100"
              class="mt-2 rounded"
            ></v-img>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="dialog = false" :disabled="saving">取消</v-btn>
          <v-btn color="primary" @click="saveStudent" :disabled="!formValid || saving" :loading="saving">
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
          确定要删除学生 <strong>{{ studentToDelete?.name }}</strong> 吗？
          <br>
          <span class="text-error">该学生的所有作品也将被删除！</span>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" @click="deleteStudent">删除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { api, getFileUrl } from '@/utils/api'
import AdminLayout from '@/layouts/AdminLayout.vue'

const store = useAppStore()

const search = ref('')
const dialog = ref(false)
const deleteDialog = ref(false)
const isEditing = ref(false)
const formValid = ref(false)
const form = ref(null)
const avatarFile = ref(null)
const avatarPreview = ref('')
const studentToDelete = ref(null)
const saving = ref(false)

const formData = ref({
  name: '',
  grade: '',
  bio: '',
  avatar: ''
})

const headers = [
  { title: '头像', key: 'avatar', sortable: false },
  { title: '姓名', key: 'name' },
  { title: '年级', key: 'grade' },
  { title: '作品数', key: 'projectCount' },
  { title: '添加时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

function getProjectCount(studentId) {
  return store.projects.filter(p => p.studentId === studentId).length
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

function openAddDialog() {
  isEditing.value = false
  formData.value = {
    id: null,
    name: '',
    grade: '',
    bio: '',
    avatar: ''
  }
  avatarFile.value = null
  avatarPreview.value = ''
  dialog.value = true
}

function openEditDialog(student) {
  isEditing.value = true
  formData.value = { ...student }
  avatarFile.value = null
  avatarPreview.value = ''
  dialog.value = true
}

function handleAvatarUpload(file) {
  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      avatarPreview.value = e.target.result
    }
    reader.readAsDataURL(file)
  } else {
    avatarPreview.value = ''
  }
}

async function saveStudent() {
  saving.value = true
  try {
    const studentData = { ...formData.value }

    // 如果有新上传的头像文件，先上传
    if (avatarFile.value) {
      const result = await api.upload.avatar(avatarFile.value)
      studentData.avatar = result.url
    }

    if (isEditing.value && studentData.id) {
      await store.updateStudent(studentData.id, studentData)
    } else {
      // 创建新学生时删除 id 字段
      delete studentData.id
      await store.addStudent(studentData)
    }
    dialog.value = false
  } catch (error) {
    console.error('保存学生失败:', error)
  } finally {
    saving.value = false
  }
}

function confirmDelete(student) {
  studentToDelete.value = student
  deleteDialog.value = true
}

function deleteStudent() {
  if (studentToDelete.value) {
    store.deleteStudent(studentToDelete.value.id)
    studentToDelete.value = null
    deleteDialog.value = false
  }
}

onMounted(() => {
  store.loadData()
})
</script>

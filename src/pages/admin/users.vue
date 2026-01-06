<template>
  <AdminLayout>
    <v-row>
      <v-col>
        <div class="d-flex justify-space-between align-center mb-4">
          <h1 class="text-h5">用户管理</h1>
          <v-btn color="primary" @click="openDialog()">
            <v-icon start>mdi-plus</v-icon>
            添加用户
          </v-btn>
        </div>

        <v-card>
          <v-data-table
            :headers="headers"
            :items="users"
            :loading="loading"
            class="elevation-0"
          >
            <template v-slot:item.role="{ item }">
              <v-chip
                :color="item.role === 'admin' ? 'primary' : 'success'"
                size="small"
              >
                {{ item.role === 'admin' ? '管理员' : '学生' }}
              </v-chip>
            </template>

            <template v-slot:item.studentName="{ item }">
              <span v-if="item.studentName">{{ item.studentName }}</span>
              <span v-else class="text-grey">-</span>
            </template>

            <template v-slot:item.createdAt="{ item }">
              {{ formatDate(item.createdAt) }}
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn icon size="small" variant="text" @click="openDialog(item)">
                <v-icon>mdi-pencil</v-icon>
              </v-btn>
              <v-btn
                icon
                size="small"
                variant="text"
                color="error"
                @click="confirmDelete(item)"
                :disabled="item.id === currentUserId"
              >
                <v-icon>mdi-delete</v-icon>
              </v-btn>
            </template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>

    <!-- 添加/编辑用户对话框 -->
    <v-dialog v-model="dialog" max-width="500">
      <v-card>
        <v-card-title>{{ editingUser ? '编辑用户' : '添加用户' }}</v-card-title>
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="saveUser">
            <v-text-field
              v-model="form.username"
              label="用户名"
              :rules="[v => !!v || '用户名不能为空']"
              required
            ></v-text-field>

            <v-text-field
              v-model="form.password"
              :label="editingUser ? '新密码（留空保持不变）' : '密码'"
              type="password"
              :rules="editingUser ? [] : [v => !!v || '密码不能为空', v => v.length >= 6 || '密码至少6个字符']"
              :required="!editingUser"
            ></v-text-field>

            <v-text-field
              v-model="form.displayName"
              label="显示名称"
            ></v-text-field>

            <v-select
              v-model="form.role"
              label="角色"
              :items="[
                { title: '管理员', value: 'admin' },
                { title: '学生', value: 'student' }
              ]"
              :rules="[v => !!v || '请选择角色']"
              required
            ></v-select>

            <v-select
              v-if="form.role === 'student'"
              v-model="form.studentId"
              label="关联学生"
              :items="studentOptions"
              item-title="name"
              item-value="id"
              clearable
            ></v-select>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" variant="flat" @click="saveUser" :loading="saving">
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
          确定要删除用户 "{{ deletingUser?.username }}" 吗？此操作不可撤销。
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">取消</v-btn>
          <v-btn color="error" variant="flat" @click="deleteUser" :loading="deleting">
            删除
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
import { ref, onMounted, computed } from 'vue'
import { api } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import AdminLayout from '@/layouts/AdminLayout.vue'

const authStore = useAuthStore()
const currentUserId = computed(() => String(authStore.user?.id))

const loading = ref(false)
const saving = ref(false)
const deleting = ref(false)
const users = ref([])
const students = ref([])
const dialog = ref(false)
const deleteDialog = ref(false)
const editingUser = ref(null)
const deletingUser = ref(null)
const formRef = ref(null)

const snackbar = ref(false)
const snackbarText = ref('')
const snackbarColor = ref('success')

const headers = [
  { title: '用户名', key: 'username' },
  { title: '显示名称', key: 'displayName' },
  { title: '角色', key: 'role', width: 100 },
  { title: '关联学生', key: 'studentName' },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', sortable: false, width: 100 }
]

const form = ref({
  username: '',
  password: '',
  displayName: '',
  role: 'student',
  studentId: null
})

const studentOptions = computed(() => {
  return students.value.map(s => ({
    id: s.id,
    name: `${s.name}${s.grade ? ' (' + s.grade + ')' : ''}`
  }))
})

async function loadData() {
  loading.value = true
  try {
    const [usersData, studentsData] = await Promise.all([
      api.users.getAll(),
      api.students.getAll()
    ])
    users.value = usersData
    students.value = studentsData
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    loading.value = false
  }
}

function openDialog(user = null) {
  editingUser.value = user
  if (user) {
    form.value = {
      username: user.username,
      password: '',
      displayName: user.displayName,
      role: user.role,
      studentId: user.studentId
    }
  } else {
    form.value = {
      username: '',
      password: '',
      displayName: '',
      role: 'student',
      studentId: null
    }
  }
  dialog.value = true
}

async function saveUser() {
  const { valid } = await formRef.value.validate()
  if (!valid) return

  saving.value = true
  try {
    const data = {
      username: form.value.username,
      displayName: form.value.displayName,
      role: form.value.role,
      studentId: form.value.role === 'student' ? form.value.studentId : null
    }

    if (form.value.password) {
      data.password = form.value.password
    }

    if (editingUser.value) {
      await api.users.update(editingUser.value.id, data)
      showMessage('用户更新成功')
    } else {
      data.password = form.value.password
      await api.users.create(data)
      showMessage('用户添加成功')
    }

    dialog.value = false
    await loadData()
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    saving.value = false
  }
}

function confirmDelete(user) {
  deletingUser.value = user
  deleteDialog.value = true
}

async function deleteUser() {
  deleting.value = true
  try {
    await api.users.delete(deletingUser.value.id)
    showMessage('用户已删除')
    deleteDialog.value = false
    await loadData()
  } catch (error) {
    showMessage(error.message, 'error')
  } finally {
    deleting.value = false
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
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

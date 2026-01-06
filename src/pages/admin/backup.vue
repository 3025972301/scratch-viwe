<template>
  <AdminLayout>
    <h1 class="text-h4 font-weight-bold mb-6">
      <v-icon class="mr-2">mdi-backup-restore</v-icon>
      数据备份与恢复
    </h1>

    <v-row>
      <!-- 备份数据 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start color="primary">mdi-cloud-download</v-icon>
            导出备份
          </v-card-title>
          <v-card-text>
            <p class="mb-4">将当前所有学生和作品数据导出为 JSON 文件，可用于备份或迁移。</p>
            <v-alert type="info" variant="tonal" density="compact" class="mb-4">
              <strong>当前数据:</strong> {{ store.students.length }} 个学生，{{ store.projects.length }} 个作品
            </v-alert>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="primary"
              variant="elevated"
              :loading="exporting"
              @click="exportData"
            >
              <v-icon start>mdi-download</v-icon>
              导出数据
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- 恢复数据 -->
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start color="success">mdi-cloud-upload</v-icon>
            导入备份
          </v-card-title>
          <v-card-text>
            <p class="mb-4">从 JSON 备份文件恢复数据。</p>
            <v-file-input
              v-model="importFile"
              label="选择备份文件"
              accept=".json"
              prepend-icon="mdi-file-upload"
              @update:model-value="previewImportFile"
            ></v-file-input>

            <v-alert v-if="importPreview" type="success" variant="tonal" density="compact" class="mb-4">
              <strong>文件预览:</strong> {{ importPreview.students }} 个学生，{{ importPreview.projects }} 个作品
              <br>
              <small>导出时间: {{ importPreview.exportedAt }}</small>
            </v-alert>

            <v-switch
              v-model="clearBeforeImport"
              label="导入前清空现有数据"
              color="warning"
              hint="开启后将删除所有现有数据"
              persistent-hint
            ></v-switch>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="success"
              variant="elevated"
              :loading="importing"
              :disabled="!importFile"
              @click="importData"
            >
              <v-icon start>mdi-upload</v-icon>
              导入数据
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <!-- 从 SQLite 导入 -->
      <v-col cols="12">
        <v-card>
          <v-card-title>
            <v-icon start color="orange">mdi-database-import</v-icon>
            从 SQLite 数据库导入
          </v-card-title>
          <v-card-text>
            <p class="mb-4">
              从旧版本的 SQLite 数据库文件 (data.db) 导入数据。
              需要先使用工具将 SQLite 数据库转换为 JSON 格式。
            </p>

            <v-expansion-panels class="mb-4">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  <v-icon start>mdi-help-circle</v-icon>
                  如何从 data.db 导出数据？
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <ol>
                    <li>安装 sqlite3 命令行工具或使用 DB Browser for SQLite</li>
                    <li>运行以下命令导出数据：</li>
                  </ol>
                  <v-code class="my-2 pa-2 d-block">
sqlite3 data.db "SELECT json_group_array(json_object('id',id,'name',name,'grade',grade,'bio',bio,'avatar',avatar,'created_at',created_at)) FROM students" > students.json

sqlite3 data.db "SELECT json_group_array(json_object('id',id,'student_id',student_id,'title',title,'description',description,'instructions',instructions,'scratch_url',scratch_url,'sb3_file',sb3_file,'thumbnail',thumbnail,'award',award,'allow_download',allow_download,'views',views,'likes',likes,'created_at',created_at)) FROM projects" > projects.json
                  </v-code>
                  <p class="mt-2">或者直接粘贴 JSON 数据到下方输入框。</p>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>

            <v-textarea
              v-model="sqliteStudentsJson"
              label="学生数据 (JSON 数组)"
              rows="4"
              placeholder='[{"id":1,"name":"张三","grade":"五年级",...}]'
              variant="outlined"
            ></v-textarea>

            <v-textarea
              v-model="sqliteProjectsJson"
              label="作品数据 (JSON 数组)"
              rows="4"
              placeholder='[{"id":1,"student_id":1,"title":"我的作品",...}]'
              variant="outlined"
              class="mt-4"
            ></v-textarea>

            <v-switch
              v-model="clearBeforeSqliteImport"
              label="导入前清空现有数据"
              color="warning"
              hint="开启后将删除所有现有数据"
              persistent-hint
            ></v-switch>
          </v-card-text>
          <v-card-actions>
            <v-btn
              color="orange"
              variant="elevated"
              :loading="importingSqlite"
              :disabled="!sqliteStudentsJson || !sqliteProjectsJson"
              @click="importFromSqlite"
            >
              <v-icon start>mdi-database-import</v-icon>
              从 SQLite 导入
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <!-- 成功提示 -->
    <v-snackbar v-model="successSnackbar" color="success" timeout="3000">
      {{ successMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="successSnackbar = false">关闭</v-btn>
      </template>
    </v-snackbar>

    <!-- 错误提示 -->
    <v-snackbar v-model="errorSnackbar" color="error" timeout="5000">
      {{ errorMessage }}
      <template v-slot:actions>
        <v-btn variant="text" @click="errorSnackbar = false">关闭</v-btn>
      </template>
    </v-snackbar>

    <!-- 确认对话框 -->
    <v-dialog v-model="confirmDialog" max-width="400">
      <v-card>
        <v-card-title class="text-warning">
          <v-icon start color="warning">mdi-alert</v-icon>
          确认操作
        </v-card-title>
        <v-card-text>
          {{ confirmMessage }}
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="confirmDialog = false">取消</v-btn>
          <v-btn color="warning" @click="confirmAction">确认</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { api } from '@/utils/api'
import AdminLayout from '@/layouts/AdminLayout.vue'

const store = useAppStore()

// 状态
const exporting = ref(false)
const importing = ref(false)
const importingSqlite = ref(false)
const importFile = ref(null)
const importPreview = ref(null)
const clearBeforeImport = ref(false)
const clearBeforeSqliteImport = ref(false)
const sqliteStudentsJson = ref('')
const sqliteProjectsJson = ref('')

// 提示
const successSnackbar = ref(false)
const successMessage = ref('')
const errorSnackbar = ref(false)
const errorMessage = ref('')

// 确认对话框
const confirmDialog = ref(false)
const confirmMessage = ref('')
const pendingAction = ref(null)

// 导出数据
async function exportData() {
  exporting.value = true
  try {
    const backup = await api.backup.export()

    // 创建下载链接
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scratch-backup-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    successMessage.value = '数据导出成功！'
    successSnackbar.value = true
  } catch (error) {
    errorMessage.value = error.message || '导出失败'
    errorSnackbar.value = true
  } finally {
    exporting.value = false
  }
}

// 预览导入文件
async function previewImportFile(file) {
  if (!file) {
    importPreview.value = null
    return
  }

  try {
    const text = await file.text()
    const data = JSON.parse(text)

    if (data.data && data.data.students && data.data.projects) {
      importPreview.value = {
        students: data.data.students.length,
        projects: data.data.projects.length,
        exportedAt: data.exportedAt || '未知'
      }
    } else {
      throw new Error('无效的备份文件格式')
    }
  } catch (error) {
    errorMessage.value = '无法解析文件：' + error.message
    errorSnackbar.value = true
    importFile.value = null
    importPreview.value = null
  }
}

// 导入数据
async function importData() {
  if (clearBeforeImport.value) {
    confirmMessage.value = '确定要清空现有数据并导入备份吗？此操作不可撤销！'
    pendingAction.value = doImportData
    confirmDialog.value = true
  } else {
    await doImportData()
  }
}

async function doImportData() {
  confirmDialog.value = false
  importing.value = true

  try {
    const text = await importFile.value.text()
    const backup = JSON.parse(text)

    const result = await api.backup.import(backup.data, clearBeforeImport.value)

    successMessage.value = result.message
    successSnackbar.value = true

    // 刷新数据
    await store.loadData()

    // 重置表单
    importFile.value = null
    importPreview.value = null
    clearBeforeImport.value = false
  } catch (error) {
    errorMessage.value = error.message || '导入失败'
    errorSnackbar.value = true
  } finally {
    importing.value = false
  }
}

// 从 SQLite 导入
async function importFromSqlite() {
  if (clearBeforeSqliteImport.value) {
    confirmMessage.value = '确定要清空现有数据并从 SQLite 导入吗？此操作不可撤销！'
    pendingAction.value = doImportFromSqlite
    confirmDialog.value = true
  } else {
    await doImportFromSqlite()
  }
}

async function doImportFromSqlite() {
  confirmDialog.value = false
  importingSqlite.value = true

  try {
    const students = JSON.parse(sqliteStudentsJson.value)
    const projects = JSON.parse(sqliteProjectsJson.value)

    if (!Array.isArray(students) || !Array.isArray(projects)) {
      throw new Error('数据必须是 JSON 数组格式')
    }

    const result = await api.backup.importSqlite(students, projects, clearBeforeSqliteImport.value)

    successMessage.value = result.message
    successSnackbar.value = true

    // 刷新数据
    await store.loadData()

    // 重置表单
    sqliteStudentsJson.value = ''
    sqliteProjectsJson.value = ''
    clearBeforeSqliteImport.value = false
  } catch (error) {
    errorMessage.value = error.message || '导入失败'
    errorSnackbar.value = true
  } finally {
    importingSqlite.value = false
  }
}

// 确认操作
function confirmAction() {
  if (pendingAction.value) {
    pendingAction.value()
    pendingAction.value = null
  }
}

onMounted(() => {
  store.loadData()
})
</script>

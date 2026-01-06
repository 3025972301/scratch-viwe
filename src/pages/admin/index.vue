<template>
  <AdminLayout>
    <h1 class="text-h4 font-weight-bold mb-6">
      <v-icon class="mr-2">mdi-view-dashboard</v-icon>
      仪表盘
    </h1>

    <!-- 统计卡片 -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card color="primary" variant="flat">
          <v-card-text class="text-white">
            <div class="d-flex align-center">
              <v-icon size="48" class="mr-4">mdi-account-group</v-icon>
              <div>
                <div class="text-h4 font-weight-bold">{{ store.students.length }}</div>
                <div>学生总数</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="success" variant="flat">
          <v-card-text class="text-white">
            <div class="d-flex align-center">
              <v-icon size="48" class="mr-4">mdi-folder-multiple</v-icon>
              <div>
                <div class="text-h4 font-weight-bold">{{ store.projects.length }}</div>
                <div>作品总数</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="warning" variant="flat">
          <v-card-text class="text-white">
            <div class="d-flex align-center">
              <v-icon size="48" class="mr-4">mdi-eye</v-icon>
              <div>
                <div class="text-h4 font-weight-bold">{{ totalViews }}</div>
                <div>总浏览量</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card color="error" variant="flat">
          <v-card-text class="text-white">
            <div class="d-flex align-center">
              <v-icon size="48" class="mr-4">mdi-heart</v-icon>
              <div>
                <div class="text-h4 font-weight-bold">{{ totalLikes }}</div>
                <div>总点赞数</div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 快捷操作 -->
    <v-row class="mb-6">
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-lightning-bolt</v-icon>
            快捷操作
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col cols="6">
                <v-btn
                  block
                  color="primary"
                  to="/admin/students"
                  size="large"
                >
                  <v-icon start>mdi-account-plus</v-icon>
                  添加学生
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  block
                  color="success"
                  to="/admin/upload"
                  size="large"
                >
                  <v-icon start>mdi-upload</v-icon>
                  上传作品
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card>
          <v-card-title>
            <v-icon start>mdi-information</v-icon>
            使用说明
          </v-card-title>
          <v-card-text>
            <v-list density="compact">
              <v-list-item prepend-icon="mdi-numeric-1-circle">
                先在"学生管理"中添加参赛学生
              </v-list-item>
              <v-list-item prepend-icon="mdi-numeric-2-circle">
                在"上传作品"中为学生上传 Scratch 作品
              </v-list-item>
              <v-list-item prepend-icon="mdi-numeric-3-circle">
                在"作品管理"中管理和编辑已上传的作品
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 最近作品 -->
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon start>mdi-history</v-icon>
        最近上传的作品
        <v-spacer></v-spacer>
        <v-btn variant="text" color="primary" to="/admin/projects">
          查看全部
        </v-btn>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="recentProjects"
        :items-per-page="5"
        class="elevation-0"
      >
        <template v-slot:item.student="{ item }">
          {{ getStudentName(item.studentId) }}
        </template>
        <template v-slot:item.createdAt="{ item }">
          {{ formatDate(item.createdAt) }}
        </template>
        <template v-slot:item.actions="{ item }">
          <v-btn
            icon
            size="small"
            variant="text"
            :to="`/project/${item.id}`"
          >
            <v-icon>mdi-eye</v-icon>
          </v-btn>
        </template>
      </v-data-table>
    </v-card>
  </AdminLayout>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import AdminLayout from '@/layouts/AdminLayout.vue'

const store = useAppStore()

const headers = [
  { title: '作品名称', key: 'title' },
  { title: '作者', key: 'student' },
  { title: '浏览量', key: 'views' },
  { title: '上传时间', key: 'createdAt' },
  { title: '操作', key: 'actions', sortable: false }
]

const totalViews = computed(() => {
  return store.projects.reduce((sum, p) => sum + (p.views || 0), 0)
})

const totalLikes = computed(() => {
  return store.projects.reduce((sum, p) => sum + (p.likes || 0), 0)
})

const recentProjects = computed(() => {
  return [...store.projects]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
})

function getStudentName(studentId) {
  const student = store.getStudentById(studentId)
  return student ? student.name : '未知'
}

function formatDate(dateStr) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  store.loadData()
})
</script>

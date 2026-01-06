<template>
  <DefaultLayout>
    <v-container class="py-8">
      <h1 class="text-h4 font-weight-bold mb-6">
        <v-icon color="primary" class="mr-2">mdi-account-group</v-icon>
        学生风采
      </h1>

      <!-- 加载状态 -->
      <div v-if="store.loading" class="d-flex justify-center align-center py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>

      <v-row v-else-if="store.students.length > 0">
        <v-col
          v-for="student in store.students"
          :key="student.id"
          cols="12"
          sm="6"
          md="4"
        >
          <v-card class="student-card" hover>
            <div class="text-center pt-6">
              <v-avatar size="100" color="primary">
                <v-img v-if="student.avatar" :src="getFileUrl(student.avatar)"></v-img>
                <span v-else class="text-h3">{{ student.name.charAt(0) }}</span>
              </v-avatar>
            </div>

            <v-card-title class="text-center">
              {{ student.name }}
            </v-card-title>

            <v-card-subtitle class="text-center">
              {{ student.grade || '未设置年级' }}
            </v-card-subtitle>

            <v-card-text class="text-center">
              <p class="text-body-2 mb-4">{{ student.bio || '这位同学还没有填写简介' }}</p>
              <v-chip color="primary" variant="tonal">
                <v-icon start>mdi-folder</v-icon>
                {{ getProjectCount(student.id) }} 个作品
              </v-chip>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-btn
                block
                variant="text"
                color="primary"
                @click="showStudentProjects(student)"
              >
                查看作品
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>

      <v-empty-state
        v-else-if="!store.loading"
        icon="mdi-account-group"
        title="暂无学生信息"
        text="管理员还未添加学生信息"
      ></v-empty-state>

      <!-- 学生作品对话框 -->
      <v-dialog v-model="projectsDialog" max-width="800">
        <v-card v-if="selectedStudent">
          <v-card-title>
            <v-avatar size="32" color="primary" class="mr-2">
              <v-img v-if="selectedStudent.avatar" :src="getFileUrl(selectedStudent.avatar)"></v-img>
              <span v-else>{{ selectedStudent.name.charAt(0) }}</span>
            </v-avatar>
            {{ selectedStudent.name }} 的作品
          </v-card-title>
          <v-card-text>
            <v-row v-if="studentProjects.length > 0">
              <v-col
                v-for="project in studentProjects"
                :key="project.id"
                cols="12"
                sm="6"
              >
                <ProjectCard :project="project" />
              </v-col>
            </v-row>
            <v-empty-state
              v-else
              icon="mdi-folder-open"
              title="暂无作品"
              text="该学生还没有上传作品"
            ></v-empty-state>
          </v-card-text>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn @click="projectsDialog = false">关闭</v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </v-container>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { getFileUrl } from '@/utils/api'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ProjectCard from '@/components/ProjectCard.vue'

const route = useRoute()
const store = useAppStore()

const projectsDialog = ref(false)
const selectedStudent = ref(null)

const studentProjects = computed(() => {
  if (!selectedStudent.value) return []
  return store.getProjectsByStudent(selectedStudent.value.id)
})

function getProjectCount(studentId) {
  return store.projects.filter(p => p.studentId === studentId).length
}

function showStudentProjects(student) {
  selectedStudent.value = student
  projectsDialog.value = true
}

// 处理URL参数，自动打开指定学生的作品
function handleUrlParams() {
  const studentId = route.query.id
  if (studentId) {
    const student = store.getStudentById(studentId)
    if (student) {
      showStudentProjects(student)
    }
  }
}

onMounted(async () => {
  await store.loadData()
  handleUrlParams()
})

// 监听路由参数变化
watch(() => route.query.id, () => {
  handleUrlParams()
})
</script>

<style scoped>
.student-card {
  transition: transform 0.2s;
}

.student-card:hover {
  transform: translateY(-4px);
}
</style>

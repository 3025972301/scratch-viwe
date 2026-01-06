<template>
  <DefaultLayout>
    <v-container class="py-8">
      <v-btn
        variant="text"
        class="mb-4"
        @click="$router.back()"
      >
        <v-icon start>mdi-arrow-left</v-icon>
        返回
      </v-btn>

      <v-row v-if="project">
        <!-- 左侧：Scratch 播放器 -->
        <v-col cols="12" lg="8">
          <v-card>
            <v-card-title class="d-flex align-center">
              <span class="text-h5">{{ project.title }}</span>
              <v-chip
                v-if="project.award"
                color="warning"
                size="small"
                class="ml-2"
                prepend-icon="mdi-trophy"
              >
                {{ project.award }}
              </v-chip>
            </v-card-title>

            <!-- Scratch 播放区域 -->
            <div class="scratch-player-container">
              <!-- 在线 Scratch 项目嵌入 -->
              <iframe
                v-if="project.scratchUrl"
                :src="project.scratchUrl"
                allowtransparency="true"
                width="100%"
                height="402"
                frameborder="0"
                scrolling="no"
                allowfullscreen
              ></iframe>

              <!-- 本地 sb3 文件在线播放 -->
              <div v-else-if="project.sb3File" class="scratch-local-player">
                <ScratchPlayer :sb3-url="project.sb3File" :allow-download="project.allowDownload !== false" :project-name="project.title" />
                <div v-if="project.allowDownload !== false" class="pa-3 text-center bg-grey-lighten-4">
                  <v-btn
                    color="primary"
                    variant="tonal"
                    size="small"
                    :href="getFileUrl(project.sb3File)"
                    download
                  >
                    <v-icon start>mdi-download</v-icon>
                    下载 .sb3 文件
                  </v-btn>
                </div>
                <div v-else class="pa-3 text-center bg-grey-lighten-4">
                  <v-chip color="grey" variant="tonal" size="small">
                    <v-icon start>mdi-lock</v-icon>
                    此作品不允许下载源文件
                  </v-chip>
                </div>
              </div>

              <!-- 无内容 -->
              <div v-else class="no-player pa-12 text-center bg-grey-lighten-3">
                <v-icon size="64" color="grey">mdi-cat</v-icon>
                <p class="text-h6 mt-4 text-grey">暂无可播放内容</p>
              </div>
            </div>

            <v-card-text>
              <h3 class="text-h6 mb-2">作品介绍</h3>
              <p class="text-body-1">{{ project.description || '暂无介绍' }}</p>

              <v-divider class="my-4"></v-divider>

              <h3 class="text-h6 mb-2">操作说明</h3>
              <p class="text-body-1" style="white-space: pre-wrap;">{{ project.instructions || '暂无操作说明' }}</p>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-btn
                variant="text"
                :color="isProjectLiked ? 'red' : 'primary'"
                @click="handleLike"
              >
                <v-icon start>{{ isProjectLiked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
                {{ isProjectLiked ? '已点赞' : '点赞' }} ({{ project.likes || 0 }})
              </v-btn>
              <v-chip variant="text">
                <v-icon start>mdi-eye</v-icon>
                {{ project.views || 0 }} 次浏览
              </v-chip>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- 右侧：作者信息 -->
        <v-col cols="12" lg="4">
          <v-card class="mb-4">
            <v-card-title>
              <v-icon start>mdi-account</v-icon>
              作者信息
            </v-card-title>
            <v-card-text v-if="student">
              <div class="d-flex align-center mb-4">
                <v-avatar size="64" color="primary">
                  <v-img v-if="student.avatar" :src="getFileUrl(student.avatar)"></v-img>
                  <span v-else class="text-h5">{{ student.name.charAt(0) }}</span>
                </v-avatar>
                <div class="ml-4">
                  <h3 class="text-h6">{{ student.name }}</h3>
                  <p class="text-caption text-grey">{{ student.grade || '' }}</p>
                </div>
              </div>
              <p v-if="student.bio" class="text-body-2">{{ student.bio }}</p>
              <v-btn
                block
                variant="outlined"
                color="primary"
                class="mt-4"
                :to="`/students?id=${student.id}`"
              >
                查看该学生所有作品
              </v-btn>
            </v-card-text>
            <v-card-text v-else>
              <p class="text-grey">作者信息不可用</p>
            </v-card-text>
          </v-card>

          <!-- 其他作品推荐 -->
          <v-card v-if="otherProjects.length > 0">
            <v-card-title>
              <v-icon start>mdi-folder-star</v-icon>
              更多作品
            </v-card-title>
            <v-list>
              <v-list-item
                v-for="p in otherProjects"
                :key="p.id"
                :to="`/project/${p.id}`"
                :title="p.title"
                :subtitle="getStudentName(p.studentId)"
              >
                <template v-slot:prepend>
                  <v-avatar rounded="lg">
                    <v-img v-if="p.thumbnail" :src="getFileUrl(p.thumbnail)"></v-img>
                    <v-icon v-else>mdi-image</v-icon>
                  </v-avatar>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>

      <!-- 项目不存在 -->
      <v-empty-state
        v-else
        icon="mdi-alert-circle"
        title="作品不存在"
        text="该作品可能已被删除或链接无效"
      >
        <template v-slot:actions>
          <v-btn color="primary" to="/gallery">
            返回作品展厅
          </v-btn>
        </template>
      </v-empty-state>
    </v-container>
  </DefaultLayout>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { getFileUrl } from '@/utils/api'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ScratchPlayer from '@/components/ScratchPlayer.vue'

const route = useRoute()
const store = useAppStore()

const project = computed(() => {
  return store.getProjectById(route.params.id)
})

const isProjectLiked = computed(() => {
  return store.isLiked(route.params.id)
})

const student = computed(() => {
  if (!project.value) return null
  return store.getStudentById(project.value.studentId)
})

const otherProjects = computed(() => {
  return store.projects
    .filter(p => p.id !== route.params.id)
    .slice(0, 5)
})

function getStudentName(studentId) {
  const s = store.getStudentById(studentId)
  return s ? s.name : '未知'
}

function handleLike() {
  store.toggleLike(route.params.id)
}

onMounted(() => {
  store.loadData()
})

watch(() => route.params.id, (newId) => {
  if (newId) {
    store.incrementViews(newId)
  }
}, { immediate: true })
</script>

<style scoped>
.scratch-player-container {
  background: #f5f5f5;
  min-height: 400px;
}

.scratch-player-container iframe {
  display: block;
}

/* 移动端优化 */
@media (max-width: 600px) {
  .scratch-player-container {
    min-height: 300px;
  }

  .scratch-player-container iframe {
    height: 300px;
  }
}
</style>

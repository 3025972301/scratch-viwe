<template>
  <DefaultLayout>
    <v-container class="py-6">
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
          <!-- 作品标题栏 -->
          <div class="project-title-bar mb-4">
            <div class="d-flex align-center flex-wrap ga-2">
              <h1 class="text-h5 font-weight-bold">{{ project.title }}</h1>
              <v-chip
                v-if="project.award"
                color="warning"
                size="small"
                variant="flat"
              >
                <v-icon start size="14">mdi-trophy</v-icon>
                {{ project.award }}
              </v-chip>
            </div>
            <div class="text-body-2 text-medium-emphasis mt-1" v-if="student">
              作者：{{ student.name }}
              <span v-if="student.grade" class="ml-2">{{ student.grade }}</span>
            </div>
          </div>

          <!-- Scratch 播放区域 -->
          <div class="scratch-player-section">
            <!-- 在线 Scratch 项目嵌入 -->
            <div v-if="project.scratchUrl" class="scratch-embed-container">
              <div class="scratch-stage-wrapper">
                <div class="stage-header">
                  <div class="stage-controls">
                    <span class="stage-title">Scratch 在线项目</span>
                  </div>
                  <div class="stage-actions">
                    <a
                      :href="project.scratchUrl.replace('/embed', '')"
                      target="_blank"
                      class="action-btn"
                      title="在 Scratch 中打开"
                    >
                      <v-icon size="20">mdi-open-in-new</v-icon>
                    </a>
                  </div>
                </div>
                <div class="stage-container">
                  <div class="stage-canvas-wrapper">
                    <iframe
                      :src="project.scratchUrl"
                      allowtransparency="true"
                      width="100%"
                      height="100%"
                      frameborder="0"
                      scrolling="no"
                      allowfullscreen
                    ></iframe>
                  </div>
                </div>
                <div class="stage-footer">
                  <div class="footer-left">
                    <span class="stage-size">480 × 360</span>
                  </div>
                  <div class="footer-center">
                    <span class="powered-by">Powered by Scratch</span>
                  </div>
                  <div class="footer-right"></div>
                </div>
              </div>
            </div>

            <!-- 本地 sb3 文件在线播放 -->
            <ScratchPlayer
              v-else-if="project.sb3File"
              :sb3-url="project.sb3File"
              :allow-download="project.allowDownload !== false"
              :project-name="project.title"
            />

            <!-- 无内容 -->
            <div v-else class="no-player-container">
              <div class="scratch-stage-wrapper">
                <div class="stage-header">
                  <div class="stage-controls">
                    <span class="stage-title">暂无内容</span>
                  </div>
                </div>
                <div class="stage-container">
                  <div class="stage-canvas-wrapper no-content">
                    <v-icon size="64" color="grey-lighten-1">mdi-cat</v-icon>
                    <p class="text-h6 mt-4 text-grey">暂无可播放内容</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 作品信息卡片 -->
          <v-card class="mt-4" variant="outlined">
            <v-tabs v-model="infoTab" color="primary">
              <v-tab value="description">
                <v-icon start>mdi-information</v-icon>
                作品介绍
              </v-tab>
              <v-tab value="instructions">
                <v-icon start>mdi-gamepad-variant</v-icon>
                操作说明
              </v-tab>
            </v-tabs>

            <v-card-text>
              <v-tabs-window v-model="infoTab">
                <v-tabs-window-item value="description">
                  <p class="text-body-1" style="white-space: pre-wrap;">{{ project.description || '作者暂未添加作品介绍' }}</p>
                </v-tabs-window-item>
                <v-tabs-window-item value="instructions">
                  <p class="text-body-1" style="white-space: pre-wrap;">{{ project.instructions || '作者暂未添加操作说明' }}</p>
                </v-tabs-window-item>
              </v-tabs-window>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions class="px-4">
              <v-btn
                variant="text"
                :color="isProjectLiked ? 'red' : 'grey'"
                @click="handleLike"
              >
                <v-icon start>{{ isProjectLiked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
                {{ project.likes || 0 }}
              </v-btn>
              <v-btn variant="text" color="grey" disabled>
                <v-icon start>mdi-eye</v-icon>
                {{ project.views || 0 }}
              </v-btn>
              <v-spacer></v-spacer>
              <v-btn
                v-if="project.scratchUrl"
                variant="text"
                color="orange"
                :href="project.scratchUrl.replace('/embed', '')"
                target="_blank"
              >
                <v-icon start>mdi-open-in-new</v-icon>
                在 Scratch 中查看
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>

        <!-- 右侧：作者信息 -->
        <v-col cols="12" lg="4">
          <v-card class="mb-4" variant="outlined">
            <v-card-title class="d-flex align-center">
              <v-icon start color="primary">mdi-account</v-icon>
              作者信息
            </v-card-title>
            <v-card-text v-if="student">
              <div class="d-flex align-center mb-4">
                <v-avatar size="56" color="primary">
                  <v-img v-if="student.avatar" :src="getFileUrl(student.avatar)"></v-img>
                  <span v-else class="text-h5 text-white">{{ student.name.charAt(0) }}</span>
                </v-avatar>
                <div class="ml-4">
                  <h3 class="text-h6">{{ student.name }}</h3>
                  <p class="text-caption text-medium-emphasis">{{ student.grade || '' }}</p>
                </div>
              </div>
              <p v-if="student.bio" class="text-body-2 text-medium-emphasis">{{ student.bio }}</p>
              <v-btn
                block
                variant="tonal"
                color="primary"
                class="mt-4"
                :to="`/students?id=${student.id}`"
              >
                <v-icon start>mdi-folder-multiple</v-icon>
                查看该学生所有作品
              </v-btn>
            </v-card-text>
            <v-card-text v-else>
              <p class="text-medium-emphasis">作者信息不可用</p>
            </v-card-text>
          </v-card>

          <!-- 其他作品推荐 -->
          <v-card v-if="otherProjects.length > 0" variant="outlined">
            <v-card-title class="d-flex align-center">
              <v-icon start color="orange">mdi-star</v-icon>
              更多作品
            </v-card-title>
            <v-list density="compact">
              <v-list-item
                v-for="p in otherProjects"
                :key="p.id"
                :to="`/project/${p.id}`"
                rounded="lg"
                class="mx-2 mb-1"
              >
                <template v-slot:prepend>
                  <v-avatar rounded="lg" size="48" color="grey-lighten-3">
                    <v-img v-if="p.thumbnail" :src="getFileUrl(p.thumbnail)"></v-img>
                    <v-icon v-else color="grey">mdi-image</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">{{ p.title }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ getStudentName(p.studentId) }}</v-list-item-subtitle>
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
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { getFileUrl } from '@/utils/api'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ScratchPlayer from '@/components/ScratchPlayer.vue'

const route = useRoute()
const store = useAppStore()

const infoTab = ref('description')

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
.project-title-bar {
  padding: 0;
}

/* Scratch 嵌入式播放器样式（与 ScratchPlayer 组件保持一致） */
.scratch-embed-container .scratch-stage-wrapper,
.no-player-container .scratch-stage-wrapper {
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.scratch-embed-container .stage-header,
.no-player-container .stage-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: linear-gradient(to bottom, #4d97ff 0%, #4280d7 100%);
  min-height: 44px;
}

.stage-title {
  color: white;
  font-weight: 500;
  font-size: 14px;
}

.scratch-embed-container .stage-actions {
  display: flex;
  gap: 4px;
}

.scratch-embed-container .action-btn {
  width: 32px;
  height: 32px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  transition: background 0.15s;
}

.scratch-embed-container .action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.scratch-embed-container .stage-container,
.no-player-container .stage-container {
  background: #e8edf1;
  padding: 8px;
}

.scratch-embed-container .stage-canvas-wrapper,
.no-player-container .stage-canvas-wrapper {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background: white;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.scratch-embed-container .stage-canvas-wrapper iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

.no-player-container .stage-canvas-wrapper.no-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.scratch-embed-container .stage-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 12px;
  background: #f0f0f0;
  border-top: 1px solid #e0e0e0;
  font-size: 12px;
  color: #8c919c;
}

.scratch-embed-container .footer-left,
.scratch-embed-container .footer-right {
  min-width: 80px;
}

.scratch-embed-container .stage-size {
  font-family: monospace;
}

.scratch-embed-container .powered-by {
  font-size: 11px;
}

/* 移动端优化 */
@media (max-width: 600px) {
  .scratch-embed-container .stage-header,
  .no-player-container .stage-header {
    padding: 6px 8px;
    min-height: 40px;
  }

  .stage-title {
    font-size: 12px;
  }

  .scratch-embed-container .stage-container,
  .no-player-container .stage-container {
    padding: 4px;
  }

  .scratch-embed-container .stage-footer {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>

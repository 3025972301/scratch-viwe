<template>
  <v-card
    class="project-card"
    :to="`/project/${project.id}`"
    hover
  >
    <div class="thumbnail-container">
      <v-img
        :src="displayThumbnail"
        height="180"
        cover
        class="bg-grey-lighten-2"
      >
        <template v-slot:placeholder>
          <v-row class="fill-height ma-0" align="center" justify="center">
            <v-progress-circular
              v-if="loadingThumbnail"
              indeterminate
              color="primary"
              size="32"
            ></v-progress-circular>
            <v-icon v-else size="64" color="grey">mdi-image</v-icon>
          </v-row>
        </template>
        <v-chip
          v-if="project.award"
          color="warning"
          size="small"
          class="ma-2"
          prepend-icon="mdi-trophy"
        >
          {{ project.award }}
        </v-chip>
      </v-img>
    </div>

    <v-card-title class="text-truncate">
      {{ project.title }}
    </v-card-title>

    <v-card-subtitle>
      <v-icon size="small" class="mr-1">mdi-account</v-icon>
      {{ studentName }}
    </v-card-subtitle>

    <v-card-text class="text-truncate-2">
      {{ project.description || '暂无描述' }}
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions>
      <v-chip size="small" variant="text">
        <v-icon start size="small">mdi-eye</v-icon>
        {{ project.views || 0 }}
      </v-chip>
      <v-chip size="small" variant="text">
        <v-icon start size="small">mdi-heart</v-icon>
        {{ project.likes || 0 }}
      </v-chip>
      <v-spacer></v-spacer>
      <v-btn size="small" color="primary" variant="text">
        查看详情
        <v-icon end size="small">mdi-arrow-right</v-icon>
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { getFileUrl } from '@/utils/api'
import { generateThumbnail } from '@/utils/thumbnail'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const store = useAppStore()
const generatedThumbnail = ref(null)
const loadingThumbnail = ref(false)

const defaultThumbnail = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 360">
    <rect fill="#f0f0f0" width="480" height="360"/>
    <g fill="#bdbdbd">
      <circle cx="240" cy="150" r="40"/>
      <path d="M200 200 Q240 260 280 200 Q300 240 240 280 Q180 240 200 200"/>
    </g>
    <text x="240" y="320" text-anchor="middle" fill="#9e9e9e" font-size="24" font-family="sans-serif">Scratch</text>
  </svg>
`)

const displayThumbnail = computed(() => {
  // 优先使用项目设置的缩略图
  if (props.project.thumbnail) {
    return getFileUrl(props.project.thumbnail)
  }
  // 使用生成的缩略图
  if (generatedThumbnail.value) {
    return generatedThumbnail.value
  }
  // 默认占位图
  return defaultThumbnail
})

const studentName = computed(() => {
  const student = store.getStudentById(props.project.studentId)
  return student ? student.name : '未知学生'
})

// 自动生成缩略图
async function loadThumbnail() {
  // 如果已有缩略图或没有 sb3 文件，跳过
  if (props.project.thumbnail || !props.project.sb3File) {
    return
  }

  loadingThumbnail.value = true
  try {
    const sb3Url = getFileUrl(props.project.sb3File)
    const thumbnail = await generateThumbnail(sb3Url)
    if (thumbnail) {
      generatedThumbnail.value = thumbnail
    }
  } catch (error) {
    console.error('生成缩略图失败:', error)
  } finally {
    loadingThumbnail.value = false
  }
}

onMounted(() => {
  loadThumbnail()
})
</script>

<style scoped>
.project-card {
  transition: transform 0.2s;
}

.project-card:hover {
  transform: translateY(-4px);
}

.thumbnail-container {
  position: relative;
  overflow: hidden;
}

.text-truncate-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  min-height: 48px;
}

/* 移动端优化 */
@media (max-width: 600px) {
  .project-card:hover {
    transform: none;
  }

  .text-truncate-2 {
    min-height: 40px;
    font-size: 14px;
  }
}
</style>

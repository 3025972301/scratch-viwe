<template>
  <v-card
    class="project-card"
    :to="`/project/${project.id}`"
    hover
  >
    <v-img
      :src="thumbnailUrl"
      height="180"
      cover
      class="bg-grey-lighten-2"
    >
      <template v-slot:placeholder>
        <v-row class="fill-height ma-0" align="center" justify="center">
          <v-icon size="64" color="grey">mdi-image</v-icon>
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
import { computed } from 'vue'
import { useAppStore } from '@/stores/app'
import { getFileUrl } from '@/utils/api'

const props = defineProps({
  project: {
    type: Object,
    required: true
  }
})

const store = useAppStore()

const defaultThumbnail = 'data:image/svg+xml,' + encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
    <rect fill="#f5f5f5" width="400" height="300"/>
    <text x="200" y="150" text-anchor="middle" fill="#9e9e9e" font-size="48">Scratch</text>
  </svg>
`)

const thumbnailUrl = computed(() => {
  return props.project.thumbnail ? getFileUrl(props.project.thumbnail) : defaultThumbnail
})

const studentName = computed(() => {
  const student = store.getStudentById(props.project.studentId)
  return student ? student.name : '未知学生'
})
</script>

<style scoped>
.project-card {
  transition: transform 0.2s;
}

.project-card:hover {
  transform: translateY(-4px);
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

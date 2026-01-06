<template>
  <DefaultLayout>
    <!-- Hero Section -->
    <v-parallax
      src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=1920"
      :height="isMobile ? 350 : 500"
    >
      <div class="d-flex flex-column fill-height justify-center align-center text-white px-4">
        <h1 class="hero-title text-center" style="text-shadow: 2px 2px 4px rgba(0,0,0,0.5);">
          Scratch 创意作品展
        </h1>
        <p class="hero-subtitle mb-6 text-center" style="text-shadow: 1px 1px 2px rgba(0,0,0,0.5);">
          展示青少年编程创意与才华
        </p>
        <v-btn
          color="warning"
          :size="isMobile ? 'large' : 'x-large'"
          rounded="pill"
          to="/gallery"
        >
          <v-icon start>mdi-view-grid</v-icon>
          浏览全部作品
        </v-btn>
      </div>
    </v-parallax>

    <!-- Stats Section -->
    <v-container class="py-12">
      <v-row justify="center">
        <v-col cols="12" sm="4" class="text-center">
          <v-card class="pa-6" variant="tonal" color="primary">
            <v-icon size="48" color="primary">mdi-account-group</v-icon>
            <h3 class="text-h3 font-weight-bold mt-2">{{ store.students.length }}</h3>
            <p class="text-subtitle-1">参赛学生</p>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4" class="text-center">
          <v-card class="pa-6" variant="tonal" color="success">
            <v-icon size="48" color="success">mdi-folder-star</v-icon>
            <h3 class="text-h3 font-weight-bold mt-2">{{ store.projects.length }}</h3>
            <p class="text-subtitle-1">创意作品</p>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4" class="text-center">
          <v-card class="pa-6" variant="tonal" color="warning">
            <v-icon size="48" color="warning">mdi-eye</v-icon>
            <h3 class="text-h3 font-weight-bold mt-2">{{ totalViews }}</h3>
            <p class="text-subtitle-1">总浏览量</p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Featured Projects -->
    <v-container class="py-8" v-if="featuredProjects.length > 0">
      <h2 class="text-h4 font-weight-bold mb-6 text-center">
        <v-icon color="warning" class="mr-2">mdi-star</v-icon>
        精选作品
      </h2>
      <v-row>
        <v-col
          v-for="project in featuredProjects"
          :key="project.id"
          cols="12"
          sm="6"
          md="4"
        >
          <ProjectCard :project="project" />
        </v-col>
      </v-row>
      <div class="text-center mt-6">
        <v-btn
          color="primary"
          variant="outlined"
          size="large"
          to="/gallery"
        >
          查看更多作品
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </div>
    </v-container>

    <!-- Empty State -->
    <v-container class="py-12" v-else>
      <v-empty-state
        icon="mdi-folder-open"
        title="暂无作品"
        text="作品正在准备中，请稍后再来查看"
      >
      </v-empty-state>
    </v-container>

    <!-- About Section -->
    <v-sheet color="grey-lighten-4" class="py-12">
      <v-container>
        <v-row align="center">
          <v-col cols="12" md="6">
            <h2 class="text-h4 font-weight-bold mb-4">关于 Scratch 编程</h2>
            <p class="text-body-1 mb-4">
              Scratch 是由麻省理工学院媒体实验室开发的一款面向青少年的编程工具。
              通过拖拽积木式的编程块，学生们可以轻松创建动画、游戏和互动故事。
            </p>
            <p class="text-body-1">
              本次比赛展示了学生们的创意与编程能力，每一个作品都凝聚着他们的智慧与努力。
            </p>
          </v-col>
          <v-col cols="12" md="6" class="text-center">
            <v-icon size="200" color="orange">mdi-cat</v-icon>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>
  </DefaultLayout>
</template>

<script setup>
import { computed, onMounted, ref, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ProjectCard from '@/components/ProjectCard.vue'

const store = useAppStore()

// 移动端检测
const windowWidth = ref(window.innerWidth)
const isMobile = computed(() => windowWidth.value < 600)

function handleResize() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  store.loadData()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const totalViews = computed(() => {
  return store.projects.reduce((sum, p) => sum + (p.views || 0), 0)
})

const featuredProjects = computed(() => {
  return store.projects.slice(0, 6)
})
</script>

<style scoped>
.hero-title {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 1rem;
}

.hero-subtitle {
  font-size: 1.25rem;
}

@media (max-width: 600px) {
  .hero-title {
    font-size: 1.75rem;
  }

  .hero-subtitle {
    font-size: 1rem;
  }
}
</style>

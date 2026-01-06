<template>
  <DefaultLayout>
    <v-container class="py-8">
      <h1 class="text-h4 font-weight-bold mb-6">
        <v-icon color="primary" class="mr-2">mdi-view-grid</v-icon>
        作品展厅
      </h1>

      <!-- 搜索和筛选 -->
      <v-row class="mb-6">
        <v-col cols="12" md="6">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="搜索作品"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          ></v-text-field>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="sortBy"
            :items="sortOptions"
            label="排序方式"
            variant="outlined"
            density="compact"
            hide-details
          ></v-select>
        </v-col>
        <v-col cols="12" md="3">
          <v-select
            v-model="filterStudent"
            :items="studentOptions"
            label="按学生筛选"
            variant="outlined"
            density="compact"
            clearable
            hide-details
          ></v-select>
        </v-col>
      </v-row>

      <!-- 加载状态 -->
      <div v-if="store.loading" class="d-flex justify-center align-center py-12">
        <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      </div>

      <!-- 作品列表 -->
      <v-row v-else-if="paginatedProjects.length > 0">
        <v-col
          v-for="project in paginatedProjects"
          :key="project.id"
          cols="12"
          sm="6"
          md="4"
          lg="3"
        >
          <ProjectCard :project="project" />
        </v-col>
      </v-row>

      <!-- 分页控件 -->
      <div v-if="totalPages > 1" class="d-flex justify-center mt-6">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="5"
          rounded="circle"
        ></v-pagination>
      </div>

      <!-- 结果统计 -->
      <div v-if="filteredProjects.length > 0" class="text-center mt-4 text-grey">
        共 {{ filteredProjects.length }} 个作品，当前显示第 {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, filteredProjects.length) }} 个
      </div>

      <!-- 空状态 -->
      <v-empty-state
        v-else-if="!store.loading"
        icon="mdi-folder-search"
        title="没有找到作品"
        text="尝试修改搜索条件或清除筛选"
      >
        <template v-slot:actions>
          <v-btn color="primary" @click="clearFilters">
            清除筛选
          </v-btn>
        </template>
      </v-empty-state>
    </v-container>
  </DefaultLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import DefaultLayout from '@/layouts/DefaultLayout.vue'
import ProjectCard from '@/components/ProjectCard.vue'

const store = useAppStore()

const search = ref('')
const debouncedSearch = ref('')
const sortBy = ref('newest')
const filterStudent = ref(null)
const currentPage = ref(1)
const pageSize = 12 // 每页显示数量

// 搜索防抖
let searchTimer = null
watch(search, (newValue) => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    debouncedSearch.value = newValue
    currentPage.value = 1 // 搜索时重置到第一页
  }, 300)
})

// 筛选条件变化时重置页码
watch([sortBy, filterStudent], () => {
  currentPage.value = 1
})

const sortOptions = [
  { title: '最新发布', value: 'newest' },
  { title: '最多浏览', value: 'views' },
  { title: '最多点赞', value: 'likes' },
  { title: '名称排序', value: 'name' }
]

const studentOptions = computed(() => {
  return store.students.map(s => ({
    title: s.name,
    value: s.id
  }))
})

const filteredProjects = computed(() => {
  let result = [...store.projects]

  // 搜索过滤（使用防抖后的值）
  if (debouncedSearch.value) {
    const keyword = debouncedSearch.value.toLowerCase()
    result = result.filter(p =>
      p.title.toLowerCase().includes(keyword) ||
      (p.description && p.description.toLowerCase().includes(keyword))
    )
  }

  // 学生过滤
  if (filterStudent.value) {
    result = result.filter(p => p.studentId === filterStudent.value)
  }

  // 排序
  switch (sortBy.value) {
    case 'newest':
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      break
    case 'views':
      result.sort((a, b) => (b.views || 0) - (a.views || 0))
      break
    case 'likes':
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0))
      break
    case 'name':
      result.sort((a, b) => a.title.localeCompare(b.title, 'zh-CN'))
      break
  }

  return result
})

// 计算总页数
const totalPages = computed(() => {
  return Math.ceil(filteredProjects.value.length / pageSize)
})

// 当前页的项目
const paginatedProjects = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  const end = start + pageSize
  return filteredProjects.value.slice(start, end)
})

function clearFilters() {
  search.value = ''
  debouncedSearch.value = ''
  filterStudent.value = null
  sortBy.value = 'newest'
  currentPage.value = 1
}

onMounted(() => {
  store.loadData()
})
</script>

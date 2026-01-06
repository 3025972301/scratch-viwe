<template>
  <v-app>
    <v-app-bar color="grey-darken-4" density="compact">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>

      <v-toolbar-title>
        <v-icon icon="mdi-cog" class="mr-2"></v-icon>
        管理后台
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <v-chip variant="text" class="mr-2">
        <v-icon start>mdi-account</v-icon>
        {{ currentUser?.username || '管理员' }}
      </v-chip>

      <v-btn to="/" variant="text" size="small" class="mr-2">
        <v-icon start>mdi-home</v-icon>
        返回前台
      </v-btn>

      <v-btn variant="text" size="small" color="error" @click="handleLogout">
        <v-icon start>mdi-logout</v-icon>
        退出登录
      </v-btn>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" permanent :rail="rail" @click="rail = false">
      <v-list-item
        prepend-icon="mdi-cat"
        title="Scratch 作品展"
        subtitle="管理系统"
        nav
      >
        <template v-slot:append>
          <v-btn
            icon="mdi-chevron-left"
            variant="text"
            @click.stop="rail = !rail"
          ></v-btn>
        </template>
      </v-list-item>

      <v-divider></v-divider>

      <v-list nav density="compact">
        <v-list-item
          to="/admin"
          prepend-icon="mdi-view-dashboard"
          title="仪表盘"
          value="dashboard"
        ></v-list-item>

        <v-list-item
          to="/admin/review"
          prepend-icon="mdi-clipboard-check"
          title="作品审核"
          value="review"
        >
          <template v-slot:append v-if="pendingCount > 0">
            <v-badge :content="pendingCount" color="error" inline></v-badge>
          </template>
        </v-list-item>

        <v-list-item
          to="/admin/users"
          prepend-icon="mdi-account-cog"
          title="用户管理"
          value="users"
        ></v-list-item>

        <v-list-item
          to="/admin/students"
          prepend-icon="mdi-account-group"
          title="学生管理"
          value="students"
        ></v-list-item>

        <v-list-item
          to="/admin/projects"
          prepend-icon="mdi-folder-multiple"
          title="作品管理"
          value="projects"
        ></v-list-item>

        <v-list-item
          to="/admin/upload"
          prepend-icon="mdi-upload"
          title="上传作品"
          value="upload"
        ></v-list-item>

        <v-list-item
          to="/admin/backup"
          prepend-icon="mdi-backup-restore"
          title="备份恢复"
          value="backup"
        ></v-list-item>
      </v-list>

      <template v-slot:append>
        <div class="pa-2">
          <v-btn
            block
            variant="tonal"
            color="error"
            @click="handleLogout"
          >
            <v-icon start>mdi-logout</v-icon>
            退出登录
          </v-btn>
        </div>
      </template>
    </v-navigation-drawer>

    <v-main>
      <v-container fluid>
        <slot></slot>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { api } from '@/utils/api'

const router = useRouter()
const authStore = useAuthStore()

const drawer = ref(true)
const rail = ref(false)
const pendingCount = ref(0)

const currentUser = computed(() => authStore.getCurrentUser())

async function loadPendingCount() {
  try {
    const pending = await api.projects.getPending()
    pendingCount.value = pending.length
  } catch (e) {
    // 忽略错误
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  loadPendingCount()
})
</script>

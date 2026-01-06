<template>
  <v-app>
    <v-app-bar color="primary" prominent>
      <v-app-bar-nav-icon @click="drawer = !drawer" class="d-md-none"></v-app-bar-nav-icon>

      <v-toolbar-title class="text-h5 font-weight-bold">
        <router-link to="/" class="text-white text-decoration-none d-flex align-center">
          <v-icon icon="mdi-cat" class="mr-2" size="32"></v-icon>
          Scratch 作品展
        </router-link>
      </v-toolbar-title>

      <v-spacer></v-spacer>

      <div class="d-none d-md-flex">
        <v-btn to="/" variant="text">
          <v-icon start>mdi-home</v-icon>
          首页
        </v-btn>
        <v-btn to="/gallery" variant="text">
          <v-icon start>mdi-view-grid</v-icon>
          作品展厅
        </v-btn>
        <v-btn to="/students" variant="text">
          <v-icon start>mdi-account-group</v-icon>
          学生风采
        </v-btn>
        <v-btn to="/admin" variant="text" color="warning">
          <v-icon start>mdi-cog</v-icon>
          管理后台
        </v-btn>
      </div>
    </v-app-bar>

    <v-navigation-drawer v-model="drawer" temporary>
      <v-list nav>
        <v-list-item to="/" prepend-icon="mdi-home" title="首页" @click="drawer = false"></v-list-item>
        <v-list-item to="/gallery" prepend-icon="mdi-view-grid" title="作品展厅" @click="drawer = false"></v-list-item>
        <v-list-item to="/students" prepend-icon="mdi-account-group" title="学生风采" @click="drawer = false"></v-list-item>
        <v-divider class="my-2"></v-divider>
        <v-list-item to="/admin" prepend-icon="mdi-cog" title="管理后台" @click="drawer = false"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <slot></slot>
    </v-main>

    <v-footer app class="bg-grey-darken-4 text-center d-flex flex-column">
      <div class="py-3">
        <v-icon icon="mdi-cat" class="mr-1"></v-icon>
        Scratch 作品展示平台 - 展示学生创意与才华
      </div>
      <div class="text-grey text-caption">
        &copy; {{ new Date().getFullYear() }} 杨猫猫制作 Lucky☆*: .｡. o(≧▽≦)o .｡.:*☆
      </div>
    </v-footer>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'

const drawer = ref(false)
</script>

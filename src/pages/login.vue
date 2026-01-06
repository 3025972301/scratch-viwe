<template>
  <v-app>
    <v-main class="login-background">
      <v-container class="fill-height" fluid>
        <v-row align="center" justify="center">
          <v-col cols="12" sm="8" md="4">
            <v-card class="elevation-12">
              <v-toolbar color="primary" dark flat>
                <v-toolbar-title>
                  <v-icon class="mr-2">mdi-cat</v-icon>
                  管理后台登录
                </v-toolbar-title>
              </v-toolbar>

              <v-card-text class="pa-6">
                <v-form ref="form" v-model="formValid" @submit.prevent="handleLogin">
                  <v-text-field
                    v-model="username"
                    label="用户名"
                    prepend-inner-icon="mdi-account"
                    :rules="[v => !!v || '请输入用户名']"
                    variant="outlined"
                    class="mb-4"
                    autofocus
                  ></v-text-field>

                  <v-text-field
                    v-model="password"
                    label="密码"
                    prepend-inner-icon="mdi-lock"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                    @click:append-inner="showPassword = !showPassword"
                    :rules="[v => !!v || '请输入密码']"
                    variant="outlined"
                    class="mb-4"
                    @keyup.enter="handleLogin"
                  ></v-text-field>

                  <v-alert
                    v-if="errorMessage"
                    type="error"
                    variant="tonal"
                    class="mb-4"
                    closable
                    @click:close="errorMessage = ''"
                  >
                    {{ errorMessage }}
                  </v-alert>

                  <v-btn
                    color="primary"
                    size="large"
                    block
                    type="submit"
                    :loading="loading"
                    :disabled="!formValid"
                  >
                    <v-icon start>mdi-login</v-icon>
                    登录
                  </v-btn>
                </v-form>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions class="pa-4">
                <v-btn variant="text" color="primary" to="/">
                  <v-icon start>mdi-arrow-left</v-icon>
                  返回首页
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const form = ref(null)
const formValid = ref(false)
const username = ref('')
const password = ref('')
const showPassword = ref(false)
const loading = ref(false)
const errorMessage = ref('')

async function handleLogin() {
  if (!formValid.value) return

  loading.value = true
  errorMessage.value = ''

  try {
    const result = await authStore.login(username.value, password.value)

    if (result.success) {
      // 登录成功，跳转到目标页面或管理后台首页
      const redirect = route.query.redirect || '/admin'
      router.push(redirect)
    } else {
      errorMessage.value = result.message
    }
  } catch (error) {
    errorMessage.value = error.message || '登录失败，请重试'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}
</style>

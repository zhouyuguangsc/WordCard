<template>
  <div class="app" :data-theme="theme">
    <main class="container">
      <HomeView :theme="theme" @toggle-theme="toggleTheme" />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import HomeView from './views/HomeView.vue'

const theme = ref(localStorage.getItem('theme') || 'light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

onMounted(() => {
  document.documentElement.setAttribute('data-theme', theme.value)
})
</script>

<style lang="scss">
@use './styles/base';

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.view-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>

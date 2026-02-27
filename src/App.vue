<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from '@/components/layout/AppHeader.vue'
// import AppFooter from '@/components/layout/AppFooter.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'

const route = useRoute()
const isLoginPage = computed(() => route.name === 'login')
</script>

<template>
  <div id="app">
    <AppHeader v-if="!isLoginPage" />
    <main class="page">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <!-- <AppFooter v-if="!isLoginPage" /> -->
    <NotificationContainer />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page {
  flex: 1;
}
</style>

<script setup>
import AppHeader from '@/components/layout/AppHeader.vue'
import AppFooter from '@/components/layout/AppFooter.vue'
import NotificationContainer from '@/components/ui/NotificationContainer.vue'
</script>

<template>
  <div id="app">
    <AppHeader />
    <main class="page">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
    <AppFooter />
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

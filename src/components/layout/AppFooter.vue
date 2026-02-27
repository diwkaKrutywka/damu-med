<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const footerLinkKeys = [
  { key: 'docs', href: '#' },
  { key: 'api', href: '#' },
  { key: 'support', href: '#' },
  { key: 'telegram', href: '#' }
]
</script>

<template>
  <footer class="footer" style="user-select: none;">
    <div class="container">
      <div class="footer-links">
        <a v-for="link in footerLinkKeys" :key="link.key" :href="link.href">
          {{ t(`footer.${link.key}`) }}
        </a>
      </div>
      <p>{{ t('footer.copyright') }}</p>
    </div>
  </footer>
</template>

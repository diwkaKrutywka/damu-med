<script setup>
const footerLinks = [
  { name: 'Документация', href: '#' },
  { name: 'API', href: '#' },
  { name: 'Поддержка', href: '#' },
  { name: 'Telegram', href: '#' }
]
</script>

<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-links">
        <a v-for="link in footerLinks" :key="link.name" :href="link.href">
          {{ link.name }}
        </a>
      </div>
      <p>MedContact Demo Hub v2.0 | Только синтетические данные</p>
    </div>
  </footer>
</template>

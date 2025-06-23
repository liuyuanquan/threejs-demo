<template>
  <div class="container"></div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import World from './world'

onMounted(() => {
  new World('.container')
  document.title = 'SU7 - Three.js'
})
</script>

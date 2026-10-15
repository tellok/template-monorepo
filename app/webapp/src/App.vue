<script setup lang="ts">
import { ref } from 'vue';

const count = ref(0);
</script>

<template>
  <main>
    <p class="eyebrow">VUE · TYPESCRIPT · VITE</p>
    <h1>Template Webapp</h1>
    <p>从一个小想法开始。</p>
    <button type="button" @click="count++">计数：{{ count }}</button>
    <p class="hint">编辑 app/webapp/src/App.vue，修改会即时呈现。</p>
  </main>
</template>

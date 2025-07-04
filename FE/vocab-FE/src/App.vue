<template>
  <div style="max-width: 900px; margin: auto; padding: 20px">
    <h2>{{ selectedWord ? 'Edit Word' : 'Add Word' }}</h2>
    <AddWordForm :model-value="selectedWord" @submitted="handleSubmitted" />

    <h2 style="margin-top: 40px;">Word List</h2>
    <WordTable @edit="handleEdit" :key="reloadKey" />
  </div>
</template>

<script setup lang="ts">
import AddWordForm from './components/Form.vue';
import WordTable from './components/WordTable.vue';
import { ref } from 'vue';

const selectedWord = ref(null);
const reloadKey = ref(0); // force refresh child table

const handleSubmitted = () => {
  selectedWord.value = null;
  reloadKey.value++;
};

const handleEdit = (word: any) => {
  selectedWord.value = { ...word };
};
</script>
<template>
  <div style="max-width: 900px; margin: auto; padding: 20px">
    <div style="display: flex; justify-content: space-between; align-items: center">
      <h2>{{ selectedWord ? 'Edit Word' : 'Add Word' }}</h2>
      <el-button type="danger" size="small" @click="logout">Logout</el-button>
    </div>

    <AddWordForm :model-value="selectedWord" @submitted="handleSubmitted" />
    <h2 style="margin-top: 40px;">Word List</h2>
    <WordTable @edit="handleEdit" :key="reloadKey" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AddWordForm from '../components/Form.vue';
import WordTable from '../components/WordTable.vue';
import { logout } from '../utils/auth';

const selectedWord = ref(null);
const reloadKey = ref(0);

const handleSubmitted = () => {
  selectedWord.value = null;
  reloadKey.value++;
};

const handleEdit = (word: any) => {
  selectedWord.value = { ...word };
};
</script>
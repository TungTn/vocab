<template>
  <el-form :model="form" label-width="120px">
    <el-form-item label="Word">
      <el-input v-model="form.word"/>
    </el-form-item>
    <el-form-item label="Translation">
      <el-input v-model="form.translation"/>
    </el-form-item>
    <el-form-item label="Meaning">
      <el-input v-model="form.meaning" type="textarea"/>
    </el-form-item>
    <el-form-item label="Verb 1 (V1)">
      <el-input v-model="form.verb1"/>
    </el-form-item>
    <el-form-item label="Verb 2 (V2)">
      <el-input v-model="form.verb2"/>
    </el-form-item>
    <el-form-item label="Verb 3 (V3)">
      <el-input v-model="form.verb3"/>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="submitForm">Add Word</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import { addWord } from '../services/api';

const props = defineProps<{
  modelValue?: any;
}>();
const emit = defineEmits(['submitted']);

const form = ref({
  word: '',
  translation: '',
  meaning: '',
  verb1: '',
  verb2: '',
  verb3: '',
});

watch(
    () => props.modelValue,
    (val) => {
      if (val) form.value = { ...val };
      else resetForm();
    },
    { immediate: true }
);

const resetForm = () => {
  form.value = {
    word: '',
    translation: '',
    meaning: '',
    verb1: '',
    verb2: '',
    verb3: '',
  };
};

const submitForm = async () => {
  if (!form.value.word || !form.value.translation) return alert('Word + translation required');

  await addWord(form.value);

  emit('submitted');
  resetForm();
};
</script>
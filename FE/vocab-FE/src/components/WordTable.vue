<template>
  <div>
    <el-input
        v-model="search"
        placeholder="Search by word or translation"
        style="margin-bottom: 12px"
        @input="fetchList"
        clearable
    />

    <el-table :data="wordList" style="width: 100%">
      <el-table-column prop="word" label="Word" />
      <el-table-column prop="translation" label="Translation" />
      <el-table-column prop="meaning" label="Meaning" />
      <el-table-column prop="verb1" label="V1" width="100" />
      <el-table-column prop="verb2" label="V2" width="100" />
      <el-table-column prop="verb3" label="V3" width="100" />
      <el-table-column :label="'Hành động'">
        <template #default="scope">
          <Edit class="icon" @click="handleEdit(scope.row)"/>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
        style="margin-top: 20px"
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="limit"
        :current-page="page"
        @current-change="onPageChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { fetchWords } from '../services/api';
import {Edit,} from '@element-plus/icons-vue'

const wordList = ref([]);
const search = ref('');
const page = ref(1);
const limit = 10;
const total = ref(0);
const emits = defineEmits(['edit'])

onMounted(() => {
  fetchList()
})

const fetchList = async () => {
  const { data } = await fetchWords({ page: page.value, limit, search: search.value });
  wordList.value = data.data;
  total.value = data.total;
};

const onPageChange = (val: number) => {
  page.value = val;
  fetchList();
};

const handleEdit = (e: any) => {
  emits('edit', e)
}
</script>

<style lang="scss" scoped>
.icon {
  width: 20px;
  height: 20px;
  cursor: pointer;
}
</style>
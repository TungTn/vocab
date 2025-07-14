<template>
  <div style="text-align: center; padding: 40px;">
    <h2>Login with Google</h2>
    <el-button type="primary" @click="loginWithGoogle">Login</el-button>
  </div>
</template>

<script setup lang="ts">
const loginWithGoogle = () => {
  window.location.href = 'http://localhost:3000/api/auth/google?prompt=select_account&client=vue';
};
</script>
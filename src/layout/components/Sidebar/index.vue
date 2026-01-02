<template>
  <el-menu
    active-text-color="#ffd04b"
    background-color="#304156"
    class="sidebar-menu"
    default-active="/dashboard"
    text-color="#fff"
    router
  >
    <el-menu-item index="/dashboard">
      <el-icon><Odometer /></el-icon>
      <span>Dashboard</span>
    </el-menu-item>
    <el-sub-menu index="/system">
      <template #title>
        <el-icon><Setting /></el-icon>
        <span>System</span>
      </template>
      <el-menu-item index="/system/user">User Management</el-menu-item>
      <el-menu-item index="/system/role">Role Management</el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { Odometer, Setting } from '@element-plus/icons-vue'
</script>

<style scoped>
.sidebar-menu {
  height: 100%;
  border-right: none;
}
</style>

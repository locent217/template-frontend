<template>
  <v-navigation-drawer v-model="open" :width="256" elevation="0" class="app-drawer" breakpoint="lg">
    <div class="d-flex align-center ga-3 px-6 py-7"><v-avatar color="primary" rounded="lg" size="36"><v-icon icon="mdi-layers-triple" color="white" /></v-avatar><span class="text-h6 font-weight-bold">{{ appConfig.shortName }}</span></div>
    <div class="px-5 text-overline text-medium-emphasis mb-2">WORKSPACE</div>
    <v-list nav density="comfortable" class="px-3">
      <v-list-item v-for="item in items" :key="item.to" :title="item.title" :prepend-icon="item.icon" :to="item.to" rounded="lg" color="primary" class="mb-1" />
    </v-list>
    <template #append><div class="pa-5 text-caption text-medium-emphasis">{{ appConfig.companyName }} · {{ appConfig.environment }}</div></template>


  </v-navigation-drawer>
</template>

<script setup lang="ts">
   import { computed } from 'vue'
   import { appConfig } from '@/config/app'
   import { useAuthStore } from '@/stores/auth'
   const open = defineModel<boolean>({ default: true })
   const auth = useAuthStore()
   const items = computed(() => [
      { title: 'Dashboard', icon: 'mdi-view-dashboard-outline', to: '/dashboard', permission: 'dashboard.view' as const },
      { title: 'Users', icon: 'mdi-account-group-outline', to: '/users', permission: 'users.view' as const },
   ].filter(item => item.to === '/users' ? auth.has('users.view') : auth.has(item.permission)))
</script>

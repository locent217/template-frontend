<template>
  <v-navigation-drawer v-model="open" :width="256" elevation="0" class="app-drawer" breakpoint="lg">
    <div class="d-flex align-center ga-3 px-6 py-7"><v-avatar color="primary" rounded="lg" size="40"><v-img v-if="logoVisible && appConfig.logoUrl" :src="appConfig.logoUrl" alt="Company logo" cover @error="logoVisible = false" /><v-icon v-else icon="mdi-layers-triple" color="white" /></v-avatar><span class="text-h6 font-weight-bold">{{ appConfig.shortName }}</span></div>
    <div class="px-5 text-overline text-medium-emphasis mb-2">WORKSPACE</div>
    <v-list nav density="comfortable" class="px-3">
      <v-list-item v-for="item in items" :key="item.to" :title="item.title" :prepend-icon="item.icon" :to="item.to" rounded="lg" color="primary" class="mb-1" />
    </v-list>
    <template #append><div class="pa-5 text-caption text-medium-emphasis">{{ appConfig.companyName }} · {{ appConfig.environment }}</div></template>


  </v-navigation-drawer>
</template>

<script setup lang="ts">
   import { computed, ref, watch } from 'vue'
   import { appConfig } from '@/config/app'
   import { useAuthStore } from '@/stores/auth'
   const logoVisible = ref(true)
   watch(() => appConfig.logoUrl, () => { logoVisible.value = true })
   const open = defineModel<boolean>({ default: true })
   const auth = useAuthStore()
   const entries = [
      ['Dashboard', 'mdi-view-dashboard-outline', '/dashboard', 'dashboard.view', false],
      ['Users', 'mdi-account-group-outline', '/users', 'users.view', false],
      ['Departments', 'mdi-domain', '/departments', 'departments.view', false],
      ['User Types', 'mdi-account-cog-outline', '/user-types', 'user_types.view', false],
      ['Islands', 'mdi-earth', '/islands', 'islands.view', false],
      ['Territories', 'mdi-map-outline', '/territories', 'territories.view', false],
      ['Regions', 'mdi-map-marker-radius-outline', '/regions', 'regions.view', false],
      ['Branches', 'mdi-office-building-outline', '/branches', 'branches.view', false],
      ['Modules', 'mdi-view-module-outline', '/modules', 'modules.view', true],
      ['Permissions', 'mdi-shield-key-outline', '/permissions', 'permissions.view', true],
      ['Default Permissions', 'mdi-shield-account-outline', '/department-user-type-permissions', 'department_user_type_permissions.view', true],
   ] as const
   const items = computed(() => entries.filter(([, , , permission, adminOnly]) => auth.has(permission) && (!adminOnly || auth.isSuperAdmin)).map(([title, icon, to]) => ({ title, icon, to })))
</script>

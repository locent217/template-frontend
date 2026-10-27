<template>
  <v-app-bar flat class="app-header" height="72">
    <v-btn icon="mdi-menu" variant="text" aria-label="Toggle navigation" @click="emit('toggle-drawer')" />
    <span class="text-body-1 font-weight-medium ml-2 d-none d-sm-inline">{{ appConfig.name }}</span>
    <v-spacer />
    <v-btn icon="mdi-bell-outline" variant="text" aria-label="Notifications" />
    <v-menu location="bottom end">
      <template #activator="{ props }"><v-btn v-bind="props" variant="text" class="text-none"><v-avatar size="34" color="primary"><span class="text-white">{{ auth.user?.name?.charAt(0).toUpperCase() }}</span></v-avatar><span class="ml-2 d-none d-sm-inline">{{ auth.user?.name }}</span><v-icon icon="mdi-chevron-down" class="ml-1" /></v-btn></template>


      <v-list min-width="190"><v-list-item :title="auth.user?.email" subtitle="Signed in" /><v-divider /><v-list-item title="Sign out" prepend-icon="mdi-logout" @click="signOut" /></v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup lang="ts">
   import { useRouter } from 'vue-router'
   import { appConfig } from '@/config/app'
   import { useAuthStore } from '@/stores/auth'
   const emit = defineEmits<{ 'toggle-drawer': [] }>()
   const auth = useAuthStore()
   const router = useRouter()
   async function signOut() {
      try {
         await auth.logout()
         await router.replace('/login')
      } catch (error) {
         console.error('Unable to log out', error)
      }
   }
</script>

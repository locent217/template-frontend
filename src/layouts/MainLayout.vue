<template>
    <v-app>
        <NavigationDrawer v-model="drawer" />
        <AppHeader @toggle-drawer="drawer = !drawer" />
        <v-main class="app-main">
            <v-container
                fluid
                class="pa-5 pa-md-8"
            >
                <router-view />
            </v-container>
        </v-main>
        <ThemeSettings />
    </v-app>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import AppHeader from '@/components/layout/AppHeader.vue'
    import NavigationDrawer from '@/components/layout/NavigationDrawer.vue'
    import ThemeSettings from '@/components/layout/ThemeSettings.vue'
    const drawer = ref(true)
</script>

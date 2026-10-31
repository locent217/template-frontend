<template>
    <v-container class="fill-height d-flex align-center justify-center">
        <v-card
            rounded="xl"
            elevation="2"
            max-width="520"
            width="100%"
            class="pa-8 text-center"
        >
            <v-icon icon="mdi-map-marker-question-outline" size="64" color="primary" class="mb-4" />
            <h1 class="text-h3 font-weight-bold mb-2">
                404
            </h1>
            <h2 class="text-h5 font-weight-medium mb-3">
                Page Not Found
            </h2>
            <p class="text-body-1 text-medium-emphasis mb-6">
                The page you requested doesn't exist, or its address may have changed.
            </p>
            <v-btn
                color="primary"
                prepend-icon="mdi-home-outline"
                :to="homePath"
            >
                {{ homeLabel }}
            </v-btn>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    import { useAuthStore } from '@/stores/auth'

    const auth = useAuthStore()
    const homePath = computed(() => auth.isAuthenticated ? '/dashboard' : '/login')
    const homeLabel = computed(() => auth.isAuthenticated ? 'Return to dashboard' : 'Go to login')
</script>

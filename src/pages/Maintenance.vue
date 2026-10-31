<template>
    <v-container class="fill-height d-flex align-center justify-center">
        <v-card
            rounded="xl"
            elevation="2"
            max-width="520"
            width="100%"
            class="pa-8 text-center"
        >
            <v-icon icon="mdi-tools" size="56" color="warning" class="mb-4" />
            <h1 class="text-h5 font-weight-bold mb-3">
                System Under Maintenance
            </h1>
            <p class="text-body-1 text-medium-emphasis mb-6">
                {{ message }}
            </p>
            <v-btn
                color="primary"
                :loading="checking"
                prepend-icon="mdi-refresh"
                @click="checkAgain"
            >
                Check again
            </v-btn>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
    import { onMounted, onUnmounted, ref } from 'vue'
    import { useRouter } from 'vue-router'
    import { maintenanceService } from '@/services/maintenanceService'
    const router = useRouter()
    const message = ref('We are performing scheduled maintenance. Please try again shortly.')
    const checking = ref(false)
    let poll: ReturnType<typeof setInterval> | undefined
    async function checkAgain() {
        if (checking.value) {
            return
        }
        checking.value = true
        try {
            const status = await maintenanceService.status()
            message.value = status.message
            if (!status.enabled) {
                await router.replace('/dashboard')
            }
        } catch {
            // Keep the maintenance page visible if the server is unavailable.
        } finally {
            checking.value = false
        }
    }
    onMounted(() => {
        void checkAgain()
        poll = setInterval(() => { void checkAgain() }, 30000)
    })
    onUnmounted(() => { if (poll) clearInterval(poll) })
</script>

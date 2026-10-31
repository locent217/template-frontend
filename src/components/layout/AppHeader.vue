<template>
    <v-app-bar
        flat
        class="app-header"
        height="72"
    >
        <v-btn icon="mdi-menu" variant="text" aria-label="Toggle navigation" @click="emit('toggle-drawer')" />
        <span class="text-body-1 font-weight-medium ml-2 d-none d-sm-inline">
            {{ appConfig.name }}
        </span>
        <v-spacer />
        <NotificationBell />
        <v-menu
            location="bottom end"
            :close-on-content-click="true"
        >
            <template #activator="{ props }">
                <v-btn
                    v-bind="props"
                    variant="text"
                    class="text-none"
                    aria-label="Account and logout menu"
                >
                    <v-avatar
                        size="36"
                        color="primary"
                    >
                        <v-img v-if="avatarVisible && profileImage" :src="profileImage" alt="Profile photo" cover @error="avatarVisible = false" />
                        <v-icon v-else icon="mdi-account-outline" color="white" size="24" />
                    </v-avatar>
                    <span class="ml-2 d-none d-sm-inline">
                        {{ auth.user?.username || 'Account' }}
                    </span>
                    <v-icon icon="mdi-chevron-down" class="ml-1" />
                </v-btn>
            </template>
            <v-card
                min-width="280"
                max-width="340"
                rounded="lg"
            >
                <v-card-text class="d-flex align-center ga-3 pb-3">
                    <v-avatar
                        size="54"
                        color="primary"
                    >
                        <v-img v-if="avatarVisible && profileImage" :src="profileImage" alt="Profile photo" cover @error="avatarVisible = false" />
                        <v-icon v-else icon="mdi-account-outline" color="white" size="34" />
                    </v-avatar>
                    <div class="min-w-0">
                        <div class="text-subtitle-1 font-weight-bold text-truncate">
                            {{ fullName }}
                        </div>
                        <div class="text-body-2 text-medium-emphasis text-truncate">
                            @{{ auth.user?.username || '—' }}
                        </div>
                        <div class="text-caption text-medium-emphasis text-truncate">
                            {{ userType }}
                        </div>
                    </div>
                </v-card-text>
                <v-divider />
                <v-card-actions class="pa-2 d-flex flex-column">
                    <v-btn
                        block
                        variant="text"
                        prepend-icon="mdi-lock-reset"
                        to="/change-password"
                    >
                        Change password
                    </v-btn>
                    <template v-if="auth.isSuperAdmin">
                        <v-btn
                            block
                            variant="text"
                            :color="maintenanceEnabled ? 'success' : 'warning'"
                            prepend-icon="mdi-tools"
                            :loading="maintenanceLoading"
                            @click="toggleMaintenance"
                        >
                            {{ maintenanceEnabled ? 'Disable maintenance' : 'Enable maintenance' }}
                        </v-btn>
                    </template>
                    <v-btn
                        block
                        variant="text"
                        color="error"
                        prepend-icon="mdi-logout"
                        :loading="auth.loading"
                        @click="signOut"
                    >
                        Sign out
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-menu>
    </v-app-bar>
</template>

<script setup lang="ts">
    import { computed, ref, watch } from 'vue'
    import NotificationBell from '@/components/notifications/NotificationBell.vue'
    import { useRouter } from 'vue-router'
    import { maintenanceService } from '@/services/maintenanceService'
    import { onMounted } from 'vue'
    import { appConfig } from '@/config/app'
    import { useAuthStore } from '@/stores/auth'
    const emit = defineEmits<{ 'toggle-drawer': [] }>()
    const auth = useAuthStore()
    const router = useRouter()
    const avatarVisible = ref(true)
    const maintenanceEnabled = ref(false)
    const maintenanceLoading = ref(false)
    onMounted(async () => {
        if (!auth.isSuperAdmin) {
            return
        }
        try { maintenanceEnabled.value = (await maintenanceService.status()).enabled } catch { /* retry on toggle */ }
    })
    async function toggleMaintenance() {
        if (maintenanceLoading.value) {
            return
        }
        const next = !maintenanceEnabled.value
        if (!window.confirm(next
            ? 'Enable maintenance? Regular users will temporarily lose access.'
            : 'Disable maintenance and restore access for all users?')) return
        maintenanceLoading.value = true
        try {
            const status = await maintenanceService.update(next)
            maintenanceEnabled.value = status.enabled
        } catch (error) {
            console.error('Unable to update maintenance mode', error)
            window.alert('Maintenance mode could not be updated. Please try again.')
        } finally { maintenanceLoading.value = false }
    }
    const profileImage = computed(() => auth.user?.profile_image_url || auth.user?.avatar_url || null)
    watch(profileImage, () => { avatarVisible.value = true })
    const fullName = computed(() => {
        const user = auth.user
        if (!user) {
            return 'Account'
        }
        const parts = [user.first_name, user.middle_name, user.last_name].filter(Boolean)
        return parts.join(' ').trim() || user.name || user.username
    })
    const userType = computed(() => auth.user?.user_type?.name || auth.user?.user_type?.code || 'No user type')
    async function signOut() {
        try {
            await auth.logout()
            await router.replace('/login')
        } catch (error) {
            console.error('Unable to log out', error)
        }
    }
</script>

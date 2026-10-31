<template>
    <v-menu
        v-model="open"
        location="bottom end"
        :close-on-content-click="false"
        max-width="420"
    >
        <template #activator="{ props }">
            <v-btn
                v-bind="props"
                icon
                variant="text"
                aria-label="Notifications"
            >
                <v-badge
                    :content="notifications.unreadCount > 99 ? '99+' : notifications.unreadCount"
                    :model-value="notifications.unreadCount > 0"
                    color="error"
                >
                    <v-icon icon="mdi-bell-outline" />
                </v-badge>
            </v-btn>
        </template>
        <v-card
            width="400"
            max-width="95vw"
            rounded="lg"
        >
            <v-card-title class="d-flex align-center justify-space-between py-3">
                <span>
                    Notifications
                </span>
                <v-btn icon="mdi-refresh" size="small" variant="text" :loading="notifications.loading" aria-label="Refresh notifications" @click="reload" />
            </v-card-title>
            <v-divider />
            <v-list
                v-if="notifications.items.length"
                density="comfortable"
                class="notification-list"
            >
                <v-list-item
                    v-for="item in notifications.items"
                    :key="item.id"
                    :class="{ 'notification-unread': !item.read_at }"
                >
                    <v-list-item-title class="text-body-2 font-weight-medium text-wrap">
                        {{ item.data.title || 'Notification' }}
                    </v-list-item-title>
                    <v-list-item-subtitle class="text-wrap mt-1">
                        {{ item.data.message || '' }}
                    </v-list-item-subtitle>
                    <div class="d-flex align-center justify-space-between mt-2">
                        <span class="text-caption text-medium-emphasis">
                            {{ new Date(item.created_at).toLocaleString() }}
                        </span>
                        <v-btn
                            size="x-small"
                            variant="tonal"
                            :loading="changingId === item.id"
                            @click="toggleRead(item)"
                        >
                            {{ item.read_at ? 'Mark unread' : 'Mark read' }}
                        </v-btn>
                    </div>
                </v-list-item>
            </v-list>
            <v-card-text
                v-else
                class="text-medium-emphasis text-center"
            >
                {{ notifications.loading ? 'Loading…' : 'No notifications yet' }}
            </v-card-text>
            <v-divider />
            <v-card-actions class="justify-space-between px-3">
                <v-btn
                    size="small"
                    variant="text"
                    :disabled="notifications.page <= 1"
                    @click="reload(notifications.page - 1)"
                >
                    Previous
                </v-btn>
                <span class="text-caption">
                    {{ notifications.page }} / {{ notifications.lastPage }}
                </span>
                <v-btn
                    size="small"
                    variant="text"
                    :disabled="notifications.page >= notifications.lastPage"
                    @click="reload(notifications.page + 1)"
                >
                    Next
                </v-btn>
            </v-card-actions>
            <v-alert
                v-if="error"
                type="error"
                density="compact"
                variant="tonal"
            >
                {{ error }}
            </v-alert>
        </v-card>
    </v-menu>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useAuthStore } from '@/stores/auth'
import { subscribeToNotifications } from '@/services/realtime'
import type { AppNotification } from '@/services/notificationService'
const notifications = useNotificationStore()
const auth = useAuthStore()
const open = ref(false)
const error = ref('')
const changingId = ref<string | null>(null)
let timer: ReturnType<typeof setInterval> | undefined
let unsubscribe: (() => void) | undefined
let subscriptionVersion = 0
async function connectRealtime(id?: string) {
    const version = ++subscriptionVersion
    unsubscribe?.()
    unsubscribe = undefined
    if (!id) {
        return
    }
    try {
        const cleanup = await subscribeToNotifications(id, () => {
            if (auth.isAuthenticated) {
                void reload(notifications.page)
            }
        })
        if (version !== subscriptionVersion) {
            cleanup()
        }
        else unsubscribe = cleanup
    } catch (error) {
        console.warn('Reverb unavailable; polling remains active.', error)
    }
}
watch(() => auth.user?.id, id => { void connectRealtime(id) }, { immediate: true })
async function reload(page = 1) {
    try {
        error.value = ''; await notifications.refresh(page)
    }
    catch { error.value = 'Unable to load notifications.' }
}
async function toggleRead(item: AppNotification) {
    changingId.value = item.id
    try {
        error.value = ''; await notifications.mark(item.id, !item.read_at)
    }
    catch { error.value = 'Unable to update notification.' }
    finally {
        changingId.value = null
    }
}
watch(open, isOpen => { if (isOpen) void reload(1) })
onMounted(() => {
    if (auth.isAuthenticated) {
        void reload(1)
    }
    timer = setInterval(() => {
        if (auth.isAuthenticated && document.visibilityState === 'visible') {
            void reload(notifications.page)
        }
    }, 60000)
})
onUnmounted(() => { subscriptionVersion++; unsubscribe?.(); if (timer) clearInterval(timer) })
</script>
<style scoped>
.notification-list { max-height: 420px; overflow-y: auto; }
.notification-unread { background: rgba(var(--v-theme-primary), .055); }
</style>

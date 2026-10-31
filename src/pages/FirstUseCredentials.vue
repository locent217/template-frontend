<template>
    <v-container
        class="d-flex align-center justify-center py-12"
        style="min-height:85vh"
    >
        <v-card
            width="100%"
            max-width="520"
            rounded="xl"
            elevation="4"
            class="pa-6 pa-md-8"
        >
            <v-avatar
                color="primary"
                size="52"
                rounded="lg"
                class="mb-5"
            >
                <v-icon icon="mdi-shield-key-outline" size="28" color="white" />
            </v-avatar>
            <h1 class="text-h5 font-weight-bold mb-2">
                Secure your account
            </h1>
            <p class="text-body-2 text-medium-emphasis mb-6">
                Welcome! Before continuing, choose your own username and password. This is required only on your first sign-in.
            </p>
            <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                class="mb-4"
            >
                {{ error }}
            </v-alert>
            <v-form @submit.prevent="submit">
                <v-text-field v-model.trim="username" label="New username" autocomplete="username" :disabled="saving" required class="mb-2" />
                <v-text-field v-model="currentPassword" label="Temporary / current password" type="password" autocomplete="current-password" :disabled="saving" required class="mb-2" />
                <v-text-field v-model="password" label="New password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" @click:append-inner="showPassword = !showPassword" hint="At least 12 characters; use a unique password" persistent-hint :disabled="saving" required class="mb-2" />
                <v-text-field v-model="confirmation" label="Confirm new password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" :disabled="saving" required class="mb-4" />
                <v-btn
                    type="submit"
                    color="primary"
                    block
                    size="large"
                    :loading="saving"
                >
                    Save and continue
                </v-btn>
            </v-form>
            <v-btn
                variant="text"
                block
                class="mt-3"
                :disabled="saving"
                @click="signOut"
            >
                Sign out instead
            </v-btn>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
const auth = useAuthStore()
const router = useRouter()
const username = ref(auth.user?.username ?? '')
const currentPassword = ref('')
const password = ref('')
const confirmation = ref('')
const showPassword = ref(false)
const saving = ref(false)
const error = ref('')
async function submit() {
  error.value = ''
  if (!username.value || !currentPassword.value || password.value.length < 12 || password.value !== confirmation.value) {
    error.value = 'Complete all fields, use a password of at least 12 characters, and ensure passwords match.'
    return
  }
  saving.value = true
  try {
    await auth.changeFirstUseCredentials({
        username: username.value, current_password: currentPassword.value,
        password: password.value, password_confirmation: confirmation.value,
    })
    await router.replace('/dashboard')
  } catch (e: any) {
    const errors = e?.response?.data?.errors
    error.value = errors ? Object.values(errors).flat().join(' ') : (e?.response?.data?.message ?? 'Unable to update credentials.')
  } finally { saving.value = false }
}
async function signOut() {
  await auth.logout()
  await router.replace('/login')
}
</script>

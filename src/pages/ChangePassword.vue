<template>
  <v-container class="py-10" style="max-width:600px">
    <v-card rounded="xl" class="pa-6 pa-md-8">
      <h1 class="text-h5 font-weight-bold mb-2">Change password</h1>
      <p class="text-body-2 text-medium-emphasis mb-6">Enter your current password to secure your account with a new one.</p>
      <v-alert v-if="message" type="success" variant="tonal" class="mb-4">{{ message }}</v-alert>
      <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
      <v-form @submit.prevent="submit">
        <v-text-field v-model="current" label="Current password" type="password" autocomplete="current-password" required />
        <v-text-field v-model="password" label="New password" type="password" autocomplete="new-password" hint="At least 12 characters" persistent-hint required />
        <v-text-field v-model="confirmation" label="Confirm new password" type="password" autocomplete="new-password" required />
        <v-btn type="submit" color="primary" block :loading="loading">Update password</v-btn>
      </v-form>
    </v-card>
  </v-container>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
const router = useRouter()
const current = ref(''); const password = ref(''); const confirmation = ref('')
const loading = ref(false); const message = ref(''); const error = ref('')
async function submit() {
  error.value = ''; message.value = ''
  if (!current.value || password.value.length < 12 || password.value !== confirmation.value) { error.value = 'Enter your current password and matching new passwords of at least 12 characters.'; return }
  loading.value = true
  try { await authService.changePassword({ current_password: current.value, password: password.value, password_confirmation: confirmation.value }); message.value = 'Your password was updated.'; current.value = ''; password.value = ''; confirmation.value = ''; await router.replace('/dashboard') }
  catch (e: any) { const errors = e?.response?.data?.errors; error.value = errors ? Object.values(errors).flat().join(' ') : e?.response?.data?.message || 'Unable to update password.' }
  finally { loading.value = false }
}
</script>

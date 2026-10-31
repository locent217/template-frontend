<template>
    <v-container
        class="d-flex align-center justify-center py-12"
        style="min-height:85vh"
    >
        <v-card
            max-width="500"
            width="100%"
            rounded="xl"
            class="pa-6 pa-md-8"
        >
            <v-avatar
                color="primary"
                rounded="lg"
                class="mb-4"
            >
                <v-icon icon="mdi-lock-reset" color="white" />
            </v-avatar>
            <h1 class="text-h5 font-weight-bold mb-2">
                Account recovery
            </h1>
            <p class="text-body-2 text-medium-emphasis mb-5">
                Recover your username or reset your password using your registered email address.
            </p>
            <v-tabs
                v-model="mode"
                color="primary"
                grow
                class="mb-5"
            >
                <v-tab value="username">
                    Forgot username
                </v-tab>
                <v-tab value="password">
                    Forgot password
                </v-tab>
            </v-tabs>
            <v-alert
                v-if="message"
                type="success"
                variant="tonal"
                class="mb-4"
            >
                {{ message }}
            </v-alert>
            <v-alert
                v-if="error"
                type="error"
                variant="tonal"
                class="mb-4"
            >
                {{ error }}
            </v-alert>
            <v-form @submit.prevent="submit">
                <v-text-field v-model.trim="email" label="Registered email" type="email" autocomplete="email" required />
                <template v-if="mode === 'password' && codeSent">
                    <v-text-field v-model.trim="otp" label="6-digit email verification code" inputmode="numeric" maxlength="6" required />
                    <v-text-field v-model="password" label="New password" type="password" autocomplete="new-password" hint="At least 12 characters" persistent-hint required />
                    <v-text-field v-model="confirmation" label="Confirm new password" type="password" autocomplete="new-password" required />
                </template>
                <v-btn
                    type="submit"
                    color="primary"
                    size="large"
                    block
                    :loading="loading"
                >
                    {{ mode === 'username' ? 'Email my username' : codeSent ? 'Reset password' : 'Send verification code' }}
                </v-btn>
            </v-form>
            <v-btn
                v-if="mode === 'password' && codeSent"
                block
                variant="text"
                class="mt-2"
                :disabled="loading"
                @click="sendCode"
            >
                Resend code
            </v-btn>
            <v-btn
                block
                variant="text"
                class="mt-3"
                to="/login"
            >
                Back to sign in
            </v-btn>
        </v-card>
    </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from '@/services/authService'
const router = useRouter()
const mode = ref<'username' | 'password'>('username')
const email = ref('')
const otp = ref('')
const password = ref('')
const confirmation = ref('')
const codeSent = ref(false)
const loading = ref(false)
const message = ref('')
const error = ref('')
function clearRecoveryFields() {
  email.value = ''
  otp.value = ''
  password.value = ''
  confirmation.value = ''
  codeSent.value = false
}
// Switching recovery methods starts a fresh, independent request.
watch(mode, () => {
  clearRecoveryFields()
  message.value = ''
  error.value = ''
})
function describe(e: any): string {
  const errors = e?.response?.data?.errors
  return errors ? Object.values(errors).flat().join(' ') : e?.response?.data?.message || 'Unable to complete the request.'
}
async function sendCode() {
  if (!email.value) { error.value = 'Enter your registered email address.'; return }
  loading.value = true; error.value = ''; message.value = ''
  try {
    message.value = await authService.forgotPassword(email.value)
    // A new code invalidates any previously typed code or password details.
    otp.value = ''
    password.value = ''
    confirmation.value = ''
    codeSent.value = true
  }
  catch (e: any) {
      error.value = describe(e)
  }
  finally {
      loading.value = false
  }
}
async function submit() {
  if (!email.value) { error.value = 'Enter your registered email address.'; return }
  if (mode.value === 'password' && !codeSent.value) {
      return sendCode()
  }
  if (mode.value === 'password' && (otp.value.length !== 6 || password.value.length < 12 || password.value !== confirmation.value)) {
    error.value = 'Enter the 6-digit code and matching passwords of at least 12 characters.'; return
  }
  loading.value = true; error.value = ''; message.value = ''
  try {
    if (mode.value === 'username') {
        message.value = await authService.forgotUsername(email.value)
        clearRecoveryFields()
    } else {
        await authService.resetPassword({
        email: email.value,
        otp: otp.value,
        password: password.value,
        password_confirmation: confirmation.value,
        })
        clearRecoveryFields()
        await router.replace({ path: '/login', query: { password_reset: 'success' } })
    }
  } catch (e: any) { error.value = describe(e) }
  finally {
      loading.value = false
  }
}
</script>

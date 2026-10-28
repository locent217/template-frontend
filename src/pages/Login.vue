<template>
  <div class="auth-background d-flex align-center justify-center pa-4 pa-md-8">
    <v-card class="auth-card w-100" max-width="1120">
      <v-row no-gutters>
        <v-col cols="12" md="6" class="auth-intro pa-8 pa-md-12 d-flex flex-column justify-space-between">
          <div class="d-flex align-center ga-3"><v-avatar color="primary" rounded="lg"><v-icon icon="mdi-layers-triple-outline" color="white" /></v-avatar><span class="text-h6 font-weight-bold">{{ appConfig.shortName }}</span></div>
          <div class="text-center py-12"><v-icon icon="mdi-view-dashboard-edit-outline" size="125" color="primary" /><h2 class="text-h5 font-weight-bold mt-5">Your work, beautifully organized.</h2><p class="text-body-1 text-medium-emphasis mt-3">A secure place to manage your team, data, and daily operations.</p></div>
          <div class="text-caption text-medium-emphasis">© {{ new Date().getFullYear() }} {{ appConfig.companyName }}</div>
        </v-col>
        <v-col cols="12" md="6" class="pa-8 pa-md-12 d-flex align-center"><div class="w-100 mx-auto" style="max-width: 390px">
          <div class="d-flex justify-end mb-5">
            <v-btn
              :prepend-icon="appearance.isDark ? 'mdi-white-balance-sunny' : 'mdi-weather-night'"
              variant="text"
              size="small"
              :aria-label="appearance.isDark ? 'Switch to light mode' : 'Switch to dark mode'"
              @click="appearance.mode = appearance.isDark ? 'light' : 'dark'"
            >{{ appearance.isDark ? 'Light mode' : 'Dark mode' }}</v-btn>
          </div>
          <div class="d-flex justify-end align-center ga-2 mb-5" aria-label="Choose primary color">
            <button
              v-for="color in appearance.accents"
              :key="color"
              type="button"
              class="login-color-swatch"
              :style="{ backgroundColor: color }"
              :aria-label="`Use ${color} as primary color`"
              :aria-pressed="appearance.accent === color"
              @click="appearance.accent = color"
            >
              <v-icon v-if="appearance.accent === color" icon="mdi-check" color="white" size="small" />
            </button>
          </div>
          <div class="text-h4 font-weight-bold mb-2">Welcome back <span aria-hidden="true">👋</span></div>
          <p class="text-medium-emphasis mb-8">Sign in to continue to your workspace.</p>
          <v-alert v-if="showPasswordResetSuccess" type="success" variant="tonal" class="mb-5" text="Your password has been reset successfully. Sign in with your new password." />
          <v-alert v-if="error" type="error" variant="tonal" class="mb-5" :text="error" />
          <v-form v-model="valid" @submit.prevent="submit">
            <label class="text-body-2 font-weight-medium">Username</label>
            <v-text-field v-model="username" type="text" autocomplete="username" placeholder="Enter your username" :rules="[rules.required, rules.username]" class="mt-2 mb-3" />
            <label class="text-body-2 font-weight-medium">Password</label>
            <v-text-field v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Enter your password" :rules="[rules.required]" :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" class="mt-2 mb-5" @click:append-inner="showPassword = !showPassword" />
            <v-checkbox v-model="remember" label="Remember me" density="compact" hide-details class="mb-4" />
            <v-btn type="submit" color="primary" size="large" block :loading="auth.loading" :disabled="!valid">Sign in</v-btn>
          </v-form>
          <v-btn variant="text" block class="mt-4" to="/account-recovery">Forgot username or password?</v-btn>
          <p class="text-caption text-medium-emphasis mt-7 text-center">Access is restricted to authorized personnel.</p>
        </div></v-col>
      </v-row>
    </v-card>
  </div>
</template>

<script setup lang="ts">
   import { onUnmounted, ref, watch } from 'vue'
   import { rules } from '@/utils/validationRules'
   import { appConfig } from '@/config/app'
   import { useRouter, useRoute } from 'vue-router'
   import { useAuthStore } from '@/stores/auth'
   import { useAppearanceStore } from '@/stores/theme'

   const username = ref('')
   const password = ref('')
   const remember = ref(false)
   const showPassword = ref(false)
   const error = ref('')
   const valid = ref(false)
   const auth = useAuthStore()
   const appearance = useAppearanceStore()
   const router = useRouter()
   const route = useRoute()
   const showPasswordResetSuccess = ref(false)
   let resetNoticeTimer: ReturnType<typeof setTimeout> | undefined

   // Display the reset confirmation for three seconds, then remove the URL flag.
   watch(
      () => route.query.password_reset,
      (status) => {
         if (resetNoticeTimer) clearTimeout(resetNoticeTimer)
         showPasswordResetSuccess.value = status === 'success'
         if (status === 'success') {
            resetNoticeTimer = setTimeout(() => {
               showPasswordResetSuccess.value = false
               const query = { ...route.query }
               delete query.password_reset
               void router.replace({ path: route.path, query, hash: route.hash })
            }, 3000)
         }
      },
      { immediate: true },
   )
   onUnmounted(() => {
      if (resetNoticeTimer) clearTimeout(resetNoticeTimer)
   })


   async function submit() {
      if (!valid.value) return

      error.value = ''

      try {
         await auth.login({ username: username.value, password: password.value, remember: remember.value })

         const redirect = typeof route.query.redirect === 'string'
            && route.query.redirect.startsWith('/')
            && !route.query.redirect.startsWith('//')
            ? route.query.redirect
            : '/dashboard'

         await router.replace(redirect)
      } catch (e: any) {
         error.value = e?.response?.data?.message || 'Unable to sign in. Check your credentials.'
      }
   }
</script>

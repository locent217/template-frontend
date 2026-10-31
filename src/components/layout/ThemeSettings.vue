<template>
    <v-btn class="theme-fab" icon="mdi-cog-outline" color="primary" elevation="5" size="large" aria-label="Appearance settings" @click="visible = true" />
    <v-navigation-drawer
        v-model="visible"
        location="right"
        temporary
        :width="310"
    >
        <div class="d-flex align-center justify-space-between pa-5">
            <div class="text-h6 font-weight-bold">
                Appearance
            </div>
            <v-btn icon="mdi-close" variant="text" @click="visible = false" />
        </div>
        <v-divider />
        <div class="pa-5">
            <div class="text-subtitle-2 mb-3">
                Theme mode
            </div>
            <v-btn-toggle
                v-model="appearance.mode"
                mandatory
                color="primary"
                divided
                class="w-100 mb-7"
            >
                <v-btn
                    value="light"
                    class="flex-grow-1"
                    prepend-icon="mdi-white-balance-sunny"
                >
                    Light
                </v-btn>
                <v-btn
                    value="dark"
                    class="flex-grow-1"
                    prepend-icon="mdi-weather-night"
                >
                    Dark
                </v-btn>
            </v-btn-toggle>
            <div class="text-subtitle-2 mb-3">
                Primary color
            </div>
            <div class="d-flex ga-3 flex-wrap">
                <button
                    v-for="color in appearance.accents"
                    :key="color"
                    type="button"
                    class="color-swatch"
                    :style="{ backgroundColor: color }"
                    :aria-label="`Set primary color ${color}`"
                    :aria-pressed="appearance.accent === color"
                    @click="appearance.accent = color"
                >
                    <v-icon v-if="appearance.accent === color" icon="mdi-check" color="white" size="18" />
                </button>
            </div>
            <p class="text-caption text-medium-emphasis mt-5">
                Preferences are saved in this browser.
            </p>
        </div>
    </v-navigation-drawer>
</template>

<script setup lang="ts">
    import { ref } from 'vue'
    import { useAppearanceStore } from '@/stores/theme'
    const visible = ref(false)
    const appearance = useAppearanceStore()
</script>

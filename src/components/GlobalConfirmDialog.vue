<template>
  <v-dialog :model-value="confirmState.open" max-width="440" persistent @update:model-value="v => { if (!v) closeConfirm(false) }">
    <v-card rounded="lg" class="pa-5">
      <v-card-title class="px-0">{{ confirmState.title }}</v-card-title>
      <v-card-text class="px-0">{{ confirmState.message }}</v-card-text>
      <v-card-actions class="px-0 justify-end">
        <v-btn variant="text" @click="closeConfirm(false)">Cancel</v-btn>
        <v-btn :color="confirmState.color" variant="flat" @click="closeConfirm(true)">{{ confirmState.confirmText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<script setup lang="ts">
import { confirmState, closeConfirm } from '@/composables/useConfirm'
</script>

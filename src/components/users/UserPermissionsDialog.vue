<template>
   <v-dialog :model-value="modelValue" max-width="920" scrollable @update:model-value="emit('update:modelValue', $event)">
      <v-card>
         <v-card-title class="d-flex align-center ga-3 pa-6"><v-icon icon="mdi-shield-key-outline" color="primary" /><div><div>Manage permissions</div><div class="text-caption text-medium-emphasis">{{ user?.username }}</div></div></v-card-title>
         <v-divider />
         <v-card-text class="pa-5" style="max-height: 68vh">
            <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
            <v-alert type="info" variant="tonal" class="mb-4">Department defaults apply unless an individual Allow or Deny override exists. Removing an override restores the default. Mandatory report-only restrictions still apply.</v-alert>
            <div v-if="loading" class="text-center pa-8"><v-progress-circular indeterminate color="primary" /></div>
            <template v-else>
               <v-text-field v-model="filter" label="Filter permissions" prepend-inner-icon="mdi-magnify" clearable hide-details class="mb-4" />
               <v-table density="comfortable"><thead><tr><th>Permission</th><th>Default</th><th>Override</th><th>Effective</th><th class="text-end">Actions</th></tr></thead>
                  <tbody><tr v-for="permission in visibleCatalog" :key="permission.id">
                     <td><div class="font-weight-medium">{{ permission.code }}</div><div class="text-caption text-medium-emphasis">{{ permission.module?.name || permission.name || '' }}</div></td>
                     <td><v-chip size="x-small" :color="isDefault(permission.code) ? 'success' : 'default'" variant="tonal">{{ isDefault(permission.code) ? 'Granted' : 'Not granted' }}</v-chip></td>
                     <td><v-chip size="x-small" :color="overrideFor(permission.code) === true ? 'success' : overrideFor(permission.code) === false ? 'error' : 'default'" variant="tonal">{{ overrideFor(permission.code) === true ? 'Allow' : overrideFor(permission.code) === false ? 'Deny' : 'Inherit' }}</v-chip></td>
                     <td><v-icon :icon="isEffective(permission.code) ? 'mdi-check-circle' : 'mdi-minus-circle-outline'" :color="isEffective(permission.code) ? 'success' : 'grey'" /></td>
                     <td><div class="d-flex ga-1 justify-end"><v-btn size="x-small" color="success" variant="tonal" :disabled="saving || permission.code === 'users.manage_permissions'" @click="change(permission.id, true)">Allow</v-btn><v-btn size="x-small" color="error" variant="tonal" :disabled="saving" @click="change(permission.id, false)">Deny</v-btn><v-btn size="x-small" variant="text" :disabled="saving || overrideFor(permission.code) === null" @click="reset(permission.id)">Reset</v-btn></div></td>
                  </tr><tr v-if="!visibleCatalog.length"><td colspan="5" class="text-center pa-6">No matching permissions</td></tr></tbody>
               </v-table>
            </template>
         </v-card-text>
         <v-divider /><v-card-actions class="pa-4"><v-spacer /><v-btn variant="text" @click="emit('update:modelValue', false)">Close</v-btn></v-card-actions>
      </v-card>
   </v-dialog>
</template>

<script setup lang="ts">
   import { computed, ref, watch } from 'vue'
   import type { PermissionCatalogItem, UserPermissionDetails, UserRecord } from '@/types/auth'
   import { getUserPermissions, listPermissionCatalog, resetUserPermission, setUserPermission } from '@/services/userPermissions'
   const props = defineProps<{ modelValue: boolean; user: UserRecord | null }>()
   const emit = defineEmits<{ 'update:modelValue': [value: boolean]; changed: [] }>()
   const details = ref<UserPermissionDetails | null>(null)
   const catalog = ref<PermissionCatalogItem[]>([])
   const filter = ref('')
   const loading = ref(false)
   const saving = ref(false)
   const error = ref('')
   const visibleCatalog = computed(() => catalog.value.filter(p => p.code.toLowerCase().includes(filter.value.toLowerCase())))
   function isDefault(code: string) { return details.value?.default_permissions.includes(code) || false }
   function isEffective(code: string) { return details.value?.effective_permissions.includes(code) || false }
   function overrideFor(code: string): boolean | null {
      const item = details.value?.overrides.find(o => o.code === code)
      return item ? Boolean(item.allowed) : null
   }
   async function load() {
      if (!props.user) return
      loading.value = true; error.value = ''
      try {
         const [d, c] = await Promise.all([getUserPermissions(props.user.id), listPermissionCatalog()])
         details.value = d; catalog.value = c
      } catch (e: any) { error.value = e?.response?.data?.message || 'Could not load permission data.' }
      finally { loading.value = false }
   }
   async function change(id: string, allowed: boolean) {
      if (!props.user) return
      saving.value = true; error.value = ''
      try { await setUserPermission(props.user.id, id, allowed); await load(); emit('changed') }
      catch (e: any) { error.value = e?.response?.data?.message || 'Unable to update permission.' }
      finally { saving.value = false }
   }
   async function reset(id: string) {
      if (!props.user) return
      saving.value = true; error.value = ''
      try { await resetUserPermission(props.user.id, id); await load(); emit('changed') }
      catch (e: any) { error.value = e?.response?.data?.message || 'Unable to reset permission.' }
      finally { saving.value = false }
   }
   watch(() => [props.modelValue, props.user?.id], ([open]) => { if (open) void load() })
</script>

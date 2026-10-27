<template>
   <div class="d-flex justify-space-between align-center flex-wrap ga-3 mb-6">
      <div><h1 class="text-h4 font-weight-bold">Default Permissions</h1><p class="text-medium-emphasis">Manage default permission records</p></div>
      <v-btn v-if="canCreate" color="primary" prepend-icon="mdi-plus" :loading="openingDialog" @click="openCreate">Add Default Permission</v-btn>
   </div>
   <v-alert v-if="error" type="error" variant="tonal" class="mb-4">{{ error }}</v-alert>
   <v-snackbar v-model="showNotice" color="success">{{ notice }}</v-snackbar>
   <v-card class="pa-4 pa-md-5">
      <div class="d-flex ga-3 mb-4">
         <v-text-field v-model="search" label="Search" prepend-inner-icon="mdi-magnify" hide-details clearable />
         <v-btn icon="mdi-refresh" variant="text" :loading="loading" @click="loadRecords" />
      </div>
      <v-data-table :headers="headers" :items="filtered" :loading="loading" item-value="id">
         <template #item.department_id="{ item }">{{ relationName(item, "department") ?? department_idOptions.find(option => option.id === item.department_id)?.name ?? '—' }}</template>
         <template #item.user_type_id="{ item }">{{ relationName(item, "userType") ?? user_type_idOptions.find(option => option.id === item.user_type_id)?.name ?? '—' }}</template>
         <template #item.permission_id="{ item }">{{ relationName(item, "permission") ?? permission_idOptions.find(option => option.id === item.permission_id)?.name ?? '—' }}</template>
         <template #item.actions="{ item }">
            <div class="d-flex justify-end ga-1">
               <v-btn v-if="canUpdate" icon="mdi-pencil-outline" variant="text" size="small" :disabled="openingDialog" @click="openEdit(item)" />
               <v-btn v-if="canDelete" icon="mdi-delete-outline" variant="text" color="error" size="small" @click="deleting = item; deleteDialog = true" />
            </div>
         </template>
      </v-data-table>
   </v-card>
   <v-dialog v-model="dialog" max-width="570" scrollable>
      <v-card class="pa-6">
         <h2 class="text-h6 mb-4">{{ editingId ? 'Edit' : 'Add' }} Default Permission</h2>
         <v-alert v-if="dialogError" type="error" variant="tonal" class="mb-3">{{ dialogError }}</v-alert>
         <v-form ref="formRef" @submit.prevent="save">
            <v-select v-model="form.department_id" label="Department" :items="department_idOptions" item-title="name" item-value="id" clearable :rules="[required]" />
            <v-select v-model="form.user_type_id" label="User Type" :items="user_type_idOptions" item-title="name" item-value="id" clearable :rules="[required]" />
            <v-autocomplete
               v-if="!editingId"
               v-model="selectedPermissionIds"
               label="Permissions"
               :items="permission_idOptions"
               item-title="name"
               item-value="id"
               multiple
               chips
               closable-chips
               clearable
               :rules="[atLeastOnePermission]"
               hint="Choose one or more permissions for this department and user type"
               persistent-hint
            />
            <v-select v-else v-model="form.permission_id" label="Permission" :items="permission_idOptions" item-title="name" item-value="id" clearable :rules="[required]" />
            <div class="d-flex justify-end ga-2 mt-5">
               <v-btn variant="text" @click="dialog = false">Cancel</v-btn>
               <v-btn color="primary" type="submit" :loading="saving">Save</v-btn>
            </div>
         </v-form>
      </v-card>
   </v-dialog>
   <v-dialog v-model="deleteDialog" max-width="440">
      <v-card class="pa-6">
         <h2 class="text-h6">Delete Default Permission?</h2>
         <p class="my-4">This action may be restricted if related records exist.</p>
         <div class="d-flex justify-end ga-2">
            <v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn>
            <v-btn color="error" :loading="saving" @click="confirmDelete">Delete</v-btn>
         </div>
      </v-card>
   </v-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { api } from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { listOrganization, updateOrganization, deleteOrganization, type OrganizationRecord } from '@/services/organization'

const auth = useAuthStore()
const resource = 'department-user-type-permissions' as const
const canCreate = computed(() => auth.isSuperAdmin && auth.has('department_user_type_permissions.create'))
const canUpdate = computed(() => auth.isSuperAdmin && auth.has('department_user_type_permissions.update'))
const canDelete = computed(() => auth.isSuperAdmin && auth.has('department_user_type_permissions.delete'))
const rows = ref<OrganizationRecord[]>([])
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const openingDialog = ref(false)
const error = ref('')
const dialogError = ref('')
const notice = ref('')
const showNotice = ref(false)
const dialog = ref(false)
const deleteDialog = ref(false)
const deleting = ref<OrganizationRecord | null>(null)
const editingId = ref<string | null>(null)
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const required = (value: unknown) => (value !== null && value !== undefined && String(value).trim().length > 0) || 'Required'
const department_idOptions = ref<OrganizationRecord[]>([])
const user_type_idOptions = ref<OrganizationRecord[]>([])
const permission_idOptions = ref<OrganizationRecord[]>([])
const selectedPermissionIds = ref<string[]>([])
const atLeastOnePermission = (values: unknown) => (Array.isArray(values) && values.length > 0) || 'Select at least one permission'

function emptyForm() {
   return {
   department_id: null,
   user_type_id: null,
   permission_id: null,
   }
}
const form = ref<Record<string, any>>(emptyForm())
const headers = [
   { title: 'Department', key: 'department_id' },
   { title: 'User Type', key: 'user_type_id' },
   { title: 'Permission', key: 'permission_id' },
   { title: 'Actions', key: 'actions', sortable: false as const, align: 'end' as const },
]
const filtered = computed(() => rows.value.filter(item => JSON.stringify(item).toLowerCase().includes(search.value.toLowerCase())))

function relationName(item: OrganizationRecord, key: string): string | undefined {
   const relation = item[key]
   if (relation && typeof relation === 'object' && 'name' in relation && typeof relation.name === 'string') return relation.name
   return undefined
}
function errorMessage(e: unknown): string {
   if (axios.isAxiosError(e)) {
      const errors = e.response?.data?.errors
      if (errors && typeof errors === 'object') return Object.values(errors).flat().join(' ')
      return e.response?.data?.message ?? e.message
   }
   return 'An unexpected error occurred.'
}
async function loadRecords() {
   loading.value = true
   error.value = ''
   try { rows.value = await listOrganization(resource) }
   catch (e) { error.value = errorMessage(e) }
   finally { loading.value = false }
}
async function loadLookups(item?: OrganizationRecord) {
   // Resolve all labels before mounting the edit form.
   const results = await Promise.all([
      listOrganization('departments'),
      listOrganization('user-types'),
      listOrganization('permissions'),
   ])
   department_idOptions.value = results[0] ?? []
   if (item) {
      const selectedId = item.department_id
      const related = item['department']
      if (selectedId && !department_idOptions.value.some(option => option.id === selectedId)
          && related && typeof related === 'object' && 'name' in related && typeof related.name === 'string') {
         department_idOptions.value = [...department_idOptions.value, { id: String(selectedId), name: related.name }]
      }
   }
   user_type_idOptions.value = results[1] ?? []
   if (item) {
      const selectedId = item.user_type_id
      const related = item['user_type']
      if (selectedId && !user_type_idOptions.value.some(option => option.id === selectedId)
          && related && typeof related === 'object' && 'name' in related && typeof related.name === 'string') {
         user_type_idOptions.value = [...user_type_idOptions.value, { id: String(selectedId), name: related.name }]
      }
   }
   permission_idOptions.value = results[2] ?? []
   if (item) {
      const selectedId = item.permission_id
      const related = item['permission']
      if (selectedId && !permission_idOptions.value.some(option => option.id === selectedId)
          && related && typeof related === 'object' && 'name' in related && typeof related.name === 'string') {
         permission_idOptions.value = [...permission_idOptions.value, { id: String(selectedId), name: related.name }]
      }
   }
}
async function openCreate() {
   if (openingDialog.value) return
   openingDialog.value = true
   dialogError.value = ''
   try {
      await loadLookups()
      editingId.value = null
      form.value = emptyForm()
      selectedPermissionIds.value = []
      dialog.value = true
   } catch (e) { error.value = `Unable to load dropdown options: ${errorMessage(e)}` }
   finally { openingDialog.value = false }
}
async function openEdit(item: OrganizationRecord) {
   if (openingDialog.value) return
   openingDialog.value = true
   dialogError.value = ''
   try {
      await loadLookups(item)
      editingId.value = item.id
      form.value = {
         department_id: item.department_id ?? null,
         user_type_id: item.user_type_id ?? null,
         permission_id: item.permission_id ?? null,
      }
      dialog.value = true
   } catch (e) { error.value = `Unable to load dropdown options: ${errorMessage(e)}` }
   finally { openingDialog.value = false }
}
async function save() {
   const result = await formRef.value?.validate()
   if (!result?.valid) return
   saving.value = true
   dialogError.value = ''
   try {
      const payload = Object.fromEntries(Object.entries(form.value).filter(([, value]) => value !== ''))
      if (editingId.value) await updateOrganization(resource, editingId.value, payload)
      else {
         const { data: response } = await api.post(`/${resource}/add`, {
            department_id: form.value.department_id,
            user_type_id: form.value.user_type_id,
            permission_ids: selectedPermissionIds.value,
         })
         // The backend skips assignments that already exist.
         const counts = response?.data as { created_count?: number; skipped_count?: number } | undefined
         notice.value = `${counts?.created_count ?? selectedPermissionIds.value.length} permission(s) added${counts?.skipped_count ? `, ${counts.skipped_count} already assigned` : ''}.`
      }
      dialog.value = false
      if (editingId.value) notice.value = 'Default Permission updated successfully.'
      showNotice.value = true
      await loadRecords()
   } catch (e) { dialogError.value = errorMessage(e) }
   finally { saving.value = false }
}
async function confirmDelete() {
   if (!deleting.value) return
   saving.value = true
   error.value = ''
   try {
      await deleteOrganization(resource, deleting.value.id)
      deleteDialog.value = false
      notice.value = 'Default Permission deleted successfully.'
      showNotice.value = true
      await loadRecords()
   } catch (e) { error.value = errorMessage(e); deleteDialog.value = false }
   finally { saving.value = false }
}
onMounted(loadRecords)
</script>

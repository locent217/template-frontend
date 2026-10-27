<template>
   <div class="d-flex flex-wrap justify-space-between align-center ga-3 mb-6">
      <div><h1 class="text-h4 font-weight-bold">User Management</h1><p class="text-medium-emphasis">Accounts, assignments and individual permissions</p></div>
      <v-btn v-if="canCreate" color="primary" prepend-icon="mdi-account-plus-outline" @click="openCreate">Add user</v-btn>
   </div>
   <v-alert v-if="error" type="error" variant="tonal" closable class="mb-4" @click:close="error = ''">{{ error }}</v-alert>
   <v-snackbar v-model="showNotice" color="success">{{ notice }}</v-snackbar>
   <v-card class="dashboard-card pa-4 pa-md-5">
      <div class="d-flex flex-wrap align-center ga-3 mb-4">
         <v-text-field v-model="search" placeholder="Search name, username, email or department" prepend-inner-icon="mdi-magnify" clearable hide-details density="comfortable" style="max-width: 440px" />
         <v-spacer /><v-btn icon="mdi-refresh" variant="text" :loading="loading" aria-label="Refresh users" @click="refresh" />
      </div>
      <v-data-table :headers="headers" :items="filtered" :loading="loading" item-value="id" density="comfortable">
         <template #item.full_name="{ item }"><div class="font-weight-medium">{{ fullName(item) }}</div><div class="text-caption text-medium-emphasis">@{{ item.username }}</div></template>
         <template #item.user_type="{ item }">{{ item.user_type?.name || '—' }}</template>
         <template #item.department="{ item }">{{ item.department?.name || '—' }}</template>
         <template #item.active="{ item }"><v-chip :color="item.active ? 'success' : 'warning'" size="small" variant="tonal">{{ item.active ? 'Active' : 'Inactive' }}</v-chip></template>
         <template #item.actions="{ item }">
            <div class="d-flex ga-1 justify-end">
               <v-btn v-if="canPermissions" icon="mdi-shield-key-outline" size="small" variant="text" title="Manage permissions" :disabled="item.user_type?.code === 'SUPER_ADMIN'" @click="openPermissions(item)" />
               <v-btn v-if="canUpdate" icon="mdi-pencil-outline" size="small" variant="text" title="Edit user" @click="openEdit(item)" />
               <v-btn v-if="canDelete" icon="mdi-delete-outline" size="small" variant="text" color="error" title="Delete user" :disabled="item.id === auth.user?.id || item.user_type?.code === 'SUPER_ADMIN'" @click="deleting = item; deleteDialog = true" />
            </div>
         </template>
      </v-data-table>
   </v-card>

   <v-dialog v-model="dialog" max-width="780" scrollable>
      <v-card>
         <v-card-title class="pa-6">{{ editingId ? 'Edit employee' : 'Create employee' }}</v-card-title>
         <v-divider />
         <v-card-text class="pa-6">
            <v-form ref="userForm" @submit.prevent="save">
               <v-row>
                  <v-col cols="12" md="4"><v-text-field v-model="form.first_name" label="First name" :rules="[rules.required]" /></v-col>
                  <v-col cols="12" md="4"><v-text-field v-model="form.middle_name" label="Middle name" /></v-col>
                  <v-col cols="12" md="4"><v-text-field v-model="form.last_name" label="Last name" :rules="[rules.required]" /></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="form.username" label="Username" autocomplete="off" :rules="[rules.required, rules.username]" /></v-col>
                  <v-col cols="12" md="6"><v-text-field v-model="form.email" label="Email" type="email" :rules="[rules.required, rules.email]" /></v-col>
                  <v-col cols="12"><v-text-field v-model="form.password" :label="editingId ? 'New password (optional)' : 'Temporary password'" :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" @click:append-inner="showPassword = !showPassword" :rules="editingId && !form.password ? [] : [rules.required, rules.minLength(12)]" autocomplete="new-password" /></v-col>
                  <v-col cols="12" md="6"><v-select v-model="form.department_id" :items="departments" item-title="name" item-value="id" label="Department" clearable :rules="[rules.required]" /></v-col>
                  <v-col cols="12" md="6"><v-select v-model="form.user_type_id" :items="assignableTypes" item-title="name" item-value="id" label="User type" :rules="[rules.required]" /></v-col>
                  <v-col cols="12" md="6"><v-select v-model="assignmentLevel" :items="assignmentOptions" item-title="title" item-value="value" label="Organizational assignment" @update:model-value="clearAssignment" /></v-col>
                  <v-col v-if="assignmentLevel !== 'none'" cols="12" md="6"><v-text-field v-model="assignmentId" :label="assignmentLevel + ' UUID'" :rules="[rules.required]" hint="Select a valid organization UUID from your backend" persistent-hint /></v-col>
                  <v-col cols="12"><v-switch v-model="form.active" color="primary" label="Active account" hide-details /></v-col>
               </v-row>
            </v-form>
         </v-card-text>
         <v-divider />
         <v-card-actions class="pa-5"><v-spacer /><v-btn variant="text" @click="dialog = false">Cancel</v-btn><v-btn color="primary" :loading="saving" @click="save">{{ editingId ? 'Save changes' : 'Create user' }}</v-btn></v-card-actions>
      </v-card>
   </v-dialog>

   <v-dialog v-model="deleteDialog" max-width="440">
      <v-card class="pa-6"><h3 class="text-h6">Delete user?</h3><p class="mt-3">Delete <strong>{{ deleting ? fullName(deleting) : '' }}</strong>? This may be irreversible.</p><div class="d-flex justify-end ga-2 mt-6"><v-btn variant="text" @click="deleteDialog = false">Cancel</v-btn><v-btn color="error" :loading="saving" @click="confirmDelete">Delete</v-btn></div></v-card>
   </v-dialog>
   <UserPermissionsDialog v-if="canPermissions" v-model="permissionsDialog" :user="permissionUser" @changed="onPermissionsChanged" />
</template>

<script setup lang="ts">
   import { computed, onMounted, ref } from 'vue'
   import { useAuthStore } from '@/stores/auth'
   import { rules } from '@/utils/validationRules'
   import { createUser, deleteUser, listDepartments, listUserTypes, listUsers, updateUser, type UserPayload } from '@/services/users'
   import type { LookupOption, UserRecord } from '@/types/auth'
   import UserPermissionsDialog from '@/components/users/UserPermissionsDialog.vue'

   const auth = useAuthStore()
   const rows = ref<UserRecord[]>([])
   const departments = ref<LookupOption[]>([])
   const userTypes = ref<LookupOption[]>([])
   const loading = ref(false)
   const saving = ref(false)
   const dialog = ref(false)
   const deleteDialog = ref(false)
   const permissionsDialog = ref(false)
   const permissionUser = ref<UserRecord | null>(null)
   const deleting = ref<UserRecord | null>(null)
   const editingId = ref<string | null>(null)
   const search = ref('')
   const error = ref('')
   const notice = ref('')
   const showNotice = ref(false)
   const showPassword = ref(false)
   const userForm = ref<any>(null)
   const assignmentLevel = ref('none')
   const assignmentId = ref('')
   const assignmentOptions = [
      { title: 'Head Office (none)', value: 'none' },
      { title: 'Branch', value: 'branch' },
      { title: 'Region', value: 'region' },
      { title: 'Territory', value: 'territory' },
      { title: 'Island', value: 'island' },
   ]
   function blank(): UserPayload {
      return { first_name: '', middle_name: null, last_name: '', username: '', email: '', password: '', department_id: null, user_type_id: null, branch_id: null, region_id: null, territory_id: null, island_id: null, active: true }
   }
   const form = ref<UserPayload>(blank())
   const canCreate = computed(() => auth.canManageUsers('users.create'))
   const canUpdate = computed(() => auth.canManageUsers('users.update'))
   const canDelete = computed(() => auth.canManageUsers('users.delete'))
   const canPermissions = computed(() => auth.isSuperAdmin && auth.has('users.manage_permissions'))
   const assignableTypes = computed(() => auth.isSuperAdmin ? userTypes.value : userTypes.value.filter(type => type.code !== 'SUPER_ADMIN'))
   const headers = [
      { title: 'Employee', key: 'full_name' }, { title: 'Email', key: 'email' },
      { title: 'Department', key: 'department' }, { title: 'User type', key: 'user_type' },
      { title: 'Status', key: 'active' }, { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
   ]
   function fullName(u: UserRecord): string { return [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ') || u.name || u.username }
   const filtered = computed(() => {
      const term = search.value.trim().toLowerCase()
      if (!term) return rows.value
      return rows.value.filter(u => [fullName(u), u.username, u.email, u.department?.name, u.user_type?.name].some(v => v?.toLowerCase().includes(term)))
   })
   function message(text: string) { notice.value = text; showNotice.value = true }
   function apiError(e: any, fallback: string): string {
      const data = e?.response?.data
      const first = data?.errors && Object.values(data.errors).flat()[0]
      return String(first || data?.message || fallback)
   }
   async function refresh() {
      loading.value = true
      try { rows.value = await listUsers() } catch (e) { error.value = apiError(e, 'Could not load users.') } finally { loading.value = false }
   }
   async function loadLookups() {
      try { [departments.value, userTypes.value] = await Promise.all([listDepartments(), listUserTypes()]) }
      catch (e) { error.value = apiError(e, 'Could not load user types or departments.') }
   }
   function clearAssignment() { assignmentId.value = '' }
   function openCreate() { editingId.value = null; form.value = blank(); assignmentLevel.value = 'none'; assignmentId.value = ''; dialog.value = true }
   function openEdit(u: UserRecord) {
      editingId.value = u.id
      form.value = { first_name: u.first_name || '', middle_name: u.middle_name || null, last_name: u.last_name || '', username: u.username, email: u.email, password: '', department_id: u.department_id, user_type_id: u.user_type_id, branch_id: u.branch_id || null, region_id: u.region_id || null, territory_id: u.territory_id || null, island_id: u.island_id || null, active: Boolean(u.active) }
      const found = (['branch', 'region', 'territory', 'island'] as const).find(level => Boolean(u[`${level}_id`]))
      assignmentLevel.value = found || 'none'
      assignmentId.value = found ? u[`${found}_id`] || '' : ''
      dialog.value = true
   }
   async function save() {
      const result = await userForm.value?.validate()
      if (!result?.valid) return
      if (assignmentLevel.value !== 'none' && !assignmentId.value.trim()) { error.value = 'Provide an organizational assignment UUID.'; return }
      saving.value = true; error.value = ''
      try {
         const payload: UserPayload = { ...form.value, branch_id: null, region_id: null, territory_id: null, island_id: null }
         if (assignmentLevel.value !== 'none') (payload as any)[`${assignmentLevel.value}_id`] = assignmentId.value.trim()
         if (editingId.value && !payload.password) delete payload.password
         if (editingId.value) await updateUser(editingId.value, payload)
         else await createUser(payload)
         dialog.value = false; message(editingId.value ? 'User updated.' : 'User created.'); await refresh()
      } catch (e) { error.value = apiError(e, 'Could not save user.') }
      finally { saving.value = false }
   }
   async function confirmDelete() {
      if (!deleting.value) return
      saving.value = true; error.value = ''
      try { await deleteUser(deleting.value.id); deleteDialog.value = false; deleting.value = null; message('User deleted.'); await refresh() }
      catch (e) { error.value = apiError(e, 'Could not delete user.') }
      finally { saving.value = false }
   }
   function openPermissions(user: UserRecord) { permissionUser.value = user; permissionsDialog.value = true }
   function onPermissionsChanged() { message('Permissions updated.') }
   onMounted(async () => { await Promise.all([refresh(), loadLookups()]) })
</script>

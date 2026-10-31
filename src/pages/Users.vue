<template>
    <div class="d-flex flex-wrap justify-space-between align-center ga-3 mb-6">
        <div>
            <h1 class="text-h4 font-weight-bold">
                User Management
            </h1>
            <p class="text-medium-emphasis">
                Accounts, assignments and individual permissions
            </p>
        </div>
        <v-btn
            v-if="canCreate"
            color="primary"
            prepend-icon="mdi-account-plus-outline"
            @click="openCreate"
        >
            Add user
        </v-btn>
    </div>
    <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        closable
        class="mb-4"
        @click:close="error = ''"
    >
        {{ error }}
    </v-alert>
    <v-snackbar
        v-model="showNotice"
        color="success"
    >
        {{ notice }}
    </v-snackbar>
    <v-card class="dashboard-card pa-4 pa-md-5">
        <div class="d-flex flex-wrap align-center ga-3 mb-4">
            <v-text-field v-model="search" placeholder="Search name, username, email or department" prepend-inner-icon="mdi-magnify" clearable hide-details density="comfortable" style="max-width: 440px" />
            <v-spacer />
            <v-btn icon="mdi-refresh" variant="text" :loading="loading" aria-label="Refresh users" @click="refresh" />
        </div>
        <v-data-table
            :headers="headers"
            :items="filtered"
            :loading="loading"
            item-value="id"
            density="comfortable"
        >
            <template #item.full_name="{ item }">
                <div class="font-weight-medium">
                    {{ fullName(item) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                    @{{ item.username }}
                </div>
            </template>
            <template #item.user_type="{ item }">
                {{ item.user_type?.name || '—' }}
            </template>
            <template #item.department="{ item }">
                {{ item.department?.name || '—' }}
            </template>
            <template #item.active="{ item }">
                <v-chip
                    :color="item.active ? 'success' : 'warning'"
                    size="small"
                    variant="tonal"
                >
                    {{ item.active ? 'Active' : 'Inactive' }}
                </v-chip>
            </template>
            <template #item.actions="{ item }">
                <div class="d-flex ga-1 justify-end">
                    <v-btn v-if="canPermissions" icon="mdi-shield-key-outline" size="small" variant="text" title="Manage permissions" :disabled="normalizedCode(item.user_type?.code) === USER_TYPE_CODES.SUPER_ADMIN" @click="openPermissions(item)" />
                    <v-btn v-if="canUpdate" icon="mdi-pencil-outline" size="small" variant="text" title="Edit user" @click="openEdit(item)" />
                    <v-btn v-if="canDelete" icon="mdi-delete-outline" size="small" variant="text" color="error" title="Delete user" :disabled="item.id === auth.user?.id || normalizedCode(item.user_type?.code) === USER_TYPE_CODES.SUPER_ADMIN" @click="requestDelete(item)" />
                </div>
            </template>
        </v-data-table>
    </v-card>
    <v-dialog
        v-model="dialog"
        max-width="780"
        scrollable
    >
        <v-card>
            <v-card-title class="pa-6">
                {{ editingId ? 'Edit employee' : 'Create employee' }}
            </v-card-title>
            <v-divider />
            <v-card-text class="pa-6">
                <v-form
                    ref="userForm"
                    @submit.prevent="save"
                >
                    <v-row>
                        <v-col cols="12" md="4" >
                            <v-text-field v-model="form.first_name" label="First name" :rules="[rules.required]" />
                        </v-col>
                        <v-col cols="12" md="4" >
                            <v-text-field v-model="form.middle_name" label="Middle name" />
                        </v-col>
                        <v-col cols="12" md="4" >
                            <v-text-field v-model="form.last_name" label="Last name" :rules="[rules.required]" />
                        </v-col>
                        <v-col cols="12" md="6" >
                            <v-text-field v-model="form.username" label="Username" autocomplete="off" :rules="[rules.required, rules.username]" />
                        </v-col>
                        <v-col cols="12" md="6" >
                            <v-text-field v-model="form.email" label="Email" type="email" :rules="[rules.required, rules.email]" />
                        </v-col>
                        <v-col cols="12">
                            <v-text-field v-model="form.password" :label="editingId ? 'New password (optional)' : 'Temporary password'" :type="showPassword ? 'text' : 'password'" :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'" @click:append-inner="showPassword = !showPassword" :rules="editingId && !form.password ? [] : [rules.required, rules.minLength(12)]" autocomplete="new-password" />
                        </v-col>
                        <v-col cols="12">
                            <v-text-field v-model="form.password_confirmation" :label="editingId ? 'Confirm new password' : 'Confirm temporary password'" :type="showPassword ? 'text' : 'password'" :rules="editingId && !form.password && !form.password_confirmation ? [] : [rules.required, (v: string) => v === form.password || 'Passwords do not match']" autocomplete="new-password" />
                        </v-col>
                        <v-col v-if="!isClient" cols="12" md="6" >
                            <v-select v-model="form.department_id" :items="departmentOptions" item-title="name" item-value="id" label="Department" clearable :rules="[rules.required]" />
                        </v-col>
                        <v-col cols="12" md="6" >
                            <v-select v-model="form.user_type_id" :items="userTypeOptions" item-title="name" item-value="id" label="User type" :rules="[rules.required]" />
                        </v-col>
                        <v-col v-if="!isClient" cols="12" md="6" >
                            <v-select v-model="assignmentLevel" :items="assignmentOptions" item-title="title" item-value="value" label="Organizational assignment" @update:model-value="clearAssignment" />
                        </v-col>
                        <v-col v-if="!isClient && assignmentLevel !== 'none'" cols="12" md="6" >
                            <v-select v-model="assignmentId" :items="assignmentDisplayOptions" item-title="name" item-value="id" :label="assignmentLevel + ' assignment'" :rules="[rules.required]" :loading="loadingAssignments" />
                        </v-col>
                        <v-col v-if="!editingId" cols="12" >
                            <v-alert
                                type="info"
                                variant="tonal"
                                density="comfortable"
                            >
                                The temporary username and password will be emailed to the new user. Use a unique temporary password and ask them to change it immediately.
                            </v-alert>
                        </v-col>
                        <v-col cols="12">
                            <v-switch v-model="form.active" color="primary" label="Active account" hide-details />
                        </v-col>
                    </v-row>
                </v-form>
            </v-card-text>
            <v-divider />
            <v-card-actions class="pa-5">
                <v-spacer />
                <v-btn
                    variant="text"
                    @click="dialog = false"
                >
                    Cancel
                </v-btn>
                <v-btn
                    color="primary"
                    :loading="saving"
                    @click="save"
                >
                    {{ editingId ? 'Save changes' : 'Create user' }}
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <UserPermissionsDialog v-if="canPermissions" v-model="permissionsDialog" :user="permissionUser" @changed="onPermissionsChanged" />
</template>

<script setup lang="ts">
    import { useConfirm } from '@/composables/useConfirm'
    import { computed, onMounted, ref, watch } from 'vue'
    import { listOrganization, type OrganizationResource } from '@/services/organization'
    import { useAuthStore } from '@/stores/auth'
    import { USER_TYPE_CODES, normalizedCode } from '@/constants/organizationCodes'
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
    const assignmentOptionsList = ref<LookupOption[]>([])
    const loadingAssignments = ref(false)
    const lookupsLoading = ref(false)
    const lookupsLoaded = ref(false)
    const assignmentResources: Record<string, OrganizationResource> = {
        branch: 'branches',
        region: 'regions',
        territory: 'territories',
        island: 'islands',
    }
    async function loadAssignments(level: string) {
        assignmentOptionsList.value = []
        const resource = assignmentResources[level]
        if (!resource) {
            return
        }
        loadingAssignments.value = true
        try {
            assignmentOptionsList.value = await listOrganization(resource) as unknown as LookupOption[]
        }
        catch (e) { error.value = apiError(e, `Could not load ${level} options.`) }
        finally {
            loadingAssignments.value = false
        }
    }
    watch(assignmentLevel, level => { void loadAssignments(level) })
    const assignmentOptions = [
        { title: 'Head Office (none)', value: 'none' },
        { title: 'Branch', value: 'branch' },
        { title: 'Region', value: 'region' },
        { title: 'Territory', value: 'territory' },
        { title: 'Island', value: 'island' },
    ]
    function blank(): UserPayload {
        return { first_name: '', middle_name: null, last_name: '', username: '', email: '', password: '', password_confirmation: '', department_id: null, user_type_id: null, branch_id: null, region_id: null, territory_id: null, island_id: null, active: true }
    }
    const form = ref<UserPayload>(blank())
    const canCreate = computed(() => auth.canManageUsers('users.create'))
    const canUpdate = computed(() => auth.canManageUsers('users.update'))
    const canDelete = computed(() => auth.canManageUsers('users.delete'))
    const canPermissions = computed(() => auth.isSuperAdmin && auth.has('users.manage_permissions'))
    // Include the current record as a fallback if the lookup API is delayed or filtered.
    function optionsWithCurrent(options: LookupOption[], id: string | null | undefined, name: string | null | undefined): LookupOption[] {
        if (!id || options.some(option => option.id === id)) {
            return options
        }
        return name ? [{ id, name }, ...options] : options
    }
    const selectedUser = computed(() => rows.value.find(row => row.id === editingId.value))
    const departmentOptions = computed(() => optionsWithCurrent(departments.value, form.value.department_id, selectedUser.value?.department?.name))
    const userTypeOptions = computed(() => optionsWithCurrent(assignableTypes.value, form.value.user_type_id, selectedUser.value?.user_type?.name))
    const isClient = computed(() => {
        const type = userTypes.value.find(item => item.id === form.value.user_type_id)
        return normalizedCode(type?.code || selectedUser.value?.user_type?.code) === USER_TYPE_CODES.CLIENT
    })
    watch(isClient, client => {
        if (!client) {
            return
        }
        form.value.department_id = null
        form.value.branch_id = null
        form.value.region_id = null
        form.value.territory_id = null
        form.value.island_id = null
        assignmentLevel.value = 'none'
        assignmentId.value = ''
    })
    const assignmentDisplayOptions = computed(() => {
        const selected = selectedUser.value
        const level = assignmentLevel.value
        const relation = selected && level !== 'none' ? selected[level as 'branch' | 'region' | 'territory' | 'island'] : null
        return optionsWithCurrent(assignmentOptionsList.value, assignmentId.value, relation?.name)
    })
    const assignableTypes = computed(() => auth.isSuperAdmin ? userTypes.value : userTypes.value.filter(type => normalizedCode(type.code) !== USER_TYPE_CODES.SUPER_ADMIN))
    const headers = [
        { title: 'User', key: 'full_name' }, { title: 'Email', key: 'email' },
        { title: 'Department', key: 'department' }, { title: 'User type', key: 'user_type' },
        { title: 'Status', key: 'active' }, { title: 'Actions', key: 'actions', sortable: false, align: 'end' as const },
    ]
    function fullName(u: UserRecord): string { return [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ') || u.name || u.username }
    const filtered = computed(() => {
        const term = search.value.trim().toLowerCase()
        if (!term) {
            return rows.value
        }
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
        lookupsLoading.value = true
       try {
           [departments.value, userTypes.value] = await Promise.all([listDepartments(), listUserTypes()]); lookupsLoaded.value = true
       }
        catch (e) {
            error.value = apiError(e, 'Could not load user types or departments.')
        }
       finally {
           lookupsLoading.value = false
       }
    }
    function clearAssignment() { assignmentId.value = '' }
    async function openCreate() {
       if (!lookupsLoaded.value) {
           await loadLookups()
       }
       if (!lookupsLoaded.value) {
           return
       }
 editingId.value = null; form.value = blank(); assignmentLevel.value = 'none'; assignmentId.value = ''; dialog.value = true }
    async function openEdit(u: UserRecord) {
       if (!lookupsLoaded.value) {
           await loadLookups()
       }
       if (!lookupsLoaded.value) {
           return
       }
        editingId.value = u.id
        form.value = { first_name: u.first_name || '', middle_name: u.middle_name || null, last_name: u.last_name || '', username: u.username, email: u.email, password: '', password_confirmation: '', department_id: u.department_id, user_type_id: u.user_type_id, branch_id: u.branch_id || null, region_id: u.region_id || null, territory_id: u.territory_id || null, island_id: u.island_id || null, active: Boolean(u.active) }
        const found = (['branch', 'region', 'territory', 'island'] as const).find(level => Boolean(u[`${level}_id`]))
        assignmentLevel.value = found || 'none'
        assignmentId.value = found ? u[`${found}_id`] || '' : ''
        dialog.value = true
    }
    async function save() {
        const result = await userForm.value?.validate()
        if (!result?.valid) {
            return
        }
        if (!isClient.value && assignmentLevel.value !== 'none' && !assignmentId.value.trim()) { error.value = 'Provide an organizational assignment UUID.'; return }
        if (saving.value) {
            return
        }
        const updating = Boolean(editingId.value)
        const approved = await confirm({
            title: updating ? 'Confirm user update' : 'Confirm user creation',
            message: updating ? `Save changes to ${form.value.first_name} ${form.value.last_name}?` : `Create user ${form.value.first_name} ${form.value.last_name}?`,
            confirmText: updating ? 'Save changes' : 'Create user',
            color: 'primary',
        })
        if (!approved || saving.value) {
            return
        }
        saving.value = true; error.value = ''
        try {
            const payload: UserPayload = { ...form.value, branch_id: null, region_id: null, territory_id: null, island_id: null }
            if (isClient.value) {
                payload.department_id = null
            }
            if (!isClient.value && assignmentLevel.value !== 'none') {
                (payload as any)[`${assignmentLevel.value}_id`] = assignmentId.value.trim()
            }
            if (editingId.value && !payload.password) {
                delete payload.password
                delete payload.password_confirmation
            }
            if (editingId.value) {
                await updateUser(editingId.value, payload)
            }
            else await createUser(payload)
            dialog.value = false; message(editingId.value ? 'User updated.' : 'User created.'); await refresh()
        } catch (e) { error.value = apiError(e, 'Could not save user.') }
        finally {
            saving.value = false
        }
    }
    const { confirm } = useConfirm()
    async function requestDelete(item: UserRecord) {
        const approved = await confirm({ title: 'Delete user?', message: `Delete ${fullName(item)}? This action may be irreversible.`, confirmText: 'Delete' })
        if (!approved) {
            return
        }
        deleting.value = item
        await confirmDelete()
    }
    async function confirmDelete() {
        if (!deleting.value) {
            return
        }
        saving.value = true; error.value = ''
        try {
            await deleteUser(deleting.value.id);  deleting.value = null; message('User deleted.'); await refresh()
        }
        catch (e) {
            error.value = apiError(e, 'Could not delete user.')
        }
        finally {
            saving.value = false
        }
    }
    function openPermissions(user: UserRecord) { permissionUser.value = user; permissionsDialog.value = true }
    function onPermissionsChanged() { message('Permissions updated.') }
    onMounted(async () => { await Promise.all([refresh(), loadLookups()]) })
</script>

<template>
    <div class="d-flex justify-space-between align-center flex-wrap ga-3 mb-6">
        <div>
            <h1 class="text-h4 font-weight-bold">
                User Types
            </h1>
            <p class="text-medium-emphasis">
                Manage user type records
            </p>
        </div>
        <v-btn
            v-if="canCreate"
            color="primary"
            prepend-icon="mdi-plus"
            @click="openCreate"
        >
            Add User Type
        </v-btn>
    </div>
    <v-alert
        v-if="error"
        type="error"
        variant="tonal"
        class="mb-4"
    >
        {{ error }}
    </v-alert>
    <v-snackbar
        v-model="showNotice"
        color="success"
    >
        {{ notice }}
    </v-snackbar>
    <v-card class="pa-4 pa-md-5">
        <div class="d-flex ga-3 mb-4">
            <v-text-field v-model="search" label="Search" prepend-inner-icon="mdi-magnify" hide-details clearable />
            <v-btn icon="mdi-refresh" variant="text" :loading="loading" @click="loadRecords" />
        </div>
        <v-data-table
            :headers="headers"
            :items="filtered"
            :loading="loading"
            item-value="id"
        >
            <template #item.actions="{ item }">
                <div class="d-flex justify-end ga-1">
                    <v-btn v-if="canUpdate" icon="mdi-pencil-outline" variant="text" size="small" @click="openEdit(item)" />
                    <v-btn v-if="canDelete" icon="mdi-delete-outline" variant="text" color="error" size="small" @click="requestDelete(item)" />
                </div>
            </template>
        </v-data-table>
    </v-card>
    <v-dialog
        v-model="dialog"
        max-width="570"
        scrollable
    >
        <v-card class="pa-6">
            <h2 class="text-h6 mb-4">
                {{ editingId ? 'Edit' : 'Add' }} User Type
            </h2>
            <v-alert
                v-if="dialogError"
                type="error"
                variant="tonal"
                class="mb-3"
            >
                {{ dialogError }}
            </v-alert>
            <v-form
                ref="formRef"
                @submit.prevent="save"
            >
                <v-text-field v-model="form.name" label="Name" :maxlength="255" counter :rules="[required]" />
                <v-text-field v-model="form.code" label="Code" :maxlength="255" counter :rules="[required]" />
                <div class="d-flex justify-end ga-2 mt-5">
                    <v-btn
                        variant="text"
                        @click="dialog = false"
                    >
                        Cancel
                    </v-btn>
                    <v-btn
                        color="primary"
                        type="submit"
                        :loading="saving"
                    >
                        Save
                    </v-btn>
                </div>
            </v-form>
        </v-card>
    </v-dialog>
</template>

<script setup lang="ts">
import { useConfirm } from '@/composables/useConfirm'
import { computed, onMounted, ref } from 'vue'
import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { listOrganization, createOrganization, updateOrganization, deleteOrganization, type OrganizationRecord } from '@/services/organization'

const auth = useAuthStore()
const resource = 'user-types' as const
const canCreate = computed(() => auth.has('user_types.create'))
const canUpdate = computed(() => auth.has('user_types.update'))
const canDelete = computed(() => auth.has('user_types.delete'))
const rows = ref<OrganizationRecord[]>([])
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')
const dialogError = ref('')
const notice = ref('')
const showNotice = ref(false)
const dialog = ref(false)

const deleting = ref<OrganizationRecord | null>(null)
const editingId = ref<string | null>(null)
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const required = (value: unknown) => (value !== null && value !== undefined && String(value).trim().length > 0) || 'Required'


function emptyForm() {
    return {
    name: '',
    code: '',
    }
}
const form = ref<Record<string, any>>(emptyForm())
const headers = [
    { title: 'Name', key: 'name' },
    { title: 'Code', key: 'code' },
    { title: 'Actions', key: 'actions', sortable: false as const, align: 'end' as const },
]
const filtered = computed(() => rows.value.filter(item => JSON.stringify(item).toLowerCase().includes(search.value.toLowerCase())))

function relationName(item: OrganizationRecord, key: string): string | undefined {
    const relation = item[key]
    if (relation && typeof relation === 'object' && 'name' in relation && typeof relation.name === 'string') {
        return relation.name
    }
    return undefined
}
function errorMessage(e: unknown): string {
    if (axios.isAxiosError(e)) {
        const errors = e.response?.data?.errors
        if (errors && typeof errors === 'object') {
            return Object.values(errors).flat().join(' ')
        }
        return e.response?.data?.message ?? e.message
    }
    return 'An unexpected error occurred.'
}
async function loadRecords() {
    loading.value = true
    error.value = ''
    try {
        rows.value = await listOrganization(resource)
    }
    catch (e) {
        error.value = errorMessage(e)
    }
    finally {
        loading.value = false
    }
}
async function loadLookups() {
    try {
        // No relationship dropdowns for this module.
    } catch (e) { dialogError.value = errorMessage(e) }
}
function openCreate() {
    editingId.value = null
    form.value = emptyForm()
    dialogError.value = ''
    dialog.value = true
    void loadLookups()
}
function openEdit(item: OrganizationRecord) {
    editingId.value = item.id
    form.value = {
        name: item.name ?? '',
        code: item.code ?? '',
    }
    dialogError.value = ''
    dialog.value = true
    void loadLookups()
}
async function save() {
    const result = await formRef.value?.validate()
    if (!result?.valid) {
        return
    }
    if (saving.value) {
        return
    }
    const updating = Boolean(editingId.value)
    const approved = await confirm({
        title: updating ? 'Confirm update' : 'Confirm creation',
        message: updating ? 'Save changes to this user type?' : 'Create this user type?',
        confirmText: updating ? 'Save changes' : 'Create',
        color: 'primary',
    })
    if (!approved || saving.value) {
        return
    }
    saving.value = true
    dialogError.value = ''
    try {
        const payload = Object.fromEntries(Object.entries(form.value).filter(([, value]) => value !== ''))
        if (editingId.value) {
            await updateOrganization(resource, editingId.value, payload)
        }
        else await createOrganization(resource, payload)
        dialog.value = false
        notice.value = 'User Type saved successfully.'
        showNotice.value = true
        await loadRecords()
    } catch (e) { dialogError.value = errorMessage(e) }
    finally {
        saving.value = false
    }
}
const { confirm } = useConfirm()
async function requestDelete(item: OrganizationRecord) {
    const label = String(item.name ?? item.code ?? item.id)
    const approved = await confirm({ title: 'Confirm deletion', message: `Delete ${label}? This action may be irreversible.`, confirmText: 'Delete' })
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
    saving.value = true
    error.value = ''
    try {
        await deleteOrganization(resource, deleting.value.id)
        
        notice.value = 'User Type deleted successfully.'
        showNotice.value = true
        await loadRecords()
    } catch (e) { error.value = errorMessage(e);  }
    finally {
        saving.value = false
    }
}
onMounted(loadRecords)
</script>

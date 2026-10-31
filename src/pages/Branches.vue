<template>
    <div class="d-flex justify-space-between align-center flex-wrap ga-3 mb-6">
        <div>
            <h1 class="text-h4 font-weight-bold">
                Branches
            </h1>
            <p class="text-medium-emphasis">
                Manage branch records
            </p>
        </div>
        <v-btn
            v-if="canCreate"
            color="primary"
            prepend-icon="mdi-plus"
            :loading="openingDialog"
            @click="openCreate"
        >
            Add Branch
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
            <template #item.region_id="{ item }">
                {{ relationName(item, "region") ?? region_idOptions.find(option => option.id === item.region_id)?.name ?? '—' }}
            </template>
            <template #item.actions="{ item }">
                <div class="d-flex justify-end ga-1">
                    <v-btn v-if="canUpdate" icon="mdi-pencil-outline" variant="text" size="small" :disabled="openingDialog" @click="openEdit(item)" />
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
                {{ editingId ? 'Edit' : 'Add' }} Branch
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
                <v-text-field v-model="form.address" label="Address" :maxlength="255" counter :rules="[required]" />
                <v-select v-model="form.region_id" label="Region" :items="region_idOptions" item-title="name" item-value="id" clearable />
                <v-switch v-model="form.active" label="Active" color="primary" />
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
const resource = 'branches' as const
const canCreate = computed(() => auth.has('branches.create'))
const canUpdate = computed(() => auth.has('branches.update'))
const canDelete = computed(() => auth.has('branches.delete'))
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

const deleting = ref<OrganizationRecord | null>(null)
const editingId = ref<string | null>(null)
const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)
const required = (value: unknown) => (value !== null && value !== undefined && String(value).trim().length > 0) || 'Required'
const region_idOptions = ref<OrganizationRecord[]>([])

function emptyForm() {
    return {
    name: '',
    code: '',
    address: '',
    region_id: null,
    active: true,
    }
}
const form = ref<Record<string, any>>(emptyForm())
const headers = [
    { title: 'Name', key: 'name' },
    { title: 'Code', key: 'code' },
    { title: 'Address', key: 'address' },
    { title: 'Region', key: 'region_id' },
    { title: 'Active', key: 'active' },
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
async function loadLookups(item?: OrganizationRecord) {
    // Resolve all labels before mounting the edit form.
    const results = await Promise.all([
        listOrganization('regions'),
    ])
    region_idOptions.value = results[0] ?? []
    if (item) {
        const selectedId = item.region_id
        const related = item['region']
        if (selectedId && !region_idOptions.value.some(option => option.id === selectedId)
          && related && typeof related === 'object' && 'name' in related && typeof related.name === 'string') {
            region_idOptions.value = [...region_idOptions.value, { id: String(selectedId), name: related.name }]
        }
    }
}
async function openCreate() {
    if (openingDialog.value) {
        return
    }
    openingDialog.value = true
    dialogError.value = ''
    try {
        await loadLookups()
        editingId.value = null
        form.value = emptyForm()
        dialog.value = true
    } catch (e) { error.value = `Unable to load dropdown options: ${errorMessage(e)}` }
    finally {
        openingDialog.value = false
    }
}
async function openEdit(item: OrganizationRecord) {
    if (openingDialog.value) {
        return
    }
    openingDialog.value = true
    dialogError.value = ''
    try {
        await loadLookups(item)
        editingId.value = item.id
        form.value = {
            name: item.name ?? '',
            code: item.code ?? '',
            address: item.address ?? '',
            region_id: item.region_id ?? null,
            active: item.active ?? true,
        }
        dialog.value = true
    } catch (e) { error.value = `Unable to load dropdown options: ${errorMessage(e)}` }
    finally {
        openingDialog.value = false
    }
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
        message: updating ? 'Save changes to this branche?' : 'Create this branche?',
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
        notice.value = 'Branch saved successfully.'
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
        
        notice.value = 'Branch deleted successfully.'
        showNotice.value = true
        await loadRecords()
    } catch (e) { error.value = errorMessage(e);  }
    finally {
        saving.value = false
    }
}
onMounted(loadRecords)
</script>

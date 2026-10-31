<template>
    <div>
        <div class="d-flex flex-wrap align-center justify-space-between ga-3 mb-5">
            <div>
                <h1 class="text-h5 font-weight-bold">
                    Audit Logs
                </h1>
                <p class="text-body-2 text-medium-emphasis">
                    Read-only history of business and security activity.
                </p>
            </div>
            <v-btn
                prepend-icon="mdi-refresh"
                variant="tonal"
                :loading="loading"
                @click="load"
            >
                Refresh
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
        <v-card
            rounded="lg"
            class="mb-5 pa-4"
        >
            <v-row dense>
                <v-col cols="12" sm="6" lg="4" >
                    <v-select v-model="filters.event" :items="eventOptions" label="Action" placeholder="All actions" clearable density="comfortable" hide-details="auto" />
                </v-col>
                <v-col cols="12" sm="6" lg="4" >
                    <v-autocomplete v-model="filters.actor_id" v-model:search="actorSearch" :items="actorOptions" item-title="label" item-value="id" label="Select user" placeholder="Search name or username" density="comfortable" clearable hide-details="auto" :loading="actorLoading" no-filter @update:search="lookupActors" />
                </v-col>
                <v-col cols="12" sm="6" lg="4" >
                    <v-text-field v-model="filters.from" type="date" label="From date (UTC)" density="comfortable" hide-details="auto" />
                </v-col>
                <v-col cols="12" sm="6" lg="4" >
                    <v-text-field v-model="filters.to" type="date" label="To date (UTC)" density="comfortable" hide-details="auto" />
                </v-col>
                <v-col cols="12" sm="6" lg="4" >
                    <v-text-field v-model="filters.request_id" label="Request ID" placeholder="Search request ID" clearable density="comfortable" hide-details="auto" />
                </v-col>
                <v-col cols="12" sm="6" lg="4" >
                    <v-text-field v-model="filters.ip_address" label="IP address" placeholder="Search IP address" clearable density="comfortable" hide-details="auto" />
                </v-col>
            </v-row>
            <div class="d-flex flex-wrap ga-2 mt-4">
                <v-btn
                    color="primary"
                    prepend-icon="mdi-magnify"
                    :loading="loading"
                    @click="search"
                >
                    Apply filters
                </v-btn>
                <v-btn
                    variant="text"
                    prepend-icon="mdi-filter-off-outline"
                    @click="reset"
                >
                    Clear filters
                </v-btn>
            </div>
        </v-card>
        <v-card
            rounded="lg"
            overflow="hidden"
        >
            <div class="d-flex align-center justify-space-between flex-wrap ga-2 px-4 py-3">
                <div class="font-weight-medium">
                    Activity history
                </div>
                <span class="text-caption text-medium-emphasis">
                    {{ total }} records
                </span>
            </div>
            <v-divider />
            <v-table
                density="comfortable"
                class="audit-table"
            >
                <thead>
                    <tr>
                        <th>
                            Employee
                        </th>
                        <th>
                            Action
                        </th>
                        <th>
                            Subject
                        </th>
                        <th>
                            IP address
                        </th>
                        <th>
                            Timestamp (UTC)
                        </th>
                        <th class="text-end">
                            Details
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr
                        v-for="entry in records"
                        :key="entry.id"
                    >
                        <td>
                            <div class="d-flex align-center ga-3 py-2">
                                <v-avatar
                                    color="primary"
                                    variant="tonal"
                                    size="34"
                                >
                                    <span class="text-caption font-weight-bold">
                                        {{ initials(actorLabel(entry)) }}
                                    </span>
                                </v-avatar>
                                <div class="audit-employee">
                                    <div class="font-weight-medium">
                                        {{ actorLabel(entry) }}
                                    </div>
                                    <div class="text-caption text-medium-emphasis">
                                        {{ actorUsername(entry) }}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td>
                            <v-chip
                                size="small"
                                variant="tonal"
                                :color="eventColor(entry.event)"
                            >
                                {{ friendlyEvent(entry.event) }}
                            </v-chip>
                        </td>
                        <td>
                            {{ subjectName(entry.subject_type) }}
                        </td>
                        <td class="text-no-wrap">
                            {{ entry.ip_address || '—' }}
                        </td>
                        <td class="text-no-wrap">
                            {{ entry.created_at }}
                        </td>
                        <td class="text-end">
                            <v-btn
                                size="small"
                                variant="text"
                                color="primary"
                                @click="selected = entry"
                            >
                                View
                            </v-btn>
                        </td>
                    </tr>
                    <tr v-if="!loading && records.length === 0">
                        <td
                            colspan="6"
                            class="text-center text-medium-emphasis py-8"
                        >
                            No matching audit records.
                        </td>
                    </tr>
                </tbody>
            </v-table>
            <v-divider />
            <div class="d-flex align-center justify-end flex-wrap ga-3 pa-3">
                <span class="text-caption text-medium-emphasis">
                    Page {{ page }} of {{ lastPage }}
                </span>
                <v-btn
                    size="small"
                    variant="outlined"
                    :disabled="page <= 1 || loading"
                    @click="go(page - 1)"
                >
                    Previous
                </v-btn>
                <v-btn
                    size="small"
                    variant="outlined"
                    :disabled="page >= lastPage || loading"
                    @click="go(page + 1)"
                >
                    Next
                </v-btn>
            </div>
        </v-card>
        <v-dialog
            :model-value="!!selected"
            max-width="900"
            scrollable
            @update:model-value="value => { if (!value) selected = null }"
        >
            <v-card
                v-if="selected"
                rounded="lg"
            >
                <v-card-title class="d-flex align-center justify-space-between px-5 py-4">
                    <span class="text-h6 font-weight-bold">
                        Audit event details
                    </span>
                    <v-btn icon="mdi-close" variant="text" size="small" aria-label="Close details" @click="selected = null" />
                </v-card-title>
                <v-divider />
                <v-card-text class="pa-5 audit-detail-scroll">
                    <v-row dense class="mb-3" >
                        <v-col cols="12" sm="6" >
                            <div class="audit-meta-label">
                                Action
                            </div>
                            <v-chip
                                size="small"
                                variant="tonal"
                                :color="eventColor(selected.event)"
                            >
                                {{ friendlyEvent(selected.event) }}
                            </v-chip>
                        </v-col>
                        <v-col cols="12" sm="6" >
                            <div class="audit-meta-label">
                                Employee
                            </div>
                            <div class="audit-meta-value">
                                {{ actorLabel(selected) }}
                            </div>
                            <div class="text-caption text-medium-emphasis">
                                {{ actorUsername(selected) }}
                            </div>
                        </v-col>
                        <v-col cols="12" sm="6" >
                            <div class="audit-meta-label">
                                Timestamp (UTC)
                            </div>
                            <div class="audit-meta-value">
                                {{ selected.created_at }}
                            </div>
                        </v-col>
                        <v-col cols="12" sm="6" >
                            <div class="audit-meta-label">
                                IP address
                            </div>
                            <div class="audit-meta-value">
                                {{ selected.ip_address || '—' }}
                            </div>
                        </v-col>
                        <v-col cols="12">
                            <div class="audit-meta-label">
                                Request ID
                            </div>
                            <div class="audit-meta-value audit-break">
                                {{ selected.request_id || '—' }}
                            </div>
                        </v-col>
                        <v-col cols="12">
                            <div class="audit-meta-label">
                                Affected record
                            </div>
                            <div class="audit-meta-value audit-break">
                                {{ selected.subject_type || '—' }} / {{ selected.subject_id || '—' }}
                            </div>
                        </v-col>
                    </v-row>
                    <section
                        v-for="section in detailSections"
                        :key="section.key"
                        class="mb-4"
                    >
                        <div class="d-flex align-center justify-space-between ga-2 mb-2">
                            <h3 class="text-subtitle-1 font-weight-bold">
                                {{ section.title }}
                            </h3>
                            <v-btn
                                size="small"
                                variant="text"
                                prepend-icon="mdi-content-copy"
                                @click="copyJson(section.value)"
                            >
                                Copy JSON
                            </v-btn>
                        </div>
                        <div class="audit-json-panel">
                            <pre>
                                {{ pretty(section.value) }}
                            </pre>
                        </div>
                    </section>
                </v-card-text>
                <v-divider />
                <v-card-actions class="px-5 py-3">
                    <v-spacer />
                    <v-btn
                        variant="tonal"
                        @click="selected = null"
                    >
                        Close
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { api } from '@/services/api'

type AuditEntry = {
  actor_name?: string | null; actor_username?: string | null
  actor?: { first_name?: string; middle_name?: string; last_name?: string; username?: string } | null
  id: string; created_at: string; event: string; actor_id: string | null
  ip_address: string | null; request_id: string | null
  subject_type: string | null; subject_id: string | null
  old_values: unknown; new_values: unknown; context: unknown
}
const records = ref<AuditEntry[]>([])
const actorOptions = ref<{ id: string; label: string }[]>([])
const actorSearch = ref('')
const actorLoading = ref(false)
let actorQuerySequence = 0
function actorLabel(entry: AuditEntry): string {
  const user = entry.actor
  const name = user ? [user.first_name, user.middle_name, user.last_name].filter(Boolean).join(' ').trim() : ''
  return entry.actor_name || name || entry.actor_username || user?.username || entry.actor_id || 'System / unknown'
}
function actorUsername(entry: AuditEntry): string { return entry.actor_username || entry.actor?.username || '' }
function initials(name: string): string { return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase() || '').join('') || '?' }
function subjectName(value: string | null): string { return value?.split('\\').pop() || '—' }
function friendlyEvent(value: string): string { return value.replace(/^model\./i, '').replace(/[._-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) }
function eventColor(value: string): string {
  const event = value.toLowerCase()
  if (event.includes('delet') || event.includes('denied') || event.includes('fail')) {
      return 'error'
  }
  if (event.includes('creat') || event.includes('login')) {
      return 'success'
  }
  if (event.includes('updat')) {
      return 'info'
  }
  return 'secondary'
}
const selected = ref<AuditEntry | null>(null)
const detailSections = computed(() => selected.value ? [
  { key: 'old', title: 'Old values', value: selected.value.old_values },
  { key: 'new', title: 'New values', value: selected.value.new_values },
  { key: 'context', title: 'Context', value: selected.value.context },
] : [])
function pretty(value: unknown): string {
  if (value === null || value === undefined || value === '') {
      return 'No data recorded'
  }
  if (typeof value === 'string') {
    try { return JSON.stringify(JSON.parse(value), null, 2) } catch { return value }
  }
  return JSON.stringify(value, null, 2) ?? 'No data recorded'
}
async function copyJson(value: unknown) {
  try { await navigator.clipboard.writeText(pretty(value)) } catch { /* Clipboard permissions may prevent copying. */ }
}
async function lookupActors(value: string) {
  const seq = ++actorQuerySequence
  actorLoading.value = true
  try {
    const { data } = await api.get('/audit-logs/actors', { params: { search: value || '' } })
    if (seq !== actorQuerySequence) {
        return
    }
    const items = (data.data ?? []) as { id: string; first_name?: string; middle_name?: string; last_name?: string; username?: string }[]
    const previous = actorOptions.value.find(x => x.id === filters.actor_id)
    actorOptions.value = items.map(u => ({ id: u.id, label: `${[u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ')} (${u.username ?? u.id})` }))
    if (previous && !actorOptions.value.some(x => x.id === previous.id)) {
        actorOptions.value.push(previous)
    }
  } catch { if (seq === actorQuerySequence) actorOptions.value = [] }
  finally {
      if (seq === actorQuerySequence) actorLoading.value = false
  }
}
const loading = ref(false)
const error = ref('')
const total = ref(0)
const page = ref(1)
const lastPage = ref(1)
const filters = reactive({ request_id: '', actor_id: '', event: '', ip_address: '', from: '', to: '' })
const eventOptions = [
  { title: 'Created', value: 'model.created' },
  { title: 'Updated', value: 'model.updated' },
  { title: 'Deleted', value: 'model.deleted' },
  { title: 'Login', value: 'auth.login' },
  { title: 'Logout', value: 'auth.logout' },
  { title: 'Failed login', value: 'auth.login_failed' },
  { title: 'Access denied', value: 'auth.access_denied' },
]
async function load() {
  loading.value = true; error.value = ''
  try {
    const params: Record<string, string | number> = { page: page.value, per_page: 25 }
    for (const [key, value] of Object.entries(filters)) if (value) params[key] = value
    const response = await api.get('/audit-logs', { params })
    records.value = response.data.data ?? []
    total.value = response.data.total ?? 0
    lastPage.value = Math.max(1, response.data.last_page ?? 1)
  } catch { error.value = 'Unable to load audit logs. Check your access or filter values.'; records.value = [] }
  finally {
      loading.value = false
  }
}
function search() { page.value = 1; void load() }
function reset() { Object.assign(filters, { request_id: '', actor_id: '', event: '', ip_address: '', from: '', to: '' }); actorSearch.value = ''; search() }
function go(next: number) { page.value = next; void load() }
onMounted(() => { void load(); void lookupActors('') })
</script>

<style scoped>
.audit-table { overflow-x: auto; }
.audit-table :deep(th) { white-space: nowrap; font-weight: 600; }
.audit-table :deep(td) { vertical-align: middle; }
.audit-employee { min-width: 155px; max-width: 260px; }
.audit-meta-label { font-size: .75rem; color: rgb(var(--v-theme-on-surface)); opacity: .65; margin-bottom: 4px; }
.audit-meta-value { font-size: .9rem; line-height: 1.5; }
.audit-break { overflow-wrap: anywhere; }
.audit-detail-scroll { max-height: min(75vh, 740px); }
.audit-json-panel { background: rgba(var(--v-theme-on-surface), .055); border: 1px solid rgba(var(--v-theme-on-surface), .11); border-radius: 10px; padding: 14px 16px; max-height: 290px; min-height: 96px; overflow: auto; }
.audit-json-panel pre { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; font-size: .8rem; line-height: 1.65; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
</style>

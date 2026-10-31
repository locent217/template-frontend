<template>
    <div class="page-heading mb-7">
        <div>
            <h1 class="text-h4 font-weight-bold">
                Dashboard
            </h1>
            <p class="text-medium-emphasis mt-1">
                Overview of your workspace · {{ today }}
            </p>
        </div>
        <v-chip
            color="primary"
            variant="tonal"
            prepend-icon="mdi-chart-line"
        >
            Demo data
        </v-chip>
    </div>
    <v-row>
        <v-col v-for="card in cards" :key="card.label" cols="12" sm="6" xl="3" >
            <v-card class="dashboard-card pa-5">
                <div class="d-flex justify-space-between">
                    <div>
                        <div class="text-body-2 text-medium-emphasis">
                            {{ card.label }}
                        </div>
                        <div class="text-h4 font-weight-bold mt-3">
                            {{ card.value }}
                        </div>
                        <div
                            class="text-caption mt-2"
                            :style="{ color: card.color }"
                        >
                            {{ card.change }} this month
                        </div>
                    </div>
                    <v-avatar
                        :color="card.color"
                        variant="tonal"
                        rounded="lg"
                        size="48"
                    >
                        <v-icon :icon="card.icon" size="25" />
                    </v-avatar>
                </div>
            </v-card>
        </v-col>
    </v-row>
    <v-row class="mt-2">
        <v-col cols="12" lg="8" >
            <v-card
                class="dashboard-card pa-6"
                height="365"
            >
                <div class="d-flex justify-space-between align-center">
                    <div>
                        <div class="text-h6 font-weight-bold">
                            Activity Overview
                        </div>
                        <div class="text-body-2 text-medium-emphasis">
                            Illustrative monthly performance
                        </div>
                    </div>
                    <v-chip
                        size="small"
                        variant="outlined"
                    >
                        2026
                    </v-chip>
                </div>
                <div class="chart-bars mt-9">
                    <div
                        v-for="(height, i) in bars"
                        :key="i"
                        class="chart-column"
                    >
                        <div class="chart-bar" :style="{ height: `${height}%` }" />
                        <span>
                            {{ ['J','F','M','A','M','J','J','A','S','O','N','D'][i] }}
                        </span>
                    </div>
                </div>
            </v-card>
        </v-col>
        <v-col cols="12" lg="4" >
            <v-card
                class="dashboard-card pa-6"
                height="365"
            >
                <div class="text-h6 font-weight-bold mb-5">
                    Recent Activity
                </div>
                <v-timeline
                    side="end"
                    density="compact"
                    truncate-line="both"
                    align="start"
                >
                    <v-timeline-item
                        v-for="item in activity"
                        :key="item.title"
                        :dot-color="item.color"
                        size="x-small"
                    >
                        <div class="text-body-2 font-weight-medium">
                            {{ item.title }}
                        </div>
                        <div class="text-caption text-medium-emphasis">
                            {{ item.detail }}
                        </div>
                        <div class="text-caption text-medium-emphasis mt-1">
                            {{ item.time }}
                        </div>
                    </v-timeline-item>
                </v-timeline>
            </v-card>
        </v-col>
    </v-row>
</template>

<script setup lang="ts">
    import { computed } from 'vue'
    const cards = [
        { label: 'Total Users', value: '1,248', change: '+12.8%', icon: 'mdi-account-group-outline', color: '#8955f6' },
        { label: 'Active Sessions', value: '342', change: '+6.4%', icon: 'mdi-monitor-dashboard', color: '#3b82f6' },
        { label: 'Transactions', value: '8,624', change: '+18.2%', icon: 'mdi-swap-horizontal', color: '#16a085' },
        { label: 'Pending Requests', value: '38', change: '-3.1%', icon: 'mdi-clock-outline', color: '#ed9a31' },
    ]
    const bars = [35, 54, 46, 72, 59, 88, 67, 78, 60, 93, 75, 85]
    const activity = [
        { title: 'New user registered', detail: 'An account was added to the system', time: '10 minutes ago', color: 'primary' },
        { title: 'Monthly report generated', detail: 'Operations report is ready', time: '1 hour ago', color: 'success' },
        { title: 'Permission settings updated', detail: 'A user role was modified', time: 'Yesterday', color: 'info' },
    ]
    const today = computed(() => new Intl.DateTimeFormat('en-US', { dateStyle: 'full' }).format(new Date()))
</script>

<template>
  <main class="dashboard-page">
    <header class="header">
      <div class="left-info">
        <span
          class="status-tag"
          :class="{ 'status-paused': !autoRefresh }"
        >
          ● {{ autoRefresh ? '自动刷新已开启' : '自动刷新已关闭' }}
        </span>
        <span class="connection-status" :class="`status-${connectionStatus.type}`">
          {{ connectionStatus.text }}
        </span>
      </div>

      <h1>智能无感出入库终端</h1>

      <div class="action-container">
        <input
          id="auto-refresh"
          v-model="autoRefresh"
          type="checkbox"
          class="switch-checkbox"
          @change="toggleAutoRefresh(autoRefresh)"
        >
        <label for="auto-refresh" class="switch-wrapper">
          <span class="tech-switch"></span>
          <span class="switch-label">自动刷新</span>
        </label>

        <button
          class="btn-circle"
          type="button"
          title="手动刷新"
          :disabled="loading"
          @click="manualRefresh"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M17.65 6.35A7.95 7.95 0 0 0 12 4a8 8 0 1 0 7.73 10h-2.08A6 6 0 1 1 12 6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35Z" />
          </svg>
        </button>

        <button
          class="btn-sync"
          type="button"
          :disabled="syncLoading"
          @click="syncToolInfo"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 18a6 6 0 1 0-6-6 6 6 0 0 0 6 6Zm0-16A10 10 0 1 1 2 12 10 10 0 0 1 12 2Zm-1 4.5h1.5v5H17V13h-6V6.5Z" />
          </svg>
          {{ syncLoading ? '同步中...' : '同步工具信息' }}
        </button>
      </div>
    </header>

    <section class="main-container">
      <section class="left-column-large">
        <div class="kpi-container">
          <button class="kpi-box" type="button" @click="openToolsDialog('all')">
            <span class="label">工器具总数</span>
            <span class="value color-total">
              {{ statistics.totalTools || 0 }}
              <span>件</span>
            </span>
          </button>
          <div class="kpi-box">
            <span class="label">出入库记录</span>
            <span class="value color-borrow">
              {{ statistics.toolRecords || toolRecords.length }}
              <span>条</span>
            </span>
          </div>
          <div class="kpi-box">
            <span class="label">未归还数量</span>
            <span class="value color-return">
              {{ statistics.unreturnedCount || 0 }}
              <span>件</span>
            </span>
          </div>
          <button class="kpi-box" type="button" @click="openToolsDialog('overdue')">
            <span class="label">逾期工具</span>
            <span class="value color-overdue">
              {{ statistics.overdueTools || 0 }}
              <span>件</span>
            </span>
          </button>
        </div>

        <section class="tech-card records-card">
          <div class="card-title">
            当日日任务工具清单
            <span class="count-badge">{{ toolRecords.length }} 条</span>
            <span
              v-if="newRecordsCount > 0"
              class="new-record-badge"
            >
              新增 {{ newRecordsCount }}
            </span>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>计划状态</th>
                  <th>任务名称</th>
                  <th>工具名称</th>
                  <th>领用人</th>
                  <th>领用时间</th>
                  <th>归还人</th>
                  <th>归还时间</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading && !toolRecords.length">
                    <td colspan="7">
                    <div class="table-empty">加载中...</div>
                  </td>
                </tr>
                <tr v-else-if="!toolRecords.length">
                    <td colspan="7">
                    <div class="table-empty">暂无日任务工具清单</div>
                  </td>
                </tr>
                <tr
                  v-for="(row, index) in toolRecords"
                  v-else
                  :key="row.id || `${row.taskToolId || 'task-tool'}-${index}`"
                  :class="{ 'new-record-row': isNewRecord(row.id) }"
                >
                  <td>
                    <span class="plan-status">{{ row.planStatus || '未领用' }}</span>
                  </td>
                  <td>{{ row.jobName || '-' }}</td>
                  <td>
                    <span :class="{ 'unmatched-tool-name': isUnmatchedToolName(row) }">
                      {{ getDisplayToolName(row) }}
                    </span>
                  </td>
                  <td class="person">{{ row.usePersonName || '-' }}</td>
                  <td>{{ row.useTime || '-' }}</td>
                  <td class="returner">{{ row.returnPersonName || '-' }}</td>
                  <td>
                    <span v-if="row.returnTime">{{ row.returnTime }}</span>
                    <span v-else class="warning-text">未归还</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>

      <aside class="right-column-small">
        <section class="tech-card chart-card">
          <div class="card-title">工具数据监控</div>
          <div class="chart-shell">
            <div ref="toolsChartRef" class="chart-container"></div>
            <div v-if="toolsLoading && !tools.length" class="chart-loading">加载工具数据...</div>
          </div>
        </section>

        <section class="tech-card active-tools-card">
          <div class="card-title">
            当前识别工具
            <span class="count-badge">{{ activeRedisTools.length }} 条</span>
          </div>

          <div
            v-if="activeToolsLoading && !activeRedisTools.length"
            class="empty-holder"
          >
            <svg class="empty-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a10 10 0 1 1-10 10A10 10 0 0 1 12 2Zm0 2a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm-1 7h2v7h-2v-7Zm0-4h2v2h-2V7Z" />
            </svg>
            <span>加载当前识别工具...</span>
          </div>
          <div
            v-else-if="!activeRedisTools.length"
            class="empty-holder"
          >
            <svg class="empty-icon" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2a10 10 0 1 1-10 10A10 10 0 0 1 12 2Zm0 2a8 8 0 1 0 8 8 8 8 0 0 0-8-8Zm-1 7h2v7h-2v-7Zm0-4h2v2h-2V7Z" />
            </svg>
            <span>暂无微波标签识别信号</span>
          </div>
          <div v-else class="active-tool-list">
            <div
              v-for="tool in activeRedisTools"
              :key="tool.rfid"
              class="active-tool-item"
            >
              <div>
                <div
                  class="active-tool-name"
                  :class="{ 'unmatched-tool-name': isUnmatchedToolName(tool) }"
                >
                  {{ getDisplayToolName(tool) }}
                </div>
                <div class="active-tool-rfid">{{ tool.rfid || '-' }}</div>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </section>

    <footer class="dashboard-footer">
      <span>版本：v1.0.2-5</span>
      <span>当前时间：{{ clockTime || '-' }}</span>
      <span>最后更新：{{ lastUpdateTime || '-' }}</span>
    </footer>

    <el-dialog
      v-model="toolsDialogVisible"
      :title="toolsDialogTitle"
      width="980px"
      class="tools-dialog"
    >
      <el-table
        v-loading="toolsLoading"
        :data="dialogTools"
        height="520"
        stripe
        border
        empty-text="暂无工器具信息"
      >
        <el-table-column prop="toolName" label="工具名称" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.toolName || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="toolCode" label="工具编号" min-width="190" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.toolCode || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="manufacturer" label="生产厂家" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.manufacturer || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="inspectionWarningStatus" label="送检预警状态" min-width="140" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.inspectionWarningStatus || '-' }}
          </template>
        </el-table-column>
        <el-table-column
          prop="useRecordStatus"
          :label="toolDialogMode === 'overdue' ? '工具状态' : '领用归还状态'"
          min-width="140"
          show-overflow-tooltip
        >
          <template #default="{ row }">
            {{ toolDialogMode === 'overdue' ? formatToolStatus(row.useRecordStatus) : (row.useRecordStatus || '-') }}
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </main>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

const toolRecords = ref([])
const activeRedisTools = ref([])
const tools = ref([])
const statistics = ref({
  totalTools: 0,
  toolRecords: 0,
  unreturnedCount: 0,
  overdueTools: 0
})
const loading = ref(true)
const activeToolsLoading = ref(false)
const toolsLoading = ref(false)
const syncLoading = ref(false)
const autoRefresh = ref(true)
const lastUpdateTime = ref('')
const clockTime = ref('')
const newRecordIds = ref(new Set())
const newRecordsCount = ref(0)
const completingRecordIds = ref(new Set())
const toolsDialogVisible = ref(false)
const toolDialogMode = ref('all')
const toolsChartRef = ref(null)

let ws = null
let pollingTimer = null
let activeToolsTimer = null
let reconnectTimer = null
let clockTimer = null
let reconnectAttempts = 0
let toolsChart = null

const MAX_RECONNECT_ATTEMPTS = 5
const DEFAULT_USE_WEBSOCKET = true
let useWebSocket = DEFAULT_USE_WEBSOCKET
const POLLING_INTERVAL = 5000
const API_BASE_URL = 'http://localhost:8080/api/dashboard'
const WS_URL = 'ws://localhost:8080/ws'

const API_ENDPOINTS = {
  toolRecords: `${API_BASE_URL}/tool-records`,
  tools: `${API_BASE_URL}/tools`,
  statistics: `${API_BASE_URL}/statistics`,
  activeTools: `${API_BASE_URL}/active-tools`,
  syncToolInfo: `${API_BASE_URL}/syncToolInfo`,
  completeRecord: (id) => `${API_BASE_URL}/tool-records/${id}/complete`
}

const connectionStatus = ref({
  text: '连接中',
  type: 'info'
})

const isNewRecord = (id) => newRecordIds.value.has(id)

const getTextValue = (value) => String(value || '').trim()

const formatRfid = (value) => {
  const rfid = getTextValue(value)
  if (!rfid) return '-'
  if (rfid.length <= 16) return rfid
  return `${rfid.slice(0, 6)}...${rfid.slice(-7)}`
}

const isOverdueTool = (item = {}) => getTextValue(item.assetStatus) === '1'

const TOOL_STATUS_LABELS = Object.freeze({
  0: '在役',
  1: '作废',
  2: '待审核',
  3: '已退回',
  9: '已删除'
})

const formatToolStatus = (value) => {
  const status = getTextValue(value)
  return TOOL_STATUS_LABELS[status] || status || '-'
}

const dialogTools = computed(() => {
  if (toolDialogMode.value === 'overdue') {
    return tools.value.filter(isOverdueTool)
  }
  return tools.value
})

const toolsDialogTitle = computed(() => (
  toolDialogMode.value === 'overdue' ? '逾期工具' : '工器具信息'
))

const isUnmatchedToolName = (item = {}) => {
  const toolName = getTextValue(item.toolName)
  const rfid = getTextValue(item.rfid)
  return !toolName || (rfid && toolName === rfid)
}

const getDisplayToolName = (item = {}) => {
  return isUnmatchedToolName(item) ? '未匹配工具' : getTextValue(item.toolName)
}

const isRecordCompleted = (row = {}) => {
  return row.status === 'RETURNED' || Boolean(row.returnTime)
}

const isCompletingRecord = (id) => completingRecordIds.value.has(id)

const setRecordCompleting = (id, completing) => {
  const nextIds = new Set(completingRecordIds.value)
  if (completing) {
    nextIds.add(id)
  } else {
    nextIds.delete(id)
  }
  completingRecordIds.value = nextIds
}

const getCurrentDateTime = () => {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return [
    now.getFullYear(),
    pad(now.getMonth() + 1),
    pad(now.getDate())
  ].join('-') + ' ' + [
    pad(now.getHours()),
    pad(now.getMinutes()),
    pad(now.getSeconds())
  ].join(':')
}

const startClock = () => {
  clockTime.value = getCurrentDateTime()
  clockTimer = setInterval(() => {
    clockTime.value = getCurrentDateTime()
  }, 1000)
}

const updateLastUpdateTime = () => {
  lastUpdateTime.value = getCurrentDateTime()
}

const normalizeStatistics = (data = {}) => ({
  totalTools: data.totalTools || 0,
  toolRecords: data.toolRecords || 0,
  unreturnedCount: data.unreturnedCount || 0,
  overdueTools: data.overdueTools || 0
})

const detectNewRecords = (newRecords) => {
  const oldIds = new Set(toolRecords.value.map(record => record.id))
  const newIds = new Set()

  newRecords.forEach(record => {
    if (record.id && !oldIds.has(record.id)) {
      newIds.add(record.id)
    }
  })

  if (newIds.size > 0) {
    newRecordIds.value = newIds
    newRecordsCount.value = newIds.size

    ElMessage.success({
      message: `检测到 ${newIds.size} 条新的出入库记录`,
      duration: 3000
    })

    setTimeout(() => {
      newRecordIds.value = new Set()
      newRecordsCount.value = 0
    }, 3000)
  }
}

const applyRecords = (newRecords) => {
  const records = Array.isArray(newRecords) ? newRecords : []
  if (toolRecords.value.length > 0) {
    detectNewRecords(records)
  }
  toolRecords.value = records
}

const applyActiveTools = (newTools) => {
  activeRedisTools.value = Array.isArray(newTools) ? newTools : []
}

const applyTools = (newTools) => {
  tools.value = Array.isArray(newTools) ? newTools : []
}

const buildToolChartData = () => {
  const countMap = new Map()

  tools.value.forEach(tool => {
    const name = getDisplayToolName(tool)
    countMap.set(name, (countMap.get(name) || 0) + 1)
  })

  return Array.from(countMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

const renderToolChart = async () => {
  await nextTick()
  if (!toolsChartRef.value) return

  if (!toolsChart) {
    toolsChart = echarts.init(toolsChartRef.value)
  }

  const chartData = buildToolChartData()
  toolsChart.setOption({
    backgroundColor: 'transparent',
    color: ['#00f3ff', '#00ffad', '#ffec00', '#ff5a00', '#df00ff', '#007eff', '#8fa0ff', '#ff77b7'],
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(5, 17, 40, 0.92)',
      borderColor: '#00f3ff',
      textStyle: { color: '#ffffff' }
    },
    title: {
      show: chartData.length === 0,
      text: '暂无工具数据',
      left: 'center',
      top: 'center',
      textStyle: {
        color: '#4f6793',
        fontSize: 14,
        fontWeight: 400
      }
    },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'middle',
      itemWidth: 10,
      itemHeight: 10,
      textStyle: {
        color: '#8fa0c4',
        fontSize: 11
      }
    },
    series: [
      {
        name: '工具品类分布',
        type: 'pie',
        radius: ['42%', '70%'],
        center: ['36%', '52%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 4,
          borderColor: '#0c214a',
          borderWidth: 2
        },
        label: { show: false },
        data: chartData
      }
    ]
  }, true)
}

const resizeToolChart = () => {
  if (toolsChart) {
    toolsChart.resize()
  }
}

watch(tools, () => {
  renderToolChart()
}, { deep: true })

const openToolsDialog = async (mode = 'all') => {
  toolDialogMode.value = mode
  toolsDialogVisible.value = true
  await fetchTools()
}

const fetchTools = async (showError = true) => {
  toolsLoading.value = true
  try {
    const response = await fetch(API_ENDPOINTS.tools)
    if (!response.ok) {
      throw new Error('获取工器具信息失败')
    }

    const newTools = await response.json()
    applyTools(newTools)
  } catch (err) {
    console.error('[Dashboard] 获取工器具信息失败:', err)
    if (showError) {
      ElMessage.error(err.message || '获取工器具信息失败')
    }
  } finally {
    toolsLoading.value = false
    renderToolChart()
  }
}

const refreshRecordInList = (updatedRecord) => {
  if (!updatedRecord || !updatedRecord.id) return
  toolRecords.value = toolRecords.value.map(record => (
    record.id === updatedRecord.id ? { ...record, ...updatedRecord } : record
  ))
}

const updateUnreturnedCount = () => {
  statistics.value = {
    ...statistics.value,
    unreturnedCount: toolRecords.value.filter(record => !isRecordCompleted(record)).length,
    toolRecords: toolRecords.value.length
  }
}

const completeRecord = async (row) => {
  if (!row || !row.id || isRecordCompleted(row)) return

  setRecordCompleting(row.id, true)
  try {
    const response = await fetch(API_ENDPOINTS.completeRecord(row.id), {
      method: 'POST'
    })
    const responseText = await response.text()

    if (!response.ok) {
      throw new Error(responseText || '手工完成记录失败')
    }

    const updatedRecord = responseText ? JSON.parse(responseText) : null
    refreshRecordInList(updatedRecord)
    updateUnreturnedCount()
    ElMessage.success('已手工完成该记录')
    await fetchData()
  } catch (err) {
    console.error('[Dashboard] 手工完成记录失败:', err)
    ElMessage.error(err.message || '手工完成记录失败')
  } finally {
    setRecordCompleting(row.id, false)
  }
}

const fetchActiveTools = async () => {
  activeToolsLoading.value = true
  try {
    const response = await fetch(API_ENDPOINTS.activeTools)
    if (!response.ok) {
      throw new Error('获取当前识别工具失败')
    }

    const newTools = await response.json()
    applyActiveTools(newTools)
    console.info('[Dashboard] Redis当前工具刷新完成', {
      count: activeRedisTools.value.length
    })
  } catch (err) {
    console.error('[Dashboard] Redis当前工具刷新失败:', err)
  } finally {
    activeToolsLoading.value = false
  }
}

const fetchData = async () => {
  try {
    console.info('[Dashboard] 开始请求工器具出入库数据', {
      recordsUrl: API_ENDPOINTS.toolRecords,
      statisticsUrl: API_ENDPOINTS.statistics
    })

    const [recordsRes, statisticsRes] = await Promise.all([
      fetch(API_ENDPOINTS.toolRecords),
      fetch(API_ENDPOINTS.statistics)
    ])

    if (!recordsRes.ok || !statisticsRes.ok) {
      throw new Error('获取数据失败')
    }

    const newRecords = await recordsRes.json()
    const newStatistics = await statisticsRes.json()

    applyRecords(newRecords)
    statistics.value = normalizeStatistics(newStatistics)
    console.info('[Dashboard] 工器具出入库数据请求完成', {
      recordCount: Array.isArray(newRecords) ? newRecords.length : 0,
      statistics: statistics.value
    })
    updateLastUpdateTime()
    updateConnectionStatus('connected')
  } catch (err) {
    console.error('[Dashboard] 工器具出入库数据请求失败:', err)
    updateConnectionStatus('error')
  } finally {
    loading.value = false
  }
}

const connectWebSocket = () => {
  if (!useWebSocket) return

  updateConnectionStatus('connecting')
  console.info('[Dashboard] 开始连接WebSocket', { url: WS_URL })

  try {
    ws = new WebSocket(WS_URL)

    ws.onopen = () => {
      updateConnectionStatus('connected')
      reconnectAttempts = 0
      console.info('[Dashboard] WebSocket连接成功，发送订阅消息', {
        channels: ['toolRecords', 'statistics']
      })
      ws.send(JSON.stringify({
        type: 'subscribe',
        channels: ['toolRecords', 'statistics']
      }))
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'update') {
          if (data.toolRecords) {
            applyRecords(data.toolRecords)
          }
          if (data.statistics) {
            statistics.value = normalizeStatistics(data.statistics)
          }
          console.info('[Dashboard] WebSocket收到Dashboard更新', {
            recordCount: Array.isArray(data.toolRecords) ? data.toolRecords.length : toolRecords.value.length,
            statistics: statistics.value
          })
        }

        updateLastUpdateTime()
        loading.value = false
      } catch (err) {
        console.error('[Dashboard] 解析WebSocket消息失败:', err, event.data)
      }
    }

    ws.onerror = (event) => {
      console.error('[Dashboard] WebSocket连接错误:', event)
      updateConnectionStatus('error')
    }

    ws.onclose = () => {
      updateConnectionStatus('disconnected')
      console.warn('[Dashboard] WebSocket连接关闭', {
        reconnectAttempts,
        autoRefresh: autoRefresh.value
      })

      if (autoRefresh.value && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        reconnectTimer = setTimeout(() => {
          connectWebSocket()
        }, 3000 * reconnectAttempts)
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        ElMessage.error('WebSocket 连接失败，已切换到轮询模式')
        useWebSocket = false
        startPolling()
      }
    }
  } catch (err) {
    console.error('[Dashboard] 创建WebSocket连接失败:', err)
    updateConnectionStatus('error')
  }
}

const startPolling = () => {
  if (useWebSocket) return
  console.info('[Dashboard] 启动轮询刷新工器具出入库数据', {
    interval: POLLING_INTERVAL
  })
  fetchData()
  if (autoRefresh.value) {
    pollingTimer = setInterval(fetchData, POLLING_INTERVAL)
  }
}

const startActiveToolsPolling = () => {
  fetchActiveTools()
  activeToolsTimer = setInterval(fetchActiveTools, POLLING_INTERVAL)
}

const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

const stopActiveToolsPolling = () => {
  if (activeToolsTimer) {
    clearInterval(activeToolsTimer)
    activeToolsTimer = null
  }
}

const updateConnectionStatus = (status) => {
  const statusMap = {
    connected: { text: '已连接', type: 'success' },
    disconnected: { text: '已断开', type: 'warning' },
    error: { text: '连接错误', type: 'danger' },
    connecting: { text: '连接中', type: 'info' }
  }
  connectionStatus.value = statusMap[status] || statusMap.connecting
}

const toggleAutoRefresh = (value) => {
  if (useWebSocket) {
    if (value) {
      connectWebSocket()
    } else if (ws) {
      ws.close()
      ws = null
    }
  } else if (value) {
    startPolling()
  } else {
    stopPolling()
  }
}

const manualRefresh = () => {
  loading.value = true
  console.info('[Dashboard] 手动刷新工器具出入库数据', {
    useWebSocket,
    wsReadyState: ws ? ws.readyState : null
  })
  if (useWebSocket && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'refresh' }))
    setTimeout(() => {
      loading.value = false
    }, 500)
  } else {
    fetchData()
  }
  fetchActiveTools()
  fetchTools(false)
}

const syncToolInfo = async () => {
  syncLoading.value = true
  console.info('[Dashboard] 开始同步工具信息', {
    url: API_ENDPOINTS.syncToolInfo
  })

  try {
    const response = await fetch(API_ENDPOINTS.syncToolInfo)
    const message = await response.text()

    if (!response.ok) {
      throw new Error(message || '同步工具信息失败')
    }

    ElMessage.success(message || '同步工具信息完成')
    console.info('[Dashboard] 同步工具信息完成，准备刷新页面', { message })
    window.location.reload()
  } catch (err) {
    console.error('[Dashboard] 同步工具信息失败:', err)
    ElMessage.error(err.message || '同步工具信息失败')
  } finally {
    syncLoading.value = false
  }
}

onMounted(() => {
  startClock()
  renderToolChart()
  window.addEventListener('resize', resizeToolChart)

  if (useWebSocket) {
    connectWebSocket()
  } else {
    startPolling()
  }
  startActiveToolsPolling()
  fetchTools(false)
})

onBeforeUnmount(() => {
  stopPolling()
  stopActiveToolsPolling()
  window.removeEventListener('resize', resizeToolChart)
  if (toolsChart) {
    toolsChart.dispose()
    toolsChart = null
  }
  if (ws) {
    ws.close()
    ws = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }
  if (clockTimer) {
    clearInterval(clockTimer)
  }
})
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.dashboard-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-width: 1180px;
  min-height: 720px;
  overflow: hidden;
  color: #ffffff;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
  background-color: #051128;
  background-image:
    radial-gradient(circle at 50% 30%, #0b2554 0%, #051128 70%),
    linear-gradient(rgba(18, 54, 114, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(18, 54, 114, 0.1) 1px, transparent 1px);
  background-size: 100% 100%, 40px 40px, 40px 40px;
}

.dashboard-page::after {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  height: 160px;
  pointer-events: none;
  background:
    linear-gradient(180deg, transparent, rgba(0, 126, 255, 0.2)),
    repeating-linear-gradient(90deg, transparent 0 42px, rgba(0, 243, 255, 0.07) 42px 43px),
    repeating-linear-gradient(0deg, transparent 0 28px, rgba(0, 243, 255, 0.06) 28px 29px);
  content: "";
  transform: perspective(520px) rotateX(58deg);
  transform-origin: bottom;
}

.header {
  position: relative;
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  height: 75px;
  padding: 0 24px;
  border-bottom: 2px solid #00f3ff;
  background: linear-gradient(to bottom, rgba(12, 42, 97, 0.62), rgba(5, 17, 40, 0));
  box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
}

.left-info,
.action-container {
  z-index: 2;
  display: flex;
  align-items: center;
}

.left-info {
  gap: 10px;
}

.header h1 {
  position: absolute;
  left: 50%;
  margin: 0;
  color: #ffffff;
  font-size: 25px;
  font-weight: 700;
  letter-spacing: 2px;
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.6);
  white-space: nowrap;
  transform: translateX(-50%);
}

.status-tag,
.connection-status {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 3px 10px;
  font-size: 12px;
  border-radius: 3px;
}

.status-tag {
  color: #00ffad;
  border: 1px solid #00ffad;
  box-shadow: inset 0 0 5px rgba(0, 255, 173, 0.3);
}

.status-tag.status-paused {
  color: #ff9d4d;
  border-color: #ff9d4d;
  box-shadow: inset 0 0 5px rgba(255, 157, 77, 0.28);
}

.connection-status {
  color: #8fa0c4;
  border: 1px solid rgba(143, 160, 196, 0.32);
}

.status-success {
  color: #00ffad;
  border-color: rgba(0, 255, 173, 0.55);
}

.status-warning {
  color: #ffec00;
  border-color: rgba(255, 236, 0, 0.45);
}

.status-danger {
  color: #ff5a5a;
  border-color: rgba(255, 90, 90, 0.5);
}

.status-info {
  color: #00f3ff;
  border-color: rgba(0, 243, 255, 0.45);
}

.action-container {
  gap: 15px;
}

.switch-checkbox {
  display: none;
}

.switch-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  user-select: none;
}

.switch-label {
  color: #8fa0c4;
  font-size: 13px;
  text-shadow: 0 0 5px rgba(0, 243, 255, 0.2);
  transition: color 0.3s;
}

.tech-switch {
  position: relative;
  width: 44px;
  height: 20px;
  background: rgba(10, 25, 57, 0.8);
  border: 1px solid rgba(0, 243, 255, 0.3);
  border-radius: 10px;
  box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.6);
  transition: all 0.3s;
}

.tech-switch::after {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  background: #8fa0c4;
  border-radius: 50%;
  content: "";
  transition: all 0.3s cubic-bezier(0.18, 0.89, 0.35, 1.15);
}

.switch-checkbox:checked + .switch-wrapper .tech-switch {
  background: rgba(0, 243, 255, 0.1);
  border-color: #00f3ff;
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.3);
}

.switch-checkbox:checked + .switch-wrapper .tech-switch::after {
  left: 26px;
  background: #00f3ff;
  box-shadow: 0 0 8px #00f3ff;
}

.switch-checkbox:checked + .switch-wrapper .switch-label {
  color: #00f3ff;
  text-shadow: 0 0 8px rgba(0, 243, 255, 0.6);
}

.btn-circle,
.btn-sync,
.kpi-box,
.btn-status-action {
  font-family: inherit;
}

.btn-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: #00f3ff;
  cursor: pointer;
  background: linear-gradient(135deg, rgba(16, 49, 107, 0.8), rgba(9, 29, 66, 0.6));
  border: 1px solid rgba(0, 243, 255, 0.4);
  border-radius: 50%;
  transition: all 0.3s;
}

.btn-circle:disabled,
.btn-sync:disabled,
.btn-status-action:disabled {
  cursor: not-allowed;
  opacity: 0.56;
}

.btn-circle:hover:not(:disabled) {
  background: rgba(0, 243, 255, 0.2);
  border-color: #00f3ff;
  box-shadow: 0 0 12px rgba(0, 243, 255, 0.4);
  transform: scale(1.05);
}

.btn-circle svg {
  width: 16px;
  height: 16px;
  fill: currentColor;
  transition: transform 0.5s;
}

.btn-circle:hover:not(:disabled) svg {
  transform: rotate(180deg);
}

.btn-sync {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  color: #00ffad;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  background: linear-gradient(180deg, rgba(0, 255, 173, 0.15), rgba(0, 255, 173, 0.02));
  border: 1px solid #00ffad;
  border-radius: 4px;
  box-shadow: inset 0 0 8px rgba(0, 255, 173, 0.2);
  transition: all 0.3s;
}

.btn-sync:hover:not(:disabled) {
  background: linear-gradient(180deg, rgba(0, 255, 173, 0.3), rgba(0, 255, 173, 0.05));
  box-shadow: inset 0 0 12px rgba(0, 255, 173, 0.4), 0 0 15px rgba(0, 255, 173, 0.3);
  text-shadow: 0 0 5px rgba(0, 255, 173, 0.6);
}

.btn-sync svg {
  width: 14px;
  height: 14px;
  fill: currentColor;
}

.main-container {
  z-index: 1;
  display: flex;
  flex: 1;
  gap: 20px;
  min-height: 0;
  padding: 20px;
  overflow: hidden;
}

.left-column-large {
  display: flex;
  flex: 6.5;
  flex-direction: column;
  min-width: 0;
}

.right-column-small {
  display: flex;
  flex: 3.5;
  flex-direction: column;
  gap: 20px;
  min-width: 360px;
}

.kpi-container {
  display: flex;
  flex-shrink: 0;
  gap: 15px;
  margin-bottom: 20px;
}

.kpi-box {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  min-height: 78px;
  padding: 15px;
  text-align: left;
  background: linear-gradient(135deg, rgba(16, 49, 107, 0.6), rgba(9, 29, 66, 0.4));
  border: 1px solid rgba(0, 243, 255, 0.2);
  border-radius: 4px;
}

button.kpi-box {
  color: inherit;
  cursor: pointer;
}

button.kpi-box:hover {
  border-color: rgba(0, 243, 255, 0.65);
  box-shadow: 0 0 16px rgba(0, 243, 255, 0.2);
}

.kpi-box .label {
  color: #8fa0c4;
  font-size: 14px;
}

.kpi-box .value {
  font-family: Impact, "Arial Narrow", sans-serif;
  font-size: 28px;
  font-weight: 700;
  line-height: 1;
}

.kpi-box .value span {
  font-family: inherit;
  font-size: 14px;
}

.color-total {
  color: #00f3ff;
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.5);
}

.color-borrow {
  color: #ffec00;
  text-shadow: 0 0 10px rgba(255, 236, 0, 0.5);
}

.color-return {
  color: #00ffad;
  text-shadow: 0 0 10px rgba(0, 255, 173, 0.5);
}

.color-overdue {
  color: #ff5a8a;
  text-shadow: 0 0 10px rgba(255, 90, 138, 0.5);
}

.tech-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 20px;
  overflow: hidden;
  background: rgba(12, 33, 74, 0.4);
  border: 1px solid rgba(0, 243, 255, 0.15);
  border-radius: 4px;
  box-shadow: inset 0 0 20px rgba(0, 243, 255, 0.05);
  backdrop-filter: blur(5px);
}

.tech-card::before,
.tech-card::after {
  position: absolute;
  width: 10px;
  height: 10px;
  border-color: #00f3ff;
  border-style: solid;
  opacity: 0.8;
  content: "";
}

.tech-card::before {
  top: -1px;
  left: -1px;
  border-width: 2px 0 0 2px;
}

.tech-card::after {
  top: -1px;
  right: -1px;
  border-width: 2px 2px 0 0;
}

.records-card {
  flex: 1;
}

.chart-card {
  flex: 1.3;
}

.active-tools-card {
  flex: 1;
}

.card-title {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  margin-bottom: 15px;
  color: #00f3ff;
  font-size: 16px;
  font-weight: 700;
  text-shadow: 0 0 5px rgba(0, 243, 255, 0.3);
}

.card-title::before {
  margin-right: 8px;
  font-size: 12px;
  letter-spacing: -2px;
  content: ">>>>";
}

.count-badge,
.new-record-badge {
  padding: 1px 6px;
  margin-left: 8px;
  font-size: 12px;
  border-radius: 10px;
}

.count-badge {
  color: #00f3ff;
  background: rgba(0, 243, 255, 0.15);
  border: 1px solid rgba(0, 243, 255, 0.3);
}

.new-record-badge {
  color: #ffec00;
  background: rgba(255, 236, 0, 0.12);
  border: 1px solid rgba(255, 236, 0, 0.3);
}

.table-container {
  flex: 1;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

.table-container::-webkit-scrollbar,
.active-tool-list::-webkit-scrollbar {
  width: 5px;
  height: 5px;
}

.table-container::-webkit-scrollbar-track,
.active-tool-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.1);
}

.table-container::-webkit-scrollbar-thumb,
.active-tool-list::-webkit-scrollbar-thumb {
  background: rgba(0, 243, 255, 0.2);
  border-radius: 3px;
}

table {
  width: 100%;
  table-layout: fixed;
  text-align: left;
  border-collapse: collapse;
}

th {
  position: sticky;
  top: 0;
  z-index: 5;
  padding: 12px 10px;
  color: #00f3ff;
  font-size: 14px;
  font-weight: 700;
  background-color: rgba(18, 54, 114, 0.92);
  border-bottom: 1px solid rgba(0, 243, 255, 0.3);
}

td {
  padding: 12px 10px;
  color: #d1ddf7;
  font-size: 13px;
  line-height: 1.35;
  border-bottom: 1px solid rgba(255, 255, 255, 0.03);
  word-break: break-word;
}

tr:nth-child(even) {
  background-color: rgba(12, 33, 74, 0.2);
}

tbody tr:hover {
  background-color: rgba(0, 243, 255, 0.1);
}

.new-record-row {
  background-color: rgba(255, 236, 0, 0.1);
}

.status-col {
  width: 90px;
}

.rfid-col {
  width: 150px;
}

.rfid-cell {
  display: inline-block;
  max-width: 100%;
  color: #d1ddf7;
  font-variant-numeric: tabular-nums;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: bottom;
  white-space: nowrap;
}

.btn-status-action {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 3px 10px;
  color: #00ffad;
  font-size: 12px;
  cursor: pointer;
  background: linear-gradient(180deg, rgba(0, 255, 173, 0.2), rgba(0, 255, 173, 0.05));
  border: 1px solid #00ffad;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(0, 255, 173, 0.2);
  transition: all 0.2s;
}

.btn-status-action::before {
  font-weight: 700;
  content: "✓";
}

.btn-status-action:hover:not(:disabled) {
  background: rgba(0, 255, 173, 0.3);
  box-shadow: 0 0 12px rgba(0, 255, 173, 0.5);
}

.status-text-done {
  display: inline-flex;
  align-items: center;
  color: #8fa0c4;
  font-size: 12px;
}

.status-text-done::before {
  margin-right: 6px;
  color: #00f3ff;
  font-size: 10px;
  text-shadow: 0 0 5px #00f3ff;
  content: "●";
}

.person {
  color: #ffec00;
}

.returner {
  color: #00ffad;
}

.plan-status {
  color: #00f3ff;
  font-weight: 700;
}

.warning-text,
.unmatched-tool-name {
  color: #ffb04f;
}

.table-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 220px;
  color: #4f6793;
}

.chart-shell {
  position: relative;
  flex: 1;
  min-height: 220px;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 220px;
}

.chart-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4f6793;
  font-size: 13px;
  pointer-events: none;
}

.empty-holder {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  color: #4f6793;
  font-size: 13px;
}

.empty-icon {
  width: 40px;
  height: 40px;
  fill: currentColor;
  opacity: 0.5;
  animation: pulse 2s infinite ease-in-out;
}

@keyframes pulse {
  0% {
    opacity: 0.3;
    transform: scale(0.98);
  }

  50% {
    opacity: 0.6;
    transform: scale(1.02);
  }

  100% {
    opacity: 0.3;
    transform: scale(0.98);
  }
}

.active-tool-list {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  overflow: auto;
}

.active-tool-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  align-items: center;
  padding: 12px;
  background: linear-gradient(135deg, rgba(16, 49, 107, 0.52), rgba(9, 29, 66, 0.32));
  border: 1px solid rgba(0, 243, 255, 0.14);
  border-radius: 4px;
}

.active-tool-name {
  color: #dffcff;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.35;
  overflow-wrap: anywhere;
}

.active-tool-rfid {
  margin-top: 5px;
  color: #8fa0c4;
  font-size: 12px;
  line-height: 1.35;
  overflow-wrap: anywhere;
}


.dashboard-footer {
  z-index: 1;
  display: flex;
  flex-shrink: 0;
  gap: 36px;
  align-items: center;
  justify-content: center;
  height: 34px;
  color: #8fa0c4;
  font-size: 12px;
}

:deep(.tools-dialog) {
  --el-dialog-bg-color: #071b3b;
  --el-dialog-text-color: #e8fbff;
  --el-border-color: rgba(0, 243, 255, 0.28);
}

:deep(.tools-dialog .el-dialog__title) {
  color: #00f3ff;
}

:deep(.tools-dialog .el-table) {
  --el-table-bg-color: #071b3b;
  --el-table-tr-bg-color: #071b3b;
  --el-table-header-bg-color: rgba(18, 54, 114, 0.95);
  --el-table-header-text-color: #00f3ff;
  --el-table-text-color: #d1ddf7;
  --el-table-row-hover-bg-color: rgba(0, 243, 255, 0.1);
  --el-table-border-color: rgba(0, 243, 255, 0.18);
  --el-fill-color-lighter: rgba(16, 49, 107, 0.42);
  --el-bg-color: #071b3b;
  --el-bg-color-overlay: #071b3b;
}

:deep(.tools-dialog .el-table__inner-wrapper::before),
:deep(.tools-dialog .el-table__border-left-patch) {
  background-color: rgba(0, 243, 255, 0.18);
}

:deep(.tools-dialog .el-table th.el-table__cell) {
  color: #00f3ff;
  background: rgba(18, 54, 114, 0.95);
}

:deep(.tools-dialog .el-table tr),
:deep(.tools-dialog .el-table td.el-table__cell) {
  color: #d1ddf7;
  background: #071b3b;
}

:deep(.tools-dialog .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: rgba(16, 49, 107, 0.42);
}

:deep(.tools-dialog .el-table__body tr:hover > td.el-table__cell) {
  color: #ffffff;
  background: rgba(0, 243, 255, 0.12);
}

:deep(.tools-dialog .el-table .cell) {
  color: inherit;
}

@media (max-width: 1280px) {
  .main-container {
    gap: 14px;
    padding: 14px;
  }

  .right-column-small {
    min-width: 330px;
  }

  .header h1 {
    font-size: 22px;
  }
}
</style>

<template>
  <div class="dashboard-page">
    <el-container class="dashboard-container">
      <el-main>
        <div class="dashboard-header">
          <div>
            <h1>库房设备管理系统</h1>
            <div class="header-subtitle">
              <p>实时监控工器具出入库状态</p>
              <el-tag :type="connectionStatus.type" size="small" effect="light">
                <el-icon class="status-icon">
                  <component :is="connectionStatus.icon" />
                </el-icon>
                {{ connectionStatus.text }}
              </el-tag>
            </div>
          </div>
          <div class="toolbar">
            <div class="toolbar-row">
              <el-switch
                v-model="autoRefresh"
                active-text="自动刷新"
                @change="toggleAutoRefresh"
              />
              <el-button
                type="primary"
                :icon="Refresh"
                :loading="loading"
                circle
                title="手动刷新"
                @click="manualRefresh"
              />
            </div>
            <el-button
              class="sync-button"
              type="success"
              :icon="Refresh"
              :loading="syncLoading"
              @click="syncToolInfo"
            >
              同步工具信息
            </el-button>
          </div>
        </div>

        <div v-if="lastUpdateTime" class="last-update">
          <el-text type="info" size="small">
            <el-icon><Clock /></el-icon>
            最后更新: {{ lastUpdateTime }}
          </el-text>
        </div>

        <div v-if="loading && !toolRecords.length" class="loading-panel">
          <el-icon :size="50" class="is-loading">
            <Loading />
          </el-icon>
          <p>加载中...</p>
        </div>

        <template v-else>
          <el-row :gutter="16" class="stats-row">
            <el-col :xs="24" :sm="8">
              <el-card shadow="hover" class="stat-card stat-blue">
                <div class="stat-content">
                  <div>
                    <p>工器具总数</p>
                    <strong>{{ statistics.totalTools || 0 }}</strong>
                  </div>
                  <el-icon :size="48"><Box /></el-icon>
                </div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-card shadow="hover" class="stat-card stat-green">
                <div class="stat-content">
                  <div>
                    <p>出入库记录</p>
                    <strong>{{ statistics.toolRecords || toolRecords.length }}</strong>
                  </div>
                  <el-icon :size="48"><Tickets /></el-icon>
                </div>
              </el-card>
            </el-col>
            <el-col :xs="24" :sm="8">
              <el-card shadow="hover" class="stat-card stat-orange">
                <div class="stat-content">
                  <div>
                    <p>未归还数量</p>
                    <strong>{{ statistics.unreturnedCount || 0 }}</strong>
                  </div>
                  <el-icon :size="48"><Clock /></el-icon>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <div class="dashboard-content">
            <el-card shadow="hover" class="records-card">
              <template #header>
                <div class="card-header">
                  <div class="card-title">
                    <el-icon :size="20" color="#409EFF"><Box /></el-icon>
                    <span>工器具出入库记录</span>
                    <el-tag size="small" type="info">{{ toolRecords.length }}条</el-tag>
                    <el-badge
                      v-if="newRecordsCount > 0"
                      :value="newRecordsCount"
                      type="danger"
                    >
                      <el-text type="danger" size="small">新增</el-text>
                    </el-badge>
                  </div>
                </div>
              </template>

              <el-table
                :data="toolRecords"
                :height="460"
                stripe
                border
                empty-text="暂无出入库记录"
                :row-class-name="getRowClassName"
              >
                <el-table-column prop="rfid" label="标签号" min-width="190" fixed="left" show-overflow-tooltip />
                <el-table-column prop="toolName" label="工具名称" min-width="220" show-overflow-tooltip>
                  <template #default="{ row }">
                    {{ row.toolName || row.rfid || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="usePersonName" label="领用人" min-width="120" show-overflow-tooltip>
                  <template #default="{ row }">
                    {{ row.usePersonName || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="useTime" label="领用时间" min-width="170" show-overflow-tooltip>
                  <template #default="{ row }">
                    {{ row.useTime || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="returnPersonName" label="归还人" min-width="120" show-overflow-tooltip>
                  <template #default="{ row }">
                    {{ row.returnPersonName || '-' }}
                  </template>
                </el-table-column>
                <el-table-column prop="returnTime" label="归还时间" min-width="170" show-overflow-tooltip>
                  <template #default="{ row }">
                    <el-tag v-if="!row.returnTime" type="warning" size="small" effect="plain">未归还</el-tag>
                    <span v-else>{{ row.returnTime }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>

            <el-card shadow="hover" class="active-tools-card">
              <template #header>
                <div class="card-header">
                  <div class="card-title">
                    <el-icon :size="20" color="#67C23A"><Box /></el-icon>
                    <span>当前识别工具</span>
                    <el-tag size="small" type="success">{{ activeRedisTools.length }}条</el-tag>
                  </div>
                </div>
              </template>

              <div v-if="activeToolsLoading && !activeRedisTools.length" class="active-tools-loading">
                <el-icon class="is-loading"><Loading /></el-icon>
                <span>加载中...</span>
              </div>
              <el-empty v-else-if="!activeRedisTools.length" description="暂无工具信息" :image-size="90" />
              <el-scrollbar v-else height="460px">
                <div class="active-tool-list">
                  <div
                    v-for="tool in activeRedisTools"
                    :key="tool.rfid"
                    class="active-tool-item"
                  >
                    <div class="active-tool-name">{{ tool.toolName || tool.rfid || '-' }}</div>
                    <div class="active-tool-rfid">{{ tool.rfid || '-' }}</div>
                  </div>
                </div>
              </el-scrollbar>
            </el-card>
          </div>
        </template>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Box,
  CircleCheck,
  CircleClose,
  Clock,
  Loading,
  Refresh,
  Tickets
} from '@element-plus/icons-vue'

const toolRecords = ref([])
const activeRedisTools = ref([])
const statistics = ref({
  totalTools: 0,
  toolRecords: 0,
  unreturnedCount: 0
})
const loading = ref(true)
const activeToolsLoading = ref(false)
const syncLoading = ref(false)
const autoRefresh = ref(true)
const lastUpdateTime = ref('')
const newRecordIds = ref(new Set())
const newRecordsCount = ref(0)

let ws = null
let pollingTimer = null
let activeToolsTimer = null
let reconnectTimer = null
let reconnectAttempts = 0

const MAX_RECONNECT_ATTEMPTS = 5
const DEFAULT_USE_WEBSOCKET = true
let useWebSocket = DEFAULT_USE_WEBSOCKET
const POLLING_INTERVAL = 5000
const API_BASE_URL = 'http://localhost:8080/api/dashboard'
const WS_URL = 'ws://localhost:8080/ws'

const API_ENDPOINTS = {
  toolRecords: `${API_BASE_URL}/tool-records`,
  statistics: `${API_BASE_URL}/statistics`,
  activeTools: `${API_BASE_URL}/active-tools`,
  syncToolInfo: `${API_BASE_URL}/syncToolInfo`
}

const connectionStatus = ref({
  text: '连接中',
  type: 'info',
  icon: Loading
})

const isNewRecord = (id) => newRecordIds.value.has(id)

const getRowClassName = ({ row }) => {
  return isNewRecord(row.id) ? 'new-record-row' : ''
}

const updateLastUpdateTime = () => {
  const now = new Date()
  lastUpdateTime.value = now.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

const normalizeStatistics = (data = {}) => ({
  totalTools: data.totalTools || 0,
  toolRecords: data.toolRecords || 0,
  unreturnedCount: data.unreturnedCount || 0
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
    if (toolRecords.value.length === 0) {
      loadMockData()
    }
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
    connected: { text: '已连接', type: 'success', icon: CircleCheck },
    disconnected: { text: '已断开', type: 'warning', icon: CircleClose },
    error: { text: '连接错误', type: 'danger', icon: CircleClose },
    connecting: { text: '连接中', type: 'info', icon: Loading }
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

const loadMockData = () => {
  console.warn('[Dashboard] 接口无可用数据，加载本地示例数据用于页面兜底显示')
  toolRecords.value = [
    {
      id: 1,
      rfid: 'E2000017221101441890B3D4',
      toolName: '绝缘手套',
      usePersonName: '杨海男',
      useTime: '2026-04-26 09:00:00',
      returnPersonName: '',
      returnTime: '',
      status: 'BORROWED'
    },
    {
      id: 2,
      rfid: 'E2000017221101441890B3D5',
      toolName: '验电器',
      usePersonName: '朱陈正华',
      useTime: '2026-04-26 08:30:00',
      returnPersonName: '朱陈正华',
      returnTime: '2026-04-26 10:20:00',
      status: 'RETURNED'
    }
  ]
  statistics.value = {
    totalTools: 2,
    toolRecords: 2,
    unreturnedCount: 1
  }
  updateLastUpdateTime()
}

onMounted(() => {
  if (useWebSocket) {
    connectWebSocket()
  } else {
    startPolling()
  }
  startActiveToolsPolling()
})

onBeforeUnmount(() => {
  stopPolling()
  stopActiveToolsPolling()
  if (ws) {
    ws.close()
    ws = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }
})
</script>

<style scoped>
.dashboard-page {
  min-height: 100vh;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%);
}

.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 24px;
}

.dashboard-header h1 {
  margin: 0 0 8px;
  color: #303133;
  font-size: 28px;
  font-weight: 700;
}

.header-subtitle {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-subtitle p {
  margin: 0;
  color: #909399;
}

.status-icon {
  margin-right: 4px;
}

.toolbar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.toolbar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sync-button {
  width: 100%;
}

.last-update {
  margin-bottom: 16px;
  text-align: right;
}

.loading-panel {
  padding: 100px 0;
  color: #409eff;
  text-align: center;
}

.loading-panel p {
  margin-top: 16px;
  color: #909399;
}

.stats-row {
  margin-bottom: 24px;
}

.stat-card {
  color: #fff;
  border: none;
}

.stat-blue {
  background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
}

.stat-green {
  background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
}

.stat-orange {
  background: linear-gradient(135deg, #e6a23c 0%, #ebb563 100%);
}

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-content p {
  margin: 0 0 8px;
  font-size: 14px;
  opacity: 0.9;
}

.stat-content strong {
  font-size: 32px;
  line-height: 1;
}

.dashboard-content {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
}

.records-card,
.active-tools-card {
  width: 100%;
}

.card-header,
.card-title {
  display: flex;
  align-items: center;
}

.card-header {
  justify-content: space-between;
}

.card-title {
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.active-tools-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 180px;
  color: #909399;
}

.active-tool-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.active-tool-item {
  padding: 12px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  background: #f9fafc;
}

.active-tool-name {
  color: #303133;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.active-tool-rfid {
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

:deep(.new-record-row) {
  --el-table-tr-bg-color: #fef0f0;
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 12px;
  }

  .dashboard-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .toolbar {
    width: 100%;
    align-items: flex-end;
  }

  .sync-button {
    width: auto;
  }

  .dashboard-content {
    grid-template-columns: 1fr;
  }
}
</style>

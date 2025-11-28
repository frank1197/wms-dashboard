<template>
  <div style="min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%); padding: 24px;">
    <el-container style="max-width: 1400px; margin: 0 auto;">
      <el-main>
        <!-- 页面标题和控制栏 -->
        <div style="margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="font-size: 28px; font-weight: bold; color: #303133; margin-bottom: 8px;">库房设备管理系统</h1>
            <div style="display: flex; align-items: center; gap: 12px;">
              <p style="color: #909399; margin: 0;">实时监控设备领用状态与人员信息</p>
              <el-tag :type="connectionStatus.type" size="small" effect="light">
                <el-icon style="margin-right: 4px;"><component :is="connectionStatus.icon" /></el-icon>
                {{ connectionStatus.text }}
              </el-tag>
            </div>
          </div>
          <div style="display: flex; gap: 12px; align-items: center;">
            <el-switch
              v-model="autoRefresh"
              active-text="自动刷新"
              @change="toggleAutoRefresh"
            />
            <el-button 
              type="primary" 
              :icon="Refresh" 
              @click="manualRefresh"
              :loading="loading"
              circle
              title="手动刷新"
            />
          </div>
        </div>

        <!-- 最后更新时间 -->
        <div v-if="lastUpdateTime" style="margin-bottom: 16px; text-align: right;">
          <el-text type="info" size="small">
            <el-icon><Clock /></el-icon>
            最后更新: {{ lastUpdateTime }}
          </el-text>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading && !personnel.length" style="text-align: center; padding: 100px 0;">
          <el-icon :size="50" class="is-loading" style="color: #409EFF;">
            <Loading />
          </el-icon>
          <p style="margin-top: 16px; color: #909399;">加载中...</p>
        </div>

        <template v-else>
          <!-- 统计卡片 -->
          <el-row :gutter="16" style="margin-bottom: 24px;">
            <el-col :span="8">
              <el-card shadow="hover" style="background: linear-gradient(135deg, #409EFF 0%, #66b1ff 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <p style="opacity: 0.9; font-size: 14px; margin-bottom: 8px;">总人数</p>
                    <p style="font-size: 32px; font-weight: bold; margin: 0;">{{ statistics.totalPersonnel }}</p>
                  </div>
                  <el-icon :size="48" style="opacity: 0.8;">
                    <User />
                  </el-icon>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" style="background: linear-gradient(135deg, #67C23A 0%, #85ce61 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <p style="opacity: 0.9; font-size: 14px; margin-bottom: 8px;">已完成</p>
                    <p style="font-size: 32px; font-weight: bold; margin: 0;">{{ statistics.completedCount }}</p>
                  </div>
                  <el-icon :size="48" style="opacity: 0.8;">
                    <CircleCheck />
                  </el-icon>
                </div>
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" style="background: linear-gradient(135deg, #E6A23C 0%, #ebb563 100%); color: white; border: none;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                  <div>
                    <p style="opacity: 0.9; font-size: 14px; margin-bottom: 8px;">待处理</p>
                    <p style="font-size: 32px; font-weight: bold; margin: 0;">{{ statistics.pendingCount }}</p>
                  </div>
                  <el-icon :size="48" style="opacity: 0.8;">
                    <Clock />
                  </el-icon>
                </div>
              </el-card>
            </el-col>
          </el-row>

          <!-- 人员信息和领用提醒 -->
          <el-row :gutter="24">
            <!-- 人员信息 -->
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <el-icon :size="20" color="#409EFF">
                      <User />
                    </el-icon>
                    <span style="font-size: 18px; font-weight: 600;">人员信息</span>
                    <el-tag size="small" type="info">{{ personnel.length }}人</el-tag>
                  </div>
                </template>
                <div style="max-height: 440px; overflow-y: auto;">
                  <el-empty v-if="personnel.length === 0" description="暂无人员数据" />
                  <div v-else style="display: flex; flex-direction: column; gap: 12px;">
                    <el-card 
                      v-for="person in personnel" 
                      :key="person.id"
                      shadow="hover"
                      style="background-color: #f5f7fa;"
                      :body-style="{ padding: '16px' }"
                    >
                      <div style="display: flex; align-items: center; gap: 16px;">
                        <el-avatar :size="56" :src="person.photo" />
                        <div style="flex: 1;">
                          <h3 style="margin: 0 0 4px 0; font-size: 16px; font-weight: 600;">{{ person.name }}</h3>
                          <p style="margin: 0; color: #909399; font-size: 14px;">{{ person.contact }}</p>
                        </div>
                      </div>
                    </el-card>
                  </div>
                </div>
              </el-card>
            </el-col>

            <!-- 领用提醒 -->
            <el-col :span="12">
              <el-card shadow="hover">
                <template #header>
                  <div style="display: flex; align-items: center; gap: 8px;">
                    <el-icon :size="20" color="#67C23A">
                      <Box />
                    </el-icon>
                    <span style="font-size: 18px; font-weight: 600;">领用提醒</span>
                    <el-tag size="small" type="info">{{ reminders.length }}条</el-tag>
                    <el-badge 
                      v-if="newRemindersCount > 0" 
                      :value="newRemindersCount" 
                      class="item"
                      type="danger"
                    >
                      <el-text type="danger" size="small">新增</el-text>
                    </el-badge>
                  </div>
                </template>
                <div style="max-height: 440px; overflow-y: auto;">
                  <el-empty v-if="reminders.length === 0" description="暂无领用记录" />
                  <div v-else style="display: flex; flex-direction: column;">
                    <div 
                      v-for="reminder in reminders" 
                      :key="reminder.id"
                      :style="{
                        padding: '16px',
                        borderBottom: '1px solid #EBEEF5',
                        transition: 'all 0.3s',
                        backgroundColor: isNewReminder(reminder.id) ? '#fef0f0' : 'transparent'
                      }"
                      @mouseenter="$event.currentTarget.style.backgroundColor = '#f5f7fa'"
                      @mouseleave="$event.currentTarget.style.backgroundColor = isNewReminder(reminder.id) ? '#fef0f0' : 'transparent'"
                    >
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="font-weight: 600; font-size: 15px;">{{ reminder.id }}</span>
                          <el-tag v-if="isNewReminder(reminder.id)" type="danger" size="small" effect="dark">NEW</el-tag>
                        </div>
                        <el-tag 
                          :type="getStatusConfig(reminder.status).type" 
                          size="small"
                          effect="plain"
                        >
                          {{ getStatusConfig(reminder.status).label }}
                        </el-tag>
                      </div>
                      <div style="display: flex; flex-direction: column; gap: 8px; font-size: 14px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="color: #909399;">领用人:</span>
                          <span style="font-weight: 500;">{{ reminder.person }}</span>
                        </div>
                        <div style="display: flex; align-items: flex-start; gap: 8px;">
                          <span style="color: #909399; white-space: nowrap;">RFID:</span>
                          <div style="display: flex; flex-wrap: wrap; gap: 6px; flex: 1;">
                            <el-tag 
                              v-for="(rfid, index) in reminder.rfids" 
                              :key="index"
                              size="small"
                              style="font-family: monospace;"
                            >
                              {{ rfid }}
                            </el-tag>
                          </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 8px;">
                          <span style="color: #909399;">类型:</span>
                          <el-tag type="primary" size="small" effect="plain">{{ reminder.type }}</el-tag>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </template>
      </el-main>
    </el-container>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'

const personnel = ref([])
const reminders = ref([])
const statistics = ref({
  totalPersonnel: 0,
  completedCount: 0,
  pendingCount: 0
})
const loading = ref(true)
const autoRefresh = ref(true)
const lastUpdateTime = ref('')
const newReminderIds = ref(new Set())
const newRemindersCount = ref(0)

// WebSocket 连接
let ws = null
let pollingTimer = null
let reconnectTimer = null
let reconnectAttempts = 0
const MAX_RECONNECT_ATTEMPTS = 5

// 连接状态
const connectionStatus = ref({
  text: '连接中',
  type: 'info',
  icon: 'Loading'
})

// API配置
const USE_WEBSOCKET = false // 设置为 true 启用 WebSocket，false 使用轮询
const POLLING_INTERVAL = 5000 // 轮询间隔（毫秒）
const API_BASE_URL = 'https://your-api-domain.com/api'
const WS_URL = 'ws://your-api-domain.com/ws'

const API_ENDPOINTS = {
  personnel: `${API_BASE_URL}/personnel`,
  reminders: `${API_BASE_URL}/reminders`,
  statistics: `${API_BASE_URL}/statistics`
}

// 检查是否是新提醒
const isNewReminder = (id) => {
  return newReminderIds.value.has(id)
}

// 更新最后更新时间
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

// 检测新增的提醒
const detectNewReminders = (newReminders) => {
  const oldIds = new Set(reminders.value.map(r => r.id))
  const newIds = new Set()
  
  newReminders.forEach(reminder => {
    if (!oldIds.has(reminder.id)) {
      newIds.add(reminder.id)
    }
  })
  
  if (newIds.size > 0) {
    newReminderIds.value = newIds
    newRemindersCount.value = newIds.size
    
    // 显示通知
    ElMessage.success({
      message: `检测到 ${newIds.size} 条新的领用提醒`,
      duration: 3000
    })
    
    // 3秒后清除新标记
    setTimeout(() => {
      newReminderIds.value.clear()
      newRemindersCount.value = 0
    }, 3000)
  }
}

// HTTP 轮询获取数据
const fetchData = async () => {
  try {
    const [personnelRes, remindersRes, statisticsRes] = await Promise.all([
      fetch(API_ENDPOINTS.personnel),
      fetch(API_ENDPOINTS.reminders),
      fetch(API_ENDPOINTS.statistics)
    ])

    if (!personnelRes.ok || !remindersRes.ok || !statisticsRes.ok) {
      throw new Error('获取数据失败')
    }

    const newPersonnel = await personnelRes.json()
    const newReminders = await remindersRes.json()
    const newStatistics = await statisticsRes.json()

    // 检测新提醒
    if (reminders.value.length > 0) {
      detectNewReminders(newReminders)
    }

    personnel.value = newPersonnel
    reminders.value = newReminders
    statistics.value = newStatistics
    
    updateLastUpdateTime()
    updateConnectionStatus('connected')
  } catch (err) {
    console.error('API请求失败:', err)
    updateConnectionStatus('error')
    // 使用模拟数据
    if (personnel.value.length === 0) {
      loadMockData()
    }
  } finally {
    loading.value = false
  }
}

// WebSocket 连接
const connectWebSocket = () => {
  if (!USE_WEBSOCKET) return

  try {
    ws = new WebSocket(WS_URL)
    
    ws.onopen = () => {
      console.log('WebSocket 连接成功')
      updateConnectionStatus('connected')
      reconnectAttempts = 0
      
      // 请求初始数据
      ws.send(JSON.stringify({ type: 'subscribe', channels: ['personnel', 'reminders', 'statistics'] }))
    }
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        switch(data.type) {
          case 'personnel':
            personnel.value = data.payload
            break
          case 'reminders':
            if (reminders.value.length > 0) {
              detectNewReminders(data.payload)
            }
            reminders.value = data.payload
            break
          case 'statistics':
            statistics.value = data.payload
            break
          case 'update':
            // 全量更新
            if (data.personnel) personnel.value = data.personnel
            if (data.reminders) {
              if (reminders.value.length > 0) {
                detectNewReminders(data.reminders)
              }
              reminders.value = data.reminders
            }
            if (data.statistics) statistics.value = data.statistics
            break
        }
        
        updateLastUpdateTime()
        loading.value = false
      } catch (err) {
        console.error('解析 WebSocket 消息失败:', err)
      }
    }
    
    ws.onerror = (error) => {
      console.error('WebSocket 错误:', error)
      updateConnectionStatus('error')
    }
    
    ws.onclose = () => {
      console.log('WebSocket 连接关闭')
      updateConnectionStatus('disconnected')
      
      // 尝试重连
      if (autoRefresh.value && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++
        reconnectTimer = setTimeout(() => {
          console.log(`尝试重连 (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`)
          connectWebSocket()
        }, 3000 * reconnectAttempts)
      }
    }
  } catch (err) {
    console.error('WebSocket 连接失败:', err)
    updateConnectionStatus('error')
  }
}

// 启动轮询
const startPolling = () => {
  if (USE_WEBSOCKET) return
  
  fetchData()
  
  if (autoRefresh.value) {
    pollingTimer = setInterval(() => {
      fetchData()
    }, POLLING_INTERVAL)
  }
}

// 停止轮询
const stopPolling = () => {
  if (pollingTimer) {
    clearInterval(pollingTimer)
    pollingTimer = null
  }
}

// 更新连接状态
const updateConnectionStatus = (status) => {
  const statusMap = {
    connected: { text: '已连接', type: 'success', icon: 'CircleCheck' },
    disconnected: { text: '已断开', type: 'warning', icon: 'CircleClose' },
    error: { text: '连接错误', type: 'danger', icon: 'CircleClose' },
    connecting: { text: '连接中', type: 'info', icon: 'Loading' }
  }
  connectionStatus.value = statusMap[status] || statusMap.connecting
}

// 切换自动刷新
const toggleAutoRefresh = (value) => {
  if (USE_WEBSOCKET) {
    if (value) {
      connectWebSocket()
    } else {
      if (ws) {
        ws.close()
        ws = null
      }
    }
  } else {
    if (value) {
      startPolling()
    } else {
      stopPolling()
    }
  }
}

// 手动刷新
const manualRefresh = () => {
  loading.value = true
  if (USE_WEBSOCKET && ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'refresh' }))
    setTimeout(() => {
      loading.value = false
    }, 500)
  } else {
    fetchData()
  }
}

// 模拟数据
const loadMockData = () => {
  personnel.value = [
    { id: 1, name: '张三', contact: '13800138001', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang' },
    { id: 2, name: '李四', contact: '13800138002', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li' },
    { id: 3, name: '王五', contact: '13800138003', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang' },
    { id: 4, name: '赵六', contact: '13800138004', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhao' },
    { id: 5, name: '孙七', contact: '13800138005', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sun' },
    { id: 6, name: '周八', contact: '13800138006', photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhou' }
  ]

  reminders.value = [
    { id: 'RC2024001', person: '张三', rfids: ['RFID-8825-3391', 'RFID-7234-5521', 'RFID-9182-4463'], status: 'pending', type: '临时领用' },
    { id: 'RC2024002', person: '李四', rfids: ['RFID-7723-4482', 'RFID-3345-2219'], status: 'completed', type: '长期领用' },
    { id: 'RC2024003', person: '王五', rfids: ['RFID-5516-2278'], status: 'overdue', type: '临时领用' },
    { id: 'RC2024004', person: '张三', rfids: ['RFID-9934-1156', 'RFID-4421-8837', 'RFID-6653-1192', 'RFID-2298-3304'], status: 'pending', type: '长期领用' },
    { id: 'RC2024005', person: '赵六', rfids: ['RFID-1122-3344', 'RFID-5566-7788'], status: 'completed', type: '临时领用' },
    { id: 'RC2024006', person: '孙七', rfids: ['RFID-9988-7766'], status: 'pending', type: '长期领用' }
  ]

  statistics.value = {
    totalPersonnel: 6,
    completedCount: 2,
    pendingCount: 3
  }
  
  updateLastUpdateTime()
}

const getStatusConfig = (status) => {
  const configs = {
    pending: { label: '待领用', type: 'warning' },
    completed: { label: '已完成', type: 'success' },
    overdue: { label: '已逾期', type: 'danger' }
  }
  return configs[status] || { label: '未知', type: 'info' }
}

onMounted(() => {
  if (USE_WEBSOCKET) {
    connectWebSocket()
  } else {
    startPolling()
  }
})

onBeforeUnmount(() => {
  // 清理资源
  stopPolling()
  if (ws) {
    ws.close()
    ws = null
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }
})
</script>
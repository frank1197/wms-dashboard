<template>
  <div style="min-height: 100vh; background: linear-gradient(135deg, #f5f7fa 0%, #e4e7ed 100%); padding: 24px;">
    <el-container style="max-width: 1400px; margin: 0 auto;">
      <el-main>
        <!-- 页面标题 -->
        <div style="margin-bottom: 24px;">
          <h1 style="font-size: 28px; font-weight: bold; color: #303133; margin-bottom: 8px;">库房设备管理系统</h1>
          <p style="color: #909399;">实时监控设备领用状态与人员信息</p>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" style="text-align: center; padding: 100px 0;">
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
                  </div>
                </template>
                <div style="max-height: 440px; overflow-y: auto;">
                  <el-empty v-if="reminders.length === 0" description="暂无领用记录" />
                  <div v-else style="display: flex; flex-direction: column;">
                    <div 
                      v-for="reminder in reminders" 
                      :key="reminder.id"
                      style="padding: 16px; border-bottom: 1px solid #EBEEF5; transition: background-color 0.3s;"
                      @mouseenter="$event.currentTarget.style.backgroundColor = '#f5f7fa'"
                      @mouseleave="$event.currentTarget.style.backgroundColor = 'transparent'"
                    >
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <span style="font-weight: 600; font-size: 15px;">{{ reminder.id }}</span>
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
import { ref, onMounted } from 'vue'

const personnel = ref([])
const reminders = ref([])
const statistics = ref({
  totalPersonnel: 0,
  completedCount: 0,
  pendingCount: 0
})
const loading = ref(true)

// API配置 - 请替换为您的实际API地址
const API_BASE_URL = 'https://your-api-domain.com/api'
const API_ENDPOINTS = {
  personnel: `${API_BASE_URL}/personnel`,
  reminders: `${API_BASE_URL}/reminders`,
  statistics: `${API_BASE_URL}/statistics`
}

// 获取所有数据
const fetchData = async () => {
  loading.value = true
  
  try {
    const [personnelRes, remindersRes, statisticsRes] = await Promise.all([
      fetch(API_ENDPOINTS.personnel),
      fetch(API_ENDPOINTS.reminders),
      fetch(API_ENDPOINTS.statistics)
    ])

    if (!personnelRes.ok || !remindersRes.ok || !statisticsRes.ok) {
      throw new Error('获取数据失败')
    }

    personnel.value = await personnelRes.json()
    reminders.value = await remindersRes.json()
    statistics.value = await statisticsRes.json()
  } catch (err) {
    console.error('API请求失败:', err)
    // 使用模拟数据作为后备
    loadMockData()
  } finally {
    loading.value = false
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
  fetchData()
})
</script>
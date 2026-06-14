const fs = require('fs')
const path = require('path')

const frontendRoot = path.join(__dirname, '..')
const workspaceRoot = path.join(frontendRoot, '..')
const backendRoot = path.join(workspaceRoot, 'WMS-RFID', 'src', 'main', 'java', 'com', 'wms', 'wmdrfid')

const read = (...segments) => fs.readFileSync(path.join(...segments), 'utf8')

const source = read(frontendRoot, 'src', 'components', 'WarehouseDashboard.vue')
const statisticsVo = read(backendRoot, 'domain', 'StatisticsVo.java')
const toolInfoVo = read(backendRoot, 'domain', 'ToolInfoVo.java')
const toolRecordVo = read(backendRoot, 'domain', 'ToolInOutRecordVo.java')
const warehouseService = read(backendRoot, 'service', 'WarehouseService.java')
const recordService = read(backendRoot, 'Conf', 'DB', 'service', 'impl', 'ToolInOutRecordServiceImpl.java')
const countsOverdueTools = /ToolInfo::getAssetStatus/.test(warehouseService)
  && /ASSET_STATUS_INVALID\s*=\s*["']1["']/.test(warehouseService)

const expectations = [
  ['keep total tools KPI', /工器具总数/.test(source)],
  ['keep tool records KPI', /出入库记录/.test(source)],
  ['keep unreturned count KPI', /未归还数量/.test(source)],
  ['add overdue tools KPI', /逾期工具/.test(source)],
  ['frontend statistics reads overdueTools', /statistics\.overdueTools|overdueTools:\s*data\.overdueTools/.test(source)],
  ['tool info VO exposes assetStatus for filtering', /private\s+String\s+assetStatus/.test(toolInfoVo)],
  ['statistics VO exposes overdueTools', /private\s+Integer\s+overdueTools/.test(statisticsVo)],
  ['backend counts overdue tools from assetStatus=1', countsOverdueTools],
  ['tools dialog supports overdue filtering', /dialogTools|filteredTools|toolDialogMode/.test(source)],
  ['records table adds plan status column', /计划状态/.test(source) && /row\.planStatus/.test(source)],
  ['records table hides horizontal scrollbar', /\.table-container\s*\{[\s\S]*overflow-x:\s*hidden/.test(source)],
  ['records table uses fixed layout without minimum width', /table\s*\{[\s\S]*table-layout:\s*fixed/.test(source) && !/min-width:\s*960px/.test(source)],
  ['rfid column renders compact display with full title', /formatRfid/.test(source) && /:title="row\.rfid/.test(source)],
  ['rfid column has compact class hooks', /class="rfid-col"/.test(source) && /class="rfid-cell"/.test(source)],
  ['tool record VO exposes planStatus', /private\s+String\s+planStatus/.test(toolRecordVo)],
  ['record service associates active use plans', /selectActiveUsePlansByPersonIdAndQueryTime/.test(recordService)],
  ['plan status has planned fallback label', /计划出库/.test(recordService)],
  ['plan status has temporary fallback label', /临时出库/.test(recordService)],
  ['keep original tool records fallback logic', /statistics\.toolRecords\s*\|\|\s*toolRecords\.length/.test(source)],
  ['use ECharts dependency', /from ['"]echarts['"]/.test(source)],
  ['provide tool chart container', /ref=["']toolsChartRef["']/.test(source)],
  ['aggregate pie chart data by tool name', /buildToolChartData/.test(source)],
  ['use dashboard title', /智能无感出入库终端/.test(source)],
  ['keep active tools section', /当前识别工具/.test(source)]
]

const failures = expectations.filter(([, passed]) => !passed)

if (failures.length > 0) {
  console.error('Dashboard refactor verification failed:')
  for (const [message] of failures) {
    console.error(`- ${message}`)
  }
  process.exit(1)
}

console.log('Dashboard refactor verification passed')

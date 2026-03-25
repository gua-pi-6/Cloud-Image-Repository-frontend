<template>
  <div id="teamSpacePage">
    <!-- ========================================== -->
    <!-- 1. 顶部仪表盘区域 (高度统一拉伸)               -->
    <!-- ========================================== -->
    <div class="scope-view team-view">
      <div class="dashboard-header">
        <a-row :gutter="24" type="flex" align="stretch">

          <!-- [面板1] 团队欢迎与快捷操作 -->
          <a-col :span="24" :md="8" class="flex-col">
            <div class="team-panel glass-panel dashboard-panel">
              <div class="panel-content">
                <div class="team-badge">
                  <TeamOutlined /> 团队协作空间
                </div>
                <h2 class="team-title">共享云图库</h2>
                <p class="team-desc">在这里与团队成员共享、管理高质量资产</p>
              </div>
              <div class="panel-footer">
                <a-space>
                  <a-button
                    type="primary"
                    size="large"
                    class="action-btn"
                    @click="toCreationPage"
                    v-if="canUploadPicture"
                  >
                    <CloudUploadOutlined />
                    <span>上传新作品</span>
                  </a-button>

                  <a-button
                    type="primary"
                    size="large"
                    class="action-btn"
                    @click="toMemberManage"
                    v-if="canManageSpaceUser"
                  >
                    <UsergroupAddOutlined />
                    <span>成员管理</span>
                  </a-button>
                </a-space>
              </div>
            </div>
          </a-col>

          <!-- [面板2] 团队作品总数统计 -->
          <a-col :span="24" :md="8" class="flex-col">
            <div class="stats-panel glass-panel dashboard-panel">
              <div class="stats-header">
                <PictureOutlined class="stats-icon text-blue" />
                <h4>团队总作品数</h4>
              </div>
              <div class="stats-body count-body">
                <div class="count-wrapper">
                  <!-- 使用 ref 绑定元素以供 GSAP 动画使用 -->
                  <span class="highlight-number" ref="countRef">0</span>
                  <span class="count-unit">张</span>
                </div>
                <p class="stats-subtext">团队累计创造的价值资产</p>
              </div>
            </div>
          </a-col>

          <!-- [面板3] 团队存储概览 -->
          <a-col :span="24" :md="8" class="flex-col">
            <div class="stats-panel glass-panel dashboard-panel">
              <div class="stats-header">
                <CloudServerOutlined class="stats-icon text-green" />
                <h4>团队存储概览</h4>
              </div>
              <div class="stats-body storage-body">
                <a-progress
                  type="dashboard"
                  :percent="storagePercent"
                  :width="90"
                  :strokeColor="{ '0%': '#108ee9', '100%': '#87d068' }"
                />
                <div class="storage-info">
                  <div class="stat-row">
                    <span class="stat-label">已用容量</span>
                    <b class="stat-value">{{ displayTotalSize }}</b>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">团队总量</span>
                    <b class="stat-value">{{ displayMaxSize }}</b>
                  </div>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 2. 搜索与高级筛选区域                         -->
    <!-- ========================================== -->
    <div class="search-section">
      <!-- 主搜索栏 -->
      <div class="main-search-bar glass-panel">
        <div class="search-input-wrapper">
          <SearchOutlined class="search-icon" />
          <a-input
            v-model:value="searchParams.searchText"
            placeholder="搜索团队作品名称、标签或描述..."
            size="large"
            class="main-search-input"
            @pressEnter="handleSearch"
            allow-clear
          >
            <template #suffix>
              <a-button type="text" class="filter-toggle-btn" @click="toggleAdvancedFilter">
                <FilterOutlined :class="{ 'filter-active': isFilterActive }" />
                <span class="filter-text">筛选</span>
                <span v-if="activeFilterCount > 0" class="filter-count">{{ activeFilterCount }}</span>
              </a-button>
            </template>
          </a-input>
          <a-button type="primary" size="large" class="search-btn" @click="handleSearch">
            搜索
          </a-button>
        </div>
      </div>

      <!-- 高级筛选面板 (展开/折叠) -->
      <div v-show="showAdvancedFilter" class="advanced-filter-panel glass-panel">
        <a-row :gutter="[16, 16]">
          <!-- 分类筛选 -->
          <a-col :span="24" :md="12">
            <div class="filter-item">
              <div class="filter-label">
                <AppstoreOutlined class="label-icon" />
                <span>作品分类</span>
              </div>
              <a-select
                v-model:value="searchParams.category"
                placeholder="选择分类"
                size="large"
                style="width: 100%"
                allow-clear
                @change="handleSearch"
              >
                <a-select-option v-for="opt in categoryOptions" :key="opt.value" :value="opt.value">
                  <template v-if="opt.icon">
                    <component :is="opt.icon" style="margin-right:6px;" />
                  </template>
                  {{ opt.label }}
                </a-select-option>
              </a-select>
            </div>
          </a-col>

          <!-- 时间筛选 -->
          <a-col :span="24" :md="12">
            <div class="filter-item">
              <div class="filter-label">
                <CalendarOutlined class="label-icon" />
                <span>编辑时间</span>
              </div>
              <a-range-picker
                v-model:value="dateRange"
                size="large"
                style="width: 100%"
                :placeholder="['开始时间', '结束时间']"
                format="YYYY-MM-DD"
                @change="handleDateChange"
              />
            </div>
          </a-col>
        </a-row>

        <!-- 快捷时间选择 -->
        <div class="quick-date-filters">
          <span class="quick-label">快捷选择:</span>
          <a-space :size="8">
            <a-tag
              v-for="preset in datePresets"
              :key="preset.key"
              :class="['quick-tag', { active: currentPreset === preset.key }]"
              @click="applyDatePreset(preset)"
            >
              {{ preset.label }}
            </a-tag>
          </a-space>
        </div>

        <!-- 筛选操作底部 -->
        <div class="filter-actions">
          <a-button @click="handleReset" class="reset-btn">
            <ReloadOutlined /> 重置筛选
          </a-button>
          <div class="filter-summary">
            <span v-if="activeFilterCount > 0">
              已选择 <b class="count-highlight">{{ activeFilterCount }}</b> 个筛选条件
            </span>
            <span v-else class="no-filter">未选择筛选条件</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ========================================== -->
    <!-- 3. 图片列表展示区域                           -->
    <!-- ========================================== -->
    <div class="gallery-grid team-grid">
      <a-list
        :grid="{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 5 }"
        :data-source="images"
        :pagination="paginationConfig"
        :loading="loading"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <div class="art-card team-card">
              <div class="card-image-box">
                <!-- 图片封面 -->
                <img @click="toPictureDetail(item.id)" :src="item.thumbnailUrl" :alt="item.name" />
                <!-- 悬浮操作按钮组 -->
                <div class="team-actions">
                  <a-tooltip title="编辑">
                    <a-button v-if="canEditPicture" @click="handleEdit(item)" shape="circle" class="icon-btn"><EditOutlined /></a-button>
                  </a-tooltip>
                  <a-tooltip title="下载">
                    <a-button v-if="canUploadPicture" @click="handleDownload(item)" shape="circle" class="icon-btn"><DownloadOutlined /></a-button>
                  </a-tooltip>
                  <a-tooltip title="以图识图">
                    <a-button v-if="canEditPicture" @click="handleImageSearch(item)" shape="circle" class="icon-btn"><search-outlined /></a-button>
                  </a-tooltip>
                  <a-tooltip title="以图扩图">
                    <a-button v-if="canEditPicture" @click="handleImageExpand(item)" shape="circle" class="icon-btn"><ExpandOutlined /></a-button>
                  </a-tooltip>
                  <a-tooltip title="删除">
                    <a-button v-if="canDeletePicture" @click="handleDelete(item)" shape="circle" danger class="icon-btn"><DeleteOutlined /></a-button>
                  </a-tooltip>
                </div>
              </div>
              <!-- 图片信息 -->
              <div class="card-info minimal-info">
                <div class="card-title">{{ item.name }}</div>
                <div class="file-meta">
                  <FileImageOutlined />
                  <span>
                    {{ item.picFormat }} · {{ showPictureSize(item.picSize) }} · {{ dayjs(item.createTime).format('YYYY-MM-DD') }}
                  </span>
                </div>
              </div>
            </div>
          </a-list-item>
        </template>
      </a-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import gsap from 'gsap'
import { saveAs } from 'file-saver'
import { showPictureSize } from '@/utils'
import { getSpaceVoUsingPost } from '@/api/spaceController'
import { deletePictureUsingPost, listPictureVoByPageUsingPost } from '@/api/pictureController'

// 图标引入
import {
  CloudServerOutlined, CloudUploadOutlined, DeleteOutlined, DownloadOutlined,
  EditOutlined, FileImageOutlined, TeamOutlined, SearchOutlined, FilterOutlined,
  AppstoreOutlined, CalendarOutlined, ReloadOutlined, LayoutOutlined, ShoppingOutlined,
  SmileOutlined, PictureOutlined, ExpandOutlined, UsergroupAddOutlined
} from '@ant-design/icons-vue'
import { SPACE_PERMISSION_ENUM } from '@/constants/SpaceConstant'

// ==========================================
// 1. 基础状态与定义
// ==========================================
const props = defineProps<{ id: number }>()
const router = useRouter()

const loading = ref(true)
const countRef = ref(null) // 用于数字增长动画的 DOM 引用
const showAdvancedFilter = ref(false)

// 空间信息状态
const space = ref<API.SpaceVO>({
  id: 0,
  spaceName: '',
  spaceLevel: 0,
  maxSize: 1,
  maxCount: 0,
  totalSize: 0,
  totalCount: 0,
})

// 图片列表状态
const images = ref<API.PictureVO[]>([])

// ==========================================
// 2. 搜索与筛选配置
// ==========================================
const searchParams = reactive({
  searchText: '',
  category: '',
  startEditTime: '',
  endEditTime: ''
})

const dateRange = ref<[Dayjs, Dayjs] | null>(null)
const currentPreset = ref('')

// 快捷日期预设
const datePresets = [
  { key: 'today', label: '今天', days: 0 },
  { key: 'week', label: '近7天', days: 7 },
  { key: 'month', label: '近30天', days: 30 },
  { key: 'quarter', label: '近3个月', days: 90 },
]

// 分类选项配置
const categoryOptions: Array<{ key?: string; value: string; label: string; icon?: any }> = [
  { key: 'all', value: '', label: '全部分类' },
  { key: 'template', value: '模板', label: '模板', icon: LayoutOutlined },
  { key: 'ecommerce', value: '电商', label: '电商', icon: ShoppingOutlined },
  { key: 'sticker', value: '表情包', label: '表情包', icon: SmileOutlined },
  { key: 'poster', value: '海报', label: '海报', icon: PictureOutlined },
]

// 筛选激活状态计算
const activeFilterCount = computed(() => {
  return (searchParams.category ? 1 : 0) + (searchParams.startEditTime ? 1 : 0)
})
const isFilterActive = computed(() => activeFilterCount.value > 0 || showAdvancedFilter.value)

// 分页配置
const paginationConfig = reactive({
  current: 1,
  pageSize: 12,
  total: 0,
  showQuickJumper: true,
  onChange: async (page: number) => {
    paginationConfig.current = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
    await fetchPictures()
  },
})

// 构造最终的查询请求参数
const searchCondition = computed<API.PictureQueryRequest>(() => ({
  current: paginationConfig.current,
  pageSize: paginationConfig.pageSize,
  searchText: searchParams.searchText,
  tags: [],
  category: searchParams.category,
  spaceId: props.id,
  startEditTime: searchParams.startEditTime,
  endEditTime: searchParams.endEditTime,
}))

// ==========================================
// 3. 计算属性 (仪表盘数据)
// ==========================================
const storagePercent = computed(() => {
  const percent = ((space.value?.totalSize ?? 0) / (space.value?.maxSize ?? 1)) * 100
  return parseFloat(percent.toFixed(2))
})
const displayTotalSize = computed(() => showPictureSize(space.value?.totalSize ?? 0))
const displayMaxSize = computed(() => showPictureSize(space.value?.maxSize ?? 0))

// ==========================================
// 4. 操作与事件方法
// ==========================================

// 定义权限检查
const canManageSpaceUser = createPermissionChecker(SPACE_PERMISSION_ENUM.SPACE_USER_MANAGE)
const canUploadPicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_UPLOAD)
const canEditPicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_EDIT)
const canDeletePicture = createPermissionChecker(SPACE_PERMISSION_ENUM.PICTURE_DELETE)

// 通用权限检查函数
function createPermissionChecker(permission: string) {
  return computed(() => {
    return (space.value.permissionList ?? []).includes(permission)
  })
}



// 路由跳转
const toCreationPage = () => router.push(`/creation/picture`)
const toPictureDetail = (id: number) => router.push(`/picture/${id}`)
const handleEdit = (item: API.PictureVO) => router.push(`/creation/picture?id=${item.id}`)
const handleImageSearch = (item: API.PictureVO) => router.push(`/picture/search/${item.id}`)
const handleImageExpand = (item: API.PictureVO) => router.push(`/expansion/picture/${item.id}`)
const toMemberManage = () => {
  router.push(`/space/userManage/${props.id}`)
}
// 监听 id 的变化（当切换相邻团队时触发）
watch(
  () => props.id,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      // 1. 重置分页和搜索条件
      paginationConfig.current = 1
      searchParams.searchText = ''
      searchParams.category = ''
      searchParams.startEditTime = ''
      searchParams.endEditTime = ''


      // 2. 重新加载新空间的数据
      await fetchSpaceVo()
      await fetchPictures()
    }
  }
)

/**
 * 处理下载
 */
const handleDownload = (item: API.PictureVO) => {
  if (!item || !item.url) {
    return message.warn('下载地址不可用')
  }
  try {
    saveAs(item.url, item.name ? `${item.name}` : 'picture')
  } catch (e) {
    message.error('下载失败')
  }
}

/**
 * 处理删除
 */
const handleDelete = async (item: API.PictureVO) => {
  const res = await deletePictureUsingPost({ id: item.id })
  if (res.data.code === 0 && res.data.data) {
    message.success('删除成功')
    await fetchPictures()
  } else {
    message.error(res.data.message)
  }
}

// ==========================================
// 5. 搜索与筛选逻辑
// ==========================================

const toggleAdvancedFilter = () => {
  showAdvancedFilter.value = !showAdvancedFilter.value
}

/**
 * 处理日期范围改变
 */
const handleDateChange = (dates: [Dayjs, Dayjs] | null) => {
  if (dates && dates.length === 2) {
    searchParams.startEditTime = dates[0].format('YYYY-MM-DD')
    searchParams.endEditTime = dates[1].format('YYYY-MM-DD')
    currentPreset.value = '' // 清空快捷选项选中状态
  } else {
    searchParams.startEditTime = ''
    searchParams.endEditTime = ''
  }
  handleSearch()
}

/**
 * 应用快捷日期预设
 */
const applyDatePreset = (preset: any) => {
  if (currentPreset.value === preset.key) return
  currentPreset.value = preset.key

  const endDate = dayjs()
  const startDate = preset.days === 0 ? endDate.startOf('day') : endDate.subtract(preset.days, 'day')

  dateRange.value = [startDate, endDate]
  searchParams.startEditTime = startDate.format('YYYY-MM-DD')
  searchParams.endEditTime = endDate.format('YYYY-MM-DD')

  handleSearch()
}

/**
 * 触发搜索
 */
const handleSearch = async () => {
  paginationConfig.current = 1
  await fetchPictures()
}

/**
 * 重置筛选条件
 */
const handleReset = () => {
  searchParams.searchText = ''
  searchParams.category = ''
  searchParams.startEditTime = ''
  searchParams.endEditTime = ''
  dateRange.value = null
  currentPreset.value = ''
  handleSearch()
}

// ==========================================
// 6. 数据获取与动画
// ==========================================

/**
 * 数字增长动画 (GSAP)
 */
const animateNumber = (targetValue: number) => {
  if (!countRef.value) return
  gsap.to(countRef.value, {
    innerHTML: targetValue,
    duration: 1.5,
    snap: { innerHTML: 1 },
    ease: 'power1.out',
  })
}

/**
 * 获取图片列表
 */
const fetchPictures = async () => {
  loading.value = true
  try {
    const res = await listPictureVoByPageUsingPost(searchCondition.value)
    if (res.data.code === 0 && res.data.data) {
      images.value = res.data.data.records ?? []
      paginationConfig.total = res.data.data.total ?? 0
      // 触发总数动画
      animateNumber(paginationConfig.total)
    }
  } finally {
    loading.value = false
  }
}

/**
 * 获取空间详情
 */
const fetchSpaceVo = async () => {
  const res = await getSpaceVoUsingPost({ id: props.id })
  if (res.data.code === 0 && res.data.data) {
    space.value = res.data.data
  } else {
    message.error(res.data.message)
  }
}

// ==========================================
// 7. 生命周期钩子
// ==========================================
onMounted(async () => {
  await fetchSpaceVo()
  await fetchPictures()
})
</script>

<style scoped lang="scss">
// ==========================================
// 变量定义
// ==========================================
$team-primary: #2f54eb;
$glass-bg: rgba(255, 255, 255, 0.9);
$glass-border: 1px solid rgba(0, 0, 0, 0.04);
$shadow-sm: 0 2px 12px rgba(0, 0, 0, 0.04);
$shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
$shadow-hover: 0 12px 32px rgba(47, 84, 235, 0.12);
$transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

// ==========================================
// 全局布局
// ==========================================
#teamSpacePage {
  min-height: 100vh;
  padding-bottom: 40px;
}

// Flex 引擎：保证高度统一拉伸
.flex-col {
  display: flex;
  align-items: stretch;
}

// 玻璃拟态面板通用样式
.glass-panel {
  background: $glass-bg;
  border: $glass-border;
  border-radius: 16px;
  box-shadow: $shadow-sm;
  padding: 24px;
  margin-bottom: 24px;
  width: 100%;
  transition: $transition-smooth;

  &:hover {
    box-shadow: $shadow-md;
  }
}

// ==========================================
// 1. 顶部仪表盘样式
// ==========================================
.dashboard-header {
  margin-bottom: 8px;
}

.dashboard-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  flex: 1;
  min-height: 220px;
}

// 面板 1: 欢迎与快捷操作
.team-panel {
  background: linear-gradient(145deg, #ffffff, #f0f5ff);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    bottom: -20px;
    right: -20px;
    width: 120px;
    height: 120px;
    background: radial-gradient(circle, rgba(47, 84, 235, 0.05) 0%, transparent 70%);
    border-radius: 50%;
  }

  .team-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: $team-primary;
    background: rgba(47, 84, 235, 0.1);
    padding: 6px 12px;
    border-radius: 20px;
    margin-bottom: 16px;
  }

  .team-title {
    font-size: 22px;
    font-weight: 700;
    color: #1a1a1a;
    margin-bottom: 8px;
  }

  .team-desc {
    color: #666;
    font-size: 14px;
    margin-bottom: 0;
  }

  .panel-footer {
    margin-top: 24px;
    z-index: 1;
  }

  .action-btn {
    background: $team-primary;
    border: none;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: $transition-smooth;

    &:hover {
      background: #1d39c4;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(47, 84, 235, 0.3);
    }
  }
}

// 面板 2 & 3 通用结构
.stats-panel {
  justify-content: flex-start;

  .stats-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;

    .stats-icon {
      font-size: 18px;
      &.text-blue { color: $team-primary; }
      &.text-green { color: #52c41a; }
    }

    h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
  }

  .stats-body {
    flex: 1;
    display: flex;
  }
}

// 面板 2: 数量统计
.count-body {
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  background: #fafafa;
  border-radius: 12px;
  padding: 20px;

  .count-wrapper {
    margin-bottom: 8px;
  }

  .highlight-number {
    font-size: 36px;
    font-weight: 800;
    color: $team-primary;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  .count-unit {
    font-size: 14px;
    color: #666;
    margin-left: 4px;
    font-weight: 500;
  }

  .stats-subtext {
    font-size: 13px;
    color: #999;
    margin: 0;
  }
}

// 面板 3: 存储概览
.storage-body {
  align-items: center;
  gap: 20px;

  .storage-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 13px;
    padding-bottom: 6px;
    border-bottom: 1px dashed #f0f0f0;

    &:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }
  }

  .stat-label {
    color: #666;
  }

  .stat-value {
    color: #333;
    font-weight: 600;
  }
}

// ==========================================
// 2. 搜索与筛选区域样式
// ==========================================
.search-section {
  margin-bottom: 24px;
}

.main-search-bar {
  padding: 16px 24px;
  margin-bottom: 0;

  .search-input-wrapper {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .search-icon {
    font-size: 20px;
    color: $team-primary;
    margin-right: 4px;
  }

  .main-search-input {
    flex: 1;
    border-radius: 8px;
    border: 1px solid #e8e8e8;

    &:hover,
    &:focus {
      border-color: $team-primary;
      box-shadow: 0 0 0 2px rgba(47, 84, 235, 0.1);
    }
  }

  .search-btn {
    border-radius: 8px;
    background: $team-primary;
    border: none;
    font-weight: 500;

    &:hover {
      background: #1d39c4;
    }
  }
}

.filter-toggle-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #666;

  &:hover,
  .filter-active {
    color: $team-primary;
  }
}

.filter-count {
  background: #ff4d4f;
  color: #fff;
  padding: 0 6px;
  border-radius: 10px;
  font-size: 12px;
  margin-left: 4px;
}

// 高级筛选面板展开
.advanced-filter-panel {
  margin-top: 16px;
  background: #fff;
  border-top: 3px solid $team-primary;
}

.filter-item {
  .filter-label {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    font-size: 14px;
    color: #333;
    font-weight: 500;

    .label-icon {
      color: $team-primary;
    }
  }

  :deep(.ant-select-selector),
  :deep(.ant-picker) {
    border-radius: 8px;
  }
}

.quick-date-filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #f0f0f0;
  display: flex;
  align-items: center;
  gap: 12px;

  .quick-label {
    font-size: 13px;
    color: #999;
  }

  .quick-tag {
    cursor: pointer;
    border-radius: 6px;
    padding: 4px 12px;
    border: 1px solid #e8e8e8;
    background: #fafafa;
    color: #666;
    transition: all 0.2s;

    &:hover {
      color: $team-primary;
      border-color: $team-primary;
    }

    &.active {
      background: $team-primary;
      border-color: $team-primary;
      color: #fff;
    }
  }
}

.filter-actions {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .reset-btn {
    border-radius: 6px;
  }

  .filter-summary .count-highlight {
    color: $team-primary;
    margin: 0 4px;
  }
}

// ==========================================
// 3. 图片列表区域样式
// ==========================================
.team-grid {
  margin-top: 10px;
}

.team-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: $transition-smooth;
  border: 1px solid #f0f0f0;

  &:hover {
    transform: translateY(-6px);
    box-shadow: $shadow-hover;
    border-color: rgba(47, 84, 235, 0.2);

    .card-image-box img {
      transform: scale(1.05);
    }

    .team-actions {
      opacity: 1;
      transform: translateY(0);
    }
  }
}

.card-image-box {
  position: relative;
  height: 200px;
  overflow: hidden;
  background: #f5f5f5;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
}

.team-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(10px);
  transition: $transition-smooth;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.9);
  border: none;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  color: #666;
  width: 32px;
  height: 32px;

  &:hover {
    color: $team-primary;
    background: #fff;
    transform: scale(1.05);
  }
}

.card-info {
  padding: 12px 16px;
}

.card-title {
  font-weight: 500;
  font-size: 14px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 6px;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
}

// ==========================================
// 响应式适配
// ==========================================
@media (max-width: 768px) {
  .dashboard-header .ant-col {
    margin-bottom: 16px;
  }

  .glass-panel {
    margin-bottom: 0;
  }

  .storage-body {
    flex-direction: column;
    text-align: center;

    .storage-info {
      width: 100%;
    }
  }

  .search-input-wrapper {
    flex-wrap: wrap;

    .main-search-input {
      min-width: 100%;
      margin-bottom: 8px;
    }

    .search-btn {
      width: 100%;
    }
  }
}
</style>

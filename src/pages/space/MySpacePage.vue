<template>
  <div id="mySpacePage">
    <!-- ========================================== -->
    <!-- 1. 顶部仪表盘区域 (高度统一拉伸)               -->
    <!-- ========================================== -->
    <div v-if="space.id" class="scope-view private-view">
      <div class="dashboard-header">
        <a-row :gutter="24" type="flex" align="stretch">

          <!-- [左侧] 欢迎面板 -->
          <a-col :span="24" :md="16" class="flex-col">
            <div class="welcome-panel glass-panel dashboard-panel">
              <div class="welcome-text">
                <div class="greeting-badge">
                  <span class="badge-emoji">👋</span>
                  <span>欢迎回来</span>
                </div>
                <h2 class="welcome-title">{{ space.spaceName }}</h2>
                <p class="welcome-desc">
                  您已累计发布了
                  <!-- 数字动画锚点 -->
                  <span class="highlight-number" ref="countRef">0</span>
                  张作品到私人空间
                </p>
                <div class="action-buttons">
                  <a-button
                    type="primary"
                    size="large"
                    class="gradient-btn"
                    @click="toCreationPage"
                  >
                    <CloudUploadOutlined />
                    <span>上传新作品</span>
                  </a-button>
                </div>
              </div>
              <div class="welcome-illustration">
                <div class="illustration-circle">
                  <RocketTwoTone two-tone-color="#eb2f96" class="rocket-icon" />
                </div>
              </div>
            </div>
          </a-col>

          <!-- [右侧] 统计面板 -->
          <a-col :span="24" :md="8" class="flex-col">
            <div class="stats-panel glass-panel dashboard-panel">
              <div class="stats-header">
                <CloudServerOutlined class="stats-icon" />
                <h4>云端存储概览</h4>
              </div>
              <div class="storage-circle">
                <a-progress
                  type="dashboard"
                  :percent="storagePercent"
                  :width="120"
                  :strokeColor="{ '0%': '#108ee9', '100%': '#87d068' }"
                />
                <div class="storage-info">
                  <div class="stat-row">
                    <span class="stat-label">已用</span>
                    <b class="stat-value">{{ displayTotalSize }}</b>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">总量</span>
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
    <!-- 2. 搜索筛选区域 (团队空间规整直角样式)         -->
    <!-- ========================================== -->
    <div v-if="space.id" class="search-section">
      <!-- 主搜索栏 -->
      <div class="main-search-bar glass-panel">
        <div class="search-input-wrapper">
          <SearchOutlined class="search-icon" />
          <a-input
            v-model:value="searchParams.searchText"
            placeholder="搜索作品名称、标签或描述..."
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
    <!-- 3. 图片列表区域                               -->
    <!-- ========================================== -->
    <div v-if="space.id" class="gallery-grid private-grid">
      <a-list
        :grid="{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 5 }"
        :data-source="images"
        :pagination="paginationConfig"
        :loading="loading"
      >
        <template #renderItem="{ item }">
          <a-list-item>
            <div class="art-card private-card">
              <div class="card-image-box">
                <!-- 图片封面 -->
                <img @click="toPictureDetail(item.id)" :src="item.thumbnailUrl" :alt="item.name" />
                <!-- 悬浮操作按钮组 -->
                <div class="private-actions">
                  <a-tooltip title="编辑">
                    <a-button @click="handleEdit(item)" shape="circle" class="icon-btn"><EditOutlined /></a-button>
                  </a-tooltip>
                  <a-tooltip title="下载">
                    <a-button @click="handleDownload(item)" shape="circle" class="icon-btn"><DownloadOutlined /></a-button>
                  </a-tooltip>
                  <a-tooltip title="以图识图">
                    <a-button @click="handleImageSearch(item)" shape="circle" class="icon-btn"><SearchOutlined /></a-button>
                  </a-tooltip>
                  <a-tooltip title="以图扩图">
                    <a-button @click="handleImageExpand(item)" shape="circle" class="icon-btn"><ExpandOutlined /></a-button>
                  </a-tooltip>
                  <a-tooltip title="删除">
                    <a-button @click="handleDelete(item)" shape="circle" danger class="icon-btn"><DeleteOutlined /></a-button>
                  </a-tooltip>
                </div>
              </div>
              <!-- 卡片底部信息 -->
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

    <!-- ========================================== -->
    <!-- 4. 无空间提醒页面                             -->
    <!-- ========================================== -->
    <RemindNoSpaceComponent v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs, { Dayjs } from 'dayjs'
import gsap from 'gsap'
import { saveAs } from 'file-saver'
import { showPictureSize } from '@/utils'

// Store 与 API 引用
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { deletePictureUsingPost, listPictureVoByPageUsingPost } from '@/api/pictureController'
import RemindNoSpaceComponent from '@/components/space/RemindNoSpaceComponent.vue'

// 图标引用
import {
  CloudServerOutlined, CloudUploadOutlined, DeleteOutlined, DownloadOutlined,
  EditOutlined, FileImageOutlined, RocketTwoTone, SearchOutlined, FilterOutlined,
  AppstoreOutlined, CalendarOutlined, ReloadOutlined, LayoutOutlined, ShoppingOutlined,
  SmileOutlined, PictureOutlined, ExpandOutlined,
} from '@ant-design/icons-vue'

// ==========================================
// 1. 基础状态与定义
// ==========================================
const router = useRouter()
const loginUserStore = useLoginUserStore()
const spaceVoStore = useSpaceVoStore()

const loading = ref(true)
const countRef = ref(null) // 用于数字增长动画的 DOM 引用
const showAdvancedFilter = ref(false)

// 空间信息计算属性（回退默认值防止 undefined 错误）
const space = computed<API.SpaceVO>(() =>
  spaceVoStore.spaceVo || { id: 0, totalSize: 0, maxSize: 1 }
)

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
  onChange: (page: number) => {
    paginationConfig.current = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchPictures()
  },
})

// 构造最终查询请求参数
const searchCondition = computed((): API.PictureQueryRequest => ({
  current: paginationConfig.current,
  pageSize: paginationConfig.pageSize,
  searchText: searchParams.searchText,
  tags: [],
  category: searchParams.category,
  spaceId: space.value?.id ?? undefined,
  startEditTime: searchParams.startEditTime,
  endEditTime: searchParams.endEditTime,
}))

// ==========================================
// 3. 计算属性 (仪表盘数据)
// ==========================================
const storagePercent = computed<number>(() => {
  const percent = ((space.value?.totalSize ?? 0) / (space.value?.maxSize ?? 1)) * 100
  return parseFloat(percent.toFixed(2))
})
const displayTotalSize = computed<string>(() => showPictureSize(space.value?.totalSize ?? 0))
const displayMaxSize = computed<string>(() => showPictureSize(space.value?.maxSize ?? 0))

// ==========================================
// 4. 操作与事件方法
// ==========================================

// 路由跳转
const toCreationPage = () => router.push(`/creation/picture`)
const toPictureDetail = (id: number) => router.push(`/picture/${id}`)
const handleEdit = (item: API.PictureVO) => router.push(`/creation/picture?id=${item.id}`)
const handleImageSearch = (item: API.PictureVO) => router.push(`/picture/search/${item.id}`)
const handleImageExpand = (item: API.PictureVO) => router.push(`/expansion/picture/${item.id}`)

/**
 * 处理下载
 */
const handleDownload = (item: API.PictureVO) => {
  if (!item || !item.url) {
    return message.warn('下载地址不可用')
  }
  try {
    saveAs(item.url as any, item.name ? `${item.name}` : 'picture')
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
    fetchPictures()
    spaceVoStore.fetchSpaceVo() // 刷新空间容量等信息
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
    currentPreset.value = '' // 清空快捷选项
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
const handleSearch = () => {
  paginationConfig.current = 1
  fetchPictures()
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
    ease: 'power1.out'
  })
}

/**
 * 获取图片列表
 */
const fetchPictures = async () => {
  loading.value = true
  try {
    const res = await listPictureVoByPageUsingPost({
      ...searchCondition.value,
      nullSpaceId: false
    })

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

// ==========================================
// 7. 生命周期钩子
// ==========================================
onMounted(async () => {
  // 如果已登录但尚未获取到个人空间，则主动拉取一次
  if (loginUserStore.loginUser?.id && !spaceVoStore.spaceVo?.id) {
    await spaceVoStore.fetchSpaceVo()
  }
  fetchPictures()
})
</script>

<style scoped lang="scss">
// ==========================================
// 变量定义
// ==========================================
$primary-color: #1890ff;
$secondary-color: #36cfc9;
$glass-bg: rgba(255, 255, 255, 0.9);
$glass-border: 1px solid rgba(0, 0, 0, 0.04);
$shadow-sm: 0 2px 12px rgba(0, 0, 0, 0.04);
$shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
$shadow-hover: 0 12px 32px rgba(24, 144, 255, 0.12);
$transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

// ==========================================
// 全局布局
// ==========================================
#mySpacePage {
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

// ==========================================
// 1. 左侧：欢迎面板
// ==========================================
.welcome-panel {
  flex-direction: row;
  background: linear-gradient(135deg, #fff 0%, #f0f9ff 50%, #e6f7ff 100%);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(24, 144, 255, 0.1), transparent);
    border-radius: 50%;
  }

  .welcome-text {
    flex: 1;
    z-index: 1;
    padding-right: 20px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .greeting-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: #fff;
    padding: 6px 16px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
    color: $primary-color;
    margin-bottom: 16px;
    width: fit-content;
    box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
  }

  .welcome-title {
    font-size: 28px;
    font-weight: 800;
    margin-bottom: 12px;
    color: #1a1a1a;
    background: linear-gradient(135deg, #1a1a1a, $primary-color);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .welcome-desc {
    color: #666;
    margin-bottom: 24px;
    font-size: 15px;
  }

  .highlight-number {
    color: $primary-color;
    font-weight: 700;
    font-size: 24px;
    margin: 0 4px;
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  }

  .action-buttons {
    display: flex;
    gap: 12px;
  }

  .gradient-btn {
    background: linear-gradient(135deg, #1890ff, #36cfc9);
    border: none;
    border-radius: 8px;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: $transition-smooth;

    &:hover {
      background: linear-gradient(135deg, #096dd9, #13c2c2);
      box-shadow: 0 4px 12px rgba(24, 144, 255, 0.3);
      transform: translateY(-2px);
    }
  }

  .welcome-illustration {
    flex-shrink: 0;
    z-index: 1;
    display: flex;
    align-items: center;
  }

  .illustration-circle {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(24, 144, 255, 0.05), rgba(235, 47, 150, 0.05));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .rocket-icon {
    font-size: 70px;
  }
}

// ==========================================
// 2. 右侧：统计面板
// ==========================================
.stats-panel {
  justify-content: flex-start;

  .stats-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 20px;

    .stats-icon {
      font-size: 18px;
      color: $primary-color;
    }

    h4 {
      margin: 0;
      font-size: 15px;
      font-weight: 600;
      color: #333;
    }
  }

  .storage-circle {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
  }

  .storage-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .stat-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 16px;
    font-size: 13px;
  }

  .stat-label {
    color: #666;
    font-weight: 500;
  }

  .stat-value {
    color: #333;
    font-weight: 600;
    font-size: 14px;
  }
}

// ==========================================
// 3. 搜索区域 (团队统一规范直角样式)
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
    color: $primary-color;
    margin-right: 4px;
  }

  .main-search-input {
    flex: 1;
    border-radius: 8px;
    border: 1px solid #e8e8e8;

    &:hover,
    &:focus {
      border-color: $primary-color;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
  }

  .search-btn {
    border-radius: 8px;
    background: $primary-color;
    border: none;
    font-weight: 500;

    &:hover {
      background: #096dd9;
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
    color: $primary-color;
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
  border-top: 3px solid $primary-color;
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
      color: $primary-color;
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
      color: $primary-color;
      border-color: $primary-color;
    }

    &.active {
      background: $primary-color;
      border-color: $primary-color;
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
    color: $primary-color;
    margin: 0 4px;
  }
}

// ==========================================
// 4. 图片列表与卡片样式
// ==========================================
.private-grid {
  margin-top: 10px;
}

.private-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: $transition-smooth;
  border: 1px solid #f0f0f0;

  &:hover {
    transform: translateY(-6px);
    box-shadow: $shadow-hover;
    border-color: rgba(24, 144, 255, 0.2);

    .card-image-box img {
      transform: scale(1.05);
    }

    .private-actions {
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

.private-actions {
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
    color: $primary-color;
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
// 5. 响应式适配
// ==========================================
@media (max-width: 768px) {
  .welcome-panel {
    flex-direction: column;
    text-align: center;
  }

  .welcome-text {
    padding-right: 0;
    margin-bottom: 24px;
  }

  .greeting-badge {
    margin: 0 auto 16px auto;
  }

  .action-buttons {
    justify-content: center;
  }

  .storage-circle {
    gap: 16px;
    flex-direction: column;
  }

  .dashboard-header .ant-col {
    margin-bottom: 16px;
  }

  .glass-panel {
    margin-bottom: 0;
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

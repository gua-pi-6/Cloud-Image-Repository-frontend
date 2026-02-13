<template>
  <!-- 添加 ref="containerRef" 用于锁定 GSAP 动画作用域 -->
  <div id="mySpacePage" ref="containerRef">

    <!-- 1. 顶部仪表盘区域 -->
    <div v-if="space.id" class="scope-view private-view">
      <div class="dashboard-header">
        <a-row :gutter="24">
          <!-- 左侧：欢迎面板 -->
          <a-col :span="24" :md="16">
            <div class="welcome-panel glass-panel panel-left-anim">
              <div class="welcome-text">
                <div class="greeting-badge">
                  <span class="badge-emoji">👋</span>
                  <span>欢迎回来</span>
                </div>
                <h2 class="welcome-title">创作者工作台</h2>
                <p class="welcome-desc">
                  您已累计发布了
                  <!-- 使用 span 包裹数字，方便 GSAP 做数字滚动动画 -->
                  <span class="highlight-number" ref="countRef">0</span>
                  张作品
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

          <!-- 右侧：统计面板 -->
          <a-col :span="24" :md="8">
            <div class="stats-panel glass-panel panel-right-anim">
              <div class="stats-header">
                <CloudServerOutlined class="stats-icon" />
                <h4>云端存储概览</h4>
              </div>
              <div class="storage-circle">
                <a-progress
                  type="dashboard"
                  :percent="parseFloat((space.totalSize / space.maxSize * 100).toFixed(2))"
                  :width="120"
                  :strokeColor="{
                    '0%': '#108ee9',
                    '100%': '#87d068',
                  }"
                />
                <div class="storage-info">
                  <div class="stat-row">
                    <span class="stat-label">已用</span>
                    <b class="stat-value">{{ showPictureSize(space.totalSize) }}</b>
                  </div>
                  <div class="stat-row">
                    <span class="stat-label">总量</span>
                    <b class="stat-value">{{ showPictureSize(space.maxSize) }}</b>
                  </div>
                </div>
              </div>
            </div>
          </a-col>
        </a-row>
      </div>

      <!-- 2. 图片列表区域 -->
      <div class="gallery-grid private-grid">
        <a-list
          :grid="{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 5 }"
          :data-source="images"
          :pagination="paginationConfig"
          :loading="loading"
        >
          <template #renderItem="{ item }">
            <a-list-item>
              <!-- 添加 card-anim 类用于 GSAP 控制 -->
              <div class="art-card private-card card-anim">
                <div class="card-image-box">
                  <img :src="item.thumbnailUrl" :alt="item.name" />
                  <div class="status-badge success">
                    <CheckCircleOutlined />
                    <span>已发布</span>
                  </div>
                  <div class="private-actions">
                    <a-tooltip title="编辑">
                      <a-button shape="circle" class="icon-btn">
                        <EditOutlined />
                      </a-button>
                    </a-tooltip>
                    <a-tooltip title="下载">
                      <a-button shape="circle" class="icon-btn">
                        <DownloadOutlined />
                      </a-button>
                    </a-tooltip>
                    <a-tooltip title="删除">
                      <a-button shape="circle" danger class="icon-btn">
                        <DeleteOutlined />
                      </a-button>
                    </a-tooltip>
                  </div>
                </div>
                <div class="card-info minimal-info">
                  <div class="card-title">{{ item.name }}</div>
                  <div class="file-meta">
                    <FileImageOutlined />
                    <span>{{ item.picFormat }} · {{ showPictureSize(item.picSize) }} · {{ dayjs(item.createTime).format('YYYY-MM-DD') }}</span>
                  </div>
                </div>
              </div>
            </a-list-item>
          </template>
        </a-list>
      </div>
    </div>

    <!-- 3. 无空间提醒页面 -->
    <RemindNoSpaceComponent v-else />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, nextTick, onUnmounted } from 'vue'
import { showPictureSize } from '@/utils'
import dayjs from 'dayjs'
import {
  CheckCircleOutlined, CloudServerOutlined, CloudUploadOutlined,
  DeleteOutlined, DownloadOutlined, EditOutlined,
  FileImageOutlined, RocketTwoTone
} from '@ant-design/icons-vue'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'
import RemindNoSpaceComponent from '@/components/space/RemindNoSpaceComponent.vue'
import { listPictureVoByPageUsingPost } from '@/api/pictureController'
import router from '@/router'
import gsap from 'gsap'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

// --- 状态定义 ---
const loading = ref(true)
const spaceVoStore = useSpaceVoStore()
const space = computed<API.SpaceVO>(() => spaceVoStore.spaceVo)
const images = ref<API.PictureVO[]>([])
const loginUserStore = useLoginUserStore()
// 动画相关 Refs
const containerRef = ref(null)
const countRef = ref(null)
let ctx: gsap.Context

// --- 分页配置 ---
const paginationConfig = reactive({
  onChange: (page: number) => {
    paginationConfig.current = page
    window.scrollTo({ top: 0, behavior: 'smooth' })
    fetchPictures()
  },
  total: 0,
  current: 1,
  pageSize: 12,
  showQuickJumper: true,
})

const searchCondition = computed<API.PictureQueryRequest>(() => ({
  current: paginationConfig.current,
  pageSize: paginationConfig.pageSize,
  searchText: '',
  tags: [],
  category: '',
  spaceId: null,
  nullSpaceId: true,
}))

// --- 核心逻辑 ---

/**
 * 初始化静态动画（头部面板）
 */
const initHeaderAnimations = () => {
  if (!containerRef.value) return

  // 使用 gsap.context 清理动画
  ctx = gsap.context(() => {
    const tl = gsap.timeline()

    // 1. 面板入场（左右对冲）
    tl.from('.panel-left-anim', {
      x: -50,
      opacity: 0,
      duration: 0.8,
      ease: 'power3.out'
    })
      .from('.panel-right-anim', {
        x: 50,
        opacity: 0,
        duration: 0.8,
        ease: 'power3.out'
      }, "<") // 与上一个动画同时开始

      // 2. 内部元素动效
      .from('.welcome-text > *', {
        y: 20,
        opacity: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: 'back.out(1.7)'
      }, "-=0.4")

      // 3. 火箭弹跳
      .from('.rocket-icon', {
        scale: 0,
        rotation: -45,
        duration: 0.8,
        ease: 'elastic.out(1, 0.5)'
      }, "-=0.6")

      // 4. 进度条缩放
      .from('.storage-circle', {
        scale: 0.8,
        opacity: 0,
        duration: 0.5,
        ease: 'back.out(1.2)'
      }, "-=0.4")
  }, containerRef.value)
}

/**
 * 数字滚动动画
 */
const animateNumber = (targetValue: number) => {
  if (!countRef.value) return
  gsap.to(countRef.value, {
    innerHTML: targetValue,
    duration: 1.5,
    snap: { innerHTML: 1 }, // 保证是整数
    ease: 'power1.out'
  })
}

/**
 * 列表卡片入场动画 (在数据加载后调用)
 */
const animateCards = () => {
  // 需要等待 DOM 更新渲染出卡片
  nextTick(() => {
    if (ctx) {
      // 可以在现有的 context 中添加，或者直接运行
      // 这里直接对 card-anim 类执行 stagger 动画
      gsap.fromTo('.card-anim',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }
      )
    }
  })
}

/**
 * 获取数据
 */
const fetchPictures = async () => {
  loading.value = true
  searchCondition.value.spaceId = space.value.id
  searchCondition.value.nullSpaceId = false

  const res = await listPictureVoByPageUsingPost(searchCondition.value)

  if (res.data.code === 0 && res.data.data) {
    images.value = res.data.data.records ?? []

    // 先保存旧的总数，如果需要从旧数字滚到新数字（这里简化为直接滚到新数字）
    paginationConfig.total = res.data.data.total

    // 触发动画
    animateNumber(paginationConfig.total)
    animateCards()
  }
  loading.value = false
}

const toCreationPage = async () => {
  router.push(`/creation/picture`)
}

// --- 生命周期 ---
onMounted(async () => {
  initHeaderAnimations()
  if (loginUserStore.loginUser?.id){
    await spaceVoStore.fetchSpaceVo()
  }
  fetchPictures()
})

onUnmounted(() => {
  ctx?.revert() // 清理动画，防止内存泄漏
})
</script>

<style scoped lang="scss">
// --- 变量定义 ---
$primary-color: #1890ff;
$secondary-color: #36cfc9;
$glass-bg: rgba(255, 255, 255, 0.85); // 稍微增加不透明度，提升质感
$glass-border: 1px solid rgba(255, 255, 255, 0.6);
$shadow-sm: 0 4px 20px rgba(0, 0, 0, 0.06);
$shadow-md: 0 8px 30px rgba(0, 0, 0, 0.1);
$shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.15);
$transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

#mySpacePage {
  // 仅保留基础容器样式
  min-height: 100vh;
  padding-bottom: 40px;
}

// --- 通用玻璃拟态面板 ---
.glass-panel {
  background: $glass-bg;
  backdrop-filter: blur(20px);
  border: $glass-border;
  border-radius: 20px;
  box-shadow: $shadow-sm;
  padding: 24px;
  margin-bottom: 30px;
  transition: $transition-smooth;

  &:hover {
    box-shadow: $shadow-md;
    // transform: translateY(-2px); // 移除 CSS hover 位移，避免与 GSAP 冲突，或者保留均可
  }
}

// --- 仪表盘头部 ---
.dashboard-header {
  margin-bottom: 20px;
}

.welcome-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 240px;
  background: linear-gradient(135deg, #fff 0%, #f0f9ff 50%, #e6f7ff 100%);
  position: relative;
  overflow: hidden;

  // 装饰性背景圆
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
}

.welcome-text {
  flex: 1;
  z-index: 1;
  padding-right: 20px;
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
  line-height: 1.6;
}

.highlight-number {
  color: $primary-color;
  font-weight: 700;
  font-size: 20px;
  margin: 0 4px;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; // 确保数字字体等宽美观
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.gradient-btn {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border: none;
  border-radius: 25px;
  box-shadow: 0 6px 20px rgba(24, 144, 255, 0.3);
  height: 44px;
  padding: 0 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: $transition-smooth;

  &:hover {
    background: linear-gradient(135deg, #096dd9, #13c2c2);
    box-shadow: 0 8px 25px rgba(24, 144, 255, 0.4);
    transform: translateY(-2px);
  }
}

.welcome-illustration {
  flex-shrink: 0;
  z-index: 1;
}

.illustration-circle {
  width: 160px;
  height: 160px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.05), rgba(235, 47, 150, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
  // 移除 CSS float 动画，交给 GSAP 处理
  // animation: float 6s ease-in-out infinite;
}

.rocket-icon {
  font-size: 80px;
}

// --- 统计面板 ---
.stats-panel {
  display: flex;
  flex-direction: column;
  min-height: 240px;
  background: linear-gradient(135deg, #fff, #f8fafc);
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);

  .stats-icon {
    font-size: 24px;
    color: $primary-color;
  }

  h4 {
    margin: 0;
    color: #1a1a1a;
    font-size: 16px;
    font-weight: 700;
  }
}

.storage-circle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex: 1;
}

.storage-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  font-size: 14px;
}

.stat-label {
  color: #999;
  font-weight: 500;
}

.stat-value {
  color: #1a1a1a;
  font-weight: 700;
  font-size: 16px;
}

// --- 列表与卡片 ---
.gallery-grid {
  margin-top: 10px;
}

.art-card {
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: $transition-smooth;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  position: relative;
  border: 1px solid rgba(0, 0, 0, 0.04);

  // 初始状态由 GSAP 控制，不再需要 CSS animation cardFadeIn

  &:hover {
    transform: translateY(-8px);
    box-shadow: $shadow-hover;
    border-color: rgba(24, 144, 255, 0.3);

    .card-image-box img {
      transform: scale(1.08);
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
    transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.status-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(4px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);

  &.success {
    background: rgba(82, 196, 26, 0.9); // Antd Green
  }
}

.private-actions {
  position: absolute;
  bottom: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  opacity: 0;
  transform: translateY(10px);
  transition: $transition-smooth;
}

.art-card:hover .private-actions {
  opacity: 1;
  transform: translateY(0);
}

.icon-btn {
  background: rgba(255, 255, 255, 0.95);
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  color: #666;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    color: $primary-color;
    background: #fff;
    transform: scale(1.1);
  }
}

.card-info {
  padding: 14px 16px;
}

.card-title {
  font-weight: 600;
  font-size: 15px;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 8px;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
}

// --- 响应式 ---
@media (max-width: 768px) {
  .welcome-panel {
    flex-direction: column;
    text-align: center;
    padding: 24px;
    min-height: auto;
  }

  .welcome-text {
    padding-right: 0;
    margin-bottom: 24px;
  }

  .action-buttons {
    justify-content: center;
  }

  .storage-circle {
    gap: 16px;
  }
}
</style>

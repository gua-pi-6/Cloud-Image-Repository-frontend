<template>
  <div class="gallery-container">
    <!-- ================= 1. 增强版沉浸式 Hero 区域 ================= -->
    <div class="hero-section" ref="headerRef">
      <canvas ref="canvasRef" class="particle-canvas"></canvas>

      <!-- 多层背景效果 -->
      <div class="aurora-bg"></div>
      <div class="mesh-gradient"></div>
      <div class="floating-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <div class="hero-content">
        <transition name="fade-slide" mode="out-in">
          <div  class="hero-text-group">
            <!-- 添加装饰性元素 -->
            <div class="title-decoration">
              <div class="deco-line"></div>
              <div class="deco-dot"></div>
              <div class="deco-line"></div>
            </div>

            <h1 class="hero-title">
              <span class="title-word">{{'Capture' }}</span>
              <span class="title-word accent">{{'The' }}</span>
              <span class="title-word">{{ 'Moment' }}</span>
            </h1>

            <p class="hero-subtitle">
              <span class="subtitle-icon">✨</span>
              {{ '探索全球创作者的数百万张灵感碎片' }}
            </p>
          </div>
        </transition>

        <!-- 增强的搜索栏 -->
        <div class="search-bar-container">
          <div class="search-wrapper">
            <a-input-search
              v-model:value="searchCondition.searchText"
              :placeholder="'搜索关键词，发现灵感...'"
              enter-button
              size="large"
              class="glass-search-input"
              @search="handleSearch"
            >
              <template #prefix><SearchOutlined class="search-icon-prefix" /></template>
              <template #enterButton>
                <div class="search-btn-content">
                  <span>搜 索</span>
                  <ArrowRightOutlined class="search-arrow" />
                </div>
              </template>
            </a-input-search>
            <div class="search-glow"></div>
          </div>
        </div>
      </div>

      <!-- 滚动提示 -->
      <div class="scroll-indicator">
        <div class="scroll-mouse">
          <div class="scroll-wheel"></div>
        </div>
        <p>向下滚动探索</p>
      </div>
    </div>

    <!-- ================= 2. 主内容区域 ================= -->
    <div class="main-wrapper">
      <transition name="fade-up" mode="out-in">
        <!-- 公共图库模式 -->
        <div class="scope-view public-view">
          <!-- 增强的筛选栏 -->
          <div class="filter-bar glass-panel">
            <div class="filter-row category-row">
              <div class="filter-label">
                <FireOutlined class="label-icon" />
                <span>热门分类</span>
              </div>
              <div class="category-tabs-wrapper">
                <a-tabs
                  v-model:activeKey="currentCategory"
                  @change="handleCategoryChange"
                  class="minimal-tabs"
                  :tabBarGutter="20"
                >
                  <a-tab-pane key="all">
                    <template #tab>
                      <span class="tab-content">
                        <span class="tab-icon">🎨</span>
                        全部
                      </span>
                    </template>
                  </a-tab-pane>
                  <a-tab-pane v-for="category in categoryList" :key="category.name">
                    <template #tab>
                      <span class="tab-content">{{ category.name }}</span>
                    </template>
                  </a-tab-pane>
                </a-tabs>
              </div>
            </div>

            <a-divider class="filter-divider">
              <span class="divider-text">精选标签</span>
            </a-divider>

            <div class="filter-row tags-row">
              <div class="filter-label">
                <TagsOutlined class="label-icon" />
                <span>灵感标签</span>
              </div>
              <div class="tags-scroll-area" :class="{ 'is-expanded': isTagExpanded }">
                <div class="tags-inner-list">
                  <span
                    v-for="tag in tagList"
                    :key="tag.name"
                    class="custom-tag"
                    :class="{ 'active-tag': tag.active }"
                    @click="toggleTag(tag)"
                  >
                    <span class="tag-hash">#</span>
                    {{ tag.name }}
                    <span v-if="tag.active" class="tag-check">✓</span>
                  </span>
                </div>
              </div>
              <div
                class="desktop-expand-btn"
                v-if="tagList.length > 8"
                @click="isTagExpanded = !isTagExpanded"
              >
                <div class="gradient-mask" v-show="!isTagExpanded"></div>
                <div class="btn-content">
                  {{ isTagExpanded ? '收起' : '更多' }}
                  <DownOutlined :class="{ rotated: isTagExpanded }" class="arrow-icon" />
                </div>
              </div>
            </div>
          </div>

          <!-- 增强的卡片网格 -->
          <div class="gallery-grid">
            <a-spin :spinning="loading" tip="正在加载灵感..." size="large">
              <div class="loading-tip" v-if="loading">
                <div class="loading-icon">✨</div>
              </div>

              <a-list
                :grid="{ gutter: 24, xs: 1, sm: 2, md: 3, lg: 4, xl: 4, xxl: 5 }"
                :data-source="images"
                :pagination="paginationConfig"
              >
                <template #renderItem="{ item, index }">
                  <a-list-item>
                    <div
                      class="art-card"
                      @click="goToDetail(item.id)"
                      :style="{ animationDelay: `${index * 0.05}s` }"
                    >
                      <!-- 图片区域 -->
                      <div class="card-image-box">
                        <img :src="item.thumbnailUrl" :alt="item.name" loading="lazy" />

                        <!-- 光泽效果 -->
                        <div class="card-shine"></div>

                        <!-- 分类徽章 -->
                        <div class="feature-badge" v-if="item.category">
                          <span class="badge-icon">⭐</span>
                          {{ item.category }}
                        </div>

                        <!-- 悬停遮罩 -->
                        <div class="card-hover-mask">
                          <div class="hover-content">
                            <button class="view-btn">
                              <EyeOutlined />
                              <span>查看详情</span>
                            </button>
                            <!--                            <div class="quick-actions">-->
                            <!--                              <a-tooltip title="点赞">-->
                            <!--                                <button class="action-btn"><HeartOutlined /></button>-->
                            <!--                              </a-tooltip>-->
                            <!--                              <a-tooltip title="收藏">-->
                            <!--                                <button class="action-btn"><StarOutlined /></button>-->
                            <!--                              </a-tooltip>-->
                            <!--                              <a-tooltip title="分享">-->
                            <!--                                <button class="action-btn"><ShareAltOutlined /></button>-->
                            <!--                              </a-tooltip>-->
                            <!--                            </div>-->
                          </div>
                        </div>
                      </div>

                      <!-- 信息区域 -->
                      <div class="card-info">
                        <div class="info-header">
                          <div class="card-title" :title="item.name">{{ item.name }}</div>
                        </div>

                        <div class="card-meta">
                          <!-- 用户信息 -->
                          <div class="user-row">
                            <a-avatar size="small" class="user-avatar">
                              {{ item.user.userName?.charAt(0).toUpperCase() }}
                            </a-avatar>
                            <span class="username">{{ item.user.userName }}</span>
                          </div>

                          <!-- 标签展示 -->
                          <div class="tags-mini-row" v-if="item.tags && item.tags.length">
                            <span class="meta-tag" v-for="tag in item.tags.slice(0, 1)" :key="tag">
                              {{ tag }}
                            </span>
                            <a-tooltip
                              v-if="item.tags.length > 1"
                              placement="top"
                              color="#fff"
                              overlayClassName="tags-tooltip"
                            >
                              <template #title>
                                <div class="tooltip-tags">
                                  <span v-for="t in item.tags" :key="t" class="tooltip-tag-item">
                                    #{{ t }}
                                  </span>
                                </div>
                              </template>
                              <span class="meta-tag more-tag">+{{ item.tags.length - 1 }}</span>
                            </a-tooltip>
                          </div>
                        </div>
                      </div>
                    </div>
                  </a-list-item>
                </template>
              </a-list>
            </a-spin>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  SearchOutlined,
  FireOutlined,
  TagsOutlined,
  DownOutlined,
  ArrowRightOutlined,
  EyeOutlined,
} from '@ant-design/icons-vue'
import {
  listPictureTagCategoryUsingGet,
  listPictureVoByPageUsingPost,
} from '@/api/pictureController.js'

// --- 基础状态 ---
const router = useRouter()
const loading = ref(true)
const currentCategory = ref('all')
const isTagExpanded = ref(false)
// 粒子特效
const canvasRef = ref(null)
const headerRef = ref(null)
let ctx: CanvasRenderingContext2D | null = null
let particlesArray: Particle[] = []
let animationFrameId: number | null = null

class Particle {
  constructor(x: number, y: number, size: number, speedX: number, speedY: number) {
    this.x = x  as number
    this.y = y as number
    this.size = size as number
    this.speedX = speedX as number
    this.speedY = speedY as number
    this.opacity = Math.random() * 0.5 + 0.1 as number
  }
  update() {
    this.x += this.speedX
    this.y += this.speedY as number
    if (this.x > canvasRef.value.width) this.x = 0 as number
    if (this.x < 0) this.x = canvasRef.value.width as number
    if (this.y > canvasRef.value.height) this.y = 0 as number
    if (this.y < 0) this.y = canvasRef.value.height as number
    this.draw()
  }
  draw() {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

const initParticles = () => {
  if (!canvasRef.value) return
  particlesArray = []
  const w = canvasRef.value.width
  const h = canvasRef.value.height
  for (let i = 0; i < 100; i++) {
    particlesArray.push(
      new Particle(
        Math.random() * w,
        Math.random() * h,
        Math.random() * 2.5,
        Math.random() * 0.5 - 0.25,
        Math.random() * 0.5 - 0.25,
      ),
    )
  }
}

const animateParticles = () => {
  if (!canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  particlesArray.forEach((p) => p.update())
  animationFrameId = requestAnimationFrame(animateParticles)
}
// --- 业务逻辑 ---
/**
 * 分页配置
 */
const paginationConfig = reactive({
  onChange: (page) => {
    paginationConfig.current = page
    window.scrollTo({ top: 400, behavior: 'smooth' })
    fetchPictures()
  },
  total: 0,
  current: 1,
  pageSize: 12,
  showQuickJumper: true,
})

/**
 * 搜索条件
 */
const categoryList = ref([])
const tagList = ref([])
const searchCondition = computed<API.PictureQueryRequest>(() => ({
  current: paginationConfig.current,
  pageSize: paginationConfig.pageSize,
  searchText: '',
  tags: [],
  category: '',
  spaceId: null,
  nullSpaceId: true,
}))
const images = ref<API.PictureVO[]>([])

/**
 * 获取图片分类和标签列表
 */
const getTagAndCategoryList = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    categoryList.value = (res.data.data.categoryList ?? []).map((item, index) => ({
      id: index,
      name: item,
    }))
    const rawTags = res.data.data.tagList ?? []
    tagList.value = rawTags.map((item) => ({ active: false, name: item, count: 0 }))
  }
}

/**
 * 根据私人空间和公共图库的切换, 获取对应的图片数据
 */
const fetchPictures = async () => {
  loading.value = true
  searchCondition.value.spaceId = null
  searchCondition.value.nullSpaceId = true
  const res = await listPictureVoByPageUsingPost(searchCondition.value)
  if (res.data.code === 0 && res.data.data) {
    images.value = res.data.data.records ?? []
    paginationConfig.total = res.data.data.total
  }
  loading.value = false
}
/**
 * 根据搜索内容获取图片数据
 * @param val
 */
const handleSearch = (val) => {
  paginationConfig.current = 1
  fetchPictures()
}

/**
 * 根据分类更改搜索条件
 * @param key
 */
const handleCategoryChange = (key) => {
  searchCondition.value.category =
    key === 'all' ? '' : categoryList.value.find((c) => c.name === key)?.name
}

/**
 * 切换标签
 * @param tag
 */
const toggleTag = (tag) => {
  tag.active = !tag.active
  tag.active
    ? searchCondition.value.tags.push(tag.name)
    : (searchCondition.value.tags = searchCondition.value.tags.filter((t) => t !== tag.name))
}

/**
 * 跳转到图片详情页面
 * @param id
 */
const goToDetail = (id) => router.push(`/picture/${id}`)

onMounted(() => {
  getTagAndCategoryList()
  fetchPictures()
  if (canvasRef.value && headerRef.value) {
    canvasRef.value.width = headerRef.value.clientWidth
    canvasRef.value.height = headerRef.value.clientHeight
    ctx = canvasRef.value.getContext('2d')
    initParticles()
    animateParticles()
    window.addEventListener('resize', () => {
      canvasRef.value.width = headerRef.value.clientWidth
      canvasRef.value.height = headerRef.value.clientHeight
      initParticles()
    })
  }
})

onUnmounted(() => {
  cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped lang="scss">
// --- 变量定义 ---
$hero-height: 480px;
$primary-color: #1890ff;
$secondary-color: #36cfc9;
$accent-color: #eb2f96;
$glass-bg: rgba(255, 255, 255, 0.9);
$glass-border: 1px solid rgba(255, 255, 255, 0.6);
$shadow-sm: 0 4px 20px rgba(0, 0, 0, 0.06);
$shadow-md: 0 8px 30px rgba(0, 0, 0, 0.1);
$shadow-hover: 0 12px 40px rgba(0, 0, 0, 0.15);
$transition-smooth: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);

.gallery-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f6f8fa 0%, #ffffff 100%);
  font-family:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ================= Hero 区域增强 ================= */
.hero-section {
  position: relative;
  height: $hero-height;
  width: 100%;
  overflow: hidden;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  border-bottom-left-radius: 50px;
  border-bottom-right-radius: 50px;
  box-shadow: 0 15px 50px rgba(24, 144, 255, 0.25);
  margin-bottom: 50px;
}

.aurora-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background: radial-gradient(circle at 50% 120%, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);

  &::after {
    content: '';
    position: absolute;
    top: -60%;
    left: -30%;
    width: 160%;
    height: 160%;
    background: radial-gradient(
      circle,
      rgba(24, 144, 255, 0.3),
      rgba(54, 207, 201, 0.25),
      rgba(235, 47, 150, 0.2),
      transparent 70%
    );
    filter: blur(80px);
    animation: auroraMove 20s ease-in-out infinite;
  }
}

@keyframes auroraMove {
  0%,
  100% {
    transform: translate(0, 0) rotate(0deg);
  }
  33% {
    transform: translate(30px, -30px) rotate(120deg);
  }
  66% {
    transform: translate(-30px, 30px) rotate(240deg);
  }
}

.mesh-gradient {
  position: absolute;
  inset: 0;
  z-index: 1;
  background:
    linear-gradient(90deg, rgba(24, 144, 255, 0.1) 1px, transparent 1px),
    linear-gradient(rgba(24, 144, 255, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
  opacity: 0.3;
}

.floating-orbs {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.4;
  animation: float 15s ease-in-out infinite;

  &.orb-1 {
    width: 300px;
    height: 300px;
    background: radial-gradient(circle, rgba(24, 144, 255, 0.6), transparent);
    top: 10%;
    left: 10%;
    animation-delay: 0s;
  }

  &.orb-2 {
    width: 250px;
    height: 250px;
    background: radial-gradient(circle, rgba(54, 207, 201, 0.6), transparent);
    top: 50%;
    right: 15%;
    animation-delay: 5s;
  }

  &.orb-3 {
    width: 200px;
    height: 200px;
    background: radial-gradient(circle, rgba(235, 47, 150, 0.6), transparent);
    bottom: 10%;
    left: 50%;
    animation-delay: 10s;
  }
}

@keyframes float {
  0%,
  100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-30px, 30px) scale(0.9);
  }
}

.particle-canvas {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.scope-switch-hud {
  position: absolute;
  top: 30px;
  right: 40px;
  z-index: 10;
}

.hud-segmented {
  background: rgba(255, 255, 255, 0.12) !important;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 6px;
  border-radius: 50px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);

  :deep(.ant-segmented-item) {
    color: rgba(255, 255, 255, 0.8);
    transition: $transition-smooth;
    border-radius: 50px;

    &:hover {
      color: #fff;
    }
  }

  :deep(.ant-segmented-item-selected) {
    background: linear-gradient(135deg, #1890ff, #36cfc9) !important;
    color: #fff !important;
    box-shadow: 0 4px 15px rgba(24, 144, 255, 0.4);
  }
}

.hud-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  font-weight: 500;
  font-size: 14px;
}

.hud-icon {
  font-size: 16px;
}

.hero-content {
  position: relative;
  z-index: 3;
  text-align: center;
  width: 100%;
  max-width: 900px;
  padding: 0 24px;
}

.title-decoration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 24px;

  .deco-line {
    width: 60px;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent);
  }

  .deco-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.8);
    box-shadow: 0 0 20px rgba(255, 255, 255, 0.6);
    animation: pulse 2s ease-in-out infinite;
  }
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.hero-title {
  font-size: 3.5rem;
  font-weight: 900;
  margin-bottom: 16px;
  color: #fff;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  letter-spacing: -1px;
  line-height: 1.2;

  .title-word {
    display: inline-block;
    margin: 0 8px;
    animation: fadeInUp 0.6s ease-out backwards;

    &:nth-child(1) {
      animation-delay: 0.1s;
    }
    &:nth-child(2) {
      animation-delay: 0.2s;
    }
    &:nth-child(3) {
      animation-delay: 0.3s;
    }

    &.accent {
      background: linear-gradient(135deg, #36cfc9, #1890ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-subtitle {
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 40px;
  font-weight: 300;
  line-height: 1.6;
  animation: fadeInUp 0.6s ease-out 0.4s backwards;

  .subtitle-icon {
    display: inline-block;
    margin-right: 8px;
    animation: float 3s ease-in-out infinite;
  }
}

.search-bar-container {
  width: 100%;
  max-width: 650px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease-out 0.5s backwards;
}

.search-wrapper {
  position: relative;
}

.glass-search-input {
  :deep(.ant-input-affix-wrapper) {
    background: rgba(255, 255, 255, 0.98);
    border: 2px solid rgba(255, 255, 255, 0.3);
    height: 60px;
    border-radius: 30px 0 0 30px;
    padding-left: 24px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    transition: $transition-smooth;

    &:hover,
    &:focus {
      border-color: $primary-color;
      box-shadow: 0 15px 50px rgba(24, 144, 255, 0.25);
    }

    .ant-input {
      font-size: 15px;

      &::placeholder {
        color: rgba(0, 0, 0, 0.4);
      }
    }
  }

  :deep(.ant-input-search-button) {
    height: 60px !important;
    border-radius: 0 30px 30px 0 !important;
    background: linear-gradient(135deg, #1890ff, #36cfc9);
    border: none;
    font-weight: 600;
    min-width: 120px;
    box-shadow: 0 10px 30px rgba(24, 144, 255, 0.35);
    transition: $transition-smooth;

    &:hover {
      background: linear-gradient(135deg, #096dd9, #13c2c2);
      box-shadow: 0 15px 40px rgba(24, 144, 255, 0.45);
      transform: translateY(-2px);
    }
  }
}

.search-btn-content {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}

.search-arrow {
  font-size: 14px;
  transition: transform 0.3s;
}

.glass-search-input:hover .search-arrow {
  transform: translateX(4px);
}

.search-icon-prefix {
  color: $primary-color;
  font-size: 18px;
}

.search-glow {
  position: absolute;
  inset: -2px;
  background: linear-gradient(135deg, $primary-color, $secondary-color);
  border-radius: 30px;
  opacity: 0;
  filter: blur(20px);
  transition: opacity 0.3s;
  z-index: -1;
}

.search-wrapper:hover .search-glow {
  opacity: 0.3;
}

.scroll-indicator {
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  animation: fadeInUp 0.6s ease-out 0.6s backwards;

  p {
    margin: 0;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 500;
  }
}

.scroll-mouse {
  width: 24px;
  height: 38px;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: 12px;
  display: flex;
  justify-content: center;
  padding-top: 6px;
}

.scroll-wheel {
  width: 3px;
  height: 8px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 2px;
  animation: scrollWheel 2s ease-in-out infinite;
}

@keyframes scrollWheel {
  0%,
  100% {
    transform: translateY(0);
    opacity: 1;
  }
  50% {
    transform: translateY(8px);
    opacity: 0.3;
  }
}

/* ================= 主内容区域 ================= */
.main-wrapper {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px 80px;
}

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
    transform: translateY(-2px);
  }
}

/* 筛选栏增强 */
.filter-bar {
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.95));
}

.filter-row {
  display: flex;
  align-items: flex-start;
  position: relative;
}

.category-row {
  align-items: center;
}

.filter-label {
  flex-shrink: 0;
  width: 110px;
  font-weight: 700;
  color: #1a1a1a;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;

  .label-icon {
    font-size: 18px;
    color: $primary-color;
  }
}

.category-row .filter-label {
  margin-top: 0;
}

.category-tabs-wrapper {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.minimal-tabs {
  :deep(.ant-tabs-nav) {
    margin: 0;

    &::before {
      border-bottom: 2px solid rgba(0, 0, 0, 0.06);
    }
  }

  :deep(.ant-tabs-tab) {
    padding: 10px 4px;
    font-size: 15px;
    transition: $transition-smooth;
    color: #666;
    font-weight: 500;

    &:hover {
      color: $primary-color;
    }
  }

  :deep(.ant-tabs-tab-active) {
    .tab-content {
      color: $primary-color;
      font-weight: 600;
    }
  }

  :deep(.ant-tabs-ink-bar) {
    background: linear-gradient(90deg, $primary-color, $secondary-color);
    height: 3px;
    border-radius: 3px;
  }
}

.tab-content {
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-icon {
  font-size: 16px;
}

.filter-divider {
  margin: 8px 0 !important;
  border-color: rgba(0, 0, 0, 0.06);

  .divider-text {
    color: #999;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 1px;
    font-weight: 600;
  }
}

/* 标签区域增强 */
.tags-scroll-area {
  flex: 1;
  position: relative;
  transition: max-height 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  max-height: 36px;

  &.is-expanded {
    max-height: 400px;
  }
}

.tags-inner-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.custom-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  padding: 0 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, #f5f7fa, #e9ecef);
  color: #495057;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  user-select: none;
  transition: $transition-smooth;
  white-space: nowrap;
  border: 2px solid transparent;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background: linear-gradient(135deg, $primary-color, $secondary-color);
    opacity: 0;
    transition: opacity 0.3s;
  }

  &:hover {
    background: linear-gradient(135deg, #e6f7ff, #d9f7f0);
    color: $primary-color;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
  }

  &.active-tag {
    background: linear-gradient(135deg, $primary-color, $secondary-color);
    color: #fff;
    border-color: transparent;
    box-shadow: 0 6px 20px rgba(24, 144, 255, 0.35);
    transform: translateY(-2px);

    .tag-hash {
      opacity: 1;
    }

    .tag-check {
      display: inline-block;
      margin-left: 4px;
      animation: checkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }
  }
}

.tag-hash {
  opacity: 0.6;
  margin-right: 2px;
  font-weight: 600;
}

@keyframes checkPop {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.desktop-expand-btn {
  position: absolute;
  right: 0;
  top: 0;
  height: 36px;
  z-index: 10;
  display: flex;
  align-items: center;
  cursor: pointer;
  padding-left: 30px;
  background: transparent;
  outline: none;
  -webkit-tap-highlight-color: transparent;
}

.gradient-mask {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(to right, rgba(255, 255, 255, 0), rgba(255, 255, 255, 0.95));
  pointer-events: none;
}

.btn-content {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #fff;
  padding: 6px 14px;
  font-size: 13px;
  color: #666;
  border-radius: 18px;
  font-weight: 600;
  transition: $transition-smooth;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.desktop-expand-btn:hover .btn-content {
  color: $primary-color;
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.2);
  transform: translateY(-1px);
}

.arrow-icon {
  font-size: 12px;
  transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  &.rotated {
    transform: rotate(180deg);
  }
}

/* ================= 卡片网格增强 ================= */
.gallery-grid {
  margin-top: 20px;
}

.loading-tip {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 60px 0;
}

.loading-icon {
  font-size: 48px;
  animation: float 2s ease-in-out infinite;
}

.art-card {
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  cursor: pointer;
  transition: $transition-smooth;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  height: 100%;
  position: relative;
  animation: cardFadeIn 0.6s ease-out backwards;
  border: 1px solid rgba(0, 0, 0, 0.04);

  &:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: $shadow-hover;
    border-color: rgba(24, 144, 255, 0.2);

    .card-hover-mask {
      opacity: 1;
    }

    .card-image-box img {
      transform: scale(1.1);
    }

    .card-shine {
      transform: translateX(200%);
    }

    .feature-badge {
      transform: scale(1.05);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
    }
  }
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-image-box {
  position: relative;
  height: 240px;
  overflow: hidden;
  background: linear-gradient(135deg, #f0f2f5, #e9ecef);
}

.card-image-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.card-shine {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.3) 50%,
    transparent 100%
  );
  transform: translateX(-100%);
  transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.feature-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(10px);
  color: #fff;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: $transition-smooth;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
}

.badge-icon {
  font-size: 14px;
}

.card-hover-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.6) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  opacity: 0;
  transition: opacity 0.4s;
  backdrop-filter: blur(4px);
}

.hover-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.view-btn {
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  padding: 10px 24px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 14px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: $transition-smooth;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);

  &:hover {
    background: #fff;
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }
}

.quick-actions {
  display: flex;
  gap: 12px;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: $transition-smooth;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }
}

/* 卡片信息区 */
.card-info {
  padding: 16px 18px;
}

.info-header {
  margin-bottom: 12px;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
  color: #1a1a1a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.4;
}

.card-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.user-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  min-width: 0;
}

.user-avatar {
  background: linear-gradient(135deg, #f56a00, #ff8c42);
  flex-shrink: 0;
  font-weight: 600;
}

.username {
  font-size: 13px;
  color: #666;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.tags-mini-row {
  display: flex;
  gap: 6px;
  align-items: center;
  justify-content: flex-end;
  flex: 1;
  overflow: hidden;
}

.meta-tag {
  background: linear-gradient(135deg, #f0f2f5, #e9ecef);
  color: #666;
  font-size: 11px;
  padding: 4px 8px;
  border-radius: 10px;
  white-space: nowrap;
  font-weight: 500;
  transition: $transition-smooth;

  &:hover {
    background: linear-gradient(135deg, #e6f7ff, #d9f7f0);
    color: $primary-color;
  }
}

.more-tag {
  background: linear-gradient(135deg, #e6f7ff, #d9f7f0);
  color: $primary-color;
  cursor: help;
  font-weight: 600;
}

/* ================= Dashboard 私人空间 ================= */
.dashboard-header {
  margin-bottom: 40px;
}

.welcome-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 240px;
  background: linear-gradient(135deg, #fff 0%, #f0f9ff 50%, #e6f7ff 100%);
  border: 2px solid rgba(24, 144, 255, 0.1);
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
}

.welcome-text {
  flex: 1;
  z-index: 1;
}

.greeting-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #fff, #f0f9ff);
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  color: $primary-color;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
}

.badge-emoji {
  font-size: 16px;
}

.welcome-title {
  font-size: 28px;
  font-weight: 800;
  margin-bottom: 12px;
  color: #1a1a1a;
  background: linear-gradient(135deg, #1a1a1a, $primary-color);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
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
  font-size: 18px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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

.ghost-btn {
  border: 2px solid $primary-color;
  color: $primary-color;
  border-radius: 25px;
  height: 44px;
  padding: 0 24px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: $transition-smooth;

  &:hover {
    background: $primary-color;
    color: #fff;
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
  background: linear-gradient(135deg, rgba(24, 144, 255, 0.1), rgba(235, 47, 150, 0.1));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 40px rgba(24, 144, 255, 0.2);
  animation: float 6s ease-in-out infinite;
}

.rocket-icon {
  font-size: 80px;
}

.stats-panel {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  min-height: 240px;
  background: linear-gradient(135deg, #fff, #f8fafc);
  border: 2px solid rgba(24, 144, 255, 0.1);
}

.stats-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid rgba(0, 0, 0, 0.05);

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

/* 私人卡片 */
.private-card {
  .card-image-box {
    height: 200px;
  }
}

.status-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 4px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);

  &.success {
    background: linear-gradient(135deg, #52c41a, #73d13d);
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

.private-card:hover .private-actions {
  opacity: 1;
  transform: translateY(0);
}

.icon-btn {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  color: #555;
  width: 36px;
  height: 36px;
  transition: $transition-smooth;

  &:hover {
    color: $primary-color;
    background: #fff;
    transform: scale(1.1);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }

  &.ant-btn-dangerous:hover {
    color: #ff4d4f;
  }
}

.minimal-info {
  .card-title {
    margin-bottom: 8px;
  }
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;

  span {
    display: flex;
    align-items: center;
  }
}

/* 上传弹窗 */
.custom-uploader {
  border: 2px dashed rgba(24, 144, 255, 0.3);
  border-radius: 16px;
  background: linear-gradient(135deg, #f8fafc, #f0f9ff);
  transition: $transition-smooth;

  &:hover {
    border-color: $primary-color;
    background: linear-gradient(135deg, #f0f9ff, #e6f7ff);
  }

  .upload-icon {
    color: $primary-color;
    font-size: 48px;
  }

  .ant-upload-text {
    font-size: 16px;
    font-weight: 600;
    color: #1a1a1a;
    margin-top: 12px;
  }

  .ant-upload-hint {
    color: #999;
    font-size: 13px;
  }
}

/* ================= 动画效果 ================= */
.fade-up-enter-active,
.fade-up-leave-active {
  transition:
    opacity 0.5s ease,
    transform 0.3s ease;
}

.fade-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.fade-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* ================= 响应式设计 ================= */
@media (max-width: 1200px) {
  .hero-title {
    font-size: 3rem;
  }
}

@media (max-width: 768px) {
  .hero-section {
    height: 400px;
    border-bottom-left-radius: 30px;
    border-bottom-right-radius: 30px;
  }

  .hero-title {
    font-size: 2.2rem;

    .title-word {
      margin: 0 4px;
    }
  }

  .hero-subtitle {
    font-size: 1rem;
  }

  .scope-switch-hud {
    top: 20px;
    right: 20px;
  }

  .scroll-indicator {
    display: none;
  }

  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-label {
    width: 100%;
    margin-bottom: 12px;
  }

  .tags-scroll-area {
    max-height: none !important;
    overflow: visible;
  }

  .tags-inner-list {
    flex-wrap: nowrap;
    overflow-x: auto;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .desktop-expand-btn {
    display: none !important;
  }

  .welcome-panel {
    flex-direction: column;
    text-align: center;
    padding: 32px 24px;
  }

  .welcome-illustration {
    margin-top: 24px;
  }

  .action-buttons {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .hero-title {
    font-size: 1.8rem;
  }

  .card-image-box {
    height: 200px;
  }

  .main-wrapper {
    padding: 0 16px 60px;
  }
}
</style>

<style lang="scss">
/* 全局 Tooltip 样式 */
.tags-tooltip .ant-tooltip-inner {
  background-color: #fff;
  color: #333;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  border-radius: 12px;
  padding: 12px 16px;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.tooltip-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-width: 220px;
}

.tooltip-tag-item {
  color: #1890ff;
  font-size: 13px;
  font-weight: 600;
  background: linear-gradient(135deg, #e6f7ff, #d9f7f0);
  padding: 4px 10px;
  border-radius: 10px;
  transition: all 0.3s;

  &:hover {
    background: linear-gradient(135deg, #1890ff, #36cfc9);
    color: #fff;
    transform: scale(1.05);
  }
}

/* 自定义滚动条 */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #f0f2f5;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #1890ff, #36cfc9);
  border-radius: 4px;

  &:hover {
    background: linear-gradient(135deg, #096dd9, #13c2c2);
  }
}
</style>

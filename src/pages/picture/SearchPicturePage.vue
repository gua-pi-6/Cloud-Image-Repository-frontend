<template>
  <div class="search-page">
    <!-- ===================== 顶部标题栏 ===================== -->
    <header class="page-header" ref="headerRef">
      <div class="header-inner">
        <a-button type="text" class="back-btn" @click="router.back()">
          <template #icon><LeftOutlined /></template>
          返回
        </a-button>
        <h1 class="page-title">以图搜图</h1>
        <span class="header-sub">IMAGE RETRIEVAL</span>
      </div>
    </header>

    <!-- ===================== 主体：左侧原图 + 右侧相似图 ===================== -->
    <div class="page-body">

      <!-- 左侧：原始图片侧边栏（sticky 固定，始终可见） -->
      <aside class="origin-aside" ref="originRef">
        <a-spin :spinning="originLoading" tip="加载中...">

          <template v-if="originPicture">
            <!-- 原图展示 -->
            <div class="origin-img-wrap">
              <img
                :src="originPicture.url"
                :alt="originPicture.name"
                class="origin-img"
                @load="onOriginImgLoad"
              />
            </div>

            <!-- 仅展示图片名称 -->
            <div class="origin-name-block">
              <span class="origin-label">原始图片</span>
              <p class="origin-name" :title="originPicture.name">
                {{ originPicture.name }}
              </p>
            </div>

            <!-- 搜索按钮 — 琥珀金，醒目突出 -->
            <div class="btn-wrap">
              <a-button
                class="search-btn"
                :loading="searchLoading"
                @click="handleSearch"
                block
              >
                <template #icon v-if="!searchLoading">
                  <SearchOutlined />
                </template>
                {{ searchLoading ? '搜索中...' : '搜索相似图片' }}
              </a-button>
            </div>
          </template>

          <!-- 原图加载失败 -->
          <a-empty
            v-else-if="!originLoading"
            description="图片不存在或已删除"
            class="empty-state"
          />
        </a-spin>
      </aside>

      <!-- 右侧：相似图片主区域（占据绝大部分宽度） -->
      <main class="result-main" ref="resultRef">

        <!-- 未搜索时的引导提示 -->
        <div class="guide-state" v-if="!hasSearched && !searchLoading">
          <div class="guide-icon"><SearchOutlined /></div>
          <p class="guide-text">点击左侧按钮，搜索与原图相似的图片</p>
        </div>

        <template v-else>
          <!-- 结果区标题 -->
          <div class="result-header" v-if="!searchLoading || similarPictures.length > 0">
            <span class="result-title">相似图片</span>
            <span class="result-badge" v-if="similarPictures.length > 0">
              {{ similarPictures.length }} 张
            </span>
          </div>

          <a-spin :spinning="searchLoading" tip="正在搜索相似图片...">
            <!-- 12 张相似图片网格 -->
            <div class="picture-grid" v-if="similarPictures.length > 0">
              <div
                v-for="(pic, index) in similarPictures"
                :key="index"
                class="pic-card"
                :ref="el => setPicCardRef(el, index)"
                @click="handlePicClick(pic)"
              >
                <div class="pic-img-wrap">
                  <!-- 骨架占位：shimmer 动画，图片加载完成后隐藏 -->
                  <div class="img-skeleton" :class="{ hidden: loadedSet.has(index) }" />

                  <img
                    :src="pic.thumbUrl"
                    alt="相似图片"
                    class="pic-img"
                    :class="{ loaded: loadedSet.has(index) }"
                    loading="lazy"
                    decoding="async"
                    @load="onCardImgLoad(index)"
                  />
                  <div class="pic-hover-mask">
                    <EyeOutlined class="mask-icon" />
                  </div>

                  <!-- 下载按钮 — 右下角常驻，hover 时放大突出 -->
                  <button
                    class="download-btn"
                    @click.stop="handleDownload(pic)"
                    title="下载图片"
                  >
                    <DownloadOutlined />
                  </button>
                </div>
              </div>
            </div>

            <!-- 搜索无结果 -->
            <a-empty
              v-if="!searchLoading && hasSearched && similarPictures.length === 0"
              description="未找到相似图片"
              class="empty-state"
            />
          </a-spin>
        </template>
      </main>
    </div>

    <!-- 图片预览 Modal -->
    <a-modal
      v-model:open="previewVisible"
      :footer="null"
      :width="860"
      class="preview-modal"
      centered
    >
      <img
        v-if="previewPicture"
        :src="previewPicture.thumbUrl"
        alt="预览图片"
        class="preview-img"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LeftOutlined, SearchOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons-vue'
import gsap from 'gsap'
import { getPictureVoByIdUsingGet, searchPictureByPictureUsingPost } from '@/api/pictureController'
import { saveAs } from 'file-saver'

// ======================== Props ========================

const props = defineProps<{
  id: string
}>()

// ======================== 状态 ========================

const router = useRouter()

/** 原始图片数据 */
const originPicture = ref<API.PictureVO | null>(null)
/** 相似图片列表（固定 12 张） */
const similarPictures = ref<API.ImageSearchResult[]>([])

/** 原图加载状态 */
const originLoading = ref(false)
/** 搜索加载状态 */
const searchLoading = ref(false)
/** 是否已触发过搜索（控制引导状态 vs 结果状态的显隐） */
const hasSearched = ref(false)

/** 预览弹窗 */
const previewVisible = ref(false)
const previewPicture = ref<API.ImageSearchResult | null>(null)

// ======================== DOM Refs ========================

const headerRef = ref<HTMLElement | null>(null)
const originRef = ref<HTMLElement | null>(null)
const resultRef = ref<HTMLElement | null>(null)
/** 每张卡片的 DOM ref，供 GSAP stagger 逐帧入场使用 */
const picCardRefs: HTMLElement[] = []

function setPicCardRef(el: unknown, index: number) {
  if (el) picCardRefs[index] = el as HTMLElement
}

/** 已加载完成的卡片索引集合，驱动骨架屏消失 + 图片淡入 */
const loadedSet = ref<Set<number>>(new Set())

/** 每张卡片图片 onload 回调 */
function onCardImgLoad(index: number) {
  // 用新 Set 触发响应式更新
  loadedSet.value = new Set([...loadedSet.value, index])
}

// ======================== API 调用 ========================

/** 根据 id 获取原始图片详情 */
async function fetchOriginPicture() {
  const res = await getPictureVoByIdUsingGet({ id: props.id })
  if (res.data.code === 0 && res.data.data) {
    originPicture.value = res.data.data
  } else {
    message.error(res.data.message)
  }
}

/** 根据图片 id 搜索相似图片，后端固定返回 12 张 */
async function fetchSimilarPictures() {
  const res = await searchPictureByPictureUsingPost({ pictureId: originPicture.value?.id })
  if (res.data.code === 0 && res.data.data) {
    similarPictures.value = res.data.data
  } else {
    message.error(res.data.message)
  }
}

// ======================== 业务逻辑 ========================

/** 页面初始化：加载原始图片 */
async function initPage() {
  originLoading.value = true
  try {
    await fetchOriginPicture()
  } catch {
    message.error('获取原图失败，请重试')
  } finally {
    originLoading.value = false
  }
}

/** 点击搜索按钮 */
async function handleSearch() {
  if (!originPicture.value) return

  searchLoading.value = true
  hasSearched.value = true
  similarPictures.value = []   // 清空上次结果
  loadedSet.value = new Set()  // 重置图片加载状态

  try {
    await fetchSimilarPictures()
    await nextTick()
    animateGrid()
  } catch {
    message.error('搜索失败，请稍后重试')
  } finally {
    searchLoading.value = false
  }
}

/** 点击相似图片卡片 → 打开大图预览 */
function handlePicClick(pic: API.ImageSearchResult) {
  previewPicture.value = pic
  previewVisible.value = true
}

/**
 * 点击下载按钮
 * 在此实现下载逻辑，例如调用后端接口或直接触发 a 标签下载
 */
function handleDownload(pic: API.ImageSearchResult) {
  // 占位：逻辑待实现
  if (pic.thumbUrl) {
    saveAs(pic.thumbUrl, 'similar-image.jpg')
  } else {
    message.error('图片地址不存在')
  }
}

/** 原图 img onload 回调：触发原图浮现动画 */
function onOriginImgLoad() {
  const imgWrap = originRef.value?.querySelector('.origin-img-wrap')
  if (!imgWrap) return
  gsap.fromTo(
    imgWrap,
    { opacity: 0, scale: 0.97 },
    { opacity: 1, scale: 1, duration: 0.5, ease: 'power2.out' }
  )
}

// ======================== GSAP 动画 ========================

/** 页面整体入场：标题 → 侧边栏 → 主区依次滑入 */
function animatePageIn() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

  tl.fromTo(headerRef.value, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4 })
    .fromTo(originRef.value, { opacity: 0, x: -28 }, { opacity: 1, x: 0, duration: 0.45 }, '-=0.15')
    .fromTo(resultRef.value, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.45 }, '-=0.30')
}

/**
 * 搜索结果网格入场：12 张卡片快速 stagger 浮现
 * stagger 0.04s，总共约 0.44s + 0.38s duration ≈ 0.82s 全部出现
 */
function animateGrid() {
  gsap.fromTo(
    picCardRefs.slice(0, similarPictures.value.length),
    { opacity: 0, y: 32, scale: 0.93 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.38,
      stagger: 0.04,
      ease: 'power2.out',
      delay: 0.05,
    }
  )
}

// ======================== 生命周期 ========================

onMounted(async () => {
  animatePageIn()
  await initPage()
})
</script>

<style scoped>
/* ======================== 字体 ======================== */

/* ======================== CSS 变量 ======================== */
:root {
  --bg:          #ede8de;         /* 暖亚麻底 */
  --surface:     #f8f5ee;         /* 卡片底 */
  --surface-2:   #e5dfd2;         /* 次级底/占位 */
  --border:      #d2c9b4;         /* 边框 */
  --text-pri:    #1a1714;         /* 主文字 */
  --text-sec:    #68604f;         /* 次要文字 */
  --text-muted:  #9d9080;         /* 弱化文字 */
  /* 琥珀金 — 按钮/强调色，在亚麻底上对比度极高 */
  --amber:       #c47820;
  --amber-dark:  #a36318;
  --amber-light: #f4e2c0;
  --shadow-sm:   0 2px 10px rgba(18,12,2,0.08);
  --shadow-md:   0 6px 26px rgba(18,12,2,0.13);
  --shadow-lg:   0 14px 48px rgba(18,12,2,0.18);
  --r-sm: 8px;
  --r-md: 12px;
  --font-d: 'Playfair Display', 'STSong', serif;
  --font-b: 'Lora', 'STKaiti', serif;
}

/* ======================== 页面容器 ======================== */
.search-page {
  min-height: 100vh;
  background: var(--bg);
  font-family: var(--font-b);
  color: var(--text-pri);
}

/* ======================== 顶部标题栏 ======================== */
.page-header {
  position: sticky;
  top: 0;
  z-index: 200;
  background: rgba(237, 232, 222, 0.88);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
  height: 58px;
  padding: 0 36px;
  display: flex;
  align-items: center;
}

.header-inner {
  width: 100%;
  max-width: 1500px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 14px;
}

.back-btn {
  color: var(--text-sec) !important;
  font-family: var(--font-b);
  font-size: 13.5px;
  padding: 0 6px;
  flex-shrink: 0;
  transition: color 0.2s;
}
.back-btn:hover { color: var(--amber) !important; }

.page-title {
  font-family: var(--font-d);
  font-size: 20px;
  font-weight: 600;
  color: var(--text-pri);
  margin: 0;
  letter-spacing: 0.03em;
}

.header-sub {
  font-size: 9px;
  letter-spacing: 0.24em;
  color: var(--text-muted);
  align-self: flex-end;
  margin-bottom: 5px;
  margin-left: 2px;
}

/* ======================== 主体双栏布局 ======================== */
.page-body {
  max-width: 1500px;
  margin: 0 auto;
  padding: 26px 36px 64px;
  display: grid;
  /* 左侧固定 270px，右侧撑满 */
  grid-template-columns: 270px 1fr;
  gap: 24px;
  align-items: start;
}

/* ======================== 左侧：原始图片侧边栏 ======================== */
.origin-aside {
  position: sticky;
  top: 82px; /* 标题栏高度 + 间距 */
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  opacity: 0; /* GSAP 入场 */
}

/* 原图 — 1:1 正方形展示 */
.origin-img-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--surface-2);
  opacity: 0; /* GSAP 入场 */
}

.origin-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.45s ease;
}
.origin-img-wrap:hover .origin-img { transform: scale(1.06); }

/* 图片名称区 */
.origin-name-block {
  padding: 13px 16px 12px;
  border-bottom: 1px solid var(--border);
}

.origin-label {
  display: block;
  font-size: 9.5px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 5px;
}

.origin-name {
  font-size: 13px;
  color: var(--text-pri);
  margin: 0;
  line-height: 1.55;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

/* ======================== 搜索按钮 — :deep 穿透 Ant Design 权重 ======================== */
.btn-wrap {
  padding: 14px 16px 18px;
}

/* 用 :deep 确保样式穿透 scoped + Ant Design 内部选择器 */
.btn-wrap :deep(.ant-btn.search-btn),
.btn-wrap :deep(.ant-btn.search-btn:not(:disabled)) {
  height: 50px;
  width: 100%;
  font-size: 15px;
  font-family: var(--font-b);
  font-weight: 600;
  letter-spacing: 0.05em;
  border-radius: var(--r-sm);
  /* 深色背景 + 白色文字 — 对比度最高方案 */
  background: #b06010 !important;
  border: 2px solid #8a4a0c !important;
  color: #fff !important;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.35);
  box-shadow: 0 4px 20px rgba(176, 96, 16, 0.50) !important;
  transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
}

.btn-wrap :deep(.ant-btn.search-btn .ant-btn-icon),
.btn-wrap :deep(.ant-btn.search-btn span) {
  color: #fff !important;
}

.btn-wrap :deep(.ant-btn.search-btn:hover:not(:disabled)) {
  background: #8a4a0c !important;
  border-color: #6e3a08 !important;
  box-shadow: 0 6px 28px rgba(176, 96, 16, 0.65) !important;
  transform: translateY(-2px);
}

.btn-wrap :deep(.ant-btn.search-btn:active) {
  transform: translateY(0);
  box-shadow: 0 2px 10px rgba(176, 96, 16, 0.40) !important;
}

/* loading 状态图标也保持白色 */
.btn-wrap :deep(.ant-btn.search-btn .anticon-loading) {
  color: #fff !important;
}

/* ======================== 右侧：相似图片主区 ======================== */
.result-main {
  min-height: 500px;
  opacity: 0; /* GSAP 入场 */
}

/* 引导状态 */
.guide-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 480px;
  gap: 18px;
}

.guide-icon {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: var(--text-muted);
  box-shadow: var(--shadow-sm);
}

.guide-text {
  font-size: 14px;
  color: var(--text-sec);
  margin: 0;
}

/* 结果标题行 */
.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.result-title {
  font-family: var(--font-d);
  font-size: 18px;
  font-weight: 600;
  color: var(--text-pri);
}

.result-badge {
  padding: 2px 11px;
  border-radius: 20px;
  background: var(--amber-light);
  color: var(--amber-dark);
  font-size: 12px;
  border: 1px solid rgba(196,120,32,0.28);
  font-family: var(--font-b);
}

/* ======================== 图片网格 — 4 列 ======================== */
.picture-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

/* ======================== 图片卡片 ======================== */
.pic-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  overflow: hidden;
  cursor: pointer;
  opacity: 0; /* GSAP 控制 */
  box-shadow: var(--shadow-sm);
  transition: box-shadow 0.22s, transform 0.22s, border-color 0.22s;
}

.pic-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-5px);
  border-color: rgba(196,120,32,0.42);
}

.pic-img-wrap {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--surface-2);
}

/* 骨架屏 shimmer 动画 */
.img-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    var(--surface-2) 25%,
    #ddd6c6 50%,
    var(--surface-2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite linear;
  transition: opacity 0.3s ease;
  z-index: 1;
}
/* 图片加载完成后骨架屏淡出 */
.img-skeleton.hidden {
  opacity: 0;
  pointer-events: none;
}

@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.pic-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.38s ease, opacity 0.35s ease;
  /* 默认透明，加载完成后淡入 */
  opacity: 0;
}
/* 加载完成后淡入显示 */
.pic-img.loaded { opacity: 1; }
.pic-card:hover .pic-img { transform: scale(1.07); }

.pic-hover-mask {
  position: absolute;
  inset: 0;
  background: rgba(18,12,2,0.30);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.22s;
}
.pic-card:hover .pic-hover-mask { opacity: 1; }

.mask-icon {
  color: rgba(255,255,255,0.90);
  font-size: 24px;
}

/* ======================== 下载按钮 ======================== */
.download-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  z-index: 2;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  /* 增强磨砂玻璃质感效果 */
  background: rgba(24, 144, 255, 0.75);
  color: rgba(255, 255, 255, 0.98);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  opacity: 0;
  transform: translateY(4px);
  transition: opacity 0.2s ease, transform 0.2s ease,
  background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
  backdrop-filter: blur(12px) saturate(180%);
  -webkit-backdrop-filter: blur(12px) saturate(180%);
}

/* 卡片 hover 时下载按钮出现 */
.pic-card:hover .download-btn {
  opacity: 1;
  transform: translateY(0);
}

/* 鼠标悬停下载按钮本身时高亮 */
.download-btn:hover {
  background: rgba(176, 96, 16, 0.9) !important;
  color: #fff !important;
  border-color: rgba(255, 255, 255, 0.4) !important;
  box-shadow:
    0 6px 20px rgba(176, 96, 16, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.5) !important;
  transform: translateY(-1px) scale(1.08) !important;
  backdrop-filter: blur(16px) saturate(200%) !important;
  -webkit-backdrop-filter: blur(16px) saturate(200%) !important;
}

.download-btn:active {
  transform: scale(0.96) !important;
}

/* ======================== 空状态 ======================== */
.empty-state { padding: 60px 0; }

/* ======================== 预览 Modal ======================== */
:deep(.preview-modal .ant-modal-content) {
  background: #1e1b16;
  border-radius: var(--r-md);
  overflow: hidden;
  padding: 6px;
}
:deep(.preview-modal .ant-modal-close) { color: rgba(255,255,255,0.65); }
:deep(.preview-modal .ant-modal-close:hover) {
  color: #fff;
  background: rgba(255,255,255,0.10);
}

.preview-img {
  width: 100%;
  border-radius: var(--r-sm);
  display: block;
}

/* ======================== Antd 覆盖 ======================== */
:deep(.ant-spin-text) {
  color: var(--text-sec) !important;
  font-family: var(--font-b);
}
:deep(.ant-empty-description) { color: var(--text-sec); }

/* ======================== 响应式 ======================== */
@media (max-width: 1280px) {
  .picture-grid { grid-template-columns: repeat(3, 1fr); }
}

@media (max-width: 1024px) {
  .page-body { grid-template-columns: 240px 1fr; }
}

@media (max-width: 768px) {
  .page-body {
    grid-template-columns: 1fr;
    padding: 16px 16px 48px;
  }
  .origin-aside { position: static; }
  .picture-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 480px) {
  .page-header { padding: 0 16px; }
  .page-title { font-size: 17px; }
}
</style>

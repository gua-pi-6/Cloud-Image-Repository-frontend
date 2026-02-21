<template>
  <div class="search-page">
    <!-- ===================== 顶部标题栏 ===================== -->
    <header class="page-header slide-down-fade">
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
      <aside class="origin-aside slide-right-fade">
        <a-spin :spinning="originLoading" tip="加载中...">

          <template v-if="originPicture">
            <!-- 原图展示 -->
            <div class="origin-img-wrap">
              <img
                :src="originPicture.url"
                :alt="originPicture.name"
                class="origin-img scale-in"
              />
            </div>

            <!-- 仅展示图片名称 -->
            <div class="origin-name-block">
              <span class="origin-label">原始图片</span>
              <p class="origin-name" :title="originPicture.name">
                {{ originPicture.name }}
              </p>
            </div>

            <!-- 搜索按钮 — 陶土暖橙 -->
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
      <main class="result-main slide-left-fade">

        <!-- 未搜索时的引导提示 -->
        <div class="guide-state" v-if="!hasSearched && !searchLoading">
          <div class="guide-icon"><SearchOutlined /></div>
          <p class="guide-text">点击左侧按钮，搜索与原图相似的图片</p>
        </div>

        <div v-else>
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
                class="pic-card stagger-up"
                :style="{ 'animation-delay': `${index * 0.04 + 0.05}s` }"
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

                  <!-- 下载按钮 -->
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
        </div>
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { LeftOutlined, SearchOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons-vue'
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
/** 相似图片列表 */
const similarPictures = ref<API.ImageSearchResult[]>([])

/** 原图加载状态 */
const originLoading = ref(false)
/** 搜索加载状态 */
const searchLoading = ref(false)
/** 是否已触发过搜索 */
const hasSearched = ref(false)

/** 预览弹窗 */
const previewVisible = ref(false)
const previewPicture = ref<API.ImageSearchResult | null>(null)

/** 已加载完成的卡片索引集合，驱动骨架屏消失 + 图片淡入 */
const loadedSet = ref<Set<number>>(new Set())

/** 每张卡片图片 onload 回调 */
function onCardImgLoad(index: number) {
  loadedSet.value = new Set([...loadedSet.value, index])
}

// ======================== API 调用 ========================

async function fetchOriginPicture() {
  const res = await getPictureVoByIdUsingGet({ id: props.id })
  if (res.data.code === 0 && res.data.data) {
    originPicture.value = res.data.data
  } else {
    message.error(res.data.message)
  }
}

async function fetchSimilarPictures() {
  const res = await searchPictureByPictureUsingPost({ pictureId: originPicture.value?.id })
  if (res.data.code === 0 && res.data.data) {
    similarPictures.value = res.data.data
  } else {
    message.error(res.data.message)
  }
}

// ======================== 业务逻辑 ========================

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

async function handleSearch() {
  if (!originPicture.value) return

  searchLoading.value = true
  hasSearched.value = true
  similarPictures.value = []   // 清空上次结果
  loadedSet.value = new Set()  // 重置图片加载状态

  try {
    await fetchSimilarPictures()
  } catch {
    message.error('搜索失败，请稍后重试')
  } finally {
    searchLoading.value = false
  }
}

function handlePicClick(pic: API.ImageSearchResult) {
  previewPicture.value = pic
  previewVisible.value = true
}

function handleDownload(pic: API.ImageSearchResult) {
  if (pic.thumbUrl) {
    saveAs(pic.thumbUrl, 'similar-image.jpg')
  } else {
    message.error('图片地址不存在')
  }
}

// ======================== 生命周期 ========================

onMounted(async () => {
  await initPage()
})
</script>

<style scoped>
/* ======================== CSS 变量 (陶土暖白系) ======================== */
.search-page {
  --bg-main:       #fbf9f6;         /* 暖白背景 */
  --surface:       #ffffff;         /* 卡片底 */
  --surface-2:     #f0e9df;         /* 骨架/占位底色 */
  --border:        #ebdcd0;         /* 暖色边框 */
  --text-pri:      #4a3f35;         /* 主文字：深褐灰 */
  --text-sec:      #8c7b6c;         /* 次要文字：浅褐灰 */
  --text-muted:    #bfaea3;         /* 弱化文字 */

  --primary:       #d87d4a;         /* 陶土暖橙 */
  --primary-hover: #c46b3d;         /* 深陶土橙 */
  --primary-light: #fdf3ed;         /* 极淡橙色背景 */

  --shadow-sm:     0 2px 8px rgba(140, 123, 108, 0.08);
  --shadow-md:     0 4px 16px rgba(140, 123, 108, 0.12);
  --shadow-lg:     0 8px 24px rgba(140, 123, 108, 0.15);

  --r-sm: 8px;
  --r-md: 12px;
}

/* ======================== 页面容器 ======================== */
.search-page {
  min-height: 100vh;
  background: var(--bg-main);
  color: var(--text-pri);
}

/* ======================== 纯 CSS 动画定义 ======================== */
/* 顶部导航滑入 */
@keyframes slideDownFade {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}
.slide-down-fade { animation: slideDownFade 0.5s ease-out forwards; }

/* 左侧边栏滑入 */
@keyframes slideRightFade {
  from { opacity: 0; transform: translateX(-28px); }
  to { opacity: 1; transform: translateX(0); }
}
.slide-right-fade {
  opacity: 0;
  animation: slideRightFade 0.5s ease-out forwards;
  animation-delay: 0.15s;
}

/* 右侧主区域滑入 */
@keyframes slideLeftFade {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}
.slide-left-fade {
  opacity: 0;
  animation: slideLeftFade 0.5s ease-out forwards;
  animation-delay: 0.3s;
}

/* 原图浮现缩放 */
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.scale-in { animation: scaleIn 0.6s ease-out forwards; }

/* 网格卡片依次浮现 */
@keyframes staggerUp {
  from { opacity: 0; transform: translateY(32px) scale(0.93); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.stagger-up {
  opacity: 0;
  /* animation-delay 已经在 template 中动态计算传入 */
  animation: staggerUp 0.45s ease-out forwards;
}

/* ======================== 顶部标题栏 ======================== */
.page-header {
  position: sticky;
  top: 0;
  z-index: 200;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  height: 58px;
  padding: 0 36px;
  display: flex;
  align-items: center;
  box-shadow: var(--shadow-sm);
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
  font-size: 14px;
  padding: 0 6px;
  transition: color 0.3s;
}
.back-btn:hover { color: var(--primary) !important; }

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-pri);
  margin: 0;
  letter-spacing: 0.02em;
}

.header-sub {
  font-size: 10px;
  letter-spacing: 0.2em;
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
  grid-template-columns: 270px 1fr;
  gap: 24px;
  align-items: start;
}

/* ======================== 左侧：原始图片侧边栏 ======================== */
.origin-aside {
  position: sticky;
  top: 82px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-md);
  overflow: hidden;
  box-shadow: var(--shadow-md);
}

.origin-img-wrap {
  width: 100%;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--surface-2);
}

.origin-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.45s ease;
}
.origin-img-wrap:hover .origin-img { transform: scale(1.04); }

.origin-name-block {
  padding: 13px 16px 12px;
  border-bottom: 1px solid var(--border);
}

.origin-label {
  display: block;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 5px;
}

.origin-name {
  font-size: 14px;
  color: var(--text-pri);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
}

/* 按钮区 */
.btn-wrap {
  padding: 16px;
}

/* 【修改部分】：移除了容易导致不可见问题的 :deep 选择器，直接应用样式 */
.search-btn {
  height: 48px;
  font-size: 15px;
  font-weight: 500;
  border-radius: var(--r-sm);
  background: var(--primary) !important;
  border: none !important;
  color: #fff !important;
  box-shadow: var(--shadow-sm) !important;
  transition: all 0.3s ease;
}

.search-btn:hover:not(:disabled) {
  background: var(--primary-hover) !important;
  box-shadow: var(--shadow-md) !important;
  transform: translateY(-2px);
}

.search-btn:active {
  transform: translateY(0);
}

/* ======================== 右侧：相似图片主区 ======================== */
.result-main {
  min-height: 500px;
}

/* 【修改部分】：未搜索时的引导提示（增加边框和高亮颜色提示） */
.guide-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 480px;
  gap: 18px;

  /* 增加主色调半透明的暖心边框 */
  border: 2px dashed rgba(216, 125, 74, 0.4);
  border-radius: var(--r-md);
  /* 增加极其淡薄的暖色做背景 */
  background-color: rgba(253, 243, 237, 0.5);
  transition: all 0.3s ease;
}

.guide-state:hover {
  border-color: var(--primary);
  background-color: var(--primary-light);
}

.guide-icon {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: var(--surface);
  border: 1px solid rgba(216, 125, 74, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  /* 将引导图标调整为醒目的主色 */
  color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.guide-text {
  font-size: 16px;
  font-weight: 600; /* 加粗使字体更突出 */
  /* 修改字体颜色，使用页面主色调（陶土暖橙），使得用户能够明显注意到 */
  color: var(--primary);
  margin: 0;
  letter-spacing: 0.02em;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 18px;
}

.result-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-pri);
}

.result-badge {
  padding: 2px 12px;
  border-radius: 20px;
  background: var(--primary-light);
  color: var(--primary);
  font-size: 12px;
  border: 1px solid rgba(216, 125, 74, 0.2);
}

/* 图片网格 */
.picture-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.pic-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r-sm);
  overflow: hidden;
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s;
}

.pic-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
  border-color: rgba(216, 125, 74, 0.4);
}

.pic-img-wrap {
  position: relative;
  aspect-ratio: 1 / 1;
  overflow: hidden;
  background: var(--surface-2);
}

/* 骨架屏动画 */
.img-skeleton {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    var(--surface-2) 25%,
    #f8f4f0 50%,
    var(--surface-2) 75%
  );
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite linear;
  transition: opacity 0.4s ease;
  z-index: 1;
}

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
  opacity: 0;
  transition: transform 0.4s ease, opacity 0.5s ease;
}

.pic-img.loaded { opacity: 1; }
.pic-card:hover .pic-img { transform: scale(1.05); }

.pic-hover-mask {
  position: absolute;
  inset: 0;
  background: rgba(74, 63, 53, 0.4); /* 暖黑色半透明遮罩 */
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}
.pic-card:hover .pic-hover-mask { opacity: 1; }

.mask-icon {
  color: #fff;
  font-size: 28px;
}

/* 下载按钮 */
.download-btn {
  position: absolute;
  bottom: 10px;
  right: 10px;
  z-index: 2;
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.85);
  color: var(--text-pri);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.25s ease;
  backdrop-filter: blur(8px);
}

.pic-card:hover .download-btn {
  opacity: 1;
  transform: translateY(0);
}

.download-btn:hover {
  background: var(--primary) !important;
  color: #fff !important;
  transform: translateY(-2px) scale(1.05) !important;
  box-shadow: 0 6px 16px rgba(216, 125, 74, 0.4) !important;
}

.download-btn:active {
  transform: scale(0.95) !important;
}

.empty-state { padding: 60px 0; }

/* ======================== 预览 Modal ======================== */
:deep(.preview-modal .ant-modal-content) {
  background: var(--surface);
  border-radius: var(--r-md);
  padding: 10px;
  box-shadow: var(--shadow-lg);
}
:deep(.preview-modal .ant-modal-close) {
  color: var(--text-sec);
  top: 14px;
  right: 14px;
}
:deep(.preview-modal .ant-modal-close:hover) {
  color: var(--text-pri);
  background: var(--bg-main);
}

.preview-img {
  width: 100%;
  border-radius: var(--r-sm);
  display: block;
}

/* ======================== Antd 覆盖 ======================== */
:deep(.ant-spin-text) {
  color: var(--text-sec) !important;
}
:deep(.ant-spin-dot-item) {
  background-color: var(--primary) !important;
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
  .page-title { font-size: 18px; }
}
</style>

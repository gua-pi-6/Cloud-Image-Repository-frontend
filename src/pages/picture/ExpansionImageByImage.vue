<template>
  <div class="picture-expansion-page">
    <!-- 顶部导航栏 -->
    <header class="page-header">
      <a-button
        class="back-button"
        type="text"
        @click="handleBack"
        :icon="h(LeftOutlined)"
      >
        返回
      </a-button>
      <h1 class="page-title">以图扩图</h1>
      <div class="header-placeholder"></div>
    </header>

    <!-- 主内容区域 -->
    <div class="page-content" ref="contentRef">
      <div class="content-wrapper">

        <!-- 左侧：原始图片 -->
        <div class="image-section original-section" ref="originalRef">
          <div class="section-title">
            <CameraOutlined class="title-icon" />
            <span>原始图片</span>
          </div>

          <div class="image-display">
            <a-spin :spinning="imageLoading" size="large">
              <img
                v-if="originalImage"
                :src="originalImage"
                alt="原始图片"
                class="display-image"
              />
              <div v-else class="image-placeholder">
                <FileImageOutlined :style="{ fontSize: '64px' }" />
                <p>加载中...</p>
              </div>
            </a-spin>
          </div>
        </div>

        <!-- 中间：箭头和控制面板 -->
        <div class="middle-section" ref="middleRef">


          <!-- 控制面板 -->
          <div class="control-panel">
            <div class="panel-header">
              <SettingOutlined class="panel-icon" />
              <span>扩展设置</span>
            </div>

            <div class="control-content">
              <!-- 输出宽高比 -->
              <div class="control-item">
                <div class="item-label">输出宽高比</div>
                <a-select
                  v-model:value="outputRatio"
                  placeholder="默认不设置"
                  class="ratio-select"
                  :options="ratioOptions"
                  allow-clear
                />
              </div>
              <!-- 操作按钮 -->
              <div class="control-actions">
                <a-button
                  type="primary"
                  size="large"
                  :loading="isExpanding"
                  :disabled="outputRatio === ''"
                  @click="handleExpand"
                  block
                  class="expand-button"
                >
                  <template #icon v-if="!isExpanding">
                    <ThunderboltOutlined />
                  </template>
                  {{ isExpanding ? '扩展中...' : '开始扩展' }}
                </a-button>

                <a-button
                  size="large"
                  @click="handleReset"
                  :disabled="isExpanding"
                  block
                  class="reset-button"
                >
                  重置参数
                </a-button>
              </div>
            </div>
          </div>

          <!-- 箭头 -->
          <div class="arrow-container">
            <div class="arrow-line"></div>
            <div class="arrow-head">
              <ArrowRightOutlined class="arrow-icon" />
            </div>
          </div>
        </div>

        <!-- 右侧：扩展结果 -->
        <div class="image-section result-section" ref="resultRef">
          <div class="section-title">
            <PictureOutlined class="title-icon" />
            <span>扩展结果</span>
          </div>

          <div class="image-display result-display">
            <!-- 扩展中的加载状态 -->
            <div v-if="isExpanding" class="loading-state">
              <div class="loading-spinner">
                <a-spin size="large" />
              </div>
              <div class="loading-text">
                <p class="loading-title">AI 正在处理中</p>
                <p class="loading-subtitle">请稍候，这可能需要几秒钟...</p>
              </div>
              <div class="loading-progress">
                <div class="progress-bar" ref="progressBarRef"></div>
              </div>
            </div>

            <!-- 扩展完成显示结果 -->
            <div v-else-if="expandedImage" class="result-wrapper">
              <img
                v-if="expandedImage"
                :src="expandedImage"
                alt="扩展后的图片"
                class="display-image result-image"
              />
              <div v-else class="image-placeholder result-placeholder">
                <PictureOutlined :style="{ fontSize: '64px' }" />
                <p>扩展结果将在这里显示</p>
                <p class="placeholder-hint">请设置参数后点击"开始扩展"</p>
              </div>
            </div>

            <div v-else class="image-placeholder result-placeholder">
              <PictureOutlined :style="{ fontSize: '64px' }" />
              <p>扩展结果将在这里显示</p>
              <p class="placeholder-hint">请设置参数后点击"开始扩展"</p>
            </div>
          </div>

          <!-- 结果操作按钮 -->
          <div class="result-actions" v-if="expandedImage">
            <a-space :size="12">
              <a-button type="primary" @click="handleDownload" class="action-btn">
                <DownloadOutlined />
                下载图片
              </a-button>
            </a-space>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  LeftOutlined,
  CameraOutlined,
  FileImageOutlined,
  PictureOutlined,
  SettingOutlined,
  ArrowUpOutlined,
  ArrowRightOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ThunderboltOutlined,
  DownloadOutlined,
  SaveOutlined
} from '@ant-design/icons-vue'
import {
  createPictureOutPaintingTaskUsingPost,
  getPictureOutPaintingTaskUsingGet,
  getPictureVoByIdUsingGet
} from '@/api/pictureController'
import { saveAs } from 'file-saver'


// ==================== Props ====================
const props = defineProps<{ id: string }>()

// ==================== 路由 ====================
const router = useRouter()

// ==================== 响应式数据 ====================
// 图片相关
const pictureVo = ref<API.PictureVO>()
const originalImage = ref<string>('')
const expandedImage = ref<string>('')
const imageLoading = ref<boolean>(false)

// 扩展参数
const outputRatio = ref<string>('')

// 状态
const isExpanding = ref<boolean>(false)

// DOM 引用
const contentRef = ref<HTMLElement | null>(null)
const originalRef = ref<HTMLElement | null>(null)
const middleRef = ref<HTMLElement | null>(null)
const resultRef = ref<HTMLElement | null>(null)
const progressBarRef = ref<HTMLElement | null>(null)

// ==================== 常量配置 ====================

// 宽高比选项
const ratioOptions = [
  { label: '不设置', value: '' },
  { label: '1:1 (正方形)', value: '1:1' },
  { label: '3:4 (竖版)', value: '3:4' },
  { label: '4:3 (横版)', value: '4:3' },
  { label: '9:16 (手机竖屏)', value: '9:16' },
  { label: '16:9 (宽屏)', value: '16:9' }
]

// ==================== 生命周期 ====================
onMounted(() => {
  // 加载原始图片
  loadOriginalImage()
})
// ==================== 数据加载 ====================
/**
 * 加载原始图片
 */
const loadOriginalImage = async () => {
  try {
    imageLoading.value = true
    const res = await getPictureVoByIdUsingGet({ id: props.id } as any) as any

    if (res?.data?.code === 0 && res?.data?.data) {
      pictureVo.value = res.data.data
      originalImage.value = res.data.data.url
    } else {
      message.error(res?.data?.message || '加载图片失败')
    }

    imageLoading.value = false
  } catch (error) {
    console.error('加载图片失败:', error)
    message.error('加载图片失败，请重试')
    imageLoading.value = false
  }
}

// 提交任务
async function submitTask() {
  const res = await createPictureOutPaintingTaskUsingPost({
    pictureId: props.id,
    parameters: {
      outputRatio: outputRatio.value
    }
  } as any)
  if (res.data.code === 0 && res.data.data) {
    const { taskId } = res?.data?.data?.output as API.Output
    checkTaskStatus(taskId);
  }else {
    message.error(res?.data?.message)
    isExpanding.value = false
  }
}

// 检查任务状态
async function checkTaskStatus(taskId: any) {
  const intervalId = setInterval(async () => {
    const res = await getPictureOutPaintingTaskUsingGet({ taskId: taskId })
    if (res.data.code === 0 && res.data.data) {
      const { taskStatus, outputImageUrl } = res?.data?.data?.output as API.Output1
      if (taskStatus === 'SUCCEEDED') {
        expandedImage.value = outputImageUrl as string
        isExpanding.value = false
        message.success("成功生成图片")
        clearInterval(intervalId); // 停止轮询
      } else if (taskStatus === 'FAILED') {
        isExpanding.value = false
        message.error("图片生成失败")
        clearInterval(intervalId); // 停止轮询
      }
    }else {
      isExpanding.value = false
      message.error(res?.data?.message)
      clearInterval(intervalId)
    }
  }, 2000); // 每隔 2 秒轮询
}

// ==================== 核心功能 ====================
/**
 * 执行图片扩展
 * 调用后端 AI 扩展接口
 */
const handleExpand = async () => {
  if (outputRatio.value === '') {
    message.warning('请选择输出宽高比')
    return
  }
  if (!(pictureVo.value?.picHeight as number >= 512 && pictureVo.value?.picHeight as number <= 4096)) {
    message.warning('图片高度尺寸必须在[512,4096]之间 单位像素')
    return
  }
  if (!(pictureVo.value?.picWidth as number >= 512 && pictureVo.value?.picWidth as number <= 4096)) {
    message.warning('图片宽度尺寸必须在[512,4096]之间 单位像素')
    return
  }

  try {
    isExpanding.value = true
    // 调用
    message.info("开始生成图片")
    submitTask();
  } catch (error) {
    console.error('扩展失败:', error)
    message.error('扩展失败，请重试')
  }
}

/**
 * 重置参数
 */
const handleReset = () => {
  outputRatio.value = ''
  expandedImage.value = ''
  message.info('参数已重置')
}

/**
 * 下载扩展后的图片
 */
const handleDownload = async () => {
  if (!expandedImage.value) {
    message.warning('没有可下载的图片')
    return
  }

  try {
    // 通过 fetch 获取图片数据，解决跨域下载问题
    const response = await fetch(expandedImage.value)
    const blob = await response.blob()

    // 使用 file-saver 下载
    saveAs(blob, `expanded-image-${Date.now()}.jpg`)
    message.success('图片下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('图片下载失败，请重试')
  }
}

/**
 * 返回上一页
 */
const handleBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
// ==================== 颜色变量 ====================
$primary-blue: #1a4d6d;
$secondary-teal: #2d6a4f;
$accent-orange: #ff6b35;
$bg-dark: #0f1419;
$bg-darker: #1a2332;
$card-bg: #ffffff;
$panel-bg: #2a3f54;
$border-color: #e0e7ed;
$text-primary: #1f2937;
$text-secondary: #6b7280;
$text-light: #ffffff;
$shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
$shadow-md: 0 4px 12px rgba(0, 0, 0, 0.15);
$shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.2);

// ==================== 主容器 ====================
.picture-expansion-page {
  min-height: 100vh;
  background: linear-gradient(135deg, $bg-dark 0%, $bg-darker 100%);
  padding-bottom: 40px;
}

// ==================== 顶部导航 ====================
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(12px);
  box-shadow: $shadow-sm;
  position: sticky;
  top: 0;
  z-index: 100;

  .back-button {
    font-size: 16px;
    color: $primary-blue;
    transition: all 0.3s;

    &:hover {
      color: $accent-orange;
      transform: translateX(-5px);
    }
  }

  .page-title {
    margin: 0;
    font-size: 26px;
    font-weight: 600;
    color: $text-primary;
    background: linear-gradient(135deg, $primary-blue 0%, $secondary-teal 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .header-placeholder {
    width: 80px;
  }
}

// ==================== 内容区域 ====================
/* 在 .image-display 样式附近添加 */
.result-wrapper {
  width: 100%;
  height: 100%;
  display: flex;       /* 保持内部布局居中 */
  align-items: center;
  justify-content: center;
}
.page-content {
  padding: 40px 20px;
  max-width: 1800px;
  margin: 0 auto;
}

.content-wrapper {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: start;

  @media (max-width: 1400px) {
    grid-template-columns: 1fr;
    gap: 30px;
  }
}

// ==================== 图片展示区域 ====================
.image-section {
  background: $card-bg;
  border-radius: 16px;
  padding: 24px;
  box-shadow: $shadow-md;
  transition: all 0.3s;

  &:hover {
    box-shadow: $shadow-lg;
  }

  .section-title {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 2px solid $border-color;
    font-size: 16px;
    font-weight: 600;
    color: $text-primary;

    .title-icon {
      font-size: 20px;
      color: $primary-blue;
    }
  }

  .image-display {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    min-height: 450px;
    display: flex;
    align-items: center;
    justify-content: center;

    .display-image {
      width: 100%;
      height: auto;
      display: block;
      object-fit: contain;
      max-height: 600px;
    }

    .image-placeholder {
      text-align: center;
      padding: 80px 30px;
      color: $text-secondary;

      p {
        margin-top: 20px;
        font-size: 16px;
        font-weight: 500;
      }

      .placeholder-hint {
        font-size: 14px;
        color: #9ca3af;
        margin-top: 8px;
        font-weight: 400;
      }
    }
  }
}

.original-section {
  .image-display {
    border: 3px solid $primary-blue;
  }
}

.result-section {
  .image-display {
    border: 3px solid $secondary-teal;
  }

  .result-placeholder {
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  }
}

// ==================== 中间区域（箭头 + 控制面板）====================
.middle-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 0 40px;
  min-width: 400px;

  @media (max-width: 1400px) {
    padding: 0;
    min-width: 100%;
  }
}

// 箭头样式
.arrow-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 60px;

  .arrow-line {
    position: absolute;
    width: 100%;
    height: 3px;
    background: linear-gradient(90deg, $primary-blue 0%, $secondary-teal 100%);
    box-shadow: 0 0 12px rgba(45, 106, 79, 0.4);
  }

  .arrow-head {
    position: relative;
    z-index: 2;
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, $primary-blue 0%, $secondary-teal 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 16px rgba(45, 106, 79, 0.5);
    animation: pulse 2s ease-in-out infinite;

    .arrow-icon {
      font-size: 28px;
      color: $text-light;
    }
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 16px rgba(45, 106, 79, 0.5);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 6px 20px rgba(45, 106, 79, 0.7);
  }
}

// 控制面板样式
.control-panel {
  width: 100%;
  background: $panel-bg;
  border-radius: 16px;
  padding: 24px;
  box-shadow: $shadow-lg;

  .panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.1);
    color: $text-light;
    font-size: 16px;
    font-weight: 600;

    .panel-icon {
      font-size: 20px;
      color: $accent-orange;
    }
  }

  .control-content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
}

// 控制项样式
.control-item {
  .item-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: rgba(255, 255, 255, 0.9);
    margin-bottom: 12px;

    .label-value {
      color: $accent-orange;
      font-weight: 600;
      margin-left: 8px;
    }
  }

  // 方向选择器
  .direction-selector {
    :deep(.ant-checkbox-group) {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      width: 100%;
    }

    :deep(.ant-checkbox-wrapper) {
      margin: 0;
      padding: 10px 14px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.05);
      color: rgba(255, 255, 255, 0.85);
      transition: all 0.3s;
      display: flex;
      align-items: center;
      gap: 8px;

      &:hover {
        border-color: $primary-blue;
        background: rgba(26, 77, 109, 0.2);
      }

      &.ant-checkbox-wrapper-checked {
        border-color: $primary-blue;
        background: rgba(26, 77, 109, 0.3);
        color: $text-light;
      }

      .anticon {
        font-size: 16px;
      }
    }
  }

  // 滑块样式
  :deep(.ant-slider) {
    .ant-slider-rail {
      background: rgba(255, 255, 255, 0.2);
    }

    .ant-slider-track {
      background: linear-gradient(90deg, $primary-blue 0%, $secondary-teal 100%);
    }

    .ant-slider-handle {
      border-color: $accent-orange;
      background: $accent-orange;

      &:hover,
      &:focus {
        border-color: $accent-orange;
        box-shadow: 0 0 0 4px rgba(255, 107, 53, 0.3);
      }
    }

    .ant-slider-mark-text {
      color: rgba(255, 255, 255, 0.6);
      font-size: 12px;
    }

    .ant-slider-mark-text-active {
      color: rgba(255, 255, 255, 0.9);
    }
  }

  // 选择器样式
  .ratio-select {
    width: 100%;

    :deep(.ant-select-selector) {
      background: rgba(255, 255, 255, 0.1) !important;
      border-color: rgba(255, 255, 255, 0.2) !important;
      color: rgba(255, 255, 255, 0.9) !important;

      &:hover {
        border-color: $primary-blue !important;
      }
    }

    :deep(.ant-select-arrow) {
      color: rgba(255, 255, 255, 0.6);
    }
  }

  // 文本域样式
  .prompt-textarea {
    :deep(textarea) {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      &:hover,
      &:focus {
        border-color: $primary-blue;
        background: rgba(255, 255, 255, 0.12);
      }
    }

    :deep(.ant-input-textarea-show-count::after) {
      color: rgba(255, 255, 255, 0.5);
    }
  }
}

// 控制按钮
.control-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;

  .expand-button {
    height: 50px;
    font-size: 17px;
    font-weight: 600;
    background: linear-gradient(135deg, $accent-orange 0%, #ff8555 100%);
    border: none;
    box-shadow: 0 4px 16px rgba(255, 107, 53, 0.4);
    transition: all 0.3s;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 53, 0.5);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      background: linear-gradient(135deg, #6b7280 0%, #9ca3af 100%);
      box-shadow: none;
    }
  }

  .reset-button {
    height: 44px;
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
    color: rgba(255, 255, 255, 0.9);

    &:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.15);
      border-color: $primary-blue;
      color: $text-light;
    }
  }
}

// ==================== 加载状态 ====================
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 40px;
  gap: 24px;

  .loading-spinner {
    :deep(.ant-spin-dot) {
      font-size: 48px;

      .ant-spin-dot-item {
        background-color: $secondary-teal;
      }
    }
  }

  .loading-text {
    text-align: center;

    .loading-title {
      font-size: 18px;
      font-weight: 600;
      color: $text-primary;
      margin: 0 0 8px 0;
    }

    .loading-subtitle {
      font-size: 14px;
      color: $text-secondary;
      margin: 0;
    }
  }

  .loading-progress {
    width: 100%;
    max-width: 300px;
    height: 6px;
    background: #e5e7eb;
    border-radius: 3px;
    overflow: hidden;

    .progress-bar {
      height: 100%;
      width: 0;
      background: linear-gradient(90deg, $primary-blue 0%, $secondary-teal 100%);
      border-radius: 3px;
      box-shadow: 0 0 10px rgba(45, 106, 79, 0.5);
    }
  }
}

// ==================== 结果操作按钮 ====================
.result-actions {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid $border-color;
  display: flex;
  justify-content: center;

  .action-btn {
    height: 42px;
    border-radius: 8px;
    font-weight: 500;
    padding: 0 24px;
  }

  :deep(.ant-btn-primary) {
    background: $accent-orange;
    border-color: $accent-orange;

    &:hover {
      background: darken($accent-orange, 8%);
      border-color: darken($accent-orange, 8%);
    }
  }
}

// ==================== 结果图片动画 ====================
.result-image {
  animation: resultFadeIn 0.8s ease-out;
}

@keyframes resultFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// ==================== 响应式设计 ====================
@media (max-width: 1400px) {
  .middle-section {
    .arrow-container {
      transform: rotate(90deg);
    }
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px 20px;

    .page-title {
      font-size: 22px;
    }
  }

  .page-content {
    padding: 24px 16px;
  }

  .image-section {
    padding: 20px;

    .image-display {
      min-height: 300px;
    }
  }

  .middle-section {
    padding: 0;
    min-width: 100%;
  }

  .control-panel {
    padding: 20px;
  }

  .control-item .direction-selector :deep(.ant-checkbox-group) {
    grid-template-columns: 1fr;
  }
}
</style>

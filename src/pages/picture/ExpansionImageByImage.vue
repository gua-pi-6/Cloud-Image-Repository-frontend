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
    <div class="page-content">
      <div class="content-wrapper">

        <!-- 左侧：原始图片 -->
        <div class="image-section original-section">
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
        <div class="middle-section">
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
        <div class="image-section result-section">
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
                <p class="loading-title">正在处理中</p>
                <p class="loading-subtitle">请稍候，这可能需要几秒钟...</p>
              </div>
              <div class="loading-progress">
                <div class="progress-bar"></div>
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
import { ref, onMounted, h } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
// 移除了未使用的图标
import {
  LeftOutlined,
  CameraOutlined,
  FileImageOutlined,
  PictureOutlined,
  SettingOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  DownloadOutlined
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
const pictureVo = ref<API.PictureVO>()
const originalImage = ref<string>('')
const expandedImage = ref<string>('')
const imageLoading = ref<boolean>(false)
const outputRatio = ref<string>('')
const isExpanding = ref<boolean>(false)

// 移除了未使用的 DOM 引用 (contentRef, originalRef 等)

// ==================== 常量配置 ====================
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
  loadOriginalImage()
})

// ==================== 数据加载 ====================
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
  } else {
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
        clearInterval(intervalId);
      } else if (taskStatus === 'FAILED') {
        isExpanding.value = false
        message.error("图片生成失败")
        clearInterval(intervalId);
      }
    } else {
      isExpanding.value = false
      message.error(res?.data?.message)
      clearInterval(intervalId)
    }
  }, 2000);
}

// ==================== 核心功能 ====================
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
    message.info("开始生成图片")
    submitTask();
  } catch (error) {
    console.error('扩展失败:', error)
    message.error('扩展失败，请重试')
  }
}

const handleReset = () => {
  outputRatio.value = ''
  expandedImage.value = ''
  message.info('参数已重置')
}

const handleDownload = async () => {
  if (!expandedImage.value) {
    message.warning('没有可下载的图片')
    return
  }

  try {
    const response = await fetch(expandedImage.value)
    const blob = await response.blob()
    saveAs(blob, `expanded-image-${Date.now()}.jpg`)
    message.success('图片下载成功')
  } catch (error) {
    console.error('下载失败:', error)
    message.error('图片下载失败，请重试')
  }
}

const handleBack = () => {
  router.back()
}
</script>

<style scoped lang="scss">
@use "sass:color"; /* 修复 sass 警告的必须引用 */

// ==================== 柔和暖色系变量 ====================
$primary-color: #d87d4a;     // 陶土暖橙（主色调）
$secondary-color: #e5a97c;   // 柔和沙橙
$bg-main: #fbf9f6;           // 暖白背景
$bg-darker: #f0e9df;         // 微深暖色背景
$card-bg: #ffffff;           // 卡片白
$panel-bg: #ffffff;          // 面板白
$border-color: #ebdcd0;      // 暖色边框
$text-primary: #4a3f35;      // 深褐灰（替代纯黑，更柔和）
$text-secondary: #8c7b6c;    // 浅褐灰
$text-light: #ffffff;
$shadow-sm: 0 2px 8px rgba(140, 123, 108, 0.08);
$shadow-md: 0 4px 16px rgba(140, 123, 108, 0.12);
$shadow-lg: 0 8px 24px rgba(140, 123, 108, 0.15);

// ==================== 主容器 ====================
.picture-expansion-page {
  min-height: 100vh;
  background: linear-gradient(135deg, $bg-main 0%, $bg-darker 100%);
  padding-bottom: 40px;
  color: $text-primary;
}

// ==================== 顶部导航 ====================
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  box-shadow: $shadow-sm;
  position: sticky;
  top: 0;
  z-index: 100;

  .back-button {
    font-size: 16px;
    color: $text-secondary;
    transition: all 0.3s;

    &:hover {
      color: $primary-color;
      transform: translateX(-5px);
    }
  }

  .page-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: $text-primary;
  }

  .header-placeholder {
    width: 80px;
  }
}

// ==================== 内容区域 ====================
.result-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
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
  border: 1px solid $border-color;

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
      color: $primary-color;
    }
  }

  .image-display {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    background: $bg-main;
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
        color: #bfaea3;
        margin-top: 8px;
        font-weight: 400;
      }
    }
  }
}

.original-section {
  .image-display {
    border: 2px dashed $border-color;
  }
}

.result-section {
  .image-display {
    border: 2px solid $border-color;
  }

  .result-placeholder {
    background: $bg-main;
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

// 箭头样式（去除了呼吸灯和刺眼渐变）
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
    height: 2px;
    background: $border-color;
  }

  .arrow-head {
    position: relative;
    z-index: 2;
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background: $card-bg;
    border: 2px solid $border-color;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-sm;

    .arrow-icon {
      font-size: 22px;
      color: $text-secondary;
    }
  }
}

// 控制面板样式
.control-panel {
  width: 100%;
  background: $panel-bg;
  border-radius: 16px;
  padding: 24px;
  box-shadow: $shadow-md;
  border: 1px solid $border-color;

  .panel-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 2px solid $border-color;
    color: $text-primary;
    font-size: 16px;
    font-weight: 600;

    .panel-icon {
      font-size: 20px;
      color: $primary-color;
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
    color: $text-primary;
    margin-bottom: 12px;
  }

  .ratio-select {
    width: 100%;
  }
}

// 控制按钮
.control-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;

  .expand-button {
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    background: $primary-color;
    border: none;
    box-shadow: $shadow-sm;
    transition: all 0.3s;

    &:hover:not(:disabled) {
      background: color.adjust($primary-color, $lightness: -6%);
      transform: translateY(-2px);
      box-shadow: $shadow-md;
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      background: #e2dcd6;
      color: #a39990;
      box-shadow: none;
    }
  }

  .reset-button {
    height: 44px;
    border-color: $border-color;
    color: $text-primary;

    &:hover:not(:disabled) {
      border-color: $primary-color;
      color: $primary-color;
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
    :deep(.ant-spin-dot-item) {
      background-color: $primary-color;
    }
  }

  .loading-text {
    text-align: center;

    .loading-title {
      font-size: 16px;
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
    max-width: 240px;
    height: 4px;
    background: #e2dcd6;
    border-radius: 2px;
    overflow: hidden;

    .progress-bar {
      height: 100%;
      width: 50%;
      background: $primary-color;
      border-radius: 2px;
      animation: indeterminate 1.5s infinite ease-in-out;
    }
  }
}

@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
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

  /* 修复 darken() 警告的地方 */
  :deep(.ant-btn-primary) {
    background: $primary-color;
    border-color: $primary-color;

    &:hover {
      background: color.adjust($primary-color, $lightness: -8%);
      border-color: color.adjust($primary-color, $lightness: -8%);
    }
  }
}

// ==================== 结果图片动画 ====================
.result-image {
  animation: resultFadeIn 0.6s ease-out;
}

@keyframes resultFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
      font-size: 20px;
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
}
</style>

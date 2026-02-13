<template>
  <!-- 1. 移除最外层的 ConfigProvider，防止样式泄露到 Layout -->
  <!-- 添加 ref="containerRef" 用于锁定动画作用域 -->
  <div class="page-container" ref="containerRef">

    <!-- 背景装饰 (保持原样) -->
    <div class="bg-shape shape-1" ref="shape1"></div>
    <div class="bg-shape shape-2" ref="shape2"></div>

    <!-- 2. 将 ConfigProvider 移到这里，只控制卡片内部的组件颜色 -->
    <a-config-provider
      :theme="{
        token: {
          colorPrimary: '#0d9488', // 仅影响此表单内的 Antd 组件
          borderRadius: 8,
        },
      }"
    >
      <div class="content-wrapper" ref="cardRef">
        <!-- 头部引导区 -->
        <div class="header-section">
          <div class="icon-box" ref="iconRef">
            <cloud-server-outlined />
          </div>
          <h1 class="page-title">创建私人空间</h1>
          <p class="page-subtitle">为您的美好回忆安个家，开始您的云端创作之旅。</p>
        </div>

        <!-- 表单区域 -->
        <a-form
          :model="formState"
          layout="vertical"
          @finish="handleCreate"
          class="custom-form"
        >
          <a-form-item
            name="spaceName"
            :rules="[{ required: true, message: '请输入空间名称' }]"
          >
            <template #label>
              <span class="form-label">空间名称</span>
            </template>
            <a-input
              v-model:value="formState.spaceName"
              placeholder="例如：我的2026摄影集 / 灵感素材库"
              size="large"
              class="custom-input"
              :maxlength="20"
              show-count
              allow-clear
            >
              <template #prefix>
                <folder-open-outlined style="color: #999" />
              </template>
            </a-input>
          </a-form-item>

          <!-- 提交按钮 -->
          <div class="actions">
            <a-button
              type="primary"
              html-type="submit"
              size="large"
              :loading="loading"
              class="submit-btn"
              block
              @mouseenter="btnHoverEnter"
              @mouseleave="btnHoverLeave"
            >
              立即创建
            </a-button>
          </div>
        </a-form>
      </div>
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted, onUnmounted } from 'vue';
import { message } from 'ant-design-vue';
import { CloudServerOutlined, FolderOpenOutlined } from '@ant-design/icons-vue';
import gsap from 'gsap';
import { addSpaceUsingPost } from '@/api/spaceController'
import router from '@/router'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'

// --- 数据状态 ---
const loading = ref(false);
const formState = reactive({
  spaceName: '',
});

// --- 引用定义 ---
const containerRef = ref(null); // 新增：整个页面的容器引用
const cardRef = ref(null);
const iconRef = ref(null);
const shape1 = ref(null);
const shape2 = ref(null);

// GSAP 上下文实例
let ctx: gsap.Context;

// --- 生命周期与动画 ---
onMounted(() => {
  // 使用 gsap.context 锁定作用域
  // 这里的 selector 只会查找 containerRef 内部的元素，绝不会影响全局 Header
  ctx = gsap.context(() => {
    initAnimations();
  }, containerRef.value);
});

onUnmounted(() => {
  // 组件销毁时清理动画，防止内存泄漏或样式残留
  ctx?.revert();
});

const initAnimations = () => {
  const tl = gsap.timeline();

  // 1. 背景漂浮
  gsap.to(shape1.value, {
    x: 50,
    y: 80,
    duration: 8,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
  gsap.to(shape2.value, {
    x: -30,
    y: 40,
    duration: 10,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    delay: 1,
  });

  // 2. 卡片入场
  tl.from(cardRef.value, {
    y: 60,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
  })
    // 3. 图标弹跳
    .from(iconRef.value, {
      scale: 0,
      rotation: -45,
      duration: 0.6,
      ease: 'back.out(1.7)',
    }, '-=0.5')
    // 4. 文字和表单顺序淡入
    // 注意：修改了类名为 page-title 避免与全局冲突，且有了 context 保护
    .from('.page-title, .page-subtitle, .custom-form', {
      y: 20,
      opacity: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: 'power2.out',
    }, '-=0.4');
};

// --- 按钮微交互 ---
const btnHoverEnter = (e: MouseEvent) => {
  gsap.to(e.target, { scale: 1.02, duration: 0.2, ease: 'power1.out' });
};

const btnHoverLeave = (e: MouseEvent) => {
  gsap.to(e.target, { scale: 1, duration: 0.2, ease: 'power1.out' });
};

// --- 业务逻辑 (保持原样) ---
const handleCreate = async (values: any) => {
  loading.value = true;
  const params = {spaceName: formState.spaceName, spaceLevel: 0}
  // 模拟请求延迟效果，让动画稍微展示一会（可选）
  try {
    const res = await addSpaceUsingPost(params)
    if (res.data.code === 0 && res.data.data){
      await useSpaceVoStore().fetchSpaceVo()
      message.success('空间创建成功,快去空间上传你的灵感吧~')
      router.replace('/space') // 建议跳转到 /space 列表页或详情页
    } else {
      message.error(res.data.message || '空间创建失败,请稍后再试~')
    }
  } catch (e: any) {
    message.error('网络异常，请重试')
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 页面容器 */
.page-container {
  position: relative;
  /* 确保占满父容器（右侧内容区），而不是 100vh 强行撑开导致滚动条 */
  height: 100%;
  min-height: 80vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 移除背景色设置，避免覆盖 BasicLayout 的背景 */
  /* 如果需要特定背景，建议使用透明度或确保不影响全局 */
  background: transparent;
  overflow: hidden;
}

/* 背景装饰球 */
.bg-shape {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.6;
}

.shape-1 {
  width: 400px;
  height: 400px;
  background: #ccfbf1;
  top: -10%;
  left: -5%;
}

.shape-2 {
  width: 300px;
  height: 300px;
  background: #ffe4e6;
  bottom: 10%;
  right: -5%;
}

/* 内容卡片 */
.content-wrapper {
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  width: 100%;
  max-width: 480px;
  padding: 48px;
  border-radius: 24px;
  box-shadow:
    0 20px 40px rgba(13, 148, 136, 0.08),
    0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

/* 头部样式 - 类名修改以防冲突 */
.header-section {
  text-align: center;
  margin-bottom: 40px;
}

.icon-box {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #0d9488 0%, #2dd4bf 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  font-size: 32px;
  color: white;
  box-shadow: 0 10px 20px rgba(13, 148, 136, 0.3);
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #111827;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.page-subtitle {
  color: #6b7280;
  font-size: 14px;
  line-height: 1.6;
}

/* 表单微调 */
.form-label {
  font-size: 15px;
  font-weight: 600;
  color: #374151;
}

:deep(.custom-input .ant-input) {
  background: transparent;
}

:deep(.custom-input) {
  border-radius: 12px;
  padding: 8px 11px;
  background-color: #f9fafb;
  border-color: #e5e7eb;
  transition: all 0.3s ease;
}

:deep(.custom-input:hover),
:deep(.custom-input:focus-within) {
  background-color: #fff;
  border-color: #0d9488;
  box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1);
}

/* 按钮样式 */
.submit-btn {
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  background: linear-gradient(90deg, #0f766e 0%, #0d9488 100%);
  border: none;
  box-shadow: 0 4px 12px rgba(13, 148, 136, 0.3);
  margin-top: 16px;
}

.submit-btn:hover {
  filter: brightness(110%);
  box-shadow: 0 6px 16px rgba(13, 148, 136, 0.4);
}
</style>

<template>
  <div class="page-container" ref="containerRef">
    <!-- 背景装饰 -->
    <div class="bg-shape shape-1" ref="shape1"></div>
    <div class="bg-shape shape-2" ref="shape2"></div>

    <a-config-provider
      :theme="{
        token: {
          colorPrimary: '#0d9488',
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
          <h1 class="page-title">创建团队空间</h1>
          <p class="page-subtitle">为您的团队的美好回忆安个家，开始您的云端创作之旅。</p>
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

          <a-form-item
            name="spaceLevel"
            :rules="[
              { required: true, message: '请选择空间等级' },
              { validator: validateLevel }
            ]"
          >
            <template #label>
              <span class="form-label">空间等级</span>
            </template>
            <a-select
              v-model:value="formState.spaceLevel"
              placeholder="请选择空间等级"
              size="large"
              class="custom-input"
              allow-clear
            >
              <a-select-option :value="-1">请选择</a-select-option>
              <a-select-option :value="0">普通版</a-select-option>
              <a-select-option :value="1">专业版</a-select-option>
              <a-select-option :value="2">旗舰版</a-select-option>
            </a-select>
          </a-form-item>

          <!-- 空间等级说明 -->
          <div class="level-desc">
            <div class="desc-title">空间等级说明</div>
            <div class="desc-item"><strong>普通版：</strong>大小100.00MB，图片数量100</div>
            <div class="desc-item"><strong>专业版：</strong>大小1000.00MB，图片数量1000</div>
            <div class="desc-item"><strong>旗舰版：</strong>大小10000.00MB，图片数量10000</div>
          </div>

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
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';
import { CloudServerOutlined, FolderOpenOutlined } from '@ant-design/icons-vue';
import gsap from 'gsap';
import { addSpaceUsingPost } from '@/api/spaceController';
import { useSpaceVoStore } from '@/stores/useSpaceVoStore';

const router = useRouter();

// --- 数据状态 ---
const loading = ref(false);
const formState = reactive({
  spaceName: '',
  spaceLevel: -1,
});

// --- 表单校验 ---
const validateLevel = async (_rule: any, value: number) => {
  if (value === -1) {
    return Promise.reject('请选择有效的空间等级');
  }
  return Promise.resolve();
};

// --- 引用定义 ---
const containerRef = ref<HTMLElement | null>(null);
const cardRef = ref<HTMLElement | null>(null);
const iconRef = ref<HTMLElement | null>(null);
const shape1 = ref<HTMLElement | null>(null);
const shape2 = ref<HTMLElement | null>(null);

let ctx: gsap.Context;

// --- 生命周期与动画 ---
onMounted(() => {
  if (containerRef.value) {
    ctx = gsap.context(() => {
      initAnimations();
    }, containerRef.value);
  }
});

onUnmounted(() => {
  ctx?.revert();
});

const initAnimations = () => {
  const tl = gsap.timeline();

  if (shape1.value && shape2.value) {
    gsap.to(shape1.value, {
      x: 50, y: 80, duration: 8, repeat: -1, yoyo: true, ease: 'sine.inOut',
    });
    gsap.to(shape2.value, {
      x: -30, y: 40, duration: 10, repeat: -1, yoyo: true, ease: 'sine.inOut', delay: 1,
    });
  }

  if (cardRef.value && iconRef.value) {
    tl.from(cardRef.value, {
      y: 60, opacity: 0, duration: 1, ease: 'power3.out',
    })
      .from(iconRef.value, {
        scale: 0, rotation: -45, duration: 0.6, ease: 'back.out(1.7)',
      }, '-=0.5')
      // 增加 .level-desc，让说明文字也参与动画
      .from('.page-title, .page-subtitle, .custom-form, .level-desc', {
        y: 20, opacity: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
      }, '-=0.4');
  }
};

// --- 按钮微交互 ---
const btnHoverEnter = (e: MouseEvent) => {
  if (e.target) gsap.to(e.target, { scale: 1.02, duration: 0.2, ease: 'power1.out' });
};

const btnHoverLeave = (e: MouseEvent) => {
  if (e.target) gsap.to(e.target, { scale: 1, duration: 0.2, ease: 'power1.out' });
};

// --- 业务逻辑 ---
const handleCreate = async (values: any) => {
  loading.value = true;
  const params = { ...values, spaceType: 1 };

  try {
    const res = await addSpaceUsingPost(params);
    if (res.data.code === 0 && res.data.data) {
      await useSpaceVoStore().fetchSpaceVo();
      message.success('团队空间创建成功,快去团队空间上传你的灵感吧~');
      router.replace('/teamSpace');
    } else {
      message.error(res.data.message || '团队空间创建失败,请稍后再试~');
    }
  } catch (e: any) {
    message.error('网络异常，请重试');
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
/* 页面容器 */
.page-container {
  position: relative;
  height: 100%;
  min-height: 80vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
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
  padding: 40px 48px;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(13, 148, 136, 0.08), 0 1px 2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

/* 头部样式 */
.header-section {
  text-align: center;
  margin-bottom: 32px;
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
  background-color: #f9fafb;
  border-color: #e5e7eb;
  transition: all 0.3s ease;
}

:deep(.custom-input:hover),
:deep(.custom-input:focus-within),
:deep(.ant-select:not(.ant-select-disabled):hover .ant-select-selector) {
  background-color: #fff;
  border-color: #0d9488 !important;
}
:deep(.ant-select-focused:not(.ant-select-disabled).ant-select:not(.ant-select-customize-input) .ant-select-selector) {
  box-shadow: 0 0 0 4px rgba(13, 148, 136, 0.1) !important;
}
:deep(.ant-select-selector) {
  border-radius: 12px !important;
  background-color: transparent !important;
  border: none !important;
}

/* ================== 空间等级说明 ================== */
.level-desc {
  background-color: #ffffff;
  color: #000000;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
}

.desc-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 8px;
}

.desc-item {
  font-size: 13px;
  line-height: 1.8;
}

.desc-item strong {
  font-weight: 700;
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
}

.submit-btn:hover {
  filter: brightness(110%);
  box-shadow: 0 6px 16px rgba(13, 148, 136, 0.4);
}
</style>

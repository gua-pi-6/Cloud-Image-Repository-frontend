<template>
  <div class="gallery-space-container" ref="containerRef">
    <!-- 1. 噪点与背景 -->
    <div class="noise-overlay"></div>
    <div class="ambient-light">
      <div class="orb orb-warm"></div>
      <div class="orb orb-cool"></div>
      <div class="orb orb-bright"></div>
    </div>

    <div class="content-wrapper">
      <a-card class="glass-card" :bordered="false">
        <div class="card-inner">

          <!-- 2. 图标插画区域 -->
          <div class="visual-section">
            <div class="icon-container">
              <div class="icon-glow"></div>
              <svg class="custom-illustration" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <!-- (SVG 内容保持不变) -->
                <defs>
                  <linearGradient id="warmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style="stop-color:#FF9A8B;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#FF6A88;stop-opacity:1" />
                  </linearGradient>
                  <linearGradient id="coolGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style="stop-color:#89f7fe;stop-opacity:1" />
                    <stop offset="100%" style="stop-color:#66a6ff;stop-opacity:1" />
                  </linearGradient>
                </defs>
                <path class="floating-shape" d="M45,100 C45,70 70,45 100,45 C130,45 155,70 155,100 C155,130 130,155 100,155 C70,155 45,130 45,100 Z" fill="url(#coolGradient)" opacity="0.1"/>
                <path class="main-cloud" d="M140,110 Q165,110 165,130 Q165,150 145,150 L65,150 Q45,150 45,130 Q45,110 65,110 Q65,90 85,90 Q85,75 105,75 Q125,75 130,95 Q145,95 140,110 Z" fill="url(#coolGradient)"/>
                <g transform="rotate(-8 100 100) translate(0, -10)">
                  <rect x="75" y="85" width="50" height="40" rx="6" fill="#FFFFFF" class="photo-card-bg"/>
                  <rect x="80" y="90" width="40" height="25" rx="3" fill="#FFF1EB"/>
                  <circle cx="90" cy="100" r="4" fill="#FF9A8B"/>
                </g>
                <circle cx="160" cy="60" r="8" fill="#FFD166" class="sun-dot"/>
                <circle cx="40" cy="140" r="5" fill="#4ECDC4" opacity="0.6"/>
              </svg>
              <div class="add-btn-badge">
                <PlusOutlined />
              </div>
            </div>
          </div>

          <!-- 3. 文本区域 -->
          <div class="text-section">
            <h2 class="title text-anim">开启您的云端画廊</h2>
            <p class="subtitle text-anim">每一张照片，都是时光的标本</p>
            <p class="description text-anim">
              创建一个专属的静谧空间，让我们为您珍藏那些闪闪发光的瞬间。
              <br>安全、私密，且触手可及。
            </p>

            <!-- 修复：直接在模板中使用图标，移除 h() 函数造成的渲染隐患 -->
            <div class="features-row">
              <div class="feature-capsule">
                <SafetyCertificateOutlined :style="{ color: '#10B981', marginRight: '6px' }" />
                银行级加密
              </div>
              <div class="feature-capsule">
                <CloudSyncOutlined :style="{ color: '#3B82F6', marginRight: '6px' }" />
                极速同步
              </div>
              <div class="feature-capsule">
                <HeartFilled :style="{ color: '#F43F5E', marginRight: '6px' }" />
                永久珍藏
              </div>
            </div>
          </div>

          <!-- 4. 按钮区域 -->
          <div class="action-section">
            <a-button type="primary" class="main-btn btn-anim" @click="handleCreateSpace">
              <span>立即创建空间</span>
              <ArrowRightOutlined class="btn-icon"/>
            </a-button>

            <a-button type="text" class="secondary-btn btn-anim" @click="handleLearnMore">
              了解更多权益
            </a-button>
          </div>

          <!-- 5. 底部提示 -->
          <div class="micro-tip">
            <InfoCircleOutlined />
            <span>新用户赠送 <strong>100MB</strong> 免费高速空间</span>
          </div>

        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  PlusOutlined,
  ArrowRightOutlined,
  InfoCircleOutlined,
  CloudSyncOutlined,
  SafetyCertificateOutlined,
  HeartFilled
} from '@ant-design/icons-vue'
// 修复：移除 .ts 后缀，避免部分构建工具报错
import router from '@/router'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'
import gsap from 'gsap'
import { message } from 'ant-design-vue'

const emit = defineEmits(['create-space', 'learn-more'])
const loginUser = computed(() => useLoginUserStore().loginUser)


const handleCreateSpace = async () => {
  // 简单的点击反馈
  gsap.to('.main-btn', { scale: 0.95, duration: 0.1, yoyo: true, repeat: 1 })
  if (loginUser.value?.id) {
    router.replace(`/creation/space`)
  }else {
    message.info('请先登录')
    router.replace(`/user/login`)
  }
}

const handleLearnMore = () => {
  emit('learn-more')
}

// GSAP 动画控制
const containerRef = ref(null)
let ctx: gsap.Context

onMounted(() => {
  ctx = gsap.context(() => {
    const tl = gsap.timeline()

    // 修复：使用 fromTo 确保状态可控，并添加 clearProps 防止样式残留

    // 1. 卡片入场
    tl.fromTo('.glass-card',
      { y: 50, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out' }
    )

      // 2. 视觉元素弹跳
      .fromTo('.visual-section',
        { scale: 0.8, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.8, ease: 'back.out(1.7)' },
        '-=0.6'
      )

      // 3. 文字上浮
      .fromTo('.text-anim',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        '-=0.4'
      )

      // 4. 特性胶囊 (修复了选择器可能选不到的问题)
      .fromTo('.feature-capsule',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'back.out(1.2)' },
        '-=0.2'
      )

      // 5. 按钮组
      .fromTo('.btn-anim',
        { y: 15, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: 'power2.out', clearProps: 'all' },
        '-=0.3'
      )

      // 6. 底部提示
      .fromTo('.micro-tip',
        { opacity: 0 },
        { opacity: 1, duration: 0.8 },
        '-=0.2'
      )

  }, containerRef.value)
})

onUnmounted(() => {
  ctx?.revert()
})
</script>

<style scoped>
/*
  样式保持不变，但增加一个保障：
  确保 .feature-capsule 和 .btn-anim 在 CSS 层面是 block/flex 布局，
  防止因为 display: none 导致的计算错误。
*/
.gallery-space-container {
  --bg-warm: #FFF1EB;
  --bg-cool: #ACE0F9;
  --glass-bg: rgba(255, 255, 255, 0.65);
  --glass-border: rgba(255, 255, 255, 0.8);
  --text-primary: #2C3E50;
  --text-secondary: #5D6D7E;
  --accent-primary: #FF7E5F;
  --accent-secondary: #FEB47B;

  position: relative;
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(120deg, #fdfbfb 0%, #ebedee 100%);
  overflow: hidden;
  padding: 20px;
}

.noise-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
}

.ambient-light {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
  overflow: hidden;
}

.orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  animation: floatOrb 20s infinite alternate cubic-bezier(0.45, 0.05, 0.55, 0.95);
}

.orb-warm {
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(255, 226, 159, 0.6) 0%, rgba(255, 169, 159, 0) 70%);
  top: -100px;
  left: -100px;
}

.orb-cool {
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(199, 233, 255, 0.5) 0%, rgba(172, 224, 249, 0) 70%);
  bottom: -150px;
  right: -100px;
}

.orb-bright {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 70%);
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulseOrb 8s infinite;
}

.content-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 480px;
}

.glass-card {
  background: var(--glass-bg) !important;
  backdrop-filter: blur(24px) saturate(120%);
  -webkit-backdrop-filter: blur(24px) saturate(120%);
  border: 1px solid var(--glass-border) !important;
  border-radius: 40px !important;
  box-shadow: 0 20px 50px -10px rgba(0, 0, 0, 0.05), 0 10px 20px -10px rgba(0, 0, 0, 0.02), inset 0 0 0 1px rgba(255, 255, 255, 0.5);
  overflow: hidden;
}

:deep(.ant-card-body) {
  padding: 0 !important;
}

.card-inner {
  padding: 48px 36px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.visual-section {
  position: relative;
  margin-bottom: 32px;
}

.icon-container {
  width: 160px;
  height: 160px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-glow {
  position: absolute;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle, rgba(162, 217, 255, 0.3) 0%, rgba(255, 255, 255, 0) 70%);
  filter: blur(20px);
  z-index: 0;
}

.custom-illustration {
  width: 100%;
  height: 100%;
  position: relative;
  z-index: 1;
  filter: drop-shadow(0 15px 25px rgba(100, 150, 200, 0.15));
  animation: floatMain 6s ease-in-out infinite;
}

.add-btn-badge {
  position: absolute;
  bottom: 10px;
  right: 10px;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  box-shadow: 0 8px 20px rgba(255, 126, 95, 0.35);
  border: 4px solid rgba(255, 255, 255, 0.9);
  z-index: 2;
  transition: transform 0.3s;
}

.icon-container:hover .add-btn-badge {
  transform: scale(1.1) rotate(90deg);
}

.text-section {
  margin-bottom: 40px;
  width: 100%;
}

.title {
  font-size: 28px;
  font-weight: 800;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, #2C3E50 0%, #4CA1AF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 16px;
  font-weight: 600;
  color: #7F8C8D;
  margin-bottom: 16px;
}

.description {
  font-size: 15px;
  color: #95A5A6;
  line-height: 1.6;
  margin-bottom: 24px;
}

.features-row {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.feature-capsule {
  font-size: 13px;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.5);
  padding: 8px 16px;
  border-radius: 100px;
  border: 1px solid rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  font-weight: 500;
  transition: all 0.3s ease;
}

.feature-capsule:hover {
  background: #fff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
}

.action-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.main-btn {
  height: 56px;
  border-radius: 28px;
  border: none;
  background: linear-gradient(135deg, var(--accent-primary) 0%, var(--accent-secondary) 100%);
  font-size: 18px;
  font-weight: 600;
  box-shadow: 0 10px 25px rgba(255, 126, 95, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  color: white; /* 确保文字颜色 */
}

.main-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 15px 35px rgba(255, 126, 95, 0.35);
}

.btn-icon {
  font-size: 16px;
  transition: transform 0.3s;
}

.main-btn:hover .btn-icon {
  transform: translateX(4px);
}

.secondary-btn {
  color: var(--text-secondary);
  font-size: 15px;
}

.secondary-btn:hover {
  color: var(--accent-primary);
  background: transparent;
}

.micro-tip {
  margin-top: 24px;
  font-size: 13px;
  color: #9CA3AF;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 12px;
}

.micro-tip strong {
  color: var(--text-primary);
  font-weight: 600;
}

@keyframes floatOrb {
  0% { transform: translate(0, 0); }
  100% { transform: translate(40px, 40px); }
}

@keyframes pulseOrb {
  0%, 100% { opacity: 0.8; transform: translate(-50%, -50%) scale(1); }
  50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.1); }
}

@keyframes floatMain {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

@media (max-width: 576px) {
  .glass-card {
    border-radius: 32px !important;
  }
  .card-inner {
    padding: 32px 24px;
  }
  .title {
    font-size: 24px;
  }
}
</style>

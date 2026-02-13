<template>
  <div id="basicLayout">
    <!-- 核心修复：添加全局 ConfigProvider，锁定基准颜色为默认蓝 -->
    <a-config-provider
      :theme="{
        token: {
          colorPrimary: '#1677ff', // 显式声明全局主色 (Ant Design 默认蓝)
        },
      }"
    >
      <a-layout class="main-wrapper">
        <!-- 1. 顶部导航 -->
        <a-layout-header class="header">
          <GlobalHeader />
        </a-layout-header>

        <!-- 2. 中间主体区域 -->
        <a-layout class="content-wrapper">
          <!-- 左侧侧边栏 -->
          <a-layout-sider
            width="240"
            class="sider"
            theme="light"
            :trigger="null"
          >
            <div class="sider-content">
              <a-menu
                v-model:selectedKeys="selectedKeys"
                mode="inline"
                class="custom-menu"
                @click="handleMenuClick"
              >
                <a-menu-item key="/" class="side-menu-item">
                  <template #icon>
                    <picture-outlined />
                  </template>
                  <span>公共图库</span>
                </a-menu-item>
                <a-menu-item key="/space" class="side-menu-item">
                  <template #icon>
                    <user-outlined />
                  </template>
                  <span>我的空间</span>
                </a-menu-item>
              </a-menu>
            </div>
          </a-layout-sider>

          <!-- 右侧内容区域 (这里面的组件如果自己有 ConfigProvider，会形成嵌套隔离) -->
          <a-layout-content class="content">
            <RouterView />
          </a-layout-content>
        </a-layout>

        <!-- 3. 底部 Footer -->
        <a-layout-footer class="footer">
          <a href="https://www.codefather.cn" target="_blank">
            编程导航 by 程序员鱼皮
          </a>
        </a-layout-footer>
      </a-layout>
    </a-config-provider>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import GlobalHeader from '@/components/layout/GlobalHeader.vue';
import { PictureOutlined, UserOutlined } from '@ant-design/icons-vue';
import gsap from 'gsap';

// --- 路由逻辑 ---
const router = useRouter();
const route = useRoute();

const selectedKeys = ref<string[]>([]);

const updateSelectedKeys = () => {
  const path = route.path;
  if (path.startsWith('/space')) {
    selectedKeys.value = ['/space'];
  } else {
    selectedKeys.value = ['/'];
  }
};

watch(() => route.path, updateSelectedKeys, { immediate: true });

const handleMenuClick = ({ key }: { key: string }) => {
  router.push(key);
};

// --- GSAP 动画 ---
onMounted(() => {
  gsap.from('.side-menu-item', {
    x: -30,
    opacity: 0,
    duration: 0.5,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 0.2
  });
});
</script>

<style scoped>
/* 保持你原有的样式不变 */
#basicLayout {
  min-height: 100vh;
  background: #f9fafb;
}

.main-wrapper {
  background: transparent;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

#basicLayout .header {
  padding-inline: 32px;
  background: white;
  color: unset;
  border-bottom: 1px solid #f0f0f0;
  z-index: 10;
}

.content-wrapper {
  flex: 1;
  background: transparent;
  width: 100%;
  padding-top: 24px;
}

.sider {
  background: transparent !important;
  padding-left: 32px;
}

.sider-content {
  background: white;
  border-radius: 12px;
  padding: 16px 0;
  height: calc(100vh - 180px);
  position: sticky;
  top: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

:deep(.custom-menu) {
  border-right: none !important;
}

:deep(.ant-menu-item-selected) {
  background-color: #f0fdfa !important;
  color: #0d9488 !important;
  font-weight: 600;
}

:deep(.ant-menu-item-selected)::after {
  border-right: 3px solid #0d9488 !important;
}

:deep(.ant-menu-item:hover) {
  color: #0d9488 !important;
}

:deep(.ant-menu-item .anticon) {
  font-size: 16px;
}

#basicLayout .content {
  margin: 0 32px 80px 32px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  min-height: 400px;
}

#basicLayout .footer {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  padding: 16px;
  position: fixed;
  z-index: 1000;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}
</style>

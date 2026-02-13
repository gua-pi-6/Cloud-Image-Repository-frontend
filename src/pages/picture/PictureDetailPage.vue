<template>
  <div class="detail-page">
    <div class="page-header">
      <a-button type="text" @click="goBack" class="back-btn">
        <template #icon><arrow-left-outlined /></template>
        返回列表
      </a-button>
      <span class="header-title">图片详情</span>
    </div>

    <div class="main-container" v-if="picture">
      <a-row :gutter="[24, 24]">

        <!-- 左侧：图片预览区 (保持不变) -->
        <a-col :xs="24" :lg="16" :xl="17">
          <div class="image-wrapper">
            <div class="canvas-board">
              <a-image :src="picture.url" :alt="picture.name" class="main-image" placeholder />
            </div>
          </div>
        </a-col>

        <!-- 右侧：信息与操作区 -->
        <a-col :xs="24" :lg="8" :xl="7">
          <a-card class="info-card" :bordered="false">

            <div class="info-header">
              <h1 class="pic-title">{{ picture.name }}</h1>
              <div class="author-row">
                <a-avatar size="small" style="background-color: #87d068">
                  <template #icon><user-outlined /></template>
                </a-avatar>
                <span class="author-name">{{ picture.user?.userName || '匿名用户'}}</span>
<!--                <span class="upload-date">{{ picture.date }}</span>-->
              </div>
            </div>

            <!-- ============ 新增：作品简介模块 ============ -->
            <div class="desc-section">
              <h3 class="section-title">作品简介</h3>
              <div class="desc-content-box" @click="openDrawer">
                <p class="desc-text-truncate">{{ picture.introduction }}</p>
                <span class="expand-hint">展开全部 <down-outlined /></span>
              </div>
            </div>
            <!-- ========================================== -->

            <a-divider style="margin: 16px 0" />

            <!-- 按钮组 (保持不变) -->
            <div class="action-group">
              <a-button type="primary" block size="large" @click="handleDownload">
                <template #icon><download-outlined /></template>
                免费下载
              </a-button>
              <div class="secondary-actions">
                <a-button v-if="mustRole(loginUser.userRole)" class="half-btn" @click="handleEdit">
                  <template #icon><edit-outlined /></template>
                  编辑
                </a-button>
                <a-button v-if="mustRole(loginUser.userRole)" danger class="half-btn" @click="handleDelete">
                  <template #icon><delete-outlined /></template>
                  删除
                </a-button>
              </div>
            </div>

            <a-divider style="margin: 24px 0" />

            <!-- 图片属性 (保持不变) -->
            <div class="properties-section">
              <h3 class="section-title">图片属性</h3>
              <a-descriptions :column="1" size="small" bordered>
                <a-descriptions-item label="文件格式"><a-tag color="blue">{{ picture.picFormat }}</a-tag></a-descriptions-item>
                <a-descriptions-item label="分辨率">{{ picture.picWidth }} x {{ picture.picHeight }} px</a-descriptions-item>
                <a-descriptions-item label="比例">
                  {{picture.picScale}}
                </a-descriptions-item>
                <a-descriptions-item label="文件大小">{{ showPictureSize(picture.picSize) }}</a-descriptions-item>
              </a-descriptions>
            </div>

            <div class="tags-section">
              <span class="tag-icon"><tag-outlined /></span>
              <div class="tags-list">
                <a-tag v-for="tag in picture.tags" :key="tag" color="purple">{{ tag }}</a-tag>
              </div>
            </div>

          </a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 加载中 -->
    <div v-else class="loading-state">
      <a-spin size="large" tip="加载详情中..." />
    </div>

    <!-- ============ 新增：详情页底部弹框 ============ -->
    <a-drawer
      title="作品完整简介"
      placement="bottom"
      :height="400"
      :open="drawerVisible"
      @close="drawerVisible = false"
    >
      <div v-if="picture" class="drawer-detail-content">
        <h3>{{ picture.name }}</h3>
        <p class="full-desc">{{ picture.introduction }}</p>
      </div>
    </a-drawer>
    <!-- =========================================== -->

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router';
import {
  ArrowLeftOutlined, UserOutlined, DownloadOutlined,
  EditOutlined, DeleteOutlined, TagOutlined, DownOutlined
} from '@ant-design/icons-vue';
import { message, Modal } from 'ant-design-vue';
import { deletePictureUsingPost, getPictureVoByIdUsingGet } from '@/api/pictureController.js'
import { saveAs } from 'file-saver'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { showPictureSize } from '@/utils/index.ts'
const route = useRoute();
const router = useRouter();
const drawerVisible = ref(false); // 控制弹框
const picture = ref<API.PictureVO>({})
const loginUserStore = useLoginUserStore()
const loginUser = loginUserStore.loginUser

interface PictureId {
  id: string;
}

const prop = defineProps<PictureId>()

/**
 * 获取图片详情
 */
const fetchDetail = async () => {
  try {
    const params = { id: prop.id }
    const res = await getPictureVoByIdUsingGet(params)
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
    } else {
      message.error(res.data.message)
      router.push({
        path: '/',
        replace: true,
      })
    }
  } catch (e) {
    message.error(e.message)
  }
};

/**
 * 打开详情抽屉
 */
const openDrawer = () => {
  drawerVisible.value = true;
};

/**
 * 回退到上一页
 */
const goBack = () => { router.back(); };

/**
 * 下载图片
 */
const handleDownload = () => {
  saveAs(picture.value.url)
};

/**
 * 编辑图片
 */
const handleEdit = () => {
  router.push(`/creation/picture?id=${picture.value.id}`)
};

/**
 * 效验角色
 */
const mustRole = (role: string ='') => {
  return role === 'admin' || loginUser.id === picture.value.userId;
}
/**
 * 获取最小公约数
 */
// 1. 安全的 GCD 函数 (防止死循环核心)
const gcd = (a: number, b: number): number => {
  // 关键点：必须使用 Math.round 强制转为整数
  a = Math.round(a);
  b = Math.round(b);

  while (b !== 0) {
    const temp = b;
    b = a % b;
    a = temp;
  }
  return a;
};

/**
 * 删除图片
 */
const handleDelete = () => {
  Modal.confirm({
    title: '确认删除', content: '删除后无法恢复，确定要删除这张图片吗？',
    okText: '确认删除', okType: 'danger', cancelText: '取消',
    async onOk() {
      const res = await deletePictureUsingPost({id: prop.id})
      if(res.data.code === 0){
        message.success('图片删除成功')
        router.push({
          path: '/',
          replace: true,
        })
      }
    }
  });
};

onMounted(() => { fetchDetail(); });
</script>

<style scoped>
/* 原有样式保持不变... */
.detail-page { min-height: 100vh; background-color: #f5f7fa; padding-bottom: 40px; }
.page-header { height: 64px; background: #fff; display: flex; align-items: center; padding: 0 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05); margin-bottom: 24px; }
.back-btn { color: #666; font-size: 15px; padding-left: 0; }
.header-title { margin-left: 16px; font-size: 16px; color: #333; font-weight: 500; border-left: 1px solid #eee; padding-left: 16px; }
.main-container { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
.image-wrapper { background: #fff; border-radius: 12px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); height: 100%; display: flex; justify-content: center; align-items: center; min-height: 500px; }
.canvas-board { width: 100%; height: 100%; border-radius: 8px; overflow: hidden; display: flex; justify-content: center; align-items: center; background-image: linear-gradient(45deg, #eee 25%, transparent 25%), linear-gradient(-45deg, #eee 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #eee 75%), linear-gradient(-45deg, transparent 75%, #eee 75%); background-size: 20px 20px; background-position: 0 0, 0 10px, 10px -10px, -10px 0px; }
.main-image :deep(.ant-image-img) { max-width: 100%; max-height: 80vh; object-fit: contain; display: block; box-shadow: 0 8px 24px rgba(0,0,0,0.15); }
.info-card { border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.03); height: 100%; }
.pic-title { font-size: 20px; font-weight: 600; color: #1f1f1f; margin-bottom: 12px; line-height: 1.4; }
.author-row { display: flex; align-items: center; color: #8c8c8c; font-size: 13px; margin-bottom: 16px; }
.author-name { margin: 0 12px 0 8px; color: #333; font-weight: 500; }
.action-group { display: flex; flex-direction: column; gap: 12px; }
.secondary-actions { display: flex; gap: 12px; }
.half-btn { flex: 1; }
.properties-section { margin-bottom: 24px; }
.section-title { font-size: 14px; font-weight: 600; margin-bottom: 12px; color: #333; }
:deep(.ant-descriptions-item-label) { width: 100px; color: #8c8c8c; }
:deep(.ant-descriptions-item-content) { font-weight: 500; color: #333; }
.tags-section { display: flex; align-items: flex-start; margin-top: 16px; }
.tag-icon { margin-right: 8px; color: #8c8c8c; margin-top: 4px; }
.tags-list { display: flex; flex-wrap: wrap; gap: 8px; }
.loading-state { display: flex; justify-content: center; align-items: center; height: 60vh; }

/* ============ 新增样式 ============ */
.desc-section {
  margin-top: 16px;
  background: #f9f9f9;
  padding: 12px;
  border-radius: 8px;
}

.desc-content-box {
  cursor: pointer;
  position: relative;
}

.desc-text-truncate {
  color: #555;
  font-size: 13px;
  line-height: 1.6;
  margin-bottom: 4px;

  /* 多行省略 */
  display: -webkit-box;
  -webkit-line-clamp: 3; /* 限制3行 */
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.expand-hint {
  font-size: 12px;
  color: #1890ff;
  display: block;
  text-align: right;
  margin-top: 4px;
}

.desc-content-box:hover .desc-text-truncate {
  color: #333;
}

/* 抽屉内样式 */
.drawer-detail-content h3 {
  margin-bottom: 16px;
  font-size: 18px;
  color: #222;
}
.full-desc {
  font-size: 15px;
  line-height: 1.8;
  color: #444;
  white-space: pre-wrap;
}
</style>

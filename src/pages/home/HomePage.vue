<template>
  <div class="home-page">
    <section class="hero">
      <div class="hero-light hero-light-left"></div>
      <div class="hero-light hero-light-right"></div>
      <div class="hero-dot-grid"></div>

      <div class="hero-content">
        <p class="hero-kicker">SMART CLOUD GALLERY</p>
        <h1 class="hero-title">海量图片灵感，等你一键发现</h1>
        <p class="hero-subtitle">
          智能云图库为你聚合高质量视觉素材。输入关键词，快速找到符合场景的图片内容。
        </p>
      </div>
    </section>

    <main class="content-wrapper">
      <section ref="galleryRef" class="gallery-header">
        <h2>首页推荐</h2>
        <p>智能云图库精选内容</p>
      </section>

      <section class="recommend-search">
        <a-input v-model:value="searchCondition.searchText" class="search-item keyword-input"
          placeholder="输入关键词，搜索图片名称或简介" allow-clear @pressEnter="handleSearch">
          <template #prefix>
            <SearchOutlined />
          </template>
        </a-input>

        <a-select v-model:value="searchCondition.category" class="search-item" placeholder="选择分类" allow-clear>
          <a-select-option value="">全部分类</a-select-option>
          <a-select-option v-for="category in categoryList" :key="category" :value="category">
            {{ category }}
          </a-select-option>
        </a-select>

        <a-select v-model:value="searchCondition.tags" class="search-item" placeholder="选择标签" mode="multiple"
          :maxTagCount="2" allow-clear>
          <a-select-option v-for="tag in tagList" :key="tag" :value="tag">
            {{ tag }}
          </a-select-option>
        </a-select>

        <a-button type="primary" class="action-btn" @click="handleSearch">搜索</a-button>
        <a-button class="action-btn reset-btn" @click="handleReset">重置</a-button>
      </section>

      <section class="gallery-panel">
        <a-spin :spinning="loading" tip="正在加载图片...">
          <div v-if="pictures.length" class="gallery-grid">
            <article v-for="picture in pictures" :key="picture.id" class="picture-card" @click="goToDetail(picture.id)">
              <div class="card-media">
                <img v-if="picture.thumbnailUrl || picture.url" :src="picture.thumbnailUrl || picture.url"
                  :alt="picture.name || 'picture'" loading="lazy" />
                <div v-else class="card-placeholder">
                  <PictureOutlined />
                  <span>暂无预览</span>
                </div>
                <div class="card-overlay">
                  <EyeOutlined />
                  <span>查看详情</span>
                </div>
              </div>

              <div class="card-content">
                <h3 :title="picture.name || '未命名作品'">{{ picture.name || '未命名作品' }}</h3>
                <p class="intro">{{ picture.introduction || '暂无简介，点击查看完整内容。' }}</p>
                <div class="meta-row">
                  <span class="category-chip">{{ picture.category || '未分类' }}</span>
                  <a-tooltip v-if="picture.tags?.length" placement="top" overlayClassName="all-tags-tooltip">
                    <template #title>
                      <div class="tooltip-tag-wrap">
                        <span v-for="tag in picture.tags" :key="tag" class="tooltip-tag-chip">
                          #{{ tag }}
                        </span>
                      </div>
                    </template>
                    <div class="tag-list">
                      <span v-for="tag in picture.tags.slice(0, 2)" :key="tag" class="tag-chip">
                        #{{ tag }}
                      </span>
                      <span v-if="picture.tags.length > 2" class="tag-chip">
                        +{{ picture.tags.length - 2 }}
                      </span>
                    </div>
                  </a-tooltip>
                </div>
                <div class="author-line">{{ picture.user?.userName || '匿名作者' }}</div>
              </div>
            </article>
          </div>

          <a-empty v-else class="empty-state" description="暂无内容，试试调整关键词、分类或标签" />
        </a-spin>

        <div class="pagination-wrap">
          <a-pagination :current="pagination.current" :total="pagination.total" :pageSize="pagination.pageSize"
            :showSizeChanger="false" :showQuickJumper="true" @change="handlePageChange" />
        </div>
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { EyeOutlined, PictureOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { listPictureTagCategoryUsingGet, listPictureVoByPageUsingPost } from '../../api/pictureController'

const router = useRouter()
const galleryRef = ref<HTMLElement>()
const loading = ref(false)
const pictures = ref<API.PictureVO[]>([])
const categoryList = ref<string[]>([])
const tagList = ref<string[]>([])

const pagination = reactive({
  current: 1,
  pageSize: 12,
  total: 0,
})

const searchCondition = reactive<API.PictureQueryRequest>({
  current: pagination.current,
  pageSize: pagination.pageSize,
  searchText: '',
  category: '',
  tags: [],
  spaceId: 0,
})

const buildRequest = (): API.PictureQueryRequest => ({
  ...searchCondition,
  current: pagination.current,
  pageSize: pagination.pageSize,
  category: searchCondition.category || '',
  tags: searchCondition.tags ?? [],
})

const fetchPictures = async () => {
  loading.value = true
  try {
    const res = await listPictureVoByPageUsingPost(buildRequest())
    if (res.data.code === 0 && res.data.data) {
      pictures.value = res.data.data.records ?? []
      pagination.total = res.data.data.total ?? 0
    } else {
      pictures.value = []
      pagination.total = 0
    }
  } finally {
    loading.value = false
  }
}

const fetchCategoryAndTag = async () => {
  const res = await listPictureTagCategoryUsingGet()
  if (res.data.code === 0 && res.data.data) {
    categoryList.value = res.data.data.categoryList ?? []
    tagList.value = res.data.data.tagList ?? []
  } else {
    categoryList.value = []
    tagList.value = []
  }
}

const handleSearch = async () => {
  pagination.current = 1
  await fetchPictures()
}

const handleReset = async () => {
  searchCondition.searchText = ''
  searchCondition.category = ''
  searchCondition.tags = []
  pagination.current = 1
  await fetchPictures()
}

const handlePageChange = async (page: number) => {
  pagination.current = page
  await fetchPictures()
  galleryRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const goToDetail = (id?: number) => {
  if (!id) {
    return
  }
  router.push(`/picture/${id}`)
}

onMounted(async () => {
  await fetchCategoryAndTag()
  await fetchPictures()
})
</script>

<style scoped lang="scss">
.home-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 10% 0%, #ffffff 0%, #f3f8ff 42%, transparent 65%),
    radial-gradient(circle at 90% 20%, #e5f1ff 0%, transparent 40%),
    linear-gradient(180deg, #f9fcff 0%, #f2f7ff 55%, #edf4ff 100%);
  font-family: 'Poppins', 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #15314f;
}

.hero {
  position: relative;
  overflow: hidden;
  padding: 80px 20px 62px;
}

.hero-light {
  position: absolute;
  border-radius: 50%;
  filter: blur(16px);
  opacity: 0.75;
  pointer-events: none;
}

.hero-light-left {
  width: 240px;
  height: 240px;
  top: -110px;
  left: -70px;
  background: radial-gradient(circle, rgba(153, 203, 255, 0.9), rgba(153, 203, 255, 0));
}

.hero-light-right {
  width: 320px;
  height: 320px;
  top: -90px;
  right: -100px;
  background: radial-gradient(circle, rgba(121, 178, 255, 0.6), rgba(121, 178, 255, 0));
}

.hero-dot-grid {
  position: absolute;
  inset: 0;
  opacity: 0.35;
  background-image: radial-gradient(rgba(66, 133, 244, 0.24) 0.8px, transparent 0.8px);
  background-size: 18px 18px;
}

.hero-content {
  position: relative;
  z-index: 1;
  width: min(1080px, 100%);
  margin: 0 auto;
  padding: 44px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.8);
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.94), rgba(240, 248, 255, 0.88));
  box-shadow: 0 16px 42px rgba(53, 107, 185, 0.12);
  backdrop-filter: blur(8px);
}

.hero-kicker {
  margin: 0;
  color: #2b69a8;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2em;
}

.hero-title {
  margin: 16px 0 0;
  max-width: 700px;
  color: #12385e;
  font-size: clamp(30px, 5.4vw, 52px);
  line-height: 1.12;
  letter-spacing: 0.02em;
}

.hero-subtitle {
  margin: 16px 0 0;
  max-width: 650px;
  color: #446b91;
  font-size: clamp(14px, 2.2vw, 17px);
  line-height: 1.7;
}

.content-wrapper {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 0 20px 68px;
}

.gallery-header {
  margin-top: 6px;
  text-align: center;
}

.gallery-header h2 {
  margin: 0;
  color: #12385e;
  font-size: 30px;
  letter-spacing: 0.04em;
}

.gallery-header p {
  margin: 8px 0 0;
  color: #5982ab;
  font-size: 14px;
}

.recommend-search {
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(260px, 1.8fr) minmax(180px, 1fr) minmax(200px, 1.2fr) auto auto;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(188, 216, 248, 0.8);
  box-shadow: 0 8px 20px rgba(62, 117, 185, 0.08);
}

.search-item {
  width: 100%;
}

.keyword-input :deep(.ant-input-affix-wrapper) {
  border-radius: 10px;
}

.search-item :deep(.ant-select-selector) {
  border-radius: 10px !important;
}

.action-btn {
  height: 40px;
  border-radius: 10px;
  padding: 0 18px;
}

.action-btn.ant-btn-primary {
  border: none;
  background: linear-gradient(120deg, #3485ff 0%, #4da8ff 100%);
}

.action-btn.ant-btn-primary:hover {
  background: linear-gradient(120deg, #2176f3 0%, #339bff 100%);
}

.reset-btn {
  border-color: #c2d9f6;
  color: #3a6b9e;
}

.gallery-panel {
  margin-top: 24px;
  border-radius: 22px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(199, 221, 247, 0.8);
  box-shadow: 0 14px 36px rgba(50, 104, 180, 0.08);
  backdrop-filter: blur(10px);
}

.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 18px;
}

.picture-card {
  border-radius: 16px;
  overflow: hidden;
  background: #fff;
  border: 1px solid #d8e8fa;
  cursor: pointer;
  transition: transform 0.26s ease, box-shadow 0.26s ease, border-color 0.26s ease;
}

.picture-card:hover {
  transform: translateY(-4px);
  border-color: #9ec7f3;
  box-shadow: 0 16px 30px rgba(66, 126, 204, 0.14);
}

.card-media {
  position: relative;
  height: 200px;
  background: linear-gradient(145deg, #edf5ff 0%, #dcebfc 100%);
}

.card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #547aa4;
  font-size: 13px;
}

.card-placeholder :deep(.anticon) {
  font-size: 22px;
}

.card-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  background: linear-gradient(180deg, rgba(35, 88, 151, 0.08), rgba(23, 70, 125, 0.58));
  opacity: 0;
  transition: opacity 0.25s ease;
}

.picture-card:hover .card-overlay {
  opacity: 1;
}

.card-content {
  padding: 14px;
}

.card-content h3 {
  margin: 0;
  color: #12385e;
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.intro {
  margin: 8px 0 0;
  min-height: 40px;
  color: #5f7ea1;
  font-size: 13px;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: linear-gradient(120deg, #eaf4ff 0%, #deeeff 100%);
  border: 1px solid #c8dff8;
  color: #2d6497;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.tag-list {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  cursor: pointer;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f3f8ff;
  color: #5e7ea1;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid #d7e7f8;
  white-space: nowrap;
}

:global(.all-tags-tooltip .ant-tooltip-inner) {
  max-width: 280px;
  background: linear-gradient(145deg, #ffffff 0%, #f3f8ff 55%, #eaf3ff 100%) !important;
  border: 1px solid #d6e6f8 !important;
  box-shadow: 0 8px 20px rgba(50, 104, 180, 0.15) !important;
  border-radius: 10px;
  padding: 10px 12px;
  color: #2b5f92 !important;
}

:global(.all-tags-tooltip .ant-tooltip-arrow::before) {
  background: linear-gradient(145deg, #ffffff 0%, #eef6ff 100%) !important;
}

:global(.all-tags-tooltip .tooltip-tag-wrap) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

:global(.all-tags-tooltip .tooltip-tag-chip) {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #eef6ff;
  border: 1px solid #d7e8fb;
  color: #3d6a99;
  font-size: 12px;
}

.author-line {
  margin-top: 12px;
  color: #3f6893;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty-state {
  padding: 28px 0;
  border-radius: 14px;
  border: 1px dashed #bdd8f4;
  background: rgba(245, 251, 255, 0.72);
}

.pagination-wrap {
  margin-top: 26px;
  display: flex;
  justify-content: center;
}

@media (max-width: 1100px) {
  .recommend-search {
    grid-template-columns: 1fr 1fr;
  }

  .action-btn {
    width: 100%;
  }
}

@media (max-width: 992px) {
  .hero {
    padding: 60px 16px 50px;
  }

  .hero-content {
    padding: 28px;
  }

  .content-wrapper {
    padding: 0 16px 56px;
  }

  .gallery-panel {
    padding: 18px;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: clamp(26px, 8vw, 36px);
  }

  .gallery-header h2 {
    font-size: 24px;
  }

  .recommend-search {
    grid-template-columns: 1fr;
  }

  .gallery-grid {
    grid-template-columns: 1fr;
  }
}
</style>

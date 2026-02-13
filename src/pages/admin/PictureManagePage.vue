<template>
  <div id="pictureManagePage">
    <a-form layout="inline" :model="searchCondition" @finish="doSearch" style="margin-bottom: 16px">
      <a-form-item label="关键词" name="searchText">
        <a-input
          v-model:value="searchCondition.searchText"
          placeholder="请输入名称或简介"
          allowClear
        />
      </a-form-item>

      <a-form-item label="类型" name="category">
        <a-input v-model:value="searchCondition.category" placeholder="请输入类型" allowClear />
      </a-form-item>

      <a-form-item label="标签" name="tags">
        <a-select
          mode="tags"
          style="min-width: 180px"
          v-model:value="searchCondition.tags"
          placeholder="请输入标签"
          allowClear
        />
      </a-form-item>

      <a-form-item label="审核状态" name="reviewStatus">
        <a-select
          style="min-width: 180px"
          v-model:value="searchCondition.reviewStatus"
          placeholder="请选择审核状态"
          :options="PIC_REVIEW_STATUS_OPTIONS"
          allowClear
        />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>



    <!-- 1. 创建一个 Flex 容器，设置两端对齐 (space-between) 和垂直居中 (center) -->
    <div class="action-bar">
      <!-- 左侧：标题 (去除默认的下边距以保证垂直居中) -->
      <h2 class="title">图片管理</h2>

      <!-- 右侧：按钮组 -->
      <a-space>
        <RouterLink to="/creation/picture">
          <a-button type="primary" target="_blank">+ 创建图片</a-button>
        </RouterLink>

        <RouterLink to="/admin/creation/picture/batch">
          <a-button type="primary" target="_blank" ghost>+ 批量创建图片</a-button>
        </RouterLink>
      </a-space>
    </div>

    <a-table
      :columns="columns"
      :data-source="pictureList"
      :pagination="pagination"
      @change="doChange"
      bordered
    >
      <template #bodyCell="{ column, text, record }">
        <!-- 图片 -->
        <template v-if="column.dataIndex === 'url'">
          <a-image style="width: 120px" :src="record.url" />
        </template>

        <!-- 创建时间 -->
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>

        <!-- 编辑时间 -->
        <template v-else-if="column.dataIndex === 'editTime'">
          {{ dayjs(record.editTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>

        <!-- 标签 -->
        <template v-else-if="column.dataIndex === 'tags'">
          <a-space wrap>
            <a-tag color="blue" v-for="tag in JSON.parse(record.tags)" :key="tag">
              {{ tag }}
            </a-tag>
          </a-space>
        </template>

        <!-- 图片信息 -->
        <template v-else-if="column.dataIndex === 'picInfo'">
          <a-space wrap>
            <div>宽度: {{ record.picWidth }}</div>
            <div>高度: {{ record.picHeight }}</div>
            <div>比例: {{ record.picScale }}</div>
            <div>格式: {{ record.picFormat }}</div>
            <div>大小: {{ (record.picSize / 1024 / 1024).toFixed(2) }}MB</div>
          </a-space>
        </template>

        <!-- 审核信息 -->
        <template v-if="column.dataIndex === 'reviewMessage'">
          <div>审核状态：{{ PIC_REVIEW_STATUS_MAP[record.reviewStatus] }}</div>
          <div>审核信息：{{ record.reviewMessage }}</div>
          <div>审核人：{{ record.reviewerId }}</div>
        </template>

        <template v-else-if="column.dataIndex === 'operation'">
          <a-space wrap>
            <a-button
              @click="changeReviewStatus(record.id, PIC_REVIEW_STATUS_ENUM.PASS)"
              v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.PASS"
              color="blue"
              type="link"
            >
              通过
            </a-button>
            <a-button
              @click="openMessage(record.id)"
              v-if="record.reviewStatus !== PIC_REVIEW_STATUS_ENUM.REJECT"
              danger
              type="link"
            >
              拒绝
            </a-button>

            <a-popconfirm danger title="确认删除?" @confirm="deletePicture(record.id)">
              <a-button danger type="link"> 删除 </a-button>
            </a-popconfirm>
            <a-popconfirm danger title="确认编辑?" @confirm="editPicture(record.id)">
              <a-button type="link"> 编辑 </a-button>
            </a-popconfirm>
          </a-space>
        </template>
      </template>
    </a-table>

    <a-modal
      :destroyOnClose="true"
      v-model:open="openReject"
      title="填写拒绝原因"
      @cancel="changeReviewMessage"
      @ok="changeReviewStatus(pictureId, PIC_REVIEW_STATUS_ENUM.REJECT)"
    >
      <a-input v-model:value="reviewMessage" />
    </a-modal>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  deletePictureUsingPost,
  doPictureReviewUsingPost,
  listPictureByPageUsingPost,
} from '@/api/pictureController'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import {
  PIC_REVIEW_STATUS_ENUM,
  PIC_REVIEW_STATUS_MAP,
  PIC_REVIEW_STATUS_OPTIONS,
} from '@/constants/PictureConstant'

const columns = [
  {
    title: 'id',
    dataIndex: 'id',
  },
  {
    title: '图片',
    dataIndex: 'url',
    width: 150,
  },
  {
    title: '名称',
    dataIndex: 'name',
  },
  {
    title: '简介',
    dataIndex: 'introduction',
    ellipsis: true,
  },
  {
    title: '类型',
    dataIndex: 'category',
  },
  {
    title: '标签',
    dataIndex: 'tags',
  },
  {
    title: '图片信息',
    dataIndex: 'picInfo',
    width: 130,
  },
  {
    title: '审核信息',
    dataIndex: 'reviewMessage',
    width: 150,
  },
  {
    title: '图片 id',
    dataIndex: 'userId',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    width: 110,
  },
  {
    title: '编辑时间',
    dataIndex: 'editTime',
    width: 110,
  },
  {
    title: '操作',
    dataIndex: 'operation',
  },
]

const router = useRouter()
// 图片列表
const pictureList = ref<API.Picture[]>([])
// 图片总数
const total = ref<number>(0)
// 查询条件
const searchCondition = reactive<API.PictureQueryRequest>({
  current: 1,
  pageSize: 10,
  sortField: '',
  sortOrder: '',
})

// 分页配置
const pagination = computed(() => {
  return {
    current: searchCondition.current,
    pageSize: searchCondition.pageSize,
    total: total.value,
    showSizeChanger: true,
    showTotal: (total: any) => `共${total}条`,
  }
})

// 获取图片列表
const fetchPictureList = async () => {
  try {
    const res = await listPictureByPageUsingPost(searchCondition)
    if (res.data.code === 0 && res.data.data) {
      pictureList.value = res.data.data.records ?? []
      total.value = res.data.data.total ?? 0
    } else {
      message.error(res.data.message)
    }
  } catch (e: any) {
    console.log(e.message)
  }
}

const openReject = ref(false)
const reviewMessage = ref('')
const pictureId = ref<string>()

/**
 * 重置拒绝原因
 */
const changeReviewMessage = () => {
  reviewMessage.value = ''
}
/**
 * 打开拒绝原因信息框
 */
const openMessage = (id) => {
  openReject.value = true
  pictureId.value = id
}
/**
 * 改变图片审核状态
 */
const changeReviewStatus = async (id: string, reviewStatus: number) => {
  try {
    if (reviewStatus === PIC_REVIEW_STATUS_ENUM.PASS) {
      reviewMessage.value = '通过'
    }
    const params = { id: id, reviewStatus: reviewStatus, reviewMessage: reviewMessage.value }
    const res = await doPictureReviewUsingPost(params)
    if (res.data.code === 0) {
      reviewMessage.value = ''
      openReject.value = false
      await fetchPictureList()
      message.success('修改图片审核状态成功')
    } else {
      message.error(res.data.message)
    }
  } catch (e: any) {
    message.error(e.message)
  }
}

/**
 * 编辑图片
 * @param id
 */
const editPicture = (id: string) => {
  router.push(`/creation/picture?id=${id}`)
}

// 删除图片
const deletePicture = async (id: string) => {
  const res = await deletePictureUsingPost({ id: id })
  if (res.data.code === 0 && res.data.data) {
    message.success('删除图片成功')
    await fetchPictureList()
    // 当页数据量为 0 时,自动切换到上一页
    const currentPage = searchCondition.current
    searchCondition.current = pictureList.value.length === 0 ? currentPage - 1 : currentPage
    await fetchPictureList()
  }
}

// 管理员切换分页时触发
const doChange = (pagination: any) => {
  searchCondition.current = pagination.current
  searchCondition.pageSize = pagination.pageSize
  fetchPictureList()
}

// 搜索图片列表
const doSearch = () => {
  searchCondition.current = 1
  fetchPictureList()
}

// 页面刷新时 获取图片列表
onMounted(async () => {
  await fetchPictureList()
})
</script>

<style scoped>

.action-bar {
  display: flex;               /* 启用 Flex 布局 */
  justify-content: space-between; /* 左右两端对齐：左边一个元素，右边一个元素 */
  align-items: center;         /* 垂直居中对齐 */
  margin-bottom: 16px;         /* 与下方内容保持一定间距 */
}

.title {
  margin-bottom: 0;            /* 去掉 h2 默认的底部间距，让对齐更精准 */
}

.editable-row-operations a {
  margin-right: 8px;
}
</style>

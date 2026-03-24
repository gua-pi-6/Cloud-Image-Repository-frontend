<template>
  <div id="spaceUserManagePage">
    <!-- 顶部导航 -->
    <div class="header-section">
      <a-breadcrumb class="breadcrumb">
        <a-breadcrumb-item><router-link to="/">首页</router-link></a-breadcrumb-item>
        <a-breadcrumb-item><a @click="router.back()">团队空间</a></a-breadcrumb-item>
        <a-breadcrumb-item>成员管理</a-breadcrumb-item>
      </a-breadcrumb>
      <div class="title-row">
        <div class="left">
          <h1 class="page-title">成员管理</h1>
          <p class="page-desc">设置成员权限，只有管理员及以上角色可以邀请或移除成员。</p>
        </div>
        <div class="right">
          <a-button type="primary" size="large" @click="isAddModalVisible = true">
            <template #icon><UserAddOutlined /></template>添加成员
          </a-button>
        </div>
      </div>
    </div>

    <!-- 列表区域 -->
    <div class="content-section">
      <div class="filter-bar">
        <a-input-search
          v-model:value="searchParams.userName"
          placeholder="搜索成员昵称"
          style="width: 320px"
          size="large"
          @search="doDataFetch"
        />
      </div>

      <a-table
        :columns="columns"
        :data-source="dataList"
        :pagination="pagination"
        :loading="loading"
        @change="handleTableChange"
        row-key="id"
        class="yuque-table"
      >
        <!-- 成员信息列 -->
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'user'">
            <div class="user-info-cell">
              <a-avatar :src="record.user?.userAvatar" :size="40">{{ record.user?.userName?.charAt(0) }}</a-avatar>
              <div class="info-text">
                <div class="name">{{ record.user?.userName }}</div>
                <div class="account">ID: {{ record.user?.userAccount }}</div>
              </div>
            </div>
          </template>

          <!-- 角色选择列 - 类似语雀的内联修改 -->
          <template v-if="column.dataIndex === 'spaceRole'">
            <a-select
              v-model:value="record.spaceRole"
              :bordered="false"
              class="role-select"
              @change="(val) => handleRoleChange(record, val)"
              :disabled="record.spaceRole === 'owner'"
            >
              <a-select-option value="viewer">查看者</a-select-option>
              <a-select-option value="editor">编辑者</a-select-option>
              <a-select-option value="admin">管理员</a-select-option>
              <a-select-option v-if="record.spaceRole === 'owner'" value="owner" disabled>所有者</a-select-option>
            </a-select>
          </template>

          <template v-if="column.dataIndex === 'createTime'">
            <span class="time-text">{{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm') }}</span>
          </template>

          <!-- 操作列 -->
          <template v-if="column.key === 'action'">
            <a-popconfirm
              v-if="record.spaceRole !== 'owner'"
              title="确定将该成员移除出空间吗？"
              @confirm="doDelete(record.id)"
            >
              <a-button type="link" danger>移除</a-button>
            </a-popconfirm>
            <span v-else class="owner-badge">所有者</span>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 添加成员弹窗 -->
    <a-modal
      v-model:visible="isAddModalVisible"
      title="添加空间成员"
      @ok="handleAdd"
      destroyOnClose
    >
      <a-form layout="vertical">
        <a-form-item label="用户 ID (数字)">
          <a-input v-model:value="addForm.userId" placeholder="请输入要添加的用户 ID" />
        </a-form-item>
        <a-form-item label="分配角色">
          <a-select v-model:value="addForm.spaceRole">
            <a-select-option value="viewer">查看者</a-select-option>
            <a-select-option value="editor">编辑者</a-select-option>
            <a-select-option value="admin">管理员</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { UserAddOutlined } from '@ant-design/icons-vue'
import dayjs from 'dayjs'
import {
  addSpaceUserUsingPost,
  deleteSpaceUserUsingPost,
  editSpaceUserUsingPost, listSpaceUserUsingPost
} from '@/api/spaceUserController'

const route = useRoute()
const router = useRouter()
const spaceId = route.params.id

const loading = ref(false)
const dataList = ref([])
const isAddModalVisible = ref(false)

const searchParams = reactive({ userName: '' })
const pagination = reactive({ current: 1, pageSize: 10, total: 0 })
const addForm = reactive({ userId: '', spaceRole: 'viewer' })

const columns = [
  { title: '成员', dataIndex: 'user', key: 'user' },
  { title: '空间角色', dataIndex: 'spaceRole', key: 'spaceRole', width: 160 },
  { title: '加入时间', dataIndex: 'createTime', key: 'createTime', width: 200 },
  { title: '操作', key: 'action', width: 100 },
]

// 获取列表
const doDataFetch = async () => {
  loading.value = true
  const res = await listSpaceUserUsingPost({
    spaceId,
    ...searchParams,
    current: pagination.current,
    pageSize: pagination.pageSize
  })
  if (res.data.code === 0) {
    dataList.value = res.data.data || []
    pagination.total = res.data.data.length || 0
  }
  loading.value = false
}

// 变更角色
const handleRoleChange = async (record: any, newRole: string) => {
  const res = await editSpaceUserUsingPost({ id: record.id, spaceRole: newRole })
  if (res.data.code === 0) {
    message.success('更新角色成功')
  } else {
    message.error(res.data.message)
    doDataFetch()
  }
}

// 添加成员
const handleAdd = async () => {
  if (!addForm.userId) return message.warn('请输入用户ID')
  const res = await addSpaceUserUsingPost({ spaceId, ...addForm })
  if (res.data.code === 0) {
    message.success('添加成功')
    isAddModalVisible.value = false
    doDataFetch()
  } else {
    message.error(res.data.message)
  }
}

// 移除成员
const doDelete = async (id: any) => {
  const res = await deleteSpaceUserUsingPost({ id })
  if (res.data.code === 0) {
    message.success('已移除成员')
    doDataFetch()
  } else {
    message.error(res.data.message)
  }
}

const handleTableChange = (pag: any) => {
  pagination.current = pag.current
  doDataFetch()
}

onMounted(() => doDataFetch())
</script>

<style scoped lang="scss">
#spaceUserManagePage {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px;
  min-height: 100vh;

  .header-section {
    margin-bottom: 32px;
    .breadcrumb { margin-bottom: 16px; }
    .title-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      .page-title { font-size: 32px; font-weight: 600; color: #262626; margin: 0 0 8px 0; }
      .page-desc { color: #8c8c8c; font-size: 14px; margin: 0; }
    }
  }

  .content-section {
    background: #fff;
    border-radius: 8px;
    .filter-bar { margin-bottom: 24px; }
  }

  .user-info-cell {
    display: flex;
    align-items: center;
    gap: 12px;
    .name { font-weight: 500; color: #262626; }
    .account { font-size: 12px; color: #bfbfbf; }
  }

  .role-select {
    width: 120px;
    margin-left: -10px; // 对齐文本
    transition: all 0.3s;
    &:hover { background: #f5f5f5; border-radius: 4px; }
  }

  .time-text { color: #8c8c8c; }
  .owner-badge { color: #fa8c16; background: #fff7e6; padding: 2px 8px; border-radius: 4px; font-size: 12px; }

  :deep(.yuque-table) {
    .ant-table-thead > tr > th {
      background: transparent;
      border-bottom: 1px solid #f0f0f0;
      color: #8c8c8c;
      font-weight: normal;
    }
  }
}
</style>

<template>
  <div id="userManagePage">
    <a-form layout="inline" :model="searchCondition" @finish="doSearch" style="margin-bottom: 16px">
      <a-form-item label="账号" name="userAccount">
        <a-input v-model:value="searchCondition.userAccount" placeholder="请输入账号" />
      </a-form-item>

      <a-form-item label="用户名" name="userName">
        <a-input v-model:value="searchCondition.userName" placeholder="请输入用户名" />
      </a-form-item>

      <a-form-item>
        <a-button type="primary" html-type="submit">搜索</a-button>
      </a-form-item>
    </a-form>

    <a-table
      :columns="columns"
      :data-source="userVoList"
      :pagination="pagination"
      @change="doChange"
      bordered
    >
      <template #bodyCell="{ column, text, record }">
        <!-- 头像 -->
        <template v-if="column.dataIndex === 'userAvatar'">
          <a-image style="width: 120px" :src="record.userAvatar" />
        </template>

        <!-- 时间 -->
        <template v-else-if="column.dataIndex === 'createTime'">
          {{ dayjs(record.createTime).format('YYYY-MM-DD HH:mm:ss') }}
        </template>

        <!-- 角色 -->
        <template v-else-if="column.dataIndex === 'userRole'">
          <a-tag color="blue" v-if="record.userRole === 'admin'">{{ '管理员' }}</a-tag>
          <a-tag color="green" v-else>{{ '用户' }}</a-tag>
        </template>

        <template v-else-if="column.dataIndex === 'operation'">
          <div class="editable-row-operations">
            <span>
              <a-popconfirm danger title="确认删除?" @confirm="deleteUser(record.id)">
                <a-button danger>删除</a-button>
              </a-popconfirm>
            </span>
          </div>
        </template>
      </template>
    </a-table>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import type { UnwrapRef } from 'vue'
import { deleteUserUsingPost, listUserVoByPageUsingPost } from '@/api/userController'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'

const columns = [
  {
    title: 'id',
    dataIndex: 'id',
  },
  {
    title: '账号',
    dataIndex: 'userAccount',
  },
  {
    title: '用户名',
    dataIndex: 'userName',
  },
  {
    title: '头像',
    dataIndex: 'userAvatar',
  },
  {
    title: '用户简介',
    dataIndex: 'userProfile',
  },
  {
    title: '角色',
    dataIndex: 'userRole',
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
  },
  {
    title: '操作',
    dataIndex: 'operation',
  },
]

// 编辑列表
const editableData: UnwrapRef<Record<string, API.UserVO>> = reactive({})

// 用户列表
const userVoList = ref<API.UserVO[]>([])
// 用户总数
const total = ref<number>(0)

// 查询条件
const searchCondition = reactive<API.UserQueryRequest>({
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

// 获取用户列表
const fetchUserVoList = async () => {
  try {
    const res = await listUserVoByPageUsingPost(searchCondition)
    if (res.data.code === 0 && res.data.data) {
      userVoList.value = res.data.data.records ?? []
      total.value = res.data.data.total ?? 0
    } else {
      message.error(res.data.message)
    }
  } catch (e: any) {
    console.log(e.message)
  }
}

// 删除用户
const deleteUser = async (id:string) => {
  const res = await deleteUserUsingPost({id: id})
  if (res.data.code === 0 && res.data.data) {
    message.success('删除用户成功')
    await fetchUserVoList()
    // 当页数据量为 0 时,自动切换到上一页
    const currentPage = searchCondition.current
    searchCondition.current = userVoList.value.length === 0 ? currentPage-1 : currentPage
    await fetchUserVoList()
  }
}

// 管理员切换分页时触发
const doChange = (pagination: any) => {
  searchCondition.current = pagination.current
  searchCondition.pageSize = pagination.pageSize
  fetchUserVoList()
}

// 搜索用户列表
const doSearch = () => {
  searchCondition.current = 1
  fetchUserVoList()
}

// 页面刷新时 获取用户列表
onMounted(async () => {
  await fetchUserVoList()
})


</script>

<style scoped>
.editable-row-operations a {
  margin-right: 8px;
}
</style>

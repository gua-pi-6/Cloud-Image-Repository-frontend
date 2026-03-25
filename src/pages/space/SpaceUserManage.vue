<template>
  <div id="spaceUserManagePage">

    <!-- ══════════════════════════════════════════
         顶部工具栏：搜索 + 邀请按钮
    ══════════════════════════════════════════ -->
    <div class="toolbar">
      <a-input
        v-model:value="searchParams.userId"
        placeholder="通过用户 ID 搜索成员"
        allow-clear
        class="search-input"
        @pressEnter="doDataFetch"
        @change="onSearchChange"
      >
        <template #prefix>
          <SearchOutlined class="search-icon" />
        </template>
      </a-input>

      <!-- 只有管理员才能邀请成员 -->
      <a-button
        v-if="isCurrentUserAdmin"
        type="primary"
        class="invite-btn"
        @click="openInviteModal"
      >
        <template #icon><UserAddOutlined /></template>
        邀请成员
      </a-button>
    </div>

    <!-- ══════════════════════════════════════════
         成员列表表格
    ══════════════════════════════════════════ -->
    <div class="table-wrap">

      <!-- 表头 -->
      <div class="table-header">
        <div class="col-name">姓名</div>
        <div class="col-role">
          <a-dropdown trigger="click" v-model:open="roleFilterDropOpen">
            <span class="header-filter-btn" @click.prevent>
              {{ currentRoleFilterLabel }}
              <DownOutlined :class="['filter-arrow', { active: roleFilterDropOpen }]" />
            </span>
            <template #overlay>
              <div class="filter-menu">
                <div
                  v-for="opt in roleFilterOptions"
                  :key="opt.value"
                  :class="['filter-item', { active: searchParams.roleFilter === opt.value }]"
                  @click="selectRoleFilter(opt.value)"
                >
                  <CheckOutlined v-if="searchParams.roleFilter === opt.value" class="check-icon" />
                  <span>{{ opt.label }}</span>
                </div>
              </div>
            </template>
          </a-dropdown>
        </div>
        <div class="col-action">操作</div>
      </div>

      <!-- 加载中骨架屏 -->
      <template v-if="loading">
        <div v-for="i in 4" :key="i" class="table-row skeleton-row">
          <div class="col-name">
            <div class="sk-box sk-avatar"></div>
            <div class="sk-box sk-name"></div>
          </div>
          <div class="col-role"><div class="sk-box sk-tag"></div></div>
          <div class="col-action"></div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-else-if="filteredList.length === 0" class="empty-state">
        <TeamOutlined class="empty-icon" />
        <p class="empty-text">暂无成员</p>
      </div>

      <!-- 数据行 -->
      <template v-else>
        <div
          v-for="member in filteredList"
          :key="member.id"
          class="table-row"
        >

          <!-- 姓名列 -->
          <div class="col-name">
            <a-avatar :size="32" :src="member?.user?.userAvatar" class="member-avatar">
              <!-- TODO: 无头像时取用户名首字 -->
              {{ member?.user?.userName?.charAt(0)?.toUpperCase() }}
            </a-avatar>
            <span class="member-name">{{ member?.user?.userName }}</span>
            <span v-if="isSelf(member)" class="self-tag">你自己</span>
          </div>

          <!-- 角色列（仅管理员可操作所有行，支持自己改自己） -->
          <div class="col-role">
            <a-dropdown
              trigger="click"
              :disabled="!isCurrentUserAdmin"
              @openChange="(v: any) => onRoleDropChange(v, member?.userId || undefined)"
            >
              <div :class="['role-btn', { disabled: !isCurrentUserAdmin }]">
                <span>{{ roleConfig[member?.spaceRole]?.label ?? '无角色' }}</span>
                <UpOutlined v-if="openRoleDropId === member?.userId || undefined" class="role-arrow up" />
                <DownOutlined v-else class="role-arrow" />
              </div>
              <template #overlay>
                <div class="role-dropdown-menu">
                  <div
                    v-for="role in roleList"
                    :key="role.value"
                    :class="['role-option', { current: member.spaceRole === role.value }]"
                    @click="handleRoleChange(member, role.value)"
                  >
                    <div class="role-option-main">
                      <CheckOutlined v-if="member.spaceRole === role.value" class="role-check" />
                      <!-- 未选中时占位，保持对齐 -->
                      <span v-else class="role-check-placeholder" />
                      <span class="role-option-label">{{ role.label }}</span>
                    </div>
                    <!-- 仅当前角色展示描述 -->
                    <p v-if="member.spaceRole === role.value" class="role-option-desc">
                      {{ role.desc }}
                    </p>
                  </div>

                  <div class="role-dropdown-divider" />

                  <!-- TODO: 跳转或弹窗「设置角色权限」 -->
                  <div class="role-option permission-entry" @click="openPermissionModal">
                    <SettingOutlined class="perm-icon" />
                    <span>设置角色权限</span>
                  </div>
                </div>
              </template>
            </a-dropdown>
          </div>

          <!-- 操作列 -->
          <div class="col-action">
            <a-dropdown trigger="click">
              <button class="more-btn" @click.stop><EllipsisOutlined /></button>
              <template #overlay>
                <div class="action-menu">
                  <!-- TODO: 跳转到用户资料页 -->
                  <div class="action-item" @click="viewMember(member)">
                    <UserOutlined /><span>查看资料</span>
                  </div>
                  <template v-if="isCurrentUserAdmin && !isSelf(member)">
                    <div class="action-divider" />
                    <!-- TODO: 调用 deleteSpaceUserUsingPost，带二次确认弹窗 -->
                    <div class="action-item danger" @click="confirmRemove(member)">
                      <DeleteOutlined /><span>移出空间</span>
                    </div>
                  </template>
                </div>
              </template>
            </a-dropdown>
          </div>
        </div>
      </template>
    </div>

    <!-- ══════════════════════════════════════════
         邀请成员弹窗
    ══════════════════════════════════════════ -->
    <a-modal
      v-model:open="isInviteModalVisible"
      title="邀请空间成员"
      :footer="null"
      :width="460"
      destroy-on-close
      class="invite-modal"
    >
      <a-form
        ref="inviteFormRef"
        :model="addForm"
        layout="vertical"
        @finish="handleAdd"
      >
        <a-form-item
          label="用户 ID"
          name="userId"
          :rules="[{ required: true, message: '请输入要邀请的用户 ID' }]"
        >
          <a-input
            v-model:value="addForm.userId"
            placeholder="请输入用户 ID"
            size="large"
            allow-clear
          />
        </a-form-item>

        <a-form-item label="空间角色" name="spaceRole">
          <div class="role-radio-group">
            <label
              v-for="role in roleList"
              :key="role.value"
              :class="['role-radio-item', { active: addForm.spaceRole === role.value }]"
              @click="addForm.spaceRole = role.value"
            >
              <div class="role-radio-head">
                <div :class="['radio-dot', { checked: addForm.spaceRole === role.value }]" />
                <span class="role-radio-label">{{ role.label }}</span>
              </div>
              <p class="role-radio-desc">{{ role.desc }}</p>
            </label>
          </div>
        </a-form-item>

        <div class="modal-footer">
          <a-button @click="isInviteModalVisible = false">取消</a-button>
          <!-- TODO: inviteLoading 防重复提交 -->
          <a-button type="primary" html-type="submit" :loading="inviteLoading">
            确认邀请
          </a-button>
        </div>
      </a-form>
    </a-modal>

    <!-- 移除成员确认弹窗 -->
    <a-modal
      v-model:open="isRemoveModalVisible"
      title="移出成员"
      ok-text="确认移出"
      cancel-text="取消"
      ok-type="danger"
      @ok="doRemove"
    >
      <p class="remove-confirm-text">
        确定将 <b>{{ removingMember?.user?.userName }}</b> 从空间中移出吗？
        移出后该成员将无法访问此空间内容。
      </p>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import {
  SearchOutlined, UserAddOutlined, DownOutlined, UpOutlined,
  CheckOutlined, EllipsisOutlined, DeleteOutlined, UserOutlined,
  SettingOutlined, TeamOutlined, CloseOutlined,
} from '@ant-design/icons-vue'
import {
  addSpaceUserUsingPost,
  deleteSpaceUserUsingPost,
  editSpaceUserUsingPost,
  listSpaceUserUsingPost
} from '@/api/spaceUserController'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { addSpaceUsingPost } from '@/api/spaceController'

// ── 角色配置 ─────────────────────────────────────────────────
const roleConfig: Record<string, { label: string; desc: string }> = {
  viewer: { label: '浏览者', desc: '可查看空间内所有文档' },
  editor: { label: '编辑者', desc: '可编辑空间内所有文档' },
  admin:  { label: '管理员', desc: '拥有空间全部管理权' },
}
const roleList = Object.entries(roleConfig).map(([value, v]) => ({ value, ...v }))

// ── 筛选选项 ─────────────────────────────────────────────────
const roleFilterOptions = [
  { label: '所有',   value: '' },
  { label: '管理员', value: 'admin' },
  { label: '编辑者', value: 'editor' },
  { label: '浏览者', value: 'viewer' },
]

// ── 状态 ──────────────────────────────────────────────────────
const route          = useRoute()
const loginUserStore = useLoginUserStore()
const loading        = ref(false)
const dataList       = ref<API.SpaceUserVO[]>([])

const searchParams = reactive({
  userId:     '',
  roleFilter: '',
})

const roleFilterDropOpen = ref(false)
const openRoleDropId     = ref<string | number | null>(null)

const isInviteModalVisible = ref(false)
const inviteLoading        = ref(false)
const inviteFormRef        = ref()
const addForm = reactive({ userId: '', spaceRole: 'viewer' })

const isRemoveModalVisible = ref(false)
const removingMember       = ref<API.SpaceUserVO | null>(null)

// ── 计算属性 ──────────────────────────────────────────────────

/**
 * 当前登录用户是否是管理员
 */
const isCurrentUserAdmin = computed(() => {
  const self = dataList.value.find(m => m.userId === loginUserStore.loginUser?.id)
  return self?.spaceRole === 'admin'
})

/** 是否是当前登录用户 */
const isSelf = (member: API.SpaceUserVO) =>
  member.userId === loginUserStore.loginUser?.id

/** 表头角色筛选文字 */
const currentRoleFilterLabel = computed(
  () => roleFilterOptions.find(o => o.value === searchParams.roleFilter)?.label ?? '所有'
)

/** 前端过滤 */
const filteredList = computed(() => {
  let list = dataList.value
  if (searchParams.userId.trim()) {
    list = list.filter(m => String(m.userId ?? '').includes(searchParams.userId.trim()))
  }
  if (searchParams.roleFilter) {
    list = list.filter(m => m.spaceRole === searchParams.roleFilter)
  }
  return list
})


// ── 事件处理 ──────────────────────────────────────────────────

const onSearchChange = () => { /* 前端实时过滤，无需额外操作 */ }

const selectRoleFilter = (val: string) => {
  searchParams.roleFilter = val
  roleFilterDropOpen.value = false
}
// 角色下拉菜单打开状态改变
const onRoleDropChange = (open: boolean, id: string | number) => {
  openRoleDropId.value = open ? id : null
}

// ── 角色修改 ──────────────────────────────────────────────────

const handleRoleChange = async (member: API.SpaceUserVO, newRole: string) => {
  if (member.spaceRole === newRole) return
  const res = await editSpaceUserUsingPost({id: member.id, spaceRole: newRole})
  if (res.data.code === 0) {
    await doDataFetch()
    message.info(`将 [${member.user?.userName}] 设为 [${roleConfig[newRole].label}]`)
  } else {
    message.error(res.data.message || '修改失败')
  }
}


// ── 邀请成员 ──────────────────────────────────────────────────

const openInviteModal = () => {
  addForm.userId    = ''
  addForm.spaceRole = 'viewer'
  isInviteModalVisible.value = true
}

const handleAdd = async () => {
  inviteLoading.value = true
  try {
    if (addForm.userId === String(loginUserStore.loginUser?.id)) {
      message.error('不能邀请自己')
      return
    }
    const res = await addSpaceUserUsingPost({
      spaceId: route.params.id || undefined,
      userId: addForm.userId || undefined,
      spaceRole: addForm.spaceRole || undefined,
    })
    if (res.data.code === 0) {
      await doDataFetch()
      message.success('邀请成功')
    } else {
      message.error(res.data.message || '邀请失败')
    }
  } finally {
    inviteLoading.value = false
    isInviteModalVisible.value = false
  }
}

// ── 移除成员 ──────────────────────────────────────────────────

const confirmRemove = (member: API.SpaceUserVO) => {
  removingMember.value = member
  isRemoveModalVisible.value = true
}
const doRemove = async () => {
  if (!removingMember.value) return
  const res = await deleteSpaceUserUsingPost({id: removingMember.value.id})
  if (res.data.code === 0) {
    await doDataFetch()
    message.success(`已移出 [${removingMember.value?.user?.userName}]`)
  } else {
    message.error(res.data.message || '移除失败')
  }
  isRemoveModalVisible.value = false
  removingMember.value = null
}

const viewMember = (member: API.SpaceUserVO) => {
  // TODO: router.push(`/user/${member.userId}`)
  message.info(`查看 [${member?.user?.userName}] 资料 — TODO`)
}
const openPermissionModal = () => {
  // TODO: 打开角色权限配置弹窗 / 跳转设置页
  message.info('设置角色权限 — TODO')
}

// ── 数据加载 ──────────────────────────────────────────────────

const doDataFetch = async () => {
  loading.value = true
  try {
    const res = await listSpaceUserUsingPost({
      spaceId: route.params.id || undefined,
    })
    if (res.data.code === 0 && res.data.data) {
      dataList.value = res.data.data
    } else {
      message.error(res.data.message ?? '加载失败')
    }
  } catch {
    message.error('网络错误，请稍后重试')
  } finally {
    loading.value = false
  }
}

onMounted(doDataFetch)
</script>

<style scoped lang="scss">
// ── CSS 变量 ───────────────────────────────────────────────────
$border   : #e8e8e8;
$hover-bg : #f7f7f8;
$text-1   : #1f2329;
$text-2   : #646a73;
$text-3   : #b0b3ba;
$blue     : #1677ff;
$green    : #00b96b;
$red      : #ff4d4f;
$radius   : 6px;

// ── 页面容器 ───────────────────────────────────────────────────
#spaceUserManagePage {
  padding: 24px 32px;
  background: #fff;
  min-height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  color: $text-1;
  position: relative;
}

// ── 工具栏 ─────────────────────────────────────────────────────
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;

  .search-input {
    width: 260px;
    border-radius: $radius;
    :deep(.ant-input-prefix) { color: $text-3; }
  }

  .invite-btn {
    margin-left: auto;
    border-radius: $radius;
    height: 32px;
    padding: 0 14px;
    font-size: 13px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
}

// ── 表格容器 ───────────────────────────────────────────────────
.table-wrap {
  border: 1px solid $border;
  border-radius: 8px;
  overflow: hidden;
}

// 列布局（去掉复选框与账号状态栏）
%col-layout {
  display: grid;
  grid-template-columns: 1fr 160px 64px;
  align-items: center;
}

// ── 表头 ───────────────────────────────────────────────────────
.table-header {
  @extend %col-layout;
  padding: 0 16px;
  height: 48px;
  background: #fafafa;
  border-bottom: 1px solid $border;
  font-size: 13px;
  color: $text-2;
  font-weight: 500;
}

.col-name   { padding-left: 0; }
.col-role   { display: flex; align-items: center; }
.col-action { display: flex; align-items: center; justify-content: center; }

.header-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  padding: 2px 6px;
  border-radius: 4px;
  transition: background 0.15s;
  &:hover { background: #f0f0f0; }
}

.filter-arrow {
  font-size: 10px;
  color: $text-3;
  transition: transform 0.2s, color 0.2s;
  &.active { transform: rotate(180deg); color: $blue; }
}

// ── 数据行 ─────────────────────────────────────────────────────
.table-row {
  @extend %col-layout;
  padding: 0 16px;
  min-height: 64px;
  border-bottom: 1px solid $border;
  transition: background 0.12s;

  &:last-child { border-bottom: none; }
  &:hover      { background: $hover-bg; }
}

// 头像与名字紧挨着
.col-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.member-avatar {
  flex-shrink: 0;
  background: $green;
  font-size: 13px;
  font-weight: 600;
}

.member-name {
  font-size: 14px;
  font-weight: 500;
  color: $text-1;
}

.self-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 12px;
  background: #f0f0f0;
  color: #646a73;
  font-size: 12px;
  line-height: 20px;
}

// ── 角色按钮 ───────────────────────────────────────────────────
.role-btn {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border-radius: $radius;
  background: #f5f5f5;
  font-size: 13px;
  font-weight: 500;
  color: $text-1;
  cursor: pointer;
  border: 1px solid transparent;
  transition: all 0.15s;
  user-select: none;

  &:hover:not(.disabled) { background: #ebebeb; }
  &.disabled { cursor: default; color: $text-3; background: #fafafa; }

  .role-arrow { font-size: 10px; color: $text-3; &.up { color: $blue; } }
}

// ── 角色下拉菜单 ───────────────────────────────────────────────
.role-dropdown-menu {
  min-width: 210px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,.1), 0 0 0 1px rgba(0,0,0,.05);
  padding: 6px 0;
  overflow: hidden;
}

.role-option {
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: $hover-bg; }
}

.role-option-main {
  display: flex;
  align-items: center;
  gap: 6px;
}

.role-check {
  font-size: 12px;
  font-weight: 700;
  color: $text-1;
  width: 14px;
  flex-shrink: 0;
}
.role-check-placeholder {
  width: 14px;
  flex-shrink: 0;
  display: inline-block;
}

.role-option-label { font-size: 14px; color: $text-1; }
.role-option-desc  {
  margin: 3px 0 0 20px;
  font-size: 12px;
  color: $text-3;
  line-height: 1.4;
}

.role-dropdown-divider { height: 1px; background: $border; margin: 4px 0; }

.permission-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  color: $text-2;
  .perm-icon { font-size: 13px; }
  span { font-size: 14px; }
}

// ── 更多操作按钮 ───────────────────────────────────────────────
.more-btn {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: $text-2;
  transition: background 0.12s;
  &:hover { background: #ebebeb; }
}

.action-menu {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,.1), 0 0 0 1px rgba(0,0,0,.05);
  padding: 6px 0;
  min-width: 140px;
}
.action-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font-size: 13px;
  color: $text-1;
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: $hover-bg; }
  &.danger { color: $red; &:hover { background: #fff2f0; } }
}
.action-divider { height: 1px; background: $border; margin: 4px 0; }

// ── 筛选下拉菜单 ───────────────────────────────────────────────
.filter-menu {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 24px rgba(0,0,0,.1), 0 0 0 1px rgba(0,0,0,.05);
  padding: 6px 0;
  min-width: 130px;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 16px;
  font-size: 13px;
  color: $text-1;
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: $hover-bg; }
  &.active { color: $blue; font-weight: 500; }
  .check-icon { font-size: 11px; color: $blue; }
}

// ── 骨架屏 ─────────────────────────────────────────────────────
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
%sk-base {
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
  border-radius: 4px;
}
.skeleton-row .col-name { gap: 8px; }
.sk-box    { @extend %sk-base; }
.sk-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; }
.sk-name   { width: 100px; height: 14px; }
.sk-tag    { width: 70px; height: 24px; border-radius: 12px; }

// ── 空状态 ─────────────────────────────────────────────────────
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 72px 0;
  color: $text-3;
  .empty-icon { font-size: 52px; margin-bottom: 14px; }
  .empty-text { font-size: 14px; margin: 0; }
}

// ── 邀请弹窗：角色选择 ─────────────────────────────────────────
.role-radio-group { display: flex; flex-direction: column; gap: 8px; }

.role-radio-item {
  padding: 12px 14px;
  border: 1.5px solid $border;
  border-radius: $radius;
  cursor: pointer;
  transition: all 0.15s;
  &:hover { border-color: #aaa; }
  &.active { border-color: $blue; background: #f0f5ff; }
}
.role-radio-head { display: flex; align-items: center; gap: 10px; }
.radio-dot {
  width: 15px;
  height: 15px;
  border-radius: 50%;
  border: 2px solid $border;
  background: #fff;
  flex-shrink: 0;
  transition: all 0.15s;
  &.checked { border-color: $blue; background: $blue; box-shadow: inset 0 0 0 3px #fff; }
}
.role-radio-label { font-size: 14px; font-weight: 500; color: $text-1; }
.role-radio-desc  { font-size: 12px; color: $text-3; margin: 4px 0 0 25px; line-height: 1.5; }

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid $border;
  margin-top: 4px;
}

.remove-confirm-text {
  font-size: 14px;
  color: $text-2;
  line-height: 1.7;
  b { color: $text-1; }
}

// ── Ant Design 覆盖 ────────────────────────────────────────────
:deep(.ant-modal-title)     { font-size: 16px; font-weight: 600; color: $text-1; }
:deep(.ant-form-item-label > label) { font-size: 13px; color: $text-2; font-weight: 500; }
:deep(.ant-input-affix-wrapper) { border-radius: $radius; }
</style>

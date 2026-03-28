<template>
  <div class="upload-space-selector">
    <div class="selector-label">
      <FolderOpenOutlined class="label-icon" />
      <span>上传至：</span>
    </div>

    <!-- 空间大类选择 -->
    <a-radio-group
      v-model:value="activeType"
      button-style="solid"
      class="custom-radio-group"
      @change="handleTypeChange"
    >
      <!-- 1. 公共图库：所有人可见 -->
      <a-radio-button value="public">
        <GlobalOutlined /> 公共图库
      </a-radio-button>

      <!-- 2. 私人图库：仅登录用户且已拥有私人空间可见 -->
      <a-radio-button v-if="isLogin && hasPrivateSpace" value="private">
        <LockOutlined /> 私人图库
      </a-radio-button>

      <!-- 3. 团队空间：仅登录且拥有团队的用户可见 -->
      <a-radio-button v-if="isLogin && hasTeamSpace" value="team">
        <TeamOutlined /> 团队空间
      </a-radio-button>
    </a-radio-group>

    <!-- 团队选择下拉框 (只有选中团队空间时出现) -->
    <transition name="slide-fade">
      <div v-if="activeType === 'team'" class="team-select-wrapper">
        <a-select
          v-model:value="selectedTeamId"
          placeholder="请选择具体的团队空间"
          class="team-select"
          :options="teamOptions"
          @change="handleTeamChange"
          allow-clear
        >
        </a-select>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  GlobalOutlined,
  LockOutlined,
  TeamOutlined,
  FolderOpenOutlined,
} from '@ant-design/icons-vue'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'

type SpaceType = 'public' | 'private' | 'team'

const spaceVoStore = useSpaceVoStore()

const props = defineProps<{
  // 父组件传入的团队空间列表
  teamList?: Array<{ id: number; name?: string; spaceName?: string }>
  // 可选：父组件可直接告知是否有私人空间；未传则由 store 推断
  hasPrivateSpace?: boolean
}>()

const emit = defineEmits<{
  (e: 'change', payload: { type: SpaceType; teamId?: number | null }): void
}>()

const loginUserStore = useLoginUserStore()
const isLogin = computed(() => !!loginUserStore.loginUser?.id)

const activeType = ref<SpaceType>('public')
const selectedTeamId = ref<number | null>(null)

const teamOptions = computed(() => {
  return (props.teamList ?? []).map((team) => ({
    value: team.id,
    label: team.spaceName || team.name || '未命名团队',
  }))
})
const hasTeamSpace = computed(() => teamOptions.value.length > 0)

const privateFromStore = computed(() => !!spaceVoStore.spaceVo?.id)
const hasPrivateSpace = computed(() => {
  if (typeof props.hasPrivateSpace === 'boolean') {
    return props.hasPrivateSpace
  }
  return privateFromStore.value
})

// 统一派发给父组件，保证输出结构稳定，便于父组件维护
const emitChange = () => {
  emit('change', {
    type: activeType.value,
    teamId: activeType.value === 'team' ? selectedTeamId.value : null,
  })
}

/**
 * 规范化当前选中状态，避免出现“当前项已不可用”导致的脏状态：
 * 1) 未登录只能选 public
 * 2) private 不可用时退回 public
 * 3) team 不可用时优先退回 private，否则 public
 * 4) team 可用但没选团队时，默认选第一个
 */
const normalizeSelection = () => {
  const prevType = activeType.value
  const prevTeamId = selectedTeamId.value

  if (!isLogin.value) {
    activeType.value = 'public'
    selectedTeamId.value = null
  } else if (activeType.value === 'private' && !hasPrivateSpace.value) {
    activeType.value = 'public'
    selectedTeamId.value = null
  } else if (activeType.value === 'team' && !hasTeamSpace.value) {
    activeType.value = hasPrivateSpace.value ? 'private' : 'public'
    selectedTeamId.value = null
  } else if (activeType.value === 'team') {
    const exists = teamOptions.value.some((item) => item.value === selectedTeamId.value)
    if (!exists) {
      selectedTeamId.value = teamOptions.value[0]?.value ?? null
    }
  } else {
    selectedTeamId.value = null
  }

  return prevType !== activeType.value || prevTeamId !== selectedTeamId.value
}

// 监听可用状态变化，自动回退/修正并同步给父组件
watch(
  [isLogin, hasTeamSpace, hasPrivateSpace, teamOptions],
  () => {
    if (normalizeSelection()) {
      emitChange()
    }
  },
  { immediate: true },
)

// 切换空间类型
const handleTypeChange = () => {
  normalizeSelection()
  emitChange()
}

// 切换具体团队
const handleTeamChange = () => {
  emitChange()
}

onMounted(async () => {
  // 当父组件未传 hasPrivateSpace 时，组件自行兜底拉取一次，避免 private 展示不准确
  if (typeof props.hasPrivateSpace === 'boolean') {
    emitChange()
    return
  }
  if (isLogin.value && !spaceVoStore.spaceVo?.id) {
    await spaceVoStore.fetchSpaceVo()
    normalizeSelection()
  }
  emitChange()
})
</script>

<style scoped lang="scss">
.upload-space-selector {
  display: flex;
  align-items: center;
  padding: 16px 0;
  margin-bottom: 16px;
}

.selector-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-right: 16px;

  .label-icon {
    font-size: 16px;
    color: #1890ff;
  }
}

.custom-radio-group {
  :deep(.ant-radio-button-wrapper) {
    border-radius: 6px;
    margin-right: 8px;
    border: 1px solid #d9d9d9;

    // 隐藏默认的相邻边框重叠样式，让按钮看起来是独立的
    &::before {
      display: none !important;
    }

    &:last-child {
      margin-right: 0;
    }

    &.ant-radio-button-wrapper-checked {
      box-shadow: 0 2px 8px rgba(24, 144, 255, 0.15);
    }
  }
}

.team-select-wrapper {
  margin-left: 12px;
}

.team-select {
  width: 220px;

  :deep(.ant-select-selector) {
    border-radius: 6px;
  }
}

/* 团队下拉框出现的丝滑过渡动画 */
.slide-fade-enter-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-10px);
  opacity: 0;
}
</style>

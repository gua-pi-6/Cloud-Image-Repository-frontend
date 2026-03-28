<template>
  <!-- 整个组件仅在创建模式展示 -->
  <div v-if="!hasId" id="urlUploadFileElement">
    <UploadSpaceSelector
      :teamList="teamList"
      :hasPrivateSpace="hasPrivateSpace"
      @change="handleSpaceChange"
    />

    <div class="url-picture-upload">
      <div class="url-input-group">
        <a-input
          v-model:value="fileUrl"
          class="url-input"
          placeholder="请输入图片 URL"
          allow-clear
          @pressEnter="handleUpload"
        />
        <a-button type="primary" class="submit-btn" :loading="loading" @click="handleUpload">
          提交
        </a-button>
      </div>

      <div class="preview-wrap">
        <img v-if="uploadedPicture?.url" :src="uploadedPicture.url" alt="图片预览" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import UploadSpaceSelector from '@/components/picture/UploadSpaceSelector.vue'
import { uploadPictureUsingPost } from '@/api/pictureController'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'

interface PictureHandleType {
  picture?: API.PictureVO
  onSuccess?: (newPicture: API.PictureVO) => void
}

type SpaceType = 'public' | 'private' | 'team'
type SpaceChangePayload = { type: SpaceType; teamId?: number | null }
type TeamItem = { id: number; spaceName?: string }

const props = defineProps<PictureHandleType>()
const route = useRoute()
const loginUserStore = useLoginUserStore()
const spaceVoStore = useSpaceVoStore()

const loading = ref(false)
const fileUrl = ref('')
const uploadedPicture = ref<API.PictureVO>()
const teamList = ref<TeamItem[]>([])
const uploadParams = ref<API.uploadPictureUsingPOSTParams>({ spaceId: 0 })

// 和文件上传组件保持一致：兼容 params/query 两种路由传参
const hasId = computed(() => {
  const paramsId = route.params.id
  if (paramsId !== undefined && paramsId !== null && String(paramsId) !== '') {
    return true
  }
  const queryId = route.query.id
  if (queryId !== undefined && queryId !== null) {
    if (Array.isArray(queryId)) {
      return queryId.length > 0 && queryId.some((item) => String(item) !== '')
    }
    return String(queryId) !== ''
  }
  return false
})

const hasPrivateSpace = computed(() => !!spaceVoStore.spaceVo?.id)

const handleSpaceChange = ({ type, teamId }: SpaceChangePayload) => {
  if (type === 'public') {
    uploadParams.value = { spaceId: 0 }
    return
  }
  if (type === 'team') {
    uploadParams.value = { spaceId: teamId ?? undefined }
    return
  }
  uploadParams.value = { spaceId: spaceVoStore.spaceVo?.id }
}

const fetchTeamList = async () => {
  const res = await listMyTeamSpaceUsingPost()
  const list = res.data.data ?? []
  teamList.value = list.map((item) => ({
    id: item?.space?.id || -1,
    spaceName: item?.space?.spaceName || '',
  }))
}

const ensurePrivateSpace = async () => {
  if (!loginUserStore.loginUser?.id) {
    return
  }
  if (!spaceVoStore.spaceVo?.id) {
    await spaceVoStore.fetchSpaceVo()
  }
}

/**
 * URL 上传：校验 URL 后调用上传接口，成功后同步给父组件和当前组件预览。
 */
const handleUpload = async () => {
  const url = fileUrl.value.trim()
  if (!url) {
    message.warning('请输入图片 URL')
    return
  }
  try {
    loading.value = true
    const res = await uploadPictureUsingPost({ ...uploadParams.value, fileUrl: url }, {})
    if (res.data.code === 0 && res.data.data) {
      uploadedPicture.value = res.data.data
      props.onSuccess?.(res.data.data)
      message.success('上传图片成功')
    } else {
      message.warning(res.data.message || '上传失败')
    }
  } catch (error: unknown) {
    const text = error instanceof Error ? error.message : '上传异常'
    message.error(text)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchTeamList(), ensurePrivateSpace()])
})
</script>

<style scoped>
.url-picture-upload {
  margin-top: 10px;
}

.url-input-group {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.url-input {
  flex: 1;
  min-width: 0;
}

.url-input :deep(.ant-input) {
  border-radius: 10px;
  height: 40px;
}

.submit-btn {
  width: 110px;
  height: 40px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(120deg, #3485ff 0%, #5aaeff 100%);
  box-shadow: 0 8px 16px rgba(52, 133, 255, 0.25);
}

.submit-btn:hover {
  background: linear-gradient(120deg, #2f7df2 0%, #4d9ff2 100%);
}

.preview-wrap {
  text-align: center;
}

#urlUploadFileElement img {
  max-width: 100%;
  max-height: 430px;
}

@media (max-width: 640px) {
  .url-input-group {
    flex-direction: column;
    align-items: stretch;
  }

  .submit-btn {
    width: 100%;
  }
}
</style>

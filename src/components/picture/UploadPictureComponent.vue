<template>
  <div id="uploadFileElement">
    <!-- 仅创建模式显示上传入口；编辑模式由父页面控制 -->
    <div v-if="!hasId">
      <UploadSpaceSelector
        :teamList="teamList"
        :hasPrivateSpace="hasPrivateSpace"
        @change="handleSpaceChange"
      />

      <a-upload-dragger
        v-model:file="file"
        class="ant-upload"
        name="file"
        :multiple="false"
        :show-upload-list="false"
        :custom-request="handleUpload"
        :before-upload="beforeUpload"
      >
        <div>
          <p class="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p class="ant-upload-text">点击或拖动文件到此区域上传</p>
        </div>
      </a-upload-dragger>
    </div>

    <!-- 预览展示保持原有行为：由父组件传入 picture 时展示 -->
    <div class="preview-wrap">
      <img v-if="props.picture?.url" :src="props.picture.url" alt="图片加载失败" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import { uploadPictureUsingPost } from '@/api/pictureController'
import { listMyTeamSpaceUsingPost } from '@/api/spaceUserController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'
import UploadSpaceSelector from '@/components/picture/UploadSpaceSelector.vue'

interface PictureHandleType {
  picture?: API.PictureVO
  onSuccess?: (newPicture: API.PictureVO) => void
}

type SpaceType = 'public' | 'private' | 'team'
type SpaceChangePayload = { type: SpaceType; teamId?: number | null }
type TeamItem = { id: number; spaceName?: string }
type UploadRequestOption = { file: File }

const props = defineProps<PictureHandleType>()
const route = useRoute()
const loginUserStore = useLoginUserStore()
const spaceVoStore = useSpaceVoStore()

const file = ref<File>()
const teamList = ref<TeamItem[]>([])
const uploadParams = ref<API.uploadPictureUsingPOSTParams>({ spaceId: 0 })

// 支持 params / query 的 id 判断，避免组件在不同路由写法下行为不一致
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

// 空间切换统一转成上传参数，父组件只消费最终结果
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
 * 文件上传入口：只负责上传和回调，不处理父组件业务跳转。
 */
const handleUpload = async ({ file }: UploadRequestOption) => {
  try {
    const res = await uploadPictureUsingPost(uploadParams.value, {}, file)
    if (res.data.code === 0 && res.data.data) {
      props.onSuccess?.(res.data.data)
      message.success('上传图片成功')
    } else {
      message.error(res.data.message || '上传失败')
    }
  } catch (error: unknown) {
    const text = error instanceof Error ? error.message : '上传异常'
    message.error(text)
  }
}

/**
 * 上传前校验：格式 + 大小
 */
const beforeUpload = (currentFile: File) => {
  const isJpgOrPng =
    currentFile.type === 'image/jpg' ||
    currentFile.type === 'image/jpeg' ||
    currentFile.type === 'image/png'
  if (!isJpgOrPng) {
    message.error('你只能上传 JPG 或 PNG 文件')
  }
  const isLt10M = currentFile.size / 1024 / 1024 < 10
  if (!isLt10M) {
    message.error('图片必须小于 10MB')
  }
  return isJpgOrPng && isLt10M
}

onMounted(async () => {
  await Promise.all([fetchTeamList(), ensurePrivateSpace()])
})
</script>

<style scoped>
#uploadFileElement :deep(.ant-upload-drag) {
  max-height: 100%;
  max-width: 100%;
  min-height: 152px;
  min-width: 152px;
}

.preview-wrap {
  text-align: center;
  margin-top: 12px;
}

#uploadFileElement img {
  max-width: 100%;
  max-height: 430px;
}
</style>

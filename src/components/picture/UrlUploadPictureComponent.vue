<template>
  <div id="urlUploadFileElement">
    <div class="url-picture-upload">
      <a-input-group compact style="margin-bottom: 16px">
        <a-input v-model:value="fileUrl" style="width: calc(100% - 120px)" placeholder="请输入图片 URL" />
        <a-button type="primary" :loading="loading" @click="handleUpload" style="width: 120px">提交</a-button>
      </a-input-group>
      <div style="text-align: center;">
        <img  v-if="picture?.url" :src="picture?.url" alt="avatar" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { getPictureVoByIdUsingGet, uploadPictureUsingPost } from '@/api/pictureController'

interface PictureHandleType {
  picture?: API.PictureVO
  onSuccess?: (newPicture: API.PictureVO) => void
}

const props = defineProps<PictureHandleType>()

const loading = ref(false)
const fileUrl = ref('')
const pictureId = ref()
const picture = ref<API.PictureVO>({})


/**
 * 上传图片
 * @param file 图片文件
 */
const handleUpload = async () => {
  try {
    loading.value = true
    const params = {id: pictureId.value ?? null, fileUrl: fileUrl.value}
    const res = await uploadPictureUsingPost(params, {})
    if (res?.data?.code === 0 && res?.data?.data) {
      loading.value = false
      props.onSuccess?.(res.data?.data)
      picture.value = res.data?.data
      pictureId.value = picture.value.id
      message.success('上传图片成功')
    } else {
      message.warn(res.data.message)
    }
  } catch (e:any) {
    message.error(e.message)
  }
}

</script>

<style  scoped>
#uploadFileElement :deep(.ant-upload-drag) {
  max-height: 100%;
  max-width: 100%;
  min-height: 152px;
  min-width: 152px;
}

#uploadFileElement img {
  max-width: 100%;
  max-height: 430px;
}
</style>

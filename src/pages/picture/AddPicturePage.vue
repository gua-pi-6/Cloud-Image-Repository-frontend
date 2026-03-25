<template>
  <div id="addPicturePage">
    <h2 style="margin-bottom: 16px; text-align: center">
      {{ route.query?.id ? '图片修改' : '图片上传' }}
    </h2>

    <!-- 1. 上传逻辑：仅在【创建】模式（无 id）时显示 -->
    <a-tabs v-if="(!route.query?.id && !picture?.url)" v-model:activeKey="uploadType">
      <a-tab-pane key="file" tab="文件上传">
        <UploadPictureComponent :picture="picture" :onSuccess="onSuccess" />
      </a-tab-pane>
      <a-tab-pane key="url" tab="URL 上传" force-render>
        <UrlUploadPictureComponent :picture="picture" :onSuccess="onSuccess" />
      </a-tab-pane>
    </a-tabs>

    <!-- 2. 修改预览：仅在【修改】模式（有 id）或【已上传成功】时显示图片预览 -->
    <div v-if="picture?.url" class="edit-single-preview" style="text-align: center">
      <img :src="picture.url" alt="预览图" style="max-height: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1)" />
    </div>

    <!-- 裁剪与旋转操作按钮 -->
    <div v-if="picture?.id" style="margin-top: 24px; display: flex; justify-content: center;">
      <a-button type="primary" @click="openCropModal">
        裁剪 / 旋转图片
      </a-button>
    </div>

    <!-- 表单部分 -->
    <a-form v-if="picture?.id"
            layout="vertical"
            :model="pictureForm"
            @finish="editPicture"
            style="margin-top: 20px;"
    >
      <a-form-item label="图片名称" name="name">
        <a-input v-model:value="pictureForm.name"
                 placeholder="名称最大长度不可超过18"
                 allowClear
        />
      </a-form-item>

      <a-form-item label="图片简介" name="introduction">
        <a-textarea v-model:value="pictureForm.introduction"
                    placeholder="请输入图片简介(可选)"
                    :auto-size="{ minRows: 2, maxRows: 5 }"
                    allowClear
        />
      </a-form-item>

      <a-form-item label="图片分类" name="category">
        <a-auto-complete v-model:value="pictureForm.category"
                         placeholder="请输入图片分类(可选)"
                         allowClear
                         :options="categoryList"
        />
      </a-form-item>

      <a-form-item label="图片标签" name="tags">
        <a-select v-model:value="pictureForm.tags"
                  placeholder="请输入图片标签(可选)"
                  mode="tags"
                  allowClear
                  :options="tagList"
        />
      </a-form-item>

      <a-form-item style=" text-align: center;">
        <a-button type="primary"
                  html-type="submit"
                  style="min-width: 60%;"
        >
          {{ route.query?.id ? '保存修改' : '立即创建' }}
        </a-button>
      </a-form-item>
    </a-form>

    <!-- 图片裁剪与旋转弹窗 -->
    <a-modal
      v-model:open="isCropModalVisible"
      title="图片裁剪与旋转"
      width="800px"
      :maskClosable="false"
      @cancel="isCropModalVisible = false"
    >
      <div style="height: 450px; width: 100%;">
        <vue-cropper
          ref="cropperRef"
          :img="cropperOptions.img"
          :autoCrop="cropperOptions.autoCrop"
          :fixedBox="cropperOptions.fixedBox"
          :centerBox="cropperOptions.centerBox"
          :canScale="cropperOptions.canScale"
          :infoTrue="cropperOptions.infoTrue"
          :outputType="cropperOptions.outputType"
        />
      </div>

      <template #footer>
        <div style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center;">
          <div></div>
          <a-space>
            <a-button @click="rotateLeft">向左旋转90°</a-button>
            <a-button @click="rotateRight">向右旋转90°</a-button>
            <a-button @click="rotatePlane">旋转180°</a-button>
          </a-space>
          <div style="display: flex; justify-content: flex-end;">
            <a-button type="primary" @click="handleCropConfirm">确 认</a-button>
          </div>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import UploadPictureComponent from '@/components/picture/UploadPictureComponent.vue'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  editPictureUsingPost,
  getPictureVoByIdUsingGet,
  listPictureTagCategoryUsingGet,
  uploadPictureUsingPost
} from '@/api/pictureController'
import { message } from 'ant-design-vue'
import UrlUploadPictureComponent from '@/components/picture/UrlUploadPictureComponent.vue'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'
import { useLoginUserStore } from '@/stores/useLoginUserStore'
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'

const categoryList = ref<{ value: string }[]>([])
const tagList = ref<{ value: string }[]>([])
const picture = ref<API.PictureVO>()
const pictureForm = reactive<API.PictureEditRequest>({})

const router = useRouter()
const route = useRoute()
const uploadType = ref<'file' | 'url'>('file')

const onSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
  pictureForm.name = newPicture.name
}

// --- 图片裁剪 ---
const isCropModalVisible = ref(false)
const cropperRef = ref()
const cropperOptions = reactive({
  img: '',
  autoCrop: true,
  fixedBox: false,
  centerBox: true,
  canScale: true,
  infoTrue: true,
  outputType: 'png',
})

const openCropModal = () => {
  if (picture.value?.url) {
    cropperOptions.img = picture.value.url
  }
  isCropModalVisible.value = true
}

const handleCropConfirm = () => {
  cropperRef.value.getCropBlob(async (blob: Blob) => {
    if (!blob) {
      message.warn('请先裁剪图片')
      return
    }
    const name = picture.value?.name || 'cropped-image'
    const fileName = name + '.png'
    const file = new File([blob], fileName, { type: 'image/png' })

    // 注意：spaceId 需要通过 store 获取，并处理 potential undefined
    const spaceId = useSpaceVoStore().spaceVo?.id
    const res = await uploadPictureUsingPost(
      { spaceId, picName: name, id: picture.value?.id },
      {},
      file
    ) as any

    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
      message.success('图片已更新')
    } else {
      message.error('图片更新失败：' + res.data.message)
    }
  })
  isCropModalVisible.value = false
}

const rotateLeft = () => cropperRef.value.rotateLeft()
const rotateRight = () => cropperRef.value.rotateRight()
const rotatePlane = () => {
  cropperRef.value.rotateRight()
  cropperRef.value.rotateRight()
}

/**
 * 修改图片信息
 */
const editPicture = async (values: any) => {
  try {
    if ((pictureForm.name?.length || 0) > 18) {
      message.warn('名称最大长度为18')
      return
    }
    // 直接使用字符串类型的 ID，不转换 Number
    const params = { id: picture.value?.id, ...values }
    const res = await editPictureUsingPost(params)
    if (res.data.code === 0) {
      message.success(route.query.id ? '修改成功' : '创建成功')
      router.push({ path: `/picture/${picture.value?.id}` })
    } else {
      message.error('操作失败：' + res.data.message)
    }
  } catch (e: any) {
    message.error('操作异常：' + e.message)
  }
}

const getTagAndCategoryList = async () => {
  try {
    const res = await listPictureTagCategoryUsingGet()
    if (res.data.code === 0 && res.data.data) {
      categoryList.value = (res.data.data.categoryList ?? []).map((item: string) => ({ value: item }))
      tagList.value = (res.data.data.tagList ?? []).map((item: string) => ({ value: item }))
    }
  } catch (e: any) {
    message.error('加载分类标签失败')
  }
}

onMounted(async () => {
  if (useLoginUserStore().loginUser.id) {
    await useSpaceVoStore().fetchSpaceVo()
  }

  // 核心：保持 picId 为原始格式（通常为 string）
  const picId = route.query.id as string
  if (picId) {
    try {
      // 这里的 id 直接传 string，不要用 Number()
      const res = await getPictureVoByIdUsingGet({ id: picId as any })
      if (res.data.code === 0 && res.data.data) {
        picture.value = res.data.data
        pictureForm.name = picture.value.name
        pictureForm.introduction = picture.value.introduction
        pictureForm.category = picture.value.category
        pictureForm.tags = picture.value.tags
      } else {
        message.error('图片信息加载失败')
      }
    } catch (e: any) {
      message.error('获取信息异常')
    }
  }
  getTagAndCategoryList()
})
</script>

<style scoped>
</style>

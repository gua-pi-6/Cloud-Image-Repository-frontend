<template>
  <div id="addPicturePage" class="add-picture-page">
    <section class="page-hero">
      <p class="hero-kicker">SMART CLOUD GALLERY</p>
      <h2 class="page-title">{{ isEditMode ? '修改图片' : '上传图片' }}</h2>
      <p class="page-subtitle">
        {{
          isEditMode
            ? '完善图片信息与展示效果，确认后保存修改。'
            : '上传图片并填写信息，快速发布到智能云图库。'
        }}
      </p>
    </section>

    <section class="page-panel">
      <a-tabs v-if="!isEditMode && !picture?.id" v-model:activeKey="uploadType" class="upload-tabs">
        <a-tab-pane key="file" tab="文件上传">
          <UploadPictureComponent :picture="picture" :onSuccess="onSuccess" />
        </a-tab-pane>
        <a-tab-pane key="url" tab="URL 上传" force-render>
          <UrlUploadPictureComponent :picture="picture" :onSuccess="onSuccess" />
        </a-tab-pane>
      </a-tabs>

      <div v-if="picture?.url" class="preview-wrap">
        <img :src="picture.url" alt="图片预览" class="preview-image" />
      </div>

      <div v-if="picture?.id" class="crop-action-row">
        <a-button type="primary" class="primary-btn" @click="openCropModal">裁剪 / 旋转图片</a-button>
      </div>

      <a-form
        v-if="picture?.id"
        layout="vertical"
        :model="pictureForm"
        class="edit-form"
        @finish="editPicture"
      >
        <a-form-item label="图片名称" name="name">
          <a-input v-model:value="pictureForm.name" placeholder="名称最大长度不超过 18" allowClear />
        </a-form-item>

        <a-form-item label="图片简介" name="introduction">
          <a-textarea
            v-model:value="pictureForm.introduction"
            placeholder="请输入图片简介（可选）"
            :auto-size="{ minRows: 2, maxRows: 5 }"
            allowClear
          />
        </a-form-item>

        <a-form-item label="图片分类" name="category">
          <a-auto-complete
            v-model:value="pictureForm.category"
            placeholder="请输入图片分类（可选）"
            allowClear
            :options="categoryList"
          />
        </a-form-item>

        <a-form-item label="图片标签" name="tags">
          <a-select
            v-model:value="pictureForm.tags"
            placeholder="请输入图片标签（可选）"
            mode="tags"
            allowClear
            :options="tagList"
          />
        </a-form-item>

        <a-form-item class="submit-row">
          <a-button type="primary" html-type="submit" class="primary-btn submit-btn">
            {{ isEditMode ? '保存修改' : '立即创建' }}
          </a-button>
        </a-form-item>
      </a-form>
    </section>

    <a-modal
      v-model:open="isCropModalVisible"
      title="图片裁剪与旋转"
      width="800px"
      :maskClosable="false"
      @cancel="isCropModalVisible = false"
    >
      <div class="cropper-wrap">
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
        <div class="modal-footer">
          <div></div>
          <a-space>
            <a-button @click="rotateLeft">向左旋转90°</a-button>
            <a-button @click="rotateRight">向右旋转90°</a-button>
            <a-button @click="rotatePlane">旋转180°</a-button>
          </a-space>
          <div class="modal-confirm">
            <a-button type="primary" @click="handleCropConfirm">确认</a-button>
          </div>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import 'vue-cropper/dist/index.css'
import { VueCropper } from 'vue-cropper'
import UploadPictureComponent from '@/components/picture/UploadPictureComponent.vue'
import UrlUploadPictureComponent from '@/components/picture/UrlUploadPictureComponent.vue'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'
import {
  editPictureUsingPost,
  getPictureVoByIdUsingGet,
  listPictureTagCategoryUsingGet,
  uploadPictureUsingPost,
} from '@/api/pictureController'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

const categoryList = ref<{ value: string }[]>([])
const tagList = ref<{ value: string }[]>([])
const picture = ref<API.PictureVO>()
const pictureForm = reactive<API.PictureEditRequest>({})

const router = useRouter()
const route = useRoute()
const uploadType = ref<'file' | 'url'>('file')

const isEditMode = computed(() => {
  const id = route.query?.id
  if (Array.isArray(id)) {
    return id.length > 0 && id.some((item) => String(item).trim() !== '')
  }
  return id !== undefined && id !== null && String(id).trim() !== ''
})

const onSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
  pictureForm.name = newPicture.name
}

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
    const fileName = `${name}.png`
    const file = new File([blob], fileName, { type: 'image/png' })

    const spaceId = useSpaceVoStore().spaceVo?.id
    const res = await uploadPictureUsingPost(
      { spaceId, picName: name, id: picture.value?.id },
      {},
      file,
    )
    const responseData = res.data

    if (responseData.code === 0 && responseData.data) {
      picture.value = responseData.data
      message.success('图片已更新')
    } else {
      message.error(`图片更新失败：${responseData.message ?? '未知错误'}`)
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

const editPicture = async (values: API.PictureEditRequest) => {
  try {
    if ((pictureForm.name?.length || 0) > 18) {
      message.warn('名称最大长度为18')
      return
    }
    const params = { id: picture.value?.id, ...values }
    const res = await editPictureUsingPost(params)
    if (res.data.code === 0) {
      message.success(isEditMode.value ? '修改成功' : '创建成功')
      router.push({ path: `/picture/${picture.value?.id}` })
    } else {
      message.error(`操作失败：${res.data.message ?? '未知错误'}`)
    }
  } catch (error: unknown) {
    const text = error instanceof Error ? error.message : '未知异常'
    message.error(`操作异常：${text}`)
  }
}

const getTagAndCategoryList = async () => {
  try {
    const res = await listPictureTagCategoryUsingGet()
    if (res.data.code === 0 && res.data.data) {
      categoryList.value = (res.data.data.categoryList ?? []).map((item: string) => ({ value: item }))
      tagList.value = (res.data.data.tagList ?? []).map((item: string) => ({ value: item }))
    }
  } catch {
    message.error('加载分类标签失败')
  }
}

onMounted(async () => {
  if (useLoginUserStore().loginUser.id) {
    await useSpaceVoStore().fetchSpaceVo()
  }

  const picIdRaw = route.query.id
  const picId = Array.isArray(picIdRaw) ? picIdRaw[0] : picIdRaw
  if (picId) {
    try {
      const res = await getPictureVoByIdUsingGet({ id: picId as unknown as number })
      if (res.data.code === 0 && res.data.data) {
        picture.value = res.data.data
        pictureForm.name = picture.value.name
        pictureForm.introduction = picture.value.introduction
        pictureForm.category = picture.value.category
        pictureForm.tags = picture.value.tags
      } else {
        message.error('图片信息加载失败')
      }
    } catch {
      message.error('获取信息异常')
    }
  }

  getTagAndCategoryList()
})
</script>

<style scoped lang="scss">
.add-picture-page {
  min-height: calc(100vh - 120px);
  padding: 20px;
  background:
    radial-gradient(circle at 0% 0%, #ffffff 0%, #f5f9ff 40%, transparent 68%),
    radial-gradient(circle at 95% 5%, #e8f3ff 0%, transparent 45%),
    linear-gradient(180deg, #f9fcff 0%, #f2f7ff 55%, #edf4ff 100%);
}

.page-hero {
  width: min(1080px, 100%);
  margin: 0 auto 18px;
  border-radius: 20px;
  padding: 28px 32px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.93), rgba(239, 248, 255, 0.9));
  border: 1px solid rgba(200, 222, 247, 0.85);
  box-shadow: 0 14px 30px rgba(52, 105, 177, 0.1);
}

.hero-kicker {
  margin: 0;
  color: #2f6ea9;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.18em;
}

.page-title {
  margin: 10px 0 0;
  color: #143e67;
  font-size: clamp(28px, 4.2vw, 38px);
  line-height: 1.2;
}

.page-subtitle {
  margin: 10px 0 0;
  color: #4f759d;
  font-size: 15px;
}

.page-panel {
  width: min(1080px, 100%);
  margin: 0 auto;
  border-radius: 20px;
  padding: 22px;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(195, 218, 245, 0.9);
  box-shadow: 0 14px 34px rgba(47, 96, 165, 0.09);
  backdrop-filter: blur(8px);
}

.upload-tabs :deep(.ant-tabs-nav) {
  margin-bottom: 18px;
}

.upload-tabs :deep(.ant-tabs-ink-bar) {
  background: linear-gradient(120deg, #3c8fff 0%, #6eb6ff 100%);
  height: 3px;
  border-radius: 999px;
}

.preview-wrap {
  margin-top: 12px;
  display: flex;
  justify-content: center;
}

.preview-image {
  width: 100%;
  max-width: 780px;
  max-height: 420px;
  object-fit: contain;
  border-radius: 14px;
  border: 1px solid #d5e6fb;
  background: linear-gradient(145deg, #f7fbff 0%, #edf5ff 100%);
  box-shadow: 0 10px 24px rgba(52, 101, 166, 0.14);
}

.crop-action-row {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.primary-btn {
  min-width: 160px;
  border: none;
  background: linear-gradient(120deg, #3a8dff 0%, #5aaeff 100%);
}

.primary-btn:hover {
  background: linear-gradient(120deg, #2e7ff0 0%, #489eea 100%);
}

.edit-form {
  margin-top: 22px;
}

.edit-form :deep(.ant-input),
.edit-form :deep(.ant-input-affix-wrapper),
.edit-form :deep(.ant-select-selector),
.edit-form :deep(.ant-input-textarea textarea) {
  border-radius: 10px !important;
}

.submit-row {
  margin-top: 2px;
  text-align: center;
}

.submit-btn {
  min-width: 60%;
  height: 42px;
  border-radius: 12px;
}

.cropper-wrap {
  height: 450px;
  width: 100%;
}

.modal-footer {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
}

.modal-confirm {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 992px) {
  .add-picture-page {
    padding: 16px;
  }

  .page-hero {
    padding: 22px 20px;
  }

  .page-panel {
    padding: 16px;
  }
}

@media (max-width: 640px) {
  .page-title {
    font-size: 30px;
  }

  .submit-btn {
    min-width: 100%;
  }

  .modal-footer {
    grid-template-columns: 1fr;
    row-gap: 10px;
  }

  .modal-confirm {
    justify-content: center;
  }
}
</style>

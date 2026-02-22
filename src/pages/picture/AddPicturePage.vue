<template>
  <div id="addPicturePage">
    <h2 style="margin-bottom: 16px; text-align: center">
      {{route.query?.id ? '图片修改' : '图片上传'}}
    </h2>
    <!-- 选择上传方式 -->
    <a-tabs v-model:activeKey="uploadType"
    >>
      <a-tab-pane key="file" tab="文件上传">
        <UploadPictureComponent :picture="picture" :onSuccess="onSuccess"/>
      </a-tab-pane>
      <a-tab-pane key="url" tab="URL 上传" force-render>
        <UrlUploadPictureComponent :picture="picture" :onSuccess="onSuccess"/>
      </a-tab-pane>
    </a-tabs>

    <!-- 新增：裁剪与旋转操作按钮 -->
    <div v-if="picture?.id" style="margin-top: 32px; display: flex; justify-content: center;">
      <a-button type="primary" @click="openCropModal">
        裁剪 / 旋转图片
      </a-button>
    </div>


    <a-form v-if="picture?.id"
            layout="vertical"
            :model="pictureForm"
            @finish="editPicture"
            style="margin-top: 4px;"
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
          {{route.query?.id ? '修改' : '创建'}}
        </a-button>
      </a-form-item>
    </a-form>

    <!-- 新增：图片裁剪与旋转弹窗 -->
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

          <!-- 1. 左侧占位 (为了让中间真正居中，左边必须有一个空元素和右边等宽) -->
          <div></div>

          <!-- 2. 中间部分 (旋转按钮) -->
          <a-space>
            <a-button @click="rotateLeft">向左旋转90°</a-button>
            <a-button @click="rotateRight">向右旋转90°</a-button>
            <a-button @click="rotatePlane">旋转180°</a-button>
          </a-space>

          <!-- 3. 右侧部分 (确认按钮，强制靠右) -->
          <div style="display: flex; justify-content: flex-end;">
            <a-button type="primary" @click="handleCropConfirm">
              确 认
            </a-button>
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

const categoryList = ref<string[]>([])
const tagList = ref<string[]>([])
const picture = ref<API.PictureVO>()
const pictureForm = reactive<API.PictureEditRequest>({})
const onSuccess = (newPicture: API.PictureVO) => {
  picture.value = newPicture
  pictureForm.name = newPicture.name
}

const router = useRouter()
const route = useRoute()
const uploadType = ref<'file' | 'url'>('file')
// --- 新增：图片裁剪相关的状态与配置 ---
const isCropModalVisible = ref(false)
const cropperRef = ref() // 用于调用 vue-cropper 的组件实例方法
const cropperOptions = reactive({
  img: '', // 需要裁剪的图片 url
  autoCrop: true, // 是否默认生成截图框
  fixedBox: false, // 是否固定截图框大小 不允许改变
  centerBox: true, // 截图框是否被限制在图片里面
  canScale: true, // 图片是否允许滚轮缩放
  infoTrue: true, // true 为展示真实输出图片宽高 false 展示设备的宽高
  outputType: 'png', // 默认输出格式
})

// --- 新增：图片裁剪相关方法 ---
/**
 * 打开裁剪弹窗
 */
const openCropModal = () => {
  // 将当前上传成功的图片 url 传给 cropper 进行渲染
  if (picture.value?.url) {
    cropperOptions.img = picture.value.url
  }
  isCropModalVisible.value = true
}

/**
 * 确认裁剪/旋转逻辑
 */
const handleCropConfirm = () => {
  // TODO: 留给你来实现具体逻辑
  // 提示：你可以通过 cropperRef.value.getCropData() 或 getCropBlob() 获取裁剪后的数据
  // 并调用后端的上传/更新接口覆盖原图片数据
  cropperRef.value.getCropBlob( async (blob: Blob) => {
    if (!blob) {
      message.warn('请先裁剪图片')
      return
    }
    const name = picture.value?.name || 'cropped-image'
    const fileName = name + '.png'
    const file = new File([blob], fileName, { type: 'image/png' })
    const res = await uploadPictureUsingPost({ spaceId: useSpaceVoStore().spaceVo.id, picName: name }, {}, file) as any
    if (res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
    }else {
      message.warn('图片上传失败')
    }
  })
  // 逻辑执行完成后关闭弹窗
  isCropModalVisible.value = false
}

// 新增：向左旋转90°
const rotateLeft = () => {
  cropperRef.value.rotateLeft()
}
// 新增：向右旋转90°
const rotateRight = () => {
  cropperRef.value.rotateRight()
}
// 新增：旋转180°
const rotatePlane = () => {
  cropperRef.value.rotateRight()
  cropperRef.value.rotateRight()
}

/**
 * 修改图片信息
 * @param values
 */
const editPicture = async (values:any) => {
  try {
    if(pictureForm.name?.length > 18){
      message.warn('名称最大长度为18')
      return
    }
    const params = { id: picture.value?.id, ...values }
    const res = await editPictureUsingPost(params)
    if (res.data.code === 0 && res.data.data) {
      if(route.query.id){
        message.success('修改成功')
      }else {
        message.success('创建成功')
      }
      router.push({
        path: `/picture/${picture.value?.id}`
      })
    } else {
      if(route.query.id){
        message.error('修改失败')
      }else {
        message.error('创建失败')
      }
    }
  } catch (e:any) {
    message.error(e.message)
  }
}

/**
 * 获取标签列表
 */
const getTagAndCategoryList = async () => {
  try {
    const res = await listPictureTagCategoryUsingGet()
    if (res.data.code === 0 && res.data.data) {
      categoryList.value = (res.data.data.categoryList ?? []).map((item: string) => {
        return { value: item }
      })
      tagList.value = (res.data.data.tagList ?? []).map((item: string) => {
        return { value: item }
      })
    } else {
      message.error('加载信息失败')
    }
  } catch (e) {
    message.error(e.message)
  }
}

onMounted(async () => {
  if (useLoginUserStore().loginUser.id){
    await useSpaceVoStore().fetchSpaceVo()
  }
  const picId = route.query.id
  if(picId){
    const res = await getPictureVoByIdUsingGet({ id: picId })
    if(res.data.code === 0 && res.data.data) {
      picture.value = res.data.data
      pictureForm.name = picture.value.name
      pictureForm.introduction = picture.value.introduction
      pictureForm.category = picture.value.category
      pictureForm.tags = picture.value.tags
    }else {
      message.error('图片信息加载失败')
    }
  }
  getTagAndCategoryList()
})
</script>

<style scoped>

</style>

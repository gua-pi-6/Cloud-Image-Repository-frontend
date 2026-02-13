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


    <a-form v-if="picture?.id"
            layout="vertical"
            :model="pictureForm"
            @finish="editPicture"
            style="margin-top: 16px;"
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
  </div>

</template>

<script setup lang="ts">
import UploadPictureComponent from '@/components/picture/UploadPictureComponent.vue'
import { onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { editPictureUsingPost, getPictureVoByIdUsingGet, listPictureTagCategoryUsingGet } from '@/api/pictureController'
import { message } from 'ant-design-vue'
import UrlUploadPictureComponent from '@/components/picture/UrlUploadPictureComponent.vue'
import { useSpaceVoStore } from '@/stores/useSpaceVoStore'
import { useLoginUserStore } from '@/stores/useLoginUserStore'

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

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { message } from 'ant-design-vue'
import router from '../router'
import { getSpaceVoUsingPost } from '../api/spaceController'

export const useSpaceVoStore = defineStore('useSpaceVoStore', () => {
  const spaceVo = ref<API.SpaceVO>({
    id: null
  })


  const fetchSpaceVo = async () => {
    if(!spaceVo.value.id){
      const res = await getSpaceVoUsingPost()
      if (res?.data.code === 0 && res?.data.data){
        spaceVo.value = res.data.data
      }
    }
  }

  const setSpaceVo = async (newSpaceVo: API.SpaceVO) => {
    spaceVo.value = newSpaceVo
  }
  return {spaceVo, fetchSpaceVo, setSpaceVo}

})



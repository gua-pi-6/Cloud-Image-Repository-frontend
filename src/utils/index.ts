/**
 * 图片大小转换
 * @param size
 */
export const showPictureSize = (size: number) => {
  const mb = 1024 * 1024
  const kb = 1024
  if(size >= mb){
    return `${(size / mb).toFixed(2)}MB`
  }else if(size >= kb){
    return `${(size / kb).toFixed(2)}KB`
  }else {
    return `${size}B`
  }
}

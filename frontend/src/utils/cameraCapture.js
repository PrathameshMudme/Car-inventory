/**
 * Utility function to capture image from camera
 * @param {Function} onCapture - Callback function that receives the captured file
 * @param {Function} showToast - Toast notification function
 */
export const captureImageFromCamera = async (onCapture, showToast) => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment' }
    })
    
    const video = document.createElement('video')
    video.srcObject = stream
    video.play()
    
    const cameraModal = document.createElement('div')
    cameraModal.style.cssText = `
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0,0,0,0.9); z-index: 10000;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
    `
    
    const videoContainer = document.createElement('div')
    videoContainer.style.cssText = 'position: relative; max-width: 90%; max-height: 70%;'
    video.style.cssText = 'width: 100%; height: auto; max-height: 70vh;'
    videoContainer.appendChild(video)
    
    const buttonContainer = document.createElement('div')
    buttonContainer.style.cssText = 'margin-top: 20px; display: flex; gap: 10px;'
    
    const captureBtn = document.createElement('button')
    captureBtn.textContent = 'Capture'
    captureBtn.style.cssText = 'padding: 12px 24px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;'
    
    const cancelBtn = document.createElement('button')
    cancelBtn.textContent = 'Cancel'
    cancelBtn.style.cssText = 'padding: 12px 24px; background: #6c757d; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 16px;'
    
    captureBtn.onclick = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      ctx.drawImage(video, 0, 0)
      
      canvas.toBlob((blob) => {
        const file = new File([blob], `camera-${Date.now()}.jpg`, { type: 'image/jpeg' })
        onCapture([file])
        stream.getTracks().forEach(track => track.stop())
        document.body.removeChild(cameraModal)
      }, 'image/jpeg', 0.9)
    }
    
    cancelBtn.onclick = () => {
      stream.getTracks().forEach(track => track.stop())
      document.body.removeChild(cameraModal)
    }
    
    buttonContainer.appendChild(captureBtn)
    buttonContainer.appendChild(cancelBtn)
    cameraModal.appendChild(videoContainer)
    cameraModal.appendChild(buttonContainer)
    document.body.appendChild(cameraModal)
  } catch (error) {
    console.error('Camera error:', error)
    if (showToast) {
      showToast('Camera access denied or not available. Please use file upload instead.', 'error')
    }
  }
}

import './style.css'

// 나노바나나 API 설정 (실제 API 키와 엔드포인트로 교체 필요)
const NANOBANANA_API_KEY = 'YOUR_API_KEY_HERE'
const NANOBANANA_API_URL = 'https://api.nanobanana.com/v1/material-synthesis'

// 전역 상태
let uploadedImage = null
let selectedMaterial = null

document.addEventListener('DOMContentLoaded', () => {
  initializeApp()
})

function initializeApp() {
  setupImageUpload()
  setupMaterialSelection()
  setupGenerateButton()
  setupResultActions()
}

// 이미지 업로드 기능
function setupImageUpload() {
  const uploadArea = document.getElementById('uploadArea')
  const imageInput = document.getElementById('imageInput')
  const imagePreview = document.getElementById('imagePreview')
  const previewImg = document.getElementById('previewImg')
  const removeBtn = document.getElementById('removeBtn')
  const materialSection = document.getElementById('materialSection')

  // 클릭으로 파일 선택
  uploadArea.addEventListener('click', () => {
    imageInput.click()
  })

  // 드래그 앤 드롭
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault()
    uploadArea.classList.add('dragover')
  })

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover')
  })

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault()
    uploadArea.classList.remove('dragover')
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  })

  // 파일 선택 처리
  imageInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileSelect(e.target.files[0])
    }
  })

  // 이미지 제거
  removeBtn.addEventListener('click', (e) => {
    e.stopPropagation()
    removeImage()
  })

  function handleFileSelect(file) {
    // 파일 유효성 검사
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.')
      return
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      alert('파일 크기는 10MB를 초과할 수 없습니다.')
      return
    }

    // 이미지 미리보기
    const reader = new FileReader()
    reader.onload = (e) => {
      previewImg.src = e.target.result
      uploadedImage = file
      
      // UI 업데이트
      uploadArea.style.display = 'none'
      imagePreview.style.display = 'block'
      materialSection.style.display = 'block'
      
      // 애니메이션 효과
      setTimeout(() => {
        materialSection.style.opacity = '0'
        materialSection.style.transform = 'translateY(30px)'
        materialSection.style.transition = 'all 0.6s ease'
        materialSection.style.opacity = '1'
        materialSection.style.transform = 'translateY(0)'
      }, 100)
    }
    reader.readAsDataURL(file)
  }

  function removeImage() {
    uploadedImage = null
    selectedMaterial = null
    
    // UI 초기화
    uploadArea.style.display = 'flex'
    imagePreview.style.display = 'none'
    materialSection.style.display = 'none'
    
    // 선택된 소재 초기화
    document.querySelectorAll('.material-card').forEach(card => {
      card.classList.remove('selected')
    })
    
    // 생성 버튼 비활성화
    document.getElementById('generateBtn').disabled = true
  }
}

// 소재 선택 기능
function setupMaterialSelection() {
  const materialCards = document.querySelectorAll('.material-card')
  const generateBtn = document.getElementById('generateBtn')

  materialCards.forEach(card => {
    card.addEventListener('click', () => {
      // 이전 선택 제거
      materialCards.forEach(c => c.classList.remove('selected'))
      
      // 현재 선택 추가
      card.classList.add('selected')
      selectedMaterial = card.dataset.material
      
      // 생성 버튼 활성화
      if (uploadedImage && selectedMaterial) {
        generateBtn.disabled = false
      }
    })
  })
}

// AI 생성 버튼 기능
function setupGenerateButton() {
  const generateBtn = document.getElementById('generateBtn')
  const resultSection = document.getElementById('resultSection')

  generateBtn.addEventListener('click', async () => {
    if (!uploadedImage || !selectedMaterial) {
      alert('이미지와 소재를 모두 선택해주세요.')
      return
    }

    // 결과 섹션 표시
    resultSection.style.display = 'block'
    resultSection.scrollIntoView({ behavior: 'smooth' })

    // 원본 이미지 표시
    const originalResult = document.getElementById('originalResult')
    originalResult.src = URL.createObjectURL(uploadedImage)

    // AI 생성 시작
    await generateMaterialComposition()
  })
}

// AI 합성 기능 (나노바나나 API 연동)
async function generateMaterialComposition() {
  const loading = document.getElementById('loading')
  const generatedResult = document.getElementById('generatedResult')
  const downloadBtn = document.getElementById('downloadBtn')

  try {
    // 로딩 표시
    loading.style.display = 'block'

    // FormData 준비
    const formData = new FormData()
    formData.append('image', uploadedImage)
    formData.append('material', selectedMaterial)

    // 실제 API 호출 (현재는 시뮬레이션)
    // const response = await fetch(NANOBANANA_API_URL, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${NANOBANANA_API_KEY}`,
    //   },
    //   body: formData
    // })

    // API 응답 시뮬레이션
    await simulateAPICall()

    // 로딩 숨김
    loading.style.display = 'none'

    // 결과 표시 (시뮬레이션)
    generatedResult.src = URL.createObjectURL(uploadedImage) // 실제로는 API 응답 이미지
    generatedResult.style.display = 'block'
    downloadBtn.style.display = 'inline-block'

    // 성공 메시지
    showNotification('AI 합성이 완료되었습니다! 🎉', 'success')

  } catch (error) {
    console.error('AI 생성 오류:', error)
    loading.style.display = 'none'
    showNotification('AI 합성 중 오류가 발생했습니다. 다시 시도해주세요.', 'error')
  }
}

// API 호출 시뮬레이션
function simulateAPICall() {
  return new Promise(resolve => {
    setTimeout(resolve, 3000) // 3초 대기
  })
}

// 결과 액션 버튼
function setupResultActions() {
  const downloadBtn = document.getElementById('downloadBtn')
  const restartBtn = document.getElementById('restartBtn')

  downloadBtn.addEventListener('click', () => {
    // 결과 이미지 다운로드
    const generatedResult = document.getElementById('generatedResult')
    if (generatedResult.src) {
      const link = document.createElement('a')
      link.href = generatedResult.src
      link.download = `cmf-design-${selectedMaterial}-${Date.now()}.jpg`
      link.click()
    }
  })

  restartBtn.addEventListener('click', () => {
    // 전체 초기화
    location.reload()
  })
}

// 알림 표시 함수
function showNotification(message, type = 'info') {
  const notification = document.createElement('div')
  notification.className = `notification ${type}`
  notification.textContent = message
  
  // 스타일 적용
  Object.assign(notification.style, {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '1rem 1.5rem',
    borderRadius: '10px',
    color: 'white',
    fontWeight: 'bold',
    zIndex: '1000',
    transition: 'all 0.3s ease',
    transform: 'translateX(100%)'
  })

  // 타입별 색상
  if (type === 'success') {
    notification.style.background = '#48bb78'
  } else if (type === 'error') {
    notification.style.background = '#f56565'
  } else {
    notification.style.background = '#4299e1'
  }

  document.body.appendChild(notification)

  // 애니메이션
  setTimeout(() => {
    notification.style.transform = 'translateX(0)'
  }, 100)

  // 자동 제거
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)'
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 3000)
}
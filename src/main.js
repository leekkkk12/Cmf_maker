import './style.css'

// API 엔드포인트 (Vercel 서버리스 함수 사용)
const IMAGE_GENERATION_API = '/api/generate-image'

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
  setupChangelog()
  checkForUpdates()
}

// 변경 내역 기능
function setupChangelog() {
  const changelogBtn = document.getElementById('changelogBtn')
  const changelogModal = document.getElementById('changelogModal')
  const closeBtn = document.getElementById('closeChangelogBtn')

  changelogBtn.addEventListener('click', () => {
    changelogModal.style.display = 'flex'
    // 새 업데이트 표시 제거
    localStorage.setItem('lastViewedVersion', '1.3.0')
    updateVersionDisplay()
  })

  closeBtn.addEventListener('click', () => {
    changelogModal.style.display = 'none'
  })

  changelogModal.addEventListener('click', (e) => {
    if (e.target === changelogModal) {
      changelogModal.style.display = 'none'
    }
  })
}

// 업데이트 확인
function checkForUpdates() {
  const currentVersion = '1.3.0'
  const lastViewedVersion = localStorage.getItem('lastViewedVersion')
  
  if (!lastViewedVersion || lastViewedVersion !== currentVersion) {
    // 새 업데이트 알림
    showUpdateNotification()
    updateVersionDisplay(true)
  } else {
    updateVersionDisplay(false)
  }
}

// 버전 표시 업데이트
function updateVersionDisplay(hasUpdate = false) {
  const changelogBtn = document.getElementById('changelogBtn')
  
  if (hasUpdate) {
    changelogBtn.classList.add('has-update')
    changelogBtn.innerHTML = '🔔 새 업데이트!'
  } else {
    changelogBtn.classList.remove('has-update')
    changelogBtn.innerHTML = '📋 업데이트 내역'
  }
}

// 업데이트 알림
function showUpdateNotification() {
  setTimeout(() => {
    showNotification('🎉 v1.3.0 업데이트! Pure Gemini AI 모드로 업그레이드되었습니다.', 'info')
  }, 2000)
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

// AI 합성 기능 (Gemini 2.5 Flash API 연동)
async function generateMaterialComposition() {
  const loading = document.getElementById('loading')
  const generatedResult = document.getElementById('generatedResult')
  const downloadBtn = document.getElementById('downloadBtn')

  try {
    // 로딩 표시
    loading.style.display = 'block'

    // 이미지 생성 프롬프트 생성
    const imagePrompt = generateDirectImagePrompt(selectedMaterial)

    // 실제 이미지 생성
    const generatedImageUrl = await generateImageWithGemini(imagePrompt)
    
    if (!generatedImageUrl) {
      throw new Error('이미지 생성에 실패했습니다.')
    }

    // 로딩 숨김
    loading.style.display = 'none'

    // 실제 생성된 이미지 표시
    await displayGeneratedImage(generatedImageUrl)

    // 결과 표시
    downloadBtn.style.display = 'inline-block'

    // 성공 메시지
    showNotification('Gemini AI 이미지 생성 완료! 🤖', 'success')

  } catch (error) {
    console.error('Gemini AI 생성 오류:', error)
    loading.style.display = 'none'
    showNotification(`Gemini AI 오류: ${error.message}`, 'error')
  }
}

// 소재 이름 반환
function getMaterialName(material) {
  const names = {
    wood: '나무',
    metal: '메탈',
    fabric: '패브릭',
    leather: '가죽',
    marble: '대리석',
    carbon: '카본'
  }
  return names[material] || material
}

// 직접 이미지 생성 프롬프트
function generateDirectImagePrompt(material) {
  const materialPrompts = {
    wood: 'High-quality product photography of a modern product with natural wood grain texture, warm brown wooden tones, organic wooden surface finish, realistic wood material, beautiful wood patterns and grain details',
    metal: 'High-quality product photography of a sleek product with polished metal surface, reflective metallic finish, chrome or brushed steel appearance, industrial metal texture, mirror-like reflections',
    fabric: 'High-quality product photography of an elegant product with soft textile surface, fabric weave pattern, cloth material texture, natural fiber appearance, cozy fabric texture',
    leather: 'High-quality product photography of a luxury product with premium leather texture, smooth leather finish, rich brown leather surface, sophisticated leather material, natural leather grain',
    marble: 'High-quality product photography of an elegant product with marble surface, natural stone veining patterns, polished marble finish, sophisticated white and gray marble texture, luxury stone material',
    carbon: 'High-quality product photography of a high-tech product with carbon fiber pattern, advanced composite material, dark woven carbon texture, modern industrial finish, futuristic carbon weave'
  }

  return `${materialPrompts[material]}. 
Professional studio lighting, clean white background, photorealistic rendering, 
premium product design, commercial product shot, ultra-high resolution, 
perfect lighting and shadows, detailed surface texture.
Style: Modern, elegant, minimalist product photography, luxury design aesthetic.`
}

// Gemini API를 통한 이미지 생성 (서버리스 함수 사용)
async function generateImageWithGemini(prompt) {
  console.log('Gemini API 이미지 생성 시작:', prompt)
  
  const response = await fetch(IMAGE_GENERATION_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prompt })
  })

  const data = await response.json()

  if (!data.success) {
    throw new Error(data.error || '서버 오류')
  }

  // base64 이미지를 blob URL로 변환
  const blob = base64ToBlob(data.imageData, 'image/jpeg')
  return URL.createObjectURL(blob)
}

// base64를 blob으로 변환
function base64ToBlob(base64, mimeType) {
  const bytes = atob(base64)
  const arrayBuffer = new ArrayBuffer(bytes.length)
  const uint8Array = new Uint8Array(arrayBuffer)
  
  for (let i = 0; i < bytes.length; i++) {
    uint8Array[i] = bytes.charCodeAt(i)
  }
  
  return new Blob([arrayBuffer], { type: mimeType })
}


// 생성된 이미지 표시
async function displayGeneratedImage(imageUrl) {
  const generatedResult = document.getElementById('generatedResult')
  const resultPlaceholder = document.getElementById('resultPlaceholder')
  
  // 실제 생성된 이미지 표시
  generatedResult.src = imageUrl
  generatedResult.style.display = 'block'
  
  // 소재 정보 표시
  const materialInfo = document.createElement('div')
  materialInfo.className = 'ai-description-overlay'
  materialInfo.innerHTML = `
    <div class="description-content">
      <h4>AI CMF 디자인 생성 완료</h4>
      <p>적용된 소재: <strong>${getMaterialName(selectedMaterial)}</strong></p>
      <p>Gemini AI가 ${getMaterialName(selectedMaterial)} 질감을 적용한 제품 이미지를 생성했습니다.</p>
      <p class="tech-note">※ 실제 제품 제작 시 참고용 디자인입니다.</p>
    </div>
  `
  
  resultPlaceholder.innerHTML = ''
  resultPlaceholder.appendChild(materialInfo)
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
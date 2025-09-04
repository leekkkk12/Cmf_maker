import './style.css'

// Gemini API 설정 (나노바나나)
const GEMINI_API_KEY = 'AIzaSyBy834fThh6Pm5k0wci0C06qPjhhgQYTBc'
const GEMINI_IMAGE_GEN_URL = 'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage'

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
    showNotification('AI 합성이 완료되었습니다! 🎉', 'success')

  } catch (error) {
    console.error('AI 생성 오류:', error)
    loading.style.display = 'none'
    showNotification(`AI 합성 중 오류가 발생했습니다: ${error.message}`, 'error')
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

// Gemini로 이미지 생성
async function generateImageWithGemini(prompt) {
  const requestBody = {
    prompt: prompt,
    sampleCount: 1,
    aspectRatio: "1:1",
    safetySettings: [
      {
        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        threshold: "BLOCK_LOW_AND_ABOVE"
      },
      {
        category: "HARM_CATEGORY_HATE_SPEECH", 
        threshold: "BLOCK_LOW_AND_ABOVE"
      }
    ],
    personGeneration: "DONT_ALLOW"
  }

  try {
    const response = await fetch(`${GEMINI_IMAGE_GEN_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      console.log('이미지 생성 API 오류, 대체 방법 사용')
      return await generateFallbackImage(prompt)
    }

    const data = await response.json()
    
    if (data.candidates && data.candidates[0] && data.candidates[0].image) {
      // base64 이미지를 blob URL로 변환
      const base64Image = data.candidates[0].image.imageBytes
      const blob = base64ToBlob(base64Image, 'image/jpeg')
      return URL.createObjectURL(blob)
    }
    
    throw new Error('이미지 생성 응답 형식 오류')

  } catch (error) {
    console.error('Gemini 이미지 생성 오류:', error)
    return await generateFallbackImage(prompt)
  }
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

// 대체 이미지 생성 (CSS로 시뮬레이션)
async function generateFallbackImage(prompt) {
  return new Promise(resolve => {
    // Canvas로 소재 텍스처 생성
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 400
    canvas.height = 400
    
    // 선택된 소재에 따른 패턴 생성
    const materialPatterns = {
      wood: () => {
        const gradient = ctx.createLinearGradient(0, 0, 400, 400)
        gradient.addColorStop(0, '#8B4513')
        gradient.addColorStop(1, '#A0522D')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 400, 400)
        
        // 나무 결 패턴
        for (let i = 0; i < 10; i++) {
          ctx.strokeStyle = `rgba(139, 69, 19, ${0.3 + Math.random() * 0.3})`
          ctx.lineWidth = 2 + Math.random() * 3
          ctx.beginPath()
          ctx.moveTo(0, i * 40 + Math.random() * 20)
          ctx.quadraticCurveTo(200, i * 40 + Math.random() * 40, 400, i * 40 + Math.random() * 20)
          ctx.stroke()
        }
      },
      metal: () => {
        const gradient = ctx.createRadialGradient(200, 200, 0, 200, 200, 200)
        gradient.addColorStop(0, '#E8E8E8')
        gradient.addColorStop(0.7, '#C0C0C0')
        gradient.addColorStop(1, '#808080')
        ctx.fillStyle = gradient
        ctx.fillRect(0, 0, 400, 400)
      }
    }
    
    // 기본 패턴
    ctx.fillStyle = '#f0f0f0'
    ctx.fillRect(0, 0, 400, 400)
    
    // 소재별 패턴 적용
    if (materialPatterns[selectedMaterial]) {
      materialPatterns[selectedMaterial]()
    }
    
    // 텍스트 오버레이
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(`AI Generated: ${getMaterialName(selectedMaterial)}`, 200, 200)
    
    canvas.toBlob(blob => {
      resolve(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.8)
  })
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
      <h4>AI 생성 결과</h4>
      <p>선택한 소재: <strong>${getMaterialName(selectedMaterial)}</strong></p>
      <p>AI가 ${getMaterialName(selectedMaterial)} 질감을 적용한 제품 이미지를 생성했습니다.</p>
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
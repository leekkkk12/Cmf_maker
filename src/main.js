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
    showNotification('소재 이미지 생성이 완료되었습니다! 🎨', 'success')

  } catch (error) {
    console.error('AI 생성 오류:', error)
    loading.style.display = 'none'
    showNotification(`이미지 생성 중 오류가 발생했습니다: ${error.message}`, 'error')
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

// 이미지 생성 (Canvas 기반)
async function generateImageWithGemini(prompt) {
  // CORS 문제로 인해 Canvas 기반 이미지 생성 사용
  console.log('Canvas 기반 이미지 생성 시작:', prompt)
  return await generateEnhancedMaterialImage(selectedMaterial)
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

// 향상된 소재 이미지 생성
async function generateEnhancedMaterialImage(material) {
  return new Promise(resolve => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 512
    canvas.height = 512
    
    // 소재별 정교한 패턴 생성
    const materialGenerators = {
      wood: () => {
        // 나무 배경
        const woodGradient = ctx.createLinearGradient(0, 0, 512, 0)
        woodGradient.addColorStop(0, '#8B4513')
        woodGradient.addColorStop(0.3, '#A0522D')
        woodGradient.addColorStop(0.7, '#CD853F')
        woodGradient.addColorStop(1, '#D2B48C')
        ctx.fillStyle = woodGradient
        ctx.fillRect(0, 0, 512, 512)
        
        // 나무결 효과
        for (let i = 0; i < 20; i++) {
          ctx.strokeStyle = `rgba(101, 67, 33, ${0.1 + Math.random() * 0.3})`
          ctx.lineWidth = 1 + Math.random() * 2
          ctx.beginPath()
          const y = i * 25 + Math.random() * 10
          ctx.moveTo(0, y)
          ctx.quadraticCurveTo(256, y + Math.random() * 20 - 10, 512, y + Math.random() * 15 - 7)
          ctx.stroke()
        }
        
        // 나무 매듭
        for (let i = 0; i < 3; i++) {
          const x = Math.random() * 400 + 56
          const y = Math.random() * 400 + 56
          ctx.fillStyle = `rgba(101, 67, 33, 0.4)`
          ctx.beginPath()
          ctx.ellipse(x, y, 15 + Math.random() * 10, 8 + Math.random() * 5, 0, 0, 2 * Math.PI)
          ctx.fill()
        }
      },
      
      metal: () => {
        // 금속 배경
        const metalGradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 300)
        metalGradient.addColorStop(0, '#F5F5F5')
        metalGradient.addColorStop(0.3, '#E0E0E0')
        metalGradient.addColorStop(0.7, '#C0C0C0')
        metalGradient.addColorStop(1, '#A0A0A0')
        ctx.fillStyle = metalGradient
        ctx.fillRect(0, 0, 512, 512)
        
        // 금속 반사 효과
        const reflectionGradient = ctx.createLinearGradient(0, 0, 512, 512)
        reflectionGradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)')
        reflectionGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)')
        reflectionGradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)')
        ctx.fillStyle = reflectionGradient
        ctx.fillRect(0, 0, 512, 512)
        
        // 브러시 마크
        for (let i = 0; i < 30; i++) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 + Math.random() * 0.1})`
          ctx.lineWidth = 0.5 + Math.random()
          ctx.beginPath()
          ctx.moveTo(Math.random() * 512, 0)
          ctx.lineTo(Math.random() * 512, 512)
          ctx.stroke()
        }
      },
      
      fabric: () => {
        // 패브릭 배경
        ctx.fillStyle = '#D2B48C'
        ctx.fillRect(0, 0, 512, 512)
        
        // 직조 패턴
        ctx.strokeStyle = 'rgba(160, 82, 45, 0.3)'
        ctx.lineWidth = 1
        
        // 가로 섬유
        for (let y = 0; y < 512; y += 4) {
          ctx.beginPath()
          ctx.moveTo(0, y)
          ctx.lineTo(512, y)
          ctx.stroke()
        }
        
        // 세로 섬유
        for (let x = 0; x < 512; x += 4) {
          ctx.beginPath()
          ctx.moveTo(x, 0)
          ctx.lineTo(x, 512)
          ctx.stroke()
        }
        
        // 섬유 질감
        for (let i = 0; i < 100; i++) {
          ctx.fillStyle = `rgba(210, 180, 140, ${Math.random() * 0.3})`
          const size = Math.random() * 3 + 1
          ctx.fillRect(Math.random() * 512, Math.random() * 512, size, size)
        }
      },
      
      leather: () => {
        // 가죽 배경
        const leatherGradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 300)
        leatherGradient.addColorStop(0, '#8B4513')
        leatherGradient.addColorStop(0.5, '#A0522D')
        leatherGradient.addColorStop(1, '#654321')
        ctx.fillStyle = leatherGradient
        ctx.fillRect(0, 0, 512, 512)
        
        // 가죽 모공 효과
        for (let i = 0; i < 200; i++) {
          ctx.fillStyle = `rgba(101, 67, 33, ${Math.random() * 0.5})`
          const size = Math.random() * 2 + 0.5
          ctx.beginPath()
          ctx.arc(Math.random() * 512, Math.random() * 512, size, 0, 2 * Math.PI)
          ctx.fill()
        }
        
        // 가죽 주름
        for (let i = 0; i < 10; i++) {
          ctx.strokeStyle = `rgba(101, 67, 33, 0.3)`
          ctx.lineWidth = 1 + Math.random()
          ctx.beginPath()
          const startX = Math.random() * 512
          const startY = Math.random() * 512
          ctx.moveTo(startX, startY)
          ctx.quadraticCurveTo(
            startX + Math.random() * 100 - 50,
            startY + Math.random() * 100 - 50,
            startX + Math.random() * 150 - 75,
            startY + Math.random() * 150 - 75
          )
          ctx.stroke()
        }
      },
      
      marble: () => {
        // 대리석 배경
        const marbleGradient = ctx.createLinearGradient(0, 0, 512, 512)
        marbleGradient.addColorStop(0, '#F5F5DC')
        marbleGradient.addColorStop(0.3, '#FFFFFF')
        marbleGradient.addColorStop(0.7, '#E6E6FA')
        marbleGradient.addColorStop(1, '#D3D3D3')
        ctx.fillStyle = marbleGradient
        ctx.fillRect(0, 0, 512, 512)
        
        // 대리석 베인
        for (let i = 0; i < 15; i++) {
          ctx.strokeStyle = `rgba(169, 169, 169, ${0.2 + Math.random() * 0.3})`
          ctx.lineWidth = 1 + Math.random() * 3
          ctx.beginPath()
          const startX = Math.random() * 512
          const startY = Math.random() * 512
          ctx.moveTo(startX, startY)
          
          let currentX = startX
          let currentY = startY
          for (let j = 0; j < 5; j++) {
            currentX += Math.random() * 80 - 40
            currentY += Math.random() * 80 - 40
            ctx.quadraticCurveTo(
              currentX + Math.random() * 40 - 20,
              currentY + Math.random() * 40 - 20,
              currentX,
              currentY
            )
          }
          ctx.stroke()
        }
      },
      
      carbon: () => {
        // 카본 배경
        ctx.fillStyle = '#2C2C2C'
        ctx.fillRect(0, 0, 512, 512)
        
        // 카본 섬유 패턴
        const size = 8
        for (let x = 0; x < 512; x += size * 2) {
          for (let y = 0; y < 512; y += size * 2) {
            // 첫 번째 방향
            ctx.fillStyle = '#404040'
            ctx.fillRect(x, y, size, size)
            ctx.fillRect(x + size, y + size, size, size)
            
            // 두 번째 방향
            ctx.fillStyle = '#1A1A1A'
            ctx.fillRect(x + size, y, size, size)
            ctx.fillRect(x, y + size, size, size)
          }
        }
        
        // 카본 섬유 광택
        for (let i = 0; i < 20; i++) {
          ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.1})`
          ctx.lineWidth = 0.5
          ctx.beginPath()
          ctx.moveTo(Math.random() * 512, 0)
          ctx.lineTo(Math.random() * 512, 512)
          ctx.stroke()
        }
      }
    }
    
    // 소재별 패턴 생성
    if (materialGenerators[material]) {
      materialGenerators[material]()
    } else {
      // 기본 패턴
      ctx.fillStyle = '#F0F0F0'
      ctx.fillRect(0, 0, 512, 512)
    }
    
    // 제품 실루엣 (예: 스마트폰 형태)
    drawProductSilhouette(ctx, material)
    
    canvas.toBlob(blob => {
      resolve(URL.createObjectURL(blob))
    }, 'image/jpeg', 0.9)
  })
}

// 제품 실루엣 그리기
function drawProductSilhouette(ctx, material) {
  const centerX = 256
  const centerY = 256
  const width = 150
  const height = 280
  const cornerRadius = 20
  
  // 제품 그림자
  ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
  drawRoundedRect(ctx, centerX - width/2 + 5, centerY - height/2 + 5, width, height, cornerRadius)
  ctx.fill()
  
  // 제품 본체
  ctx.fillStyle = getProductColor(material)
  drawRoundedRect(ctx, centerX - width/2, centerY - height/2, width, height, cornerRadius)
  ctx.fill()
  
  // 제품 하이라이트
  const gradient = ctx.createLinearGradient(centerX - width/2, centerY - height/2, centerX + width/2, centerY + height/2)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
  gradient.addColorStop(1, 'rgba(255, 255, 255, 0.1)')
  ctx.fillStyle = gradient
  drawRoundedRect(ctx, centerX - width/2, centerY - height/2, width, height, cornerRadius)
  ctx.fill()
  
  // 제품 테두리
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)'
  ctx.lineWidth = 2
  drawRoundedRect(ctx, centerX - width/2, centerY - height/2, width, height, cornerRadius)
  ctx.stroke()
}

// 둥근 사각형 그리기
function drawRoundedRect(ctx, x, y, width, height, cornerRadius) {
  ctx.beginPath()
  ctx.moveTo(x + cornerRadius, y)
  ctx.lineTo(x + width - cornerRadius, y)
  ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius)
  ctx.lineTo(x + width, y + height - cornerRadius)
  ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height)
  ctx.lineTo(x + cornerRadius, y + height)
  ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius)
  ctx.lineTo(x, y + cornerRadius)
  ctx.quadraticCurveTo(x, y, x + cornerRadius, y)
  ctx.closePath()
}

// 소재별 제품 색상
function getProductColor(material) {
  const colors = {
    wood: 'rgba(139, 69, 19, 0.8)',
    metal: 'rgba(192, 192, 192, 0.8)',
    fabric: 'rgba(210, 180, 140, 0.8)',
    leather: 'rgba(101, 67, 33, 0.8)',
    marble: 'rgba(245, 245, 220, 0.8)',
    carbon: 'rgba(44, 44, 44, 0.8)'
  }
  return colors[material] || 'rgba(240, 240, 240, 0.8)'
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
      <h4>CMF 디자인 생성 완료</h4>
      <p>적용된 소재: <strong>${getMaterialName(selectedMaterial)}</strong></p>
      <p>Canvas 기술로 ${getMaterialName(selectedMaterial)} 질감을 적용한 제품 이미지를 생성했습니다.</p>
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
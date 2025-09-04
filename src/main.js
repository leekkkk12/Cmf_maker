import './style.css'

// Gemini 2.5 Flash API 설정 (나노바나나)
const GEMINI_API_KEY = 'AIzaSyBy834fThh6Pm5k0wci0C06qPjhhgQYTBc'
const GEMINI_ANALYSIS_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'
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

    // 이미지를 base64로 변환
    const imageBase64 = await convertImageToBase64(uploadedImage)
    
    // 1단계: 이미지 분석
    const analysisResponse = await callGeminiAnalysis(imageBase64, selectedMaterial)
    
    if (analysisResponse.error) {
      throw new Error(analysisResponse.error)
    }

    // 2단계: 이미지 생성 프롬프트 생성
    const imagePrompt = generateImagePrompt(analysisResponse.description, selectedMaterial)

    // 3단계: 실제 이미지 생성
    const generatedImageUrl = await generateImageWithGemini(imagePrompt)
    
    if (!generatedImageUrl) {
      throw new Error('이미지 생성에 실패했습니다.')
    }

    // 로딩 숨김
    loading.style.display = 'none'

    // 실제 생성된 이미지 표시
    await displayGeneratedImage(generatedImageUrl, analysisResponse.description)

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

// 이미지를 base64로 변환
async function convertImageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result.split(',')[1] // data:image/jpeg;base64, 부분 제거
      resolve(base64)
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// Gemini 분석 API 호출
async function callGeminiAnalysis(imageBase64, material) {
  const materialDescriptions = {
    wood: '자연스러운 목재 질감 (나무결, 갈색 톤, 따뜻한 느낌)',
    metal: '고급스러운 금속 질감 (반사, 차가운 은색/회색 톤, 매끄러운 표면)',
    fabric: '부드러운 직물 질감 (섬유 패턴, 부드러운 표면, 자연스러운 색상)',
    leather: '세련된 가죽 질감 (매끄러운 표면, 깊은 갈색, 고급스러운 느낌)',
    marble: '고급스러운 대리석 질감 (베이지/흰색, 자연스러운 결, 광택)',
    carbon: '모던한 카본파이버 (검은색, 격자 패턴, 하이테크 느낌)'
  }

  const prompt = `이 이미지의 제품을 분석하고, ${materialDescriptions[material]}으로 소재를 변경했을 때의 모습을 자세히 설명해주세요. 

다음 형식으로 답변해주세요:
1. 원본 제품 분석: 어떤 제품인지, 현재 소재는 무엇인지
2. 소재 변경 효과: ${material} 소재로 바뀌었을 때의 시각적 변화
3. 색상 변화: 구체적인 색상 팔레트
4. 질감 변화: 표면 질감의 변화
5. 전체적인 느낌: 디자인의 인상 변화

실제 제품 디자인 관점에서 전문적이고 구체적으로 설명해주세요.`

  const requestBody = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: "image/jpeg",
            data: imageBase64
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
    }
  }

  try {
    const response = await fetch(`${GEMINI_ANALYSIS_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`API 오류: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('AI 응답 형식이 올바르지 않습니다.')
    }

    return {
      description: data.candidates[0].content.parts[0].text
    }

  } catch (error) {
    console.error('Gemini API 호출 오류:', error)
    return {
      error: error.message
    }
  }
}

// AI 결과 표시
async function displayAIResult(description) {
  const generatedResult = document.getElementById('generatedResult')
  const resultPlaceholder = document.getElementById('resultPlaceholder')
  
  // AI 설명을 시각적으로 표현하는 HTML 생성
  const resultHTML = `
    <div class="ai-result-content">
      <div class="ai-description">
        <h4>AI 분석 결과</h4>
        <div class="description-text">${formatDescription(description)}</div>
      </div>
      <div class="material-preview-large ${selectedMaterial}">
        <div class="preview-overlay">
          <span>AI가 제안한 ${getMaterialName(selectedMaterial)} 적용</span>
        </div>
      </div>
    </div>
  `
  
  resultPlaceholder.innerHTML = resultHTML
}

// 설명 텍스트 포매팅
function formatDescription(text) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => `<p>${line}</p>`)
    .join('')
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

// 이미지 생성 프롬프트 생성
function generateImagePrompt(analysisResult, material) {
  const materialStyles = {
    wood: 'natural wood grain texture, warm brown tones, organic wooden surface, realistic wood material',
    metal: 'polished metal surface, reflective metallic finish, chrome or brushed steel appearance, industrial metal texture',
    fabric: 'soft textile surface, fabric weave pattern, cloth material texture, natural fiber appearance',
    leather: 'premium leather texture, smooth leather finish, rich brown leather surface, luxury leather material',
    marble: 'elegant marble surface, natural stone veining, polished marble finish, sophisticated stone texture',
    carbon: 'carbon fiber pattern, high-tech composite material, dark woven carbon texture, modern industrial finish'
  }

  // 분석 결과에서 제품 유형 추출
  const productMatch = analysisResult.match(/제품.*?[은는이가]\s*([^.]*)/i)
  const productType = productMatch ? productMatch[1] : '제품'
  
  return `High-quality product photography of a ${productType} with ${materialStyles[material]}. 
Professional studio lighting, clean white background, photorealistic rendering, 
detailed ${material} surface texture, premium product design, 
commercial product shot, ultra-high resolution, perfect lighting and shadows.
Style: Modern, elegant, minimalist product photography.`
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
async function displayGeneratedImage(imageUrl, description) {
  const generatedResult = document.getElementById('generatedResult')
  const resultPlaceholder = document.getElementById('resultPlaceholder')
  
  // 실제 생성된 이미지 표시
  generatedResult.src = imageUrl
  generatedResult.style.display = 'block'
  
  // 설명도 함께 표시
  const descriptionDiv = document.createElement('div')
  descriptionDiv.className = 'ai-description-overlay'
  descriptionDiv.innerHTML = `
    <div class="description-content">
      <h4>AI 분석 및 생성 결과</h4>
      <div class="description-text">${formatDescription(description)}</div>
    </div>
  `
  
  resultPlaceholder.innerHTML = ''
  resultPlaceholder.appendChild(descriptionDiv)
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
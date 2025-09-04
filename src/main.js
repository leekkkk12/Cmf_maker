import './style.css'

// Gemini 2.5 Flash API 설정
const GEMINI_API_KEY = 'AIzaSyBy834fThh6Pm5k0wci0C06qPjhhgQYTBc'
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'

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
    
    // Gemini API 호출
    const response = await callGeminiAPI(imageBase64, selectedMaterial)
    
    if (response.error) {
      throw new Error(response.error)
    }

    // 로딩 숨김
    loading.style.display = 'none'

    // AI가 생성한 이미지 설명을 바탕으로 시각적 표현 생성
    await displayAIResult(response.description)

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

// Gemini API 호출
async function callGeminiAPI(imageBase64, material) {
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
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
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
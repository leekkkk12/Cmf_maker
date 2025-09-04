export default async function handler(req, res) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const { prompt } = req.body
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY

    console.log('API 키 존재 여부:', !!GEMINI_API_KEY)
    console.log('요청 프롬프트:', prompt?.substring(0, 100) + '...')

    if (!GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY 환경변수가 설정되지 않음')
      return res.status(500).json({
        success: false,
        error: 'API 키가 설정되지 않았습니다.'
      })
    }

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: '프롬프트가 필요합니다.'
      })
    }

    // Gemini Imagen 3.0 API 요청 형식 수정
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
        },
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_LOW_AND_ABOVE"
        },
        {
          category: "HARM_CATEGORY_DANGEROUS_CONTENT",
          threshold: "BLOCK_LOW_AND_ABOVE"
        }
      ],
      personGeneration: "DONT_ALLOW"
    }

    console.log('Gemini API 호출 시작...')

    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:generateImage?key=${GEMINI_API_KEY}`
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    console.log('API 응답 상태:', response.status)
    
    // 응답 텍스트 먼저 읽기
    const responseText = await response.text()
    console.log('API 응답 텍스트 (처음 200자):', responseText.substring(0, 200))

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`
      
      try {
        const errorData = JSON.parse(responseText)
        errorMessage = errorData.error?.message || errorMessage
      } catch (e) {
        console.error('에러 응답 파싱 실패:', e)
      }
      
      console.error('Gemini API 에러:', errorMessage)
      return res.status(500).json({
        success: false,
        error: `Gemini API 오류: ${errorMessage}`
      })
    }

    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      console.error('JSON 파싱 오류:', e)
      return res.status(500).json({
        success: false,
        error: '응답 파싱 오류'
      })
    }
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].image) {
      console.error('응답 형식 오류:', JSON.stringify(data, null, 2))
      return res.status(500).json({
        success: false,
        error: '이미지 생성 실패 - 응답 형식 오류'
      })
    }

    console.log('이미지 생성 성공')
    
    // base64 이미지 데이터 반환
    res.status(200).json({
      success: true,
      imageData: data.candidates[0].image.imageBytes
    })

  } catch (error) {
    console.error('서버리스 함수 오류:', error)
    res.status(500).json({
      success: false,
      error: `서버 오류: ${error.message}`
    })
  }
}
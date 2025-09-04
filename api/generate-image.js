import { GoogleGenerativeAI } from '@google/generative-ai'

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

    console.log('Gemini SDK 초기화...')
    
    // Google GenAI SDK 사용
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
    
    console.log('이미지 생성 모델 호출...')
    
    // Gemini 2.5 Flash Image Preview 모델 사용
    const response = await genAI.generateContent({
      model: "gemini-2.5-flash-image-preview",
      contents: prompt,
    })

    console.log('API 응답 받음, 후보자 수:', response.candidates?.length)

    if (!response.candidates || response.candidates.length === 0) {
      throw new Error('응답에 후보자가 없습니다.')
    }

    const candidate = response.candidates[0]
    if (!candidate.content || !candidate.content.parts) {
      throw new Error('응답 구조가 올바르지 않습니다.')
    }

    console.log('응답 파트 수:', candidate.content.parts.length)

    // 이미지 데이터 찾기
    let imageData = null
    for (const part of candidate.content.parts) {
      if (part.inlineData && part.inlineData.data) {
        imageData = part.inlineData.data
        console.log('이미지 데이터 찾음, 크기:', imageData.length)
        break
      }
    }

    if (!imageData) {
      console.error('이미지 데이터를 찾을 수 없음')
      return res.status(500).json({
        success: false,
        error: '이미지 데이터를 찾을 수 없습니다.'
      })
    }

    console.log('이미지 생성 성공')
    
    // base64 이미지 데이터 반환
    res.status(200).json({
      success: true,
      imageData: imageData
    })

  } catch (error) {
    console.error('서버리스 함수 오류:', error)
    res.status(500).json({
      success: false,
      error: `서버 오류: ${error.message}`
    })
  }
}
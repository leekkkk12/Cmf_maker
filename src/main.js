import './style.css'

// 간단한 인터랙션 추가
document.addEventListener('DOMContentLoaded', () => {
  const button = document.querySelector('.cta-button')
  
  if (button) {
    button.addEventListener('click', () => {
      alert('Vite로 만든 웹사이트에 오신 것을 환영합니다! 🚀')
    })
  }
  
  // 페이드인 애니메이션
  const elements = document.querySelectorAll('.hero, .features')
  elements.forEach((el, index) => {
    el.style.opacity = '0'
    el.style.transform = 'translateY(30px)'
    
    setTimeout(() => {
      el.style.transition = 'all 0.6s ease'
      el.style.opacity = '1'
      el.style.transform = 'translateY(0)'
    }, index * 200)
  })
})
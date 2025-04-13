import { createRouter, createWebHistory } from 'vue-router'
import DonationPage from '../views/DonationPage.vue' 
import ThankYouPage from '../views/ThankYouPage.vue' 

const routes = [
  {
    // 기부 페이지 설정
    path: '/donate/:eventId', // 주소 규칙: /donate/ 뒤에 어떤 값이 오든 받겠다 (:campaignId 부분)
    name: 'DonationPage',        // 이 경로의 별명
    component: DonationPage,      // 이 주소로 오면 DonationPage.vue 를 보여줌
    props: true                 // 주소의 :campaignId 값을 DonationPage.vue 로 전달해줌 (중요!)
  },
  {
    // 감사 페이지 설정
    path: '/thank-you',           // 주소 규칙: /thank-you
    name: 'ThankYouPage',         // 이 경로의 별명
    component: ThankYouPage       // 이 주소로 오면 ThankYouPage.vue 를 보여줌
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router

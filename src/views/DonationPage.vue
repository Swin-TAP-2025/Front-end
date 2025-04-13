<template>
  <div class="donation-page">
    <div v-if="isLoading">
      <p>Loading event...</p>
    </div>
    <div v-else-if="error">
      {/* error */}
      <p>Error occured: {{ error }}</p>
    </div>
    <div v-else-if="eventData">
      {/* Charity 로고와 이름 */}
      <div v-if="eventData && eventData.charity">
      {/* 이미지 태그 수정 */}
      <img
        v-if="eventData.charity._id" 
        :src="`https://tap-2025-455910.ts.r.appspot.com/api/image/charity/${eventData.charity._id}`" 
        :alt="`${eventData.charity.name} 로고`" 
        width="150" 
      >
      <h2>{{ eventData.charity.name }}</h2>
    </div>
      <hr>
      {/* Event name and description */}
      <h1>{{ eventData.name }}</h1>
      <p>{{ eventData.description }}</p>
      {/* 기부 금액 선택 부분 */}
      <h2>기부 금액</h2>
      <p>I am happy with payment this amount of {{ eventData.suggestedMinimumDonation }} {/* eventData.DonationMoney */} $</p>
      {/* 임시 eventId 표시 */}
      <p style="margin-top: 20px; font-size: 0.8em; color: grey;">Temp event ID: {{ eventId }}</p>
    </div>
    <div v-else>
      {/* 데이터 없는 경우 내용은 이 안에 주석처리 가능 */}
      <p>이벤트 정보를 찾을 수 없습니다.</p>
    </div>
  </div>
</template>
  
<script>
// 1. axios import
import axios from 'axios';

export default {
  name: 'DonationPage',
  props: {
    eventId: {
      type: String,
      required: true
    }
  },
  // 2. data() 속성 추가: 이벤트 정보, 로딩 상태, 에러 상태 저장
  data() {
    return {
      eventData: null, // API 응답 데이터 저장 (처음엔 비어있음)
      isLoading: false, // 로딩 중인지 여부
      error: null // 에러 메시지 저장
    };
  },
  // 3. methods 옵션 추가: API 호출 함수 정의
  methods: {
    async fetchEventData() {
      this.isLoading = true; // 로딩 시작
      this.error = null; // 이전 에러 초기화
      try {
        // Fai가 알려준 API 기본 URL 확인 필요! 여기서는 예시 URL 사용
        // 만약 API 서버 주소가 다르다면 이 부분을 수정해야 합니다.
        const apiUrl = `https://tap-2025-455910.ts.r.appspot.com/api/event/${this.eventId}`;

        // axios 를 사용해 GET 요청 보내기
        const response = await axios.get(apiUrl);

        // 5. API 호출 성공 시 데이터 저장
        this.eventData = response.data; // 응답 데이터를 eventData 에 저장
        console.log('받은 이벤트 데이터:', this.eventData); // 콘솔에도 출력 (확인용)

      } catch (err) {
        // API 호출 실패 시 에러 처리
        console.error('API 호출 에러:', err);
        this.error = '이벤트 정보를 불러오는데 실패했습니다.'; // 사용자에게 보여줄 에러 메시지
        if (err.response && err.response.status === 404) {
          this.error = '해당 이벤트를 찾을 수 없습니다.'; // 404 에러 처리
        }
      } finally {
        this.isLoading = false; // 로딩 종료 (성공/실패 모두)
      }
    }
  },
  // 4. mounted() 훅: 컴포넌트가 로드될 때 API 호출 함수 실행
  mounted() {
    console.log('DonationPage 마운트됨, 이벤트 ID:', this.eventId);
    this.fetchEventData(); // 데이터 가져오는 함수 호출
  }
}
</script>

<style scoped>
.donation-page {
  padding: 20px;
  font-family: sans-serif;
}
img {
  display: block;
  margin-bottom: 10px;
  max-width: 150px; /* 로고 크기 제한 */
  border: 1px solid #eee; /* 이미지 테두리 (선택사항) */
}
hr {
  margin: 15px 0;
  border: 0;
  border-top: 1px solid #eee;
}
</style>
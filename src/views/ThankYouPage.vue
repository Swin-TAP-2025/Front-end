<template>
  <div class="thank-you-page">
    <!-- 로딩 중 표시 -->
    <div v-if="isLoading" class="loading-container"> 
      <div class="spinner"></div> 
      <p>Loading donation details...</p>
      <p v-if="retryCount > 0" style="font-size: 0.9em; color: grey;">
        (Checking status again... Attempt {{ retryCount }})
      </p>
       <p v-if="retryCount > 0" style="font-size: 0.8em; color: grey;">
        (Confirmation can take up to 3 minute)
      </p>
    </div>

    <!-- 에러 발생 시 표시 -->
    <div v-else-if="error">
      <h1>An Error Occurred</h1>
      <p>{{ error }}</p>
      <hr>
       <router-link to="/" class="home-link">Back to Home</router-link>
    </div>

    <!-- 성공적으로 정보 로드 시 -->
    <div v-else>
      <h1 v-if="donorName">Thank You, {{ donorName }}, for Your Donation!</h1>
      <h1 v-else>Thank You for Your Donation!</h1>

      <p v-if="donationDetails && donationDetails.isPaid">
        Your generous donation has been successfully processed.
      </p>
      <p v-else>
        We appreciate your contribution! We're confirming the final status.
      </p>
      <hr>

      <div class="summary">
        <h2>Donation Summary</h2>
        <div v-if="donationDetails && donationDetails.isPaid">
          <p>
            Amount Donated:
            <strong>{{ formatCurrency(donationDetails.amount) }}</strong>
          </p>
        </div>
        <p v-else-if="!donationId">
          Could not retrieve specific donation details.
        </p>
         <p v-else>
          Waiting for final confirmation...
        </p>
      </div>
      <hr>

      <div class="receipt-options">
        <h2>Receipt</h2>
        <p>You can download a simple confirmation below.</p>
        <button @click="downloadPDF" :disabled="isGeneratingPDF || !donationDetails || !donationDetails.isPaid">
          {{ isGeneratingPDF ? 'Generating...' : 'Download Confirmation (PDF)' }}
        </button>
      </div>
      <hr>

      <div class="social-share">
        <h2>Tell people you've donated!</h2>
        <div class="share-buttons">
          <a :href="getFacebookShareUrl()" target="_blank" class="share-button facebook">Share on Facebook</a>
          <a :href="getTwitterShareUrl()" target="_blank" class="share-button twitter">Share on Twitter</a>
        </div>
      </div>
      <hr>

      <router-link v-if="donationDetails && donationDetails.eventId"
             :to="{ name: 'DonationPage', params: { eventId: donationDetails.eventId } }"
             class="home-link">
        Back to Donation Page
      </router-link>

      <div ref="pdfContent" style="position: absolute; left: -9999px; top: auto; width: 500px; padding: 20px; background: white;">
         <h2>Donation Confirmation</h2>
         <p v-if="donorName">Dear {{ donorName }},</p>
         <p>Thank you for your generous donation!</p>

        <div v-if="eventDetailsForPDF" style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
          <p><strong>Event:</strong> {{ eventDetailsForPDF.name }}</p>
          <p v-if="eventDetailsForPDF.charity"><strong>Charity:</strong> {{ eventDetailsForPDF.charity.name }}</p>
        </div>
        <div v-if="donationDetails && donationDetails.isPaid" style="margin-top: 15px; padding-top: 10px; border-top: 1px solid #eee;">
          <p><strong>Amount:</strong> {{ formatCurrency(donationDetails.amount) }}</p>
          <p><strong>Donation ID:</strong> {{ donationId }}</p>
          <p v-if="donationDetails.stripePaymentLinkId"><strong>Payment Reference:</strong> {{ donationDetails.stripePaymentLinkId }}</p>
          <p><strong>Status:</strong> Paid</p>
          <p><strong>Date:</strong> {{ formatDate(donationDetails.updated_at) }}</p>
        </div>
        <p style="margin-top: 20px;">
          Thank you once again for your support. 
          Your contribution makes a real impact and helps us continue our work. 
          We deeply appreciate your trust and partnership.
        </p>
      </div>
    </div> 
  </div>
</template>

<script>
// 필요한 라이브러리 import
import axios from 'axios';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default {
  name: 'ThankYouPage',
  data() {
    return {
      // --- 상태 관리 변수 ---
      isLoading: true,              // 페이지 데이터 로딩 중 상태
      error: null,                  // 에러 메시지 저장
      isGeneratingPDF: false,       // PDF 생성 중 상태
      retryCount: 0,                // 기부 상태 API 재시도 횟수
      maxRetries: 5,                // 최대 재시도 횟수

      // --- 데이터 저장 변수 ---
      donationId: null,             // URL에서 가져올 기부 ID
      donationDetails: null,        // 기부 상태 API 응답 저장 (/api/donation/status/{id})
      eventDetailsForPDF: null,     // 이벤트 정보 API 응답 저장 (PDF용, /api/event/{id})
      donorName: '',                // Local Storage에서 가져올 기부자 이름

      // --- 기타 데이터 (소셜 공유용) ---
      // eventName, eventUrl 등은 API 응답에서 가져오도록 개선 가능
      eventName: 'the Event',       // Placeholder - 아래 fetchEventDetailsForPDF 에서 업데이트 가능
      eventUrl: window.location.origin // Placeholder
    };
  },
  methods: {
    // --- 1. 기부 상태 조회 API 호출 ---
    async fetchDonationStatus(id) {
      // isLoading = true; // 초기 로딩은 mounted에서 시작, 재시도 시에는 유지
      this.error = null; // 재시도 시 에러 초기화
      const apiUrl = `https://tap-2025-455910.ts.r.appspot.com/api/donation/status/${id}`;
      console.log(`Fetching donation status for ID: ${id}, Attempt: ${this.retryCount + 1}`);

      try {
        const response = await axios.get(apiUrl);
        this.donationDetails = response.data;
        console.log('Received donation status:', this.donationDetails);

        // 결제 완료(isPaid: true) 시 또는 최대 재시도 도달 시
        if (this.donationDetails.isPaid || this.retryCount >= this.maxRetries) {
          this.isLoading = false; // 로딩 종료
          if (this.donationDetails.isPaid && this.donationDetails.eventId) {
            // 결제 완료 시, PDF용 이벤트 정보 가져오기 시작
            this.fetchEventDetailsForPDF(this.donationDetails.eventId);
          } else if (!this.donationDetails.isPaid) {
            console.warn('Max retries reached, donation status still not paid.');
            this.error = "Could not confirm payment status after multiple attempts. Please check back later or contact support.";
          }
        } else {
          // isPaid: false 이고 아직 재시도 횟수가 남았다면, 잠시 후 다시 시도
          this.retryCount++;
          console.log(`isPaid is false, retrying in 3 seconds... (Attempt ${this.retryCount})`);
          // 로딩 상태는 계속 true 유지
          setTimeout(() => this.fetchDonationStatus(id), 30000); // 정한 시간으로 재시도
        }

      } catch (err) {
        console.error('Error fetching donation status:', err);
        this.error = 'Failed to retrieve donation details.';
        if (err.response && err.response.status === 404) {
          this.error = 'Donation record not found.';
        }
        this.isLoading = false; // 에러 발생 시 로딩 종료
      }
    },

    // --- 2. 이벤트 상세 정보 가져오는 메소드 (PDF 및 소셜 공유용) ---
    async fetchEventDetailsForPDF(eventId) {
      try {
        const apiUrl = `https://tap-2025-455910.ts.r.appspot.com/api/event/${eventId}`;
        const response = await axios.get(apiUrl);
        this.eventDetailsForPDF = response.data;
        // 가져온 이벤트 이름으로 data 업데이트 (소셜 공유 메시지 등에 사용)
        if (this.eventDetailsForPDF && this.eventDetailsForPDF.name) {
          this.eventName = this.eventDetailsForPDF.name;
        }
        console.log('Fetched event details for PDF/Share:', this.eventDetailsForPDF);
      } catch (error) {
        console.error('Error fetching event details for PDF:', error);
        // 실패해도 크게 문제 없음 (PDF에 이벤트 이름만 안 나옴)
      }
    },

    // --- 3. 통화 형식 (AUD) ---
    formatCurrency(value) {
      // API 응답 금액이 달러 단위 숫자라고 가정 (센트 아님)
      if (value === null || typeof value !== 'number' || isNaN(value)) {
        return 'A$ 0.00';
      }
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD'
      }).format(value);
    },

    // --- 4. 날짜 형식 변환 ---
    formatDate(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-AU', {
          day: '2-digit', month: '2-digit', year: 'numeric'
        });
      } catch (e) {
        return dateString;
      }
    },

    // --- 5. PDF 다운로드 ---
    async downloadPDF() {
      // 결제가 완료되었을 때만 PDF 생성 가능
      if (this.isGeneratingPDF || !this.donationDetails || !this.donationDetails.isPaid) return;
      this.isGeneratingPDF = true;

      try {
        const pdfElement = this.$refs.pdfContent;
        if (!pdfElement) {
           throw new Error("PDF content element not found.");
        }
        // html2canvas로 요소 캡처 (로고 없으니 useCORS 불필요)
        const canvas = await html2canvas(pdfElement, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');

        // PDF 생성
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const margin = 15; // 여백 조금 더 주기

        // PDF에 이미지 추가 (페이지 넘어가지 않도록 높이 조절)
        let usableHeight = pdf.internal.pageSize.getHeight() - (margin * 2);
        let imgHeight = pdfHeight;
        if (imgHeight > usableHeight) {
            imgHeight = usableHeight;
        }
         let usableWidth = pdfWidth - (margin * 2);
         let imgWidth = (imgProps.width * imgHeight) / imgProps.height;
         if(imgWidth > usableWidth){
            imgWidth = usableWidth;
            imgHeight = (imgProps.height * imgWidth) / imgProps.width;
         }

        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
        pdf.save(`donation_${this.donationId}_confirmation.pdf`);

      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF confirmation.");
      } finally {
        this.isGeneratingPDF = false;
      }
    },

    // --- 6. 소셜 공유 URL 생성 ---
    getFacebookShareUrl() {
      // 이벤트 이름이 로드되었으면 사용, 아니면 기본값 사용
      const eventNameToShare = (this.eventDetailsForPDF && this.eventDetailsForPDF.name) || this.eventName;
      const amountText = this.donationDetails && this.donationDetails.isPaid ? ` ${this.formatCurrency(this.donationDetails.amount)} to` : '';
      const text = encodeURIComponent(`I just donated${amountText} ${eventNameToShare}! Join me in supporting them.`);
      const url = encodeURIComponent(this.eventUrl); // 실제 기부 페이지나 이벤트 페이지 URL로 변경하면 더 좋음
      return `https://www.facebook.com/sharer/sharer.php?u=${url}"e=${text}`;
    },
    getTwitterShareUrl() {
      const eventNameToShare = (this.eventDetailsForPDF && this.eventDetailsForPDF.name) || this.eventName;
      const amountText = this.donationDetails && this.donationDetails.isPaid ? ` ${this.formatCurrency(this.donationDetails.amount)} to` : '';
      const text = encodeURIComponent(`I just donated${amountText} ${eventNameToShare}! Join me here: ${this.eventUrl}`);
      return `https://twitter.com/intent/tweet?text=${text}`;
    }
  },
  // --- 7. 컴포넌트 마운트 시 실행 ---
  mounted() {
    console.log('Thank You Page Mounted');

    // Local Storage에서 이름 불러오기
    const savedName = localStorage.getItem('donorName');
    if (savedName) {
      this.donorName = savedName;
      console.log('Loaded donorName:', savedName);
    }

    // URL 파라미터에서 donationId 읽고 API 호출 시작
    // Fai가 파라미터 이름을 'donationId'로 준다고 가정
    const donationIdFromUrl = this.$route.query.donationId;
    if (donationIdFromUrl) {
      this.donationId = donationIdFromUrl;
      console.log("Received donation ID from URL:", this.donationId);
      this.isLoading = true; // API 호출 전 로딩 시작
      this.fetchDonationStatus(this.donationId); // API 호출 시작
    } else {
      console.warn("Donation ID not found in URL.");
      this.error = "Donation ID is missing. Cannot fetch details.";
      this.isLoading = false; // ID 없으면 로딩 중단
    }
  }
}
</script>

<style scoped>
/* ... (기존 스타일) ... */
.summary p { margin: 5px 0; } /* 요약 정보 줄 간격 조정 */

/* --- 로딩 스피너 스타일 --- */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  min-height: 200px; /* 로딩 중 최소 높이 확보 */
}

.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1); /* 흐린 회색 테두리 */
  border-left-color: #007bff; /* 스피너 색상 (파란색) */
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite; /* 애니메이션 적용 */
  margin-bottom: 20px;
}

/* 스피너 회전 애니메이션 */
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
/* --- /로딩 스피너 스타일 --- */
</style>
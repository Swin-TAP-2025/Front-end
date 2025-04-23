<template>
  <div class="donation-page">
    <div v-if="isLoading">
      <p>Loading event details...</p>
    </div>
    <div v-else-if="error">
      <p>Error: {{ error }}</p>
    </div>
    <div v-else-if="eventData">
      Charity Logo and Name
      <div v-if="eventData.charity">
        <img
          v-if="eventData.charity._id"
          :src="`https://tap-2025-455910.ts.r.appspot.com/api/image/charity/${eventData.charity._id}`"
          :alt="`${eventData.charity.name} Logo`"
          width="150"
        >
        <h2>{{ eventData.charity.name }}</h2>
      </div>
      <hr>

      <!--Event Name and Description-->
      <h1>{{ eventData.name }}</h1>
      <p>{{ eventData.description }}</p>
      <hr>

      <h2>Select Donation Amount</h2>
      <!--Suggested Minimum Donation (Optional Display)-->
      <p v-if="eventData.suggestedMinimumDonation > 0">
        Suggested minimum donation: {{ formatCurrency(eventData.suggestedMinimumDonation) }}
      </p>
      <!--Amount dropdown-->
      <select v-model="selectedOptionValue" style="padding: 8px; margin-bottom: 10px; width: 200px;">
        <option :value="5">$ 5.00</option>
        <option :value="10">$ 10.00</option>
        <option :value="20">$ 20.00</option>
        <option :value="30">$ 30.00</option>
        <option :value="40">$ 40.00</option>
        <option :value="50">$ 50.00</option>
        <option value="custom">Enter custom amount</option>
      </select>

      <!--Custom Amount Input Field (visible only if 'custom' is selected)-->
      <div v-if="selectedOptionValue === 'custom'">
        <span style="margin-right: 5px;">A$</span>
        <input
          type="number"
          v-model.number="customAmount"
          placeholder="Enter amount"
          style="padding: 8px; width: 150px;"
          min="1" step="1" 
          @input="handleCustomInput" 
        >
      </div>

      <p style="margin-top: 15px; font-weight: bold;">
        Selected amount: {{ formatCurrency(finalAmount) }}
      </p>

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <h2>Your Details (Optional)</h2>
        <p style="font-size: 0.9em; color: grey; margin-bottom: 15px;">
          Providing your details helps us acknowledge your donation. Stored locally in your browser for convenience.
        </p>
        <div style="margin-bottom: 15px;">
          <label for="donorName" style="display: block; margin-bottom: 5px;">Name:</label>
          <input
            type="text"
            id="donorName"
            v-model="donorName"
            placeholder="Enter your name"
            style="padding: 8px; width: 95%; max-width: 400px;"
          >
        </div>
        <div style="margin-bottom: 15px;">
          <label for="donorEmail" style="display: block; margin-bottom: 5px;">Email:</label>
          <input
            type="email"
            id="donorEmail"
            v-model="donorEmail"
            placeholder="Enter your email address"
            style="padding: 8px; width: 95%; max-width: 400px;"
          >
        </div>
        <div style="margin-top: 15px;">
          <input
            type="checkbox"
            id="anonymousCheck"
            v-model="isAnonymous"
            style="margin-right: 8px;"
          >
          <label for="anonymousCheck">Donate anonymously</label>
          <p v-if="isAnonymous" style="font-size: 0.8em; color: grey; margin-top: 5px;">
            Your name and email will not be stored or shared.
          </p>
        </div>
      </div>
      {/* --- /사용자 정보 입력 --- */}
      <!--DONATE NOW Button (functionality in next step)-->
      <button @click="initiateDonation" :disabled="finalAmount <= 0" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;" :style="{ opacity: finalAmount <= 0 ? 0.5 : 1 }">
        Donate Now
      </button>

      {/* Temporary Event ID display */}
      <p style="margin-top: 30px; font-size: 0.8em; color: grey;">Event ID: {{ eventId }}</p>
    </div>
    <div v-else>
      <p>Event information not found.</p>
    </div>
  </div>
</template>
  
<script>
import axios from 'axios';

export default {
  name: 'DonationPage',
  props: {
    eventId: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      eventData: null,
      isLoading: false,
      error: null,
      selectedOptionValue: 5,
      customAmount: null,
      // --- 사용자 정보 데이터 추가 ---
      donorName: '', // 이름 저장 (초기값 빈 문자열)
      donorEmail: '', // 이메일 저장 (초기값 빈 문자열)
      isAnonymous: false // 초기값은 false (익명 아님)
    };
  },
  computed: {
    // Calculate the final donation amount
    finalAmount() {
      if (this.selectedOptionValue === 'custom') {
        // If 'custom' is selected and a valid number is entered, use it
        // Ensure customAmount is treated as a number
        const amount = parseFloat(this.customAmount);
        return !isNaN(amount) && amount > 0 ? amount : 0;
      } else {
        // Otherwise, use the value selected from the dropdown (convert to number)
        const amount = parseFloat(this.selectedOptionValue);
        return !isNaN(amount) ? amount : 0;
      }
    }
  },
  methods: {
    async fetchEventData() {
      this.isLoading = true;
      this.error = null;
      try {
        const apiUrl = `https://tap-2025-455910.ts.r.appspot.com/api/event/${this.eventId}`;
        const response = await axios.get(apiUrl);
        this.eventData = response.data;
        console.log('Received event data:', this.eventData);

        // Optional: Adjust initial selectedOptionValue based on suggestedMinimumDonation
        // Example: if minimum is $10, set default selection to $10 if current default is less.
        const minDonation = parseFloat(this.eventData.suggestedMinimumDonation);
        const currentSelection = parseFloat(this.selectedOptionValue);
         if (!isNaN(minDonation) && this.selectedOptionValue !== 'custom' && !isNaN(currentSelection) && minDonation > currentSelection) {
           // Find the first preset option >= minDonation or keep minimum itself? For simplicity, let's just ensure it's not below minimum for now.
           // Or, maybe just display the minimum suggestion and let user choose freely from presets.
           // Let's keep the default selection simple for now. User sees suggestion and chooses.
        }

      } catch (err) {
        console.error('API call error:', err);
        this.error = 'Failed to load event details.';
        if (err.response && err.response.status === 404) {
          this.error = 'Event not found.';
        }
      } finally {
        this.isLoading = false;
      }
    },

    // --- Currency Formatting Method (AUD) ---
    formatCurrency(value) {
      if (value === null || typeof value !== 'number' || isNaN(value)) {
        return 'A$ 0.00'; // Return zero if invalid
      }
      // Use Intl.NumberFormat for proper AUD formatting
      return new Intl.NumberFormat('en-AU', {
        style: 'currency',
        currency: 'AUD'
      }).format(value);
    },

    // --- Initiate Donation Method (Placeholder) ---
    initiateDonation() {
      // This method will be called when "Donate Now" is clicked
      // Next step: Implement logic to call the backend API for payment processing (e.g., create Stripe Checkout session)
      console.log(`Initiating donation for: ${this.formatCurrency(this.finalAmount)}`);
      console.log('Selected Option Value:', this.selectedOptionValue);
      console.log('Custom Amount:', this.customAmount);
      console.log('Final Amount:', this.finalAmount);

      // Prevent actual submission for now
      alert(`Ready to donate ${this.formatCurrency(this.finalAmount)}! (Payment integration next)`);
    },

    saveCurrentDetailsToLocalStorage() {
    // 익명이 아닐 때만 저장하는 것을 다시 확인 (이 시점엔 당연히 false겠지만)
    if (!this.isAnonymous) {
      console.log('Saving current details to localStorage after unchecking anonymous.');
      localStorage.setItem('donorName', this.donorName);
      localStorage.setItem('donorEmail', this.donorEmail);
    }
  }
    
  },

  watch: {
    // donorName 변경 감지
    donorName(newName) {
      // 익명이 아닐 때만 Local Storage에 저장
      if (!this.isAnonymous) {
        console.log('Saving donorName to localStorage:', newName);
        localStorage.setItem('donorName', newName);
      }
    },
    // donorEmail 변경 감지
    donorEmail(newEmail) {
      // 익명이 아닐 때만 Local Storage에 저장
      if (!this.isAnonymous) {
        console.log('Saving donorEmail to localStorage:', newEmail);
        localStorage.setItem('donorEmail', newEmail);
      }
    },
    // --- isAnonymous 변경 감지 (선택 사항: 체크 시 저장된 정보 삭제) ---
    isAnonymous(isNowAnonymous) {
      console.log('Anonymous status changed:', isNowAnonymous);
      if (isNowAnonymous) {
        // 익명으로 변경되면 Local Storage에서 정보 삭제
        console.log('Removing donor info from localStorage due to anonymity.');
        localStorage.removeItem('donorName');
        localStorage.removeItem('donorEmail');
        // 입력 필드를 비우는 것은 선택 사항 (사용자 경험 고려)
        // this.donorName = '';
        // this.donorEmail = '';
      } else {
        this.saveCurrentDetailsToLocalStorage(); // <--- 이 메소드 호출
      }
    }
  },

  mounted() {
    console.log('DonationPage 마운트됨, 이벤트 ID:', this.eventId);

    // Local Storage에서 값 불러오기 (기존 로직 유지)
    // 익명 체크 여부와 관계없이 일단 채워주고,
    // 익명 체크 시 저장/삭제 로직은 watch에서 처리
    const savedName = localStorage.getItem('donorName');
    const savedEmail = localStorage.getItem('donorEmail');
    if (savedName) {
      this.donorName = savedName;
    }
    if (savedEmail) {
      this.donorEmail = savedEmail;
    }
    // 저장된 익명 상태는 없으므로 로드하지 않음 (기본값 false 사용)

    this.fetchEventData();
  }
}
</script>
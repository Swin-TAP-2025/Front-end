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
      <!--DONATE NOW Button (functionality in next step)-->
      <button @click="initiateDonation" :disabled="finalAmount <= 0" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;" :style="{ opacity: finalAmount <= 0 ? 0.5 : 1 }">
        Donate Now
      </button>

      <!--Temporary Event ID display-->
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

         // --- Set default dropdown value based on suggestion ---
         if (this.eventData && this.eventData.suggestedMinimumDonation > 0) {
          const suggestedAmount = parseFloat(this.eventData.suggestedMinimumDonation);
          // Check if the suggested amount is one of our preset options
          const presetOptions = [5,10,20,30,40,50]; // Preset values in the dropdown
          if (!isNaN(suggestedAmount) && presetOptions.includes(suggestedAmount)) {
            // If suggestion is a preset option, set it as default
            this.selectedOptionValue = suggestedAmount;
            console.log(`Set default donation amount to suggested: $${suggestedAmount}`);
          } else if (!isNaN(suggestedAmount)) {
            // If suggestion is not a preset, maybe default to custom and prefill? Or just default to the lowest preset?
            // Let's default to the lowest preset ($5) for simplicity if suggestion isn't a preset.
            // Or you could decide to set it to 'custom' and prefill customAmount.
            // this.selectedOptionValue = 'custom';
            // this.customAmount = suggestedAmount;
            console.log(`Suggested amount A$${suggestedAmount} is not a preset option. Defaulting to A$${this.selectedOptionValue}.`);
          }
        }
        // --- End of default value setting ---

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
    async initiateDonation() {
      
    if (this.finalAmount <= 0) {
      alert('Please select or enter a valid donation amount.');
      return;
    }

    console.log(`Attempting to donate: ${this.formatCurrency(this.finalAmount)}`);
    this.isLoading = true; // Indicate loading state (optional)
    this.error = null;     // Clear previous errors

    try {
      const donationAmount = this.finalAmount; 

      // Set the redirect URL (our thank you page)
      // Use window.location.origin to get the base URL (e.g., http://localhost:8080)
      const redirectUrl = `${window.location.origin}/thank-you`;

      // Prepare the request body
      const requestBody = {
        amount: donationAmount,
        redirectUrl: redirectUrl
      };

      // Prepare the API endpoint URL
      const apiUrl = `https://tap-2025-455910.ts.r.appspot.com/api/donation/${this.eventId}`;

      console.log('--- Before calling API ---');
      console.log('API Endpoint URL:', apiUrl); // Display API
      console.log('Request Body to send:', requestBody); // Display request body
      alert('Check console before redirecting'); 

      // --- Call the backend API ---
      const response = await axios.post(apiUrl, requestBody);
      console.log('API Response:', response.data);

      // --- Redirect to Stripe Payment Link ---
      if (response.data && response.data.stripePaymentLink) {
        // Get the payment link from the response
        const paymentLink = response.data.stripePaymentLink;
        console.log('Redirecting to Stripe:', paymentLink);

        // Redirect the user's browser to the Stripe page
        window.location.href = paymentLink;

        // We don't set isLoading = false here because the page will navigate away.

      } else {
        // Handle cases where the payment link is missing in the response
        console.error('Stripe Payment Link not found in response');
        this.error = 'Could not retrieve payment link. Please try again.';
        this.isLoading = false;
      }

    } catch (err) {
      console.error('Error initiating donation:', err);
      // Display a user-friendly error message
      this.error = 'An error occurred while starting the donation process. Please try again.';
      if (err.response) {
        // Handle specific backend errors if needed
        console.error('Backend Error:', err.response.data);
        this.error = `Error: ${err.response.data.message || 'Failed to initiate donation.'}`;
      }
      this.isLoading = false; // Stop loading indicator on error
    }
    // No finally block needed for isLoading = false if redirecting on success
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
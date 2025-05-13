<template>
  <div class="donation-page">
    <!-- loading display -->
    <div v-if="isLoading">
      <p>Loading event details...</p> 
    </div>
    <!-- error display -->
    <div v-else-if="error">
      <p>Error: {{ error }}</p> 
    </div>
    <!-- Load event data -->
    <div v-else-if="eventData" class="content-wrapper">
      <div class="header-info">
        <img
          v-if="eventData.charity && eventData.charity._id"
          :src="getCharityLogoUrl(eventData.charity._id)" 
          :alt="`${eventData.charity.name} Logo`"
          @error="hideImageOnError"
          class="charity-logo"
        >
        
        <img
            :src="getEventImageUrl(eventId)" 
            :alt="`${eventData.name} Image`"
            class="event-image"
          >
        <h1 class="event-title">{{ eventData.name }}</h1>
      </div>

      <p class="event-description">{{ eventData.description }}</p>

      <div class="donation-form-section">
        <h2>Select Donation Amount</h2>
        <p v-if="eventData.suggestedMinimumDonation > 0" class="suggestion-text">
          Suggested minimum donation: {{ formatCurrency(eventData.suggestedMinimumDonation) }}
        </p>
        <select v-model="selectedOptionValue" class="amount-select">
          <option :value="1">$ 1.00</option>
          <option :value="3">$ 3.00</option>
          <option :value="5">$ 5.00</option>
          <option :value="10">$ 10.00</option>
          <option :value="20">$ 20.00</option>
          <option :value="50">$ 50.00</option>
        </select>
        <p v-if="customAmount !== null && customAmount !== '' && parseFloat(customAmount) > 0" class="dropdown-disabled-info">
        To use the dropdown, please clear the custom amount field.
        </p>

        <div class="custom-amount-wrapper">
        <span class="currency-symbol">$</span>
        <input
          type="number"
          v-model.number="customAmount"
          @input="handleCustomInputChange" 
          placeholder="Enter custom amount"
          class="custom-amount-input"
          min="1" step="1"
        >
      </div>

        <p class="selected-amount-text">
          Selected amount: {{ formatCurrency(finalAmount) }}
        </p>
      </div>

      <div class="donor-details-section">
        <h2>Your Details (Optional)</h2>
        <p class="details-info-text">
          Providing your details helps us acknowledge your donation. Stored locally in your browser for convenience.
        </p>
        <div class="input-group">
          <label for="donorName">Name:</label>
          <input type="text" id="donorName" v-model="donorName" placeholder="Enter your name">
        </div>
        <div class="input-group">
          <label for="donorEmail">Email:</label>
          <input type="email" id="donorEmail" v-model="donorEmail" placeholder="Enter your email address">
        </div>
        <div class="input-group anonymous-group">
          <input type="checkbox" id="anonymousCheck" v-model="isAnonymous">
          <label for="anonymousCheck">Donate anonymously</label>
          <p v-if="isAnonymous" class="anonymous-info-text">
            Your name and email will not be stored or shared.
          </p>
        </div>
      </div>
      <button @click="initiateDonation" :disabled="finalAmount <= 0" class="donate-button">
        Donate Now
      </button>
      <!-- Event id for debugging -->
      <p style="margin-top: 30px; font-size: 0.8em; color: grey;">Event ID: {{ eventId }}</p>
    </div>
  </div>
    <!-- if event id not found -->
</template>

<script>
import axios from 'axios'; // Import the axios library for API communication

export default {
  name: 'DonationPage', // Define the component name
  props: { // Define data passed from parent (router)
    eventId: { // Event ID passed as a URL parameter
      type: String, // Type is String
      required: true // This value is required
    }
  },
  data() { // Define the component's internal data
    return {
      eventData: null, // Stores the event details received from the API
      isLoading: false, // Data loading state (true: loading, false: finished loading)
      error: null, // Stores error messages
      selectedOptionValue: 5, // Selected value in the dropdown (default: $5) - Reverted name
      customAmount: null, // Amount entered directly
      donorName: '', // Name entered by the user
      donorEmail: '', // Email entered by the user
      isAnonymous: false // Anonymous donation checkbox state (default: false)
    };
  },
  computed: { // Define computed properties based on data
    // Calculate the final donation amount (prioritizes custom input)
    finalAmount() {
      // If customAmount has a valid positive value, use it
      if (this.customAmount !== null && this.customAmount !== '' && parseFloat(this.customAmount) > 0) {
        return parseFloat(this.customAmount);
      }
      // Otherwise, use the value selected from the dropdown (convert to number)
      const dropdownVal = parseFloat(this.selectedOptionValue);
      return !isNaN(dropdownVal) ? dropdownVal : 0;
    }
  },
  methods: { // Define methods (functions) used within the component
    // Fetch event details from the backend API
    async fetchEventData() {
      this.isLoading = true; // Start loading state
      this.error = null; // Reset previous errors
      try {
        // Construct the API endpoint URL
        const apiUrl = `https://tap-2025-455910.ts.r.appspot.com/api/event/${this.eventId}`;
        // Send GET request and wait for the response
        const response = await axios.get(apiUrl);
        // Store the response data in eventData
        this.eventData = response.data;
        // console.log('Received event data:', this.eventData); // For debugging, can be removed later

         // --- Set default dropdown value based on suggestion ---
         if (this.eventData && this.eventData.suggestedMinimumDonation > 0) {
          const suggestedAmount = parseFloat(this.eventData.suggestedMinimumDonation);
          // List of fixed amount options in the dropdown (matches template)
          const presetOptions = [5, 10, 20, 50];
          if (!isNaN(suggestedAmount) && presetOptions.includes(suggestedAmount)) {
            // If suggested amount is one of the preset options, set it as the default
            this.selectedOptionValue = suggestedAmount; // Use selectedOptionValue
            // console.log(`Set default donation amount to suggested: A$${suggestedAmount}`); // For debugging
          } else if (!isNaN(suggestedAmount)) {
            // Handle case where suggested amount isn't a preset option
            // console.log(`Suggested amount A$${suggestedAmount} is not a preset option. Defaulting to A$${this.selectedOptionValue}.`); // For debugging
          }
        }
        // --- End of default value setting ---

      } catch (err) {
        // Handle API call failure
        console.error('API call error:', err); // Keep error log for debugging
        this.error = 'Failed to load event details.'; // Default error message for the user
        if (err.response && err.response.status === 404) {
          this.error = 'Event not found.'; // Specific message for 404 error
        }
      } finally {
        this.isLoading = false; // End loading state
      }
    },

    // --- Format number as currency (no symbol, two decimal places) ---
    formatCurrency(value) {
      if (value === null || typeof value !== 'number' || isNaN(value)) {
        return '0.00'; // Return 0.00 if invalid
      }
      // Use toFixed(2) to always display two decimal places
      return value.toFixed(2);
    },

    // --- Handle image loading errors ---
    hideImageOnError(event) {
      // Hide the image element if it fails to load
      console.warn('Failed to load charity logo, hiding image element.'); // Keep console warning
      event.target.style.display = 'none';
    },

    // --- Initiate donation (Stripe integration) ---
    async initiateDonation() {
      // Validate the final donation amount (prevent 0 or less)
      if (this.finalAmount <= 0) {
        alert('Please select or enter a valid donation amount.'); // Alert the user
        return; // Exit the function
      }
      // Validate if the custom amount is an integer
      if (this.selectedOptionValue === 'custom' && !Number.isInteger(this.finalAmount)) {
        alert('Please enter a whole dollar amount without cents for custom donations.');
        return;
      }

      // console.log(`Attempting to donate: ${this.formatCurrency(this.finalAmount)}`); // Log for debugging
      this.isLoading = true; // Start loading state (optional)
      this.error = null;     // Reset previous errors

      try {
        // --- Prepare data for the backend API request ---
        // Assumes amount is confirmed with Fai (dollar amount integer)
        const donationAmount = this.finalAmount; // Already validated to be an integer if custom
        const redirectUrl = `${window.location.origin}/thank-you`;
        const requestBody = {
          amount: donationAmount,
          redirectUrl: redirectUrl
        };
        const apiUrl = `https://tap-2025-455910.ts.r.appspot.com/api/donation/${this.eventId}`;

        // console.log('Request Body to send (amount as integer dollar):', requestBody); // For debugging

        // --- Call the backend API (POST) ---
        const response = await axios.post(apiUrl, requestBody);
        // console.log('API Response:', response.data); // For debugging

        // --- Redirect to Stripe Payment Link ---
        if (response.data && response.data.stripePaymentLink) {
          const paymentLink = response.data.stripePaymentLink;
          // console.log('Redirecting to Stripe:', paymentLink); // For debugging
          window.location.href = paymentLink;
        } else {
          console.error('Stripe Payment Link not found in response'); // Keep error log
          this.error = 'Could not retrieve payment link. Please try again.'; // User error message
          this.isLoading = false; // End loading state
        }

      } catch (err) {
        // Handle errors during donation initiation
        console.error('Error initiating donation:', err); // Keep error log
        this.error = `Error: ${err.response?.data?.message || 'Failed to initiate donation.'}`;
        this.isLoading = false; // End loading state on error
      }
    },

    // --- Save current details to Local Storage (called when unchecking anonymous) ---
    saveCurrentDetailsToLocalStorage() {
      // Only save if not anonymous
      if (!this.isAnonymous) {
        // console.log('Saving current details to localStorage after unchecking anonymous.'); // For debugging
        localStorage.setItem('donorName', this.donorName);
        localStorage.setItem('donorEmail', this.donorEmail);
      }
    },

    // --- Methods to generate image URLs (to keep template cleaner) ---
    getCharityLogoUrl(charityId) {
      return `https://tap-2025-455910.ts.r.appspot.com/api/image/charity/${charityId}`;
    },
    getEventImageUrl(eventId) {
      return `https://tap-2025-455910.ts.r.appspot.com/api/image/event/${eventId}`;
    },

    // --- Handle dropdown change to clear custom amount ---
    handleDropdownChange() {
      // console.log('Dropdown changed to:', this.selectedOptionValue); // For debugging
      this.customAmount = null; // Reset custom amount when dropdown is used
    }
    // Removed handleCustomInputChange as it's not directly used in the template's @input anymore for this logic
  },

  watch: { // Watch for data changes
    // Watch for changes in donorName
    donorName(newName) {
      // Save to Local Storage only if not anonymous
      if (!this.isAnonymous) {
        console.log('Saving donorName to localStorage:', newName); // For debugging
        localStorage.setItem('donorName', newName);
      }
    },
    // Watch for changes in donorEmail
    donorEmail(newEmail) {
      // Save to Local Storage only if not anonymous
      if (!this.isAnonymous) {
        console.log('Saving donorEmail to localStorage:', newEmail); // For debugging
        localStorage.setItem('donorEmail', newEmail);
      }
    },
    // Watch for changes in isAnonymous state
    isAnonymous(isNowAnonymous) {
      // console.log('Anonymous status changed:', isNowAnonymous); // For debugging
      if (isNowAnonymous) { // If changed to anonymous
        // Remove info from Local Storage
        console.log('Removing donor info from localStorage due to anonymity.'); // Keep this log
        localStorage.removeItem('donorName');
        localStorage.removeItem('donorEmail');
      } else { // If changed back to non-anonymous
        // Save the current field values back to Local Storage
        this.saveCurrentDetailsToLocalStorage();
      }
    }
  },

  mounted() { // Executed when the component is mounted
    // console.log('DonationPage mounted, Event ID:', this.eventId); // For debugging

    // Load name/email from Local Storage
    const savedName = localStorage.getItem('donorName');
    const savedEmail = localStorage.getItem('donorEmail');
    if (savedName) {
      this.donorName = savedName;
    }
    if (savedEmail) {
      this.donorEmail = savedEmail;
    }

    // Start fetching event details from the API
    this.fetchEventData();
  }
}
</script>

<style scoped>
/* 전체 페이지 컨테이너 */
.donation-page {
  font-family: 'Helvetica Neue', Arial, sans-serif;
  color: #333; /* 기본 글자색 */
  max-width: 450px; /* 모바일 화면 기준으로 최대 너비 제한 */
  margin: 0 auto; /* 가운데 정렬 */
  padding: 20px;
  background-color: #f9f9f9; /* Fai 디자인과 유사한 밝은 배경색 */
}

/* 로딩 및 에러 메시지 */
.donation-page > div:first-child { /* v-if, v-else-if, v-else 의 첫번째 div 에 적용 */
  padding: 40px 20px;
  text-align: center;
}

/* 실제 콘텐츠 래퍼 */
.content-wrapper {
  background-color: #fff; /* 콘텐츠 영역 배경 흰색 */
  padding: 25px;
  border-radius: 12px; /* Fai 디자인처럼 둥근 모서리 */
  box-shadow: 0 4px 12px rgba(233, 103, 103, 0.08); /* 부드러운 그림자 */
}

/* 헤더 정보 영역 */
.header-info {
  text-align: center;
  margin-bottom: 25px;
}
.charity-logo {
  max-width: 100px; /* 로고 크기 약간 줄임 */
  height: auto;
  display: block;
  margin: 0 auto 10px auto;
  border: 1px solid #eee;
  border-radius: 8px; /* 로고에도 둥근 모서리 */
}
.charity-name {
  font-size: 1.1em;
  color: #3D1E1E;
  margin-bottom: 15px;
}
.event-image {
  width: 100%; /* 이미지 너비 꽉 채움 */
  max-width: 380px; /* 너무 커지지 않도록 */
  height: auto;
  border-radius: 8px; /* 이미지에도 둥근 모서리 */
  margin-bottom: 15px;
  object-fit: cover; /* 이미지 비율 유지하며 채우기 */
}
.event-title {
  font-size: 1.8em; /* 이벤트 제목 크게 */
  color: #3D1E1E; /* 약간 진한 색 */
  margin-top: 0;
  margin-bottom: 10px;
}
.event-description {
  font-family: 'Times New Roman', Times, serif;
  font-style: italic;
  font-size: 0.95em;
  line-height: 1.6;
  color: #393838;
  margin-bottom: 25px;
  padding: 1mm;
}

/* 구분선 */
hr {
  border: none;
  height: 1px;
  background-color: #e0e0e0; 
  margin: 25px 0;
}

/* 폼 섹션 공통 스타일 */
.donation-form-section,
.donor-details-section {
  margin-bottom: 25px;
  padding: 20px;
  background-color: #FFEAEB; 
  border-radius: 8px;
  border: 1px solid #eee;
  box-shadow: 0 4px 12px rgb(244, 145, 145);
}

.donation-form-section h2,
.donor-details-section h2 {
  font-size: 1.4em;
  color: #3D1E1E;
  margin-top: 0;
  margin-bottom: 15px;
  text-align: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.suggestion-text,
.details-info-text,
.anonymous-info-text {
  font-size: 0.85em;
  color: #666;
  margin-bottom: 15px;
  line-height: 1.5;
}
/* 입력 요소 스타일 */
.amount-select,
.custom-amount-input,
.input-group input[type="text"],
.input-group input[type="email"] {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #fc7060;
  border-radius: 8px; 
  font-size: 1em;
  box-sizing: border-box; 
  margin-bottom: 10px;
}

.custom-amount-input::placeholder {
  color: #fd2b2b;
}
.custom-amount-wrapper {
  display: flex;
  align-items: center;
}
.currency-symbol {
  margin-right: 8px;
  font-size: 1em;
  color: #555;
}
.selected-amount-text {
  font-size: 1.1em;
  font-weight: bold;
  color: #e74c3c;
  margin-top: 15px;
  text-align: center;
}

/* 사용자 정보 입력 그룹 */
.input-group {
  margin-bottom: 15px;
  text-align: left;
}
.input-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  font-size: 0.9em;
  color: #444;
}
.anonymous-group {
  display: flex;
  align-items: center;
  margin-top: 10px;
}
.anonymous-group input[type="checkbox"] {
  margin-right: 8px;
  width: auto; /* 체크박스 너비 자동 */
}
.anonymous-group label {
  margin-bottom: 0; /* 체크박스 라벨 여백 제거 */
  font-weight: normal;
}

/* 기부 버튼 */
.donate-button {
  display: block; /* 버튼 너비 100% 차지 */
  width: 100%;
  padding: 15px;
  font-size: 1.1em;
  font-weight: bold;
  color: white;
  background-color: #E86148; 
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}
.donate-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.donate-button:hover:not(:disabled) {
  background-color: #c0392b; /* 호버 시 약간 어둡게 */
}

/* 임시 Event ID 텍스트 */
.event-id-text {
  margin-top: 20px;
  font-size: 0.8em;
  color: #aaa;
  text-align: center;
}

.dropdown-disabled-info {
  font-size: 0.85em; 
  color: #e74c3c;
  margin-top: 8px; 
  margin-bottom: 12px; 
  text-align: center;
  font-style: italic;
}

/* 드롭다운 비활성화 시 스타일은 그대로 유지 */
.amount-select:disabled {
  background-color: #f0f0f0;
  cursor: not-allowed;
  opacity: 0.7;
}
</style>
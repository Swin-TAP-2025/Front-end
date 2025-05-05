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
    <div v-else-if="eventData">
      <!-- Header info -->
      <div class="header-info" style="text-align: center; margin-bottom: 20px;">
        <!-- Charity logo) -->
        <img
          v-if="eventData.charity && eventData.charity._id"
          :src="`https://tap-2025-455910.ts.r.appspot.com/api/image/charity/${eventData.charity._id}`"
          :alt="`${eventData.charity.name} Logo`"
          @error="hideImageOnError"
          style="max-width: 120px; height: auto; display: block; margin: 0 auto 10px auto; border: 1px solid #eee;"
        >
        <!-- Charity name -->
        <h2 v-if="eventData.charity">{{ eventData.charity.name }}</h2>

        <!-- Event image -->
        <img
            :src="`https://tap-2025-455910.ts.r.appspot.com/api/image/event/${eventId}`"
            :alt="`${eventData.name} Image`"
            style="max-width: 100%; height: auto; margin-top: 15px; border-radius: 8px;"
          >
        <h1>{{ eventData.name }}</h1>
      </div>
      <hr>

      <p>{{ eventData.description }}</p>
      <hr>

      <!-- Select amount of donation -->
      <h2>Select Donation Amount</h2> 
      <p v-if="eventData.suggestedMinimumDonation > 0">
        Suggested minimum donation: {{ formatCurrency(eventData.suggestedMinimumDonation) }} 
      </p>
      <!-- Dropdown -->
      <select v-model="selectedOptionValue" style="padding: 8px; margin-bottom: 10px; width: 200px;">
        <option :value="1">$1</option>
        <option :value="3">$3</option>
        <option :value="5">$5</option>
        <option :value="10">$10</option>
        <option :value="20">$20</option>
        <option :value="50">$50</option>
        <option :value="100">$100</option>
        <option value="custom">Enter custom amount</option> 
      </select>

      <!-- custom field -->
      <div v-if="selectedOptionValue === 'custom'">
        <input
          type="number"
          v-model.number="customAmount"
          placeholder="Enter amount" 
          style="padding: 8px; width: 150px;"
          min="1" step="1" 
        >
      </div>

      <!-- Showing amount -->
      <p style="margin-top: 15px; font-weight: bold;">
        Selected amount: {{ formatCurrency(finalAmount) }} 
      </p>

      <!-- Donor input field (Optional) -->
      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        <h2>Your Details (Optional)</h2> 
        <p style="font-size: 0.9em; color: grey; margin-bottom: 15px;">
          Providing your details helps us acknowledge your donation. Stored locally in your browser for convenience. 
        </p>
        <!-- Name -->
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
        <!-- Email -->
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
        <!-- Donate anonymously check box -->
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

      <!-- Donate button -->
      <button @click="initiateDonation" :disabled="finalAmount <= 0" style="margin-top: 20px; padding: 10px 20px; font-size: 16px; cursor: pointer;" :style="{ opacity: finalAmount <= 0 ? 0.5 : 1 }">
        Donate Now 
      </button>

      <!-- Event id for debugging -->
      <p style="margin-top: 30px; font-size: 0.8em; color: grey;">Event ID: {{ eventId }}</p>
    </div>
    <!-- if event id not found -->
    <div v-else>
      <p>Event information not found.</p> 
    </div>
  </div>
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
      selectedOptionValue: 5, // Selected value in the dropdown (default: $5)
      customAmount: null, // Amount entered directly
      donorName: '', // Name entered by the user
      donorEmail: '', // Email entered by the user
      isAnonymous: false // Anonymous donation checkbox state (default: false)
    };
  },
  computed: { // Define computed properties based on data
    // Calculate the final donation amount
    finalAmount() {
      if (this.selectedOptionValue === 'custom') { // If 'custom' option is selected
        // Try to convert the customAmount input to a number
        const amount = parseFloat(this.customAmount);
        // If it's a valid positive number, use it; otherwise, return 0
        return !isNaN(amount) && amount > 0 ? amount : 0;
      } else { // If a fixed amount is selected from the dropdown
        // Try to convert the selectedOptionValue to a number
        const amount = parseFloat(this.selectedOptionValue);
        // If it's a valid number, use it; otherwise, return 0
        return !isNaN(amount) ? amount : 0;
      }
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
        // console.log('Received event data:', this.eventData); // Log for debugging, remove or comment out later

         // --- Set default dropdown value based on suggestion ---
         if (this.eventData && this.eventData.suggestedMinimumDonation > 0) {
          const suggestedAmount = parseFloat(this.eventData.suggestedMinimumDonation);
          // List of fixed amount options in the dropdown (matches template)
          const presetOptions = [5, 10, 20, 50]; // Corrected list
          if (!isNaN(suggestedAmount) && presetOptions.includes(suggestedAmount)) {
            // If suggested amount is one of the preset options, set it as the default
            this.selectedOptionValue = suggestedAmount;
            // console.log(`Set default donation amount to suggested: A$${suggestedAmount}`); // Log for debugging, remove or comment out later
          } else if (!isNaN(suggestedAmount)) {
            // Handle case where suggested amount isn't a preset option (currently keeps default $5)
            // console.log(`Suggested amount A$${suggestedAmount} is not a preset option. Defaulting to A$${this.selectedOptionValue}.`); // Log for debugging, remove or comment out later
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

      if (!Number.isInteger(this.finalAmount)) {
        alert('Please enter a whole dollar amount without cents for custom donations.'); 
        return;
      }

      // console.log(`Attempting to donate: ${this.formatCurrency(this.finalAmount)}`); // Log donation attempt (can remove later)
      this.isLoading = true; // Start loading state (optional)
      this.error = null;     // Reset previous errors

      try {
        // --- Prepare data for the backend API request ---
        // Assumes amount unit is confirmed with Fai (dollar amount number)
        const donationAmount = this.finalAmount;
        // Set the redirect URL (thank you page)
        // Uses the base part of the current website address (e.g., http://localhost:8080)
        const redirectUrl = `${window.location.origin}/thank-you`;
        // Create the request body object
        const requestBody = {
          amount: donationAmount,
          redirectUrl: redirectUrl
        };
        // Construct the API endpoint URL
        const apiUrl = `https://tap-2025-455910.ts.r.appspot.com/api/donation/${this.eventId}`;

        // console.log('--- Before calling API ---'); // Remove or comment out after debugging
        // console.log('API Endpoint URL:', apiUrl);
        // console.log('Request Body to send:', requestBody);

        // --- Call the backend API (POST) ---
        const response = await axios.post(apiUrl, requestBody);
        // console.log('API Response:', response.data); // Remove or comment out after debugging

        // --- Redirect to Stripe Payment Link ---
        if (response.data && response.data.stripePaymentLink) {
          // Extract the payment link from the response
          const paymentLink = response.data.stripePaymentLink;
          // console.log('Redirecting to Stripe:', paymentLink); // Keep redirection log maybe?
          // Redirect the user's browser to the Stripe payment page
          window.location.href = paymentLink;
          // No need to set isLoading=false here as the page navigates away
        } else {
          // Handle case where payment link is missing in the response
          console.error('Stripe Payment Link not found in response'); // Keep error log
          this.error = 'Could not retrieve payment link. Please try again.'; // User error message
          this.isLoading = false; // End loading state
        }

      } catch (err) {
        // Handle errors during donation initiation
        console.error('Error initiating donation:', err); // Keep error log
        // Error message for the user
        this.error = 'An error occurred while starting the donation process. Please try again.';
        if (err.response) { // Check if there's a specific error message from the backend
          console.error('Backend Error:', err.response.data); // Keep backend error log
          // Use backend message if available, otherwise use default message
          this.error = `Error: ${err.response.data.message || 'Failed to initiate donation.'}`;
        }
        this.isLoading = false; // End loading state on error
      }
    },

    // --- Save current details to Local Storage (called when unchecking anonymous) ---
    saveCurrentDetailsToLocalStorage() {
      // Only save if not anonymous
      if (!this.isAnonymous) {
        // console.log('Saving current details to localStorage after unchecking anonymous.'); // Remove or comment out after debugging
        localStorage.setItem('donorName', this.donorName);
        localStorage.setItem('donorEmail', this.donorEmail);
      }
    }

  },

  watch: { // Watch for data changes
    // Watch for changes in donorName
    donorName(newName) {
      // Save to Local Storage only if not anonymous
      if (!this.isAnonymous) {
        // console.log('Saving donorName to localStorage:', newName); // Remove or comment out after debugging
        localStorage.setItem('donorName', newName);
      }
    },
    // Watch for changes in donorEmail
    donorEmail(newEmail) {
      // Save to Local Storage only if not anonymous
      if (!this.isAnonymous) {
        // console.log('Saving donorEmail to localStorage:', newEmail); // Remove or comment out after debugging
        localStorage.setItem('donorEmail', newEmail);
      }
    },
    // Watch for changes in isAnonymous state
    isAnonymous(isNowAnonymous) {
      // console.log('Anonymous status changed:', isNowAnonymous); // Remove or comment out after debugging
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
    // console.log('DonationPage mounted, Event ID:', this.eventId); // Remove or comment out after debugging

    // Load name/email from Local Storage
    const savedName = localStorage.getItem('donorName');
    const savedEmail = localStorage.getItem('donorEmail');
    if (savedName) {
      this.donorName = savedName;
      // console.log('Loaded donorName from localStorage:', savedName); // Remove or comment out after debugging
    }
    if (savedEmail) {
      this.donorEmail = savedEmail;
      // console.log('Loaded donorEmail from localStorage:', savedEmail); // Remove or comment out after debugging
    }

    // Start fetching event details from the API
    this.fetchEventData();
  }
}
</script>
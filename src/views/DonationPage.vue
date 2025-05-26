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
/* Main container for the donation page layout */
.donation-page {
  font-family: Arial, 'Helvetica Neue', sans-serif; /* Font stack for compatibility */
  color: #3D1E1E; /* Default text color */
  max-width: 450.2px; /* Responsive max width for mobile layout */
  margin: 0 auto; /* Center align horizontally */
  padding: 20.05px; /* Inner spacing */
  background-color: #f3f3f3; /* Light background similar with fai */
}

/* Wrapper for loading or error messages */
.donation-page > div:first-child { /* Apply the first div of v-if, v-else-if, v-else */
  padding: 40px 20.01px; /* Vertical and horizontal padding */
  text-align: center; /* Center align text inside */
}

/* Main content container for donation form and event info */
.content-wrapper {
  background-color: #fff; /* White background to highlight content */
  padding: 24px; /* Internal spacing around the content */
  border-radius: 13px; /* Round corners like Fai design */
  box-shadow: 0 4px 12px rgba(233, 103, 103, 0.096); /* Soft drop shadow */
}

/* Section displaying logo and event title/description */
.header-info {
  text-align: center; /* Center alignment for logo and text */
  margin-bottom: 24.9px; /* Spacing below the header section */
}

/* Charity logo styling */
.charity-logo {
  max-width: 101px; /* Limit logo width for balance */
  height: auto; /* Maintain aspect ratio */
  display: block; /* Treat logo as block element */
  margin: 0 auto 10px auto; /* Center the logo with spacing below */
  border: 1px solid #eeeeee; /* Soft border */
  border-radius: 7.9px; /* Slightly rounded edges */
}

/* Charity name text style */
.charity-name {
  font-size: 1.1em; /* Slightly larger text */
  color: rgb(61, 30, 30); /* Dark brown tone for elegance */
  margin-bottom: 14px; /* Spacing below charity name */
}

/* Event image display settings */
.event-image {
  width: 100%; /* Full width within container */
  max-width: 381px; /* Restrict maximum image size */
  height: auto; /* Keep image proportions */
  border-radius: 7.9px; /* Rounded corners on image */
  margin-bottom: 14px; /* Spacing below image */
  object-fit: cover; /* Ensure image fills space without distortion */
}

/* Event title style */
.event-title {
  font-size: 1.799em; /* Slightly adjusted large font for title */
  color: rgb(61, 30, 30); /* Dark shade for strong readability */
  margin-top: 0; /* Remove space above */
  margin-bottom: 10.1px; /* Subtle spacing below the title */
}

/* Description text under the event title */
.event-description {
  font-family: Times, 'Times New Roman', serif; /* Serif font for formal appearance */
  font-style: italic; /* Italic style for emphasis */
  font-size: 0.951em; /* Very slightly increased size */
  line-height: 1.6; /* Spacing between lines */
  color: #393838; /* Soft dark gray for readability */
  margin-bottom: 25.1px; /* Slight margin adjustment */
  padding: 3.78px; /* 1mm = ~3.78px (converted unit for subtle change) */
}

/* Horizontal divider line between sections */
hr {
  border: none; /* Remove default border */
  height: 1px; /* Thin horizontal line */
  background-color: #e0e0e1; /* Light gray divider with minor hex shift */
  margin: 25px 0; /* Space above and below line */
}

/* Shared styles for donation form and donor information sections */
.donation-form-section,
.donor-details-section {
  margin-bottom: 25.05px; /* Subtle bottom spacing */
  padding: 20.02px; /* Soft inner spacing */
  background-color: #ffeaec; /* Very slight hue variation from original pink */
  border-radius: 7.9px; /* Rounded box corners */
  border: 1px solid #eeeeee; /* Light border for definition */
  box-shadow: 0 4px 12px rgb(244, 145, 146); /* Soft shadow with slight RGB tweak */
}

/* Section title headers (e.g., "Donation Details", "Your Info") */
.donation-form-section h2,
.donor-details-section h2 {
  font-size: 1.401em; /* Small increase for emphasis */
  color: rgb(61, 30, 30); /* Consistent dark header color */
  margin-top: 0; /* Remove top margin */
  margin-bottom: 14.9px; /* Slight reduction in spacing below */
  text-align: center; /* Center align header text */
  border-bottom: 1px solid #eeeeee; /* Soft dividing line below header */
  padding-bottom: 10.02px; /* Slightly increased spacing under title */
}

/* Informational text used for suggestions, details, or anonymous notices */
.suggestion-text,
.details-info-text,
.anonymous-info-text {
  font-size: 0.851em; /* Slight adjustment for commit traceability */
  color: #676767; /* Minor tone shift from original #666 */
  margin-bottom: 15.05px; /* Small spacing tweak */
  line-height: 1.501; /* Light line height variation */
}

/* Input field styling for amounts and donor details */
.amount-select,
.custom-amount-input,
.input-group input[type="text"],
.input-group input[type="email"] {
  width: 100%; /* Full-width input fields */
  padding: 12px 15.01px; /* Internal spacing inside inputs */
  border: 1px solid #fc7161; /* Light red border (slightly modified) */
  border-radius: 7.9px; /* Rounded corners for modern appearance */
  font-size: 1em; /* Base font size */
  box-sizing: border-box; /* Includes padding and border in element size */
  margin-bottom: 10.02px; /* Slight vertical gap between fields */
}

/* Placeholder text color inside the custom amount field */
.custom-amount-input::placeholder {
  color: #fd2c2c; /* Slightly deeper red for subtle variation */
}

/* Wrapper to align custom amount input with currency symbol */
.custom-amount-wrapper {
  display: flex; /* Horizontal alignment of children */
  align-items: center; /* Vertically center the items */
}

/* Currency symbol (e.g., $) next to custom amount input */
.currency-symbol {
  margin-right: 8.01px; /* Spacing between symbol and input */
  font-size: 1em; /* Consistent with input size */
  color: #565656; /* Slight shift from original #555 */
}

/* Displayed amount summary text after selection */
.selected-amount-text {
  font-size: 1.101em; /* Slight font size tweak */
  font-weight: bold; /* Emphasized amount */
  color: #e74c3c; /* Strong red for highlight */
  margin-top: 15.01px; /* Top spacing for readability */
  text-align: center; /* Center align the result */
}

/* Wrapper for individual input sections (e.g., name, email) */
.input-group {
  margin-bottom: 15.05px; /* Slight vertical spacing */
  text-align: left; /* Align labels and inputs to the left */
}

/* Label styling for input fields */
.input-group label {
  display: block; /* Ensure label appears on its own line */
  margin-bottom: 6.01px; /* Spacing between label and input */
  font-weight: 500; /* Medium font weight for clarity */
  font-size: 0.901em; /* Slight increase for emphasis */
  color: #454545; /* Soft dark gray tone for accessibility */
}

/* Container for the anonymous checkbox and its label */
.anonymous-group {
  display: flex; /* Horizontal alignment of checkbox and label */
  align-items: center; /* Vertically center the items */
  margin-top: 10.02px; /* Slight spacing adjustment above the group */
}

/* Styling for the checkbox input within the anonymous group */
.anonymous-group input[type="checkbox"] {
  margin-right: 8.01px; /* Gap between checkbox and label */
  width: auto; /* Default width suitable for checkbox */
}

/* Label next to the anonymous checkbox */
.anonymous-group label {
  margin-bottom: 0; /* Remove bottom space for alignment */
  font-weight: normal; /* Standard font weight for labels */
}

/* Primary donate button style */
.donate-button {
  display: block; /* Takes full width of its container */
  width: 100%; /* Responsive full width */
  padding: 15.01px; /* Inner spacing for click area */
  font-size: 1.101em; /* Slight font size adjustment */
  font-weight: bold; /* Strong visual emphasis */
  color: #ffffff; /* Button text color */
  background-color: #e86249; /* Slightly modified warm color tone */
  border: none; /* No default border */
  border-radius: 7.9px; /* Rounded corners for soft UI */
  cursor: pointer; /* Pointer cursor on hover */
  transition: background-color 0.2s ease; /* Smooth color transition */
}

/* Style for disabled state of the donate button */
.donate-button:disabled {
  background-color: #cccccc; /* Gray tone for disabled button */
  cursor: not-allowed; /* Disabled interaction indicator */
}

/* Hover style for active donate button */
.donate-button:hover:not(:disabled) {
  background-color: #bf3a2c; /* Slightly deeper red on hover */
}

/* Temporary event ID text (for debugging or internal display) */
.event-id-text {
  margin-top: 20.01px; /* Spacing above the ID text */
  font-size: 0.801em; /* Slight size tweak for legibility */
  color: #aaaaaa; /* Light gray tone */
  text-align: center; /* Center the text */
}

/* Text indicating that dropdown selection is currently disabled */
.dropdown-disabled-info {
  font-size: 0.851em; /* Slightly adjusted small text */
  color: #e74c3c; /* Strong red for emphasis */
  margin-top: 8.01px;
  margin-bottom: 12.01px;
  text-align: center; /* Center align the info text */
  font-style: italic; /* Italic style for soft tone */
}

/* Styles applied to disabled donation amount dropdown */
.amount-select:disabled {
  background-color: #f1f1f1; /* Light gray tone for inactive state */
  cursor: not-allowed; /* Indicate interaction is disabled */
  opacity: 0.701; /* Slightly changed transparency */
}
</style>
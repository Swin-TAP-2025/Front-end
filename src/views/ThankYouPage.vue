<template>
  <div class="thank-you-page-wrapper">
    <div class="thank-you-page">
      <!-- Display when loading -->
      <div v-if="isLoading" class="loading-container">
        <div class="spinner"></div>
        <p>Loading donation details...</p>
        <p v-if="retryCount > 0" style="font-size: 0.9em; color: grey;">
          (Checking status again... Attempt {{ retryCount }})
        </p>
        <p v-if="retryCount > 0" style="font-size: 0.8em; color: grey;">
          (Confirmation can take up to 3 minutes)
        </p>
      </div>

      <!-- Display when an error occurred -->
      <div v-else-if="error" class="error-container">
        <h1>An Error Occurred</h1>
        <p>{{ error }}</p>
        <hr class="separator">
        {/* Link to go back to the specific donation page if eventId is available */}
        <router-link v-if="donationDetails && donationDetails.eventId"
             :to="{ name: 'DonationPage', params: { eventId: donationDetails.eventId } }"
             class="home-link">
          Back to Donation Page
        </router-link>
      </div>
      <!-- Main content when data is loaded successfully -->
      <div v-else class="content-loaded">
        <h1 v-if="donorName" class="thank-you-title">Thank You, {{ donorName }}, for Your Donation!</h1>
        <h1 v-else class="thank-you-title">Thank You for Your Donation!</h1>

        <p v-if="donationDetails && donationDetails.isPaid" class="confirmation-message">
          Your generous donation has been successfully processed.
        </p>
        <p v-else class="confirmation-message">
          We appreciate your contribution! We're confirming the final status.
        </p>
        <hr class="separator">

        <div class="summary section-box">
          <h2>Donation Summary</h2>
          <div v-if="donationDetails && donationDetails.isPaid" class="summary-details">
            <p class="detail-item">
              <span>Amount Donated:</span>
              <strong>{{ formatCurrency(donationDetails.amount) }}</strong>
            </p>
            <p class="detail-item" v-if="donationDetails.stripePaymentLinkId"><span>Payment Reference:</span> {{ donationDetails.stripePaymentLinkId }}</p>
            <p class="detail-item"><span>Status:</span> Paid</p>
            <p class="detail-item"><span>Date:</span> {{ formatDate(donationDetails.updated_at) }}</p>
          </div>
          <p v-else-if="!donationId && !isLoading" class="detail-item">
            Could not retrieve specific donation details.
          </p>
          <p v-else class="detail-item">
            Waiting for final confirmation...
          </p>
        </div>

        <div class="receipt-options section-box">
          <h2>Receipt</h2>
          <p id="receipt_text">You can download a simple confirmation below.</p>
          <div class="button-with-icon">
            <img src="/icons/pdf-logo.svg" alt="PDF" class="pdf-icon-alone" />
            <button @click="downloadPDF" :disabled="isGeneratingPDF || !donationDetails || !donationDetails.isPaid" class="action-button">
            {{ isGeneratingPDF ? 'Generating...' : 'Download Confirmation' }}
            </button>
          </div>
        </div>

        <div class="social-share section-box">
          <h2 id="share">Tell people you've donated:</h2>
          <div class="share-buttons">
            <a :href="getFacebookShareUrl()" target="_blank" class="share-button facebook">
              <img src="/icons/facebook-logo.svg" alt="Facebook" class="icon"/>
            </a>
            <a :href="getTwitterShareUrl()" target="_blank" class="share-button twitter">
              <img src="/icons/twitter-logo.svg" alt="Twitter" class="icon"/>
            </a>
          </div>
        </div>

        <router-link v-if="donationDetails && donationDetails.eventId"
             :to="{ name: 'DonationPage', params: { eventId: donationDetails.eventId } }"
             class="home-link">
          Back to Donation Page
        </router-link>
         <router-link v-else to="/" class="home-link">
            Back to Home
        </router-link>

        <!-- Hidden div for PDF generation content -->
        <div ref="pdfContent"
         style="position: absolute; left: -9999px; top: auto;
                width: 180mm;
                padding: 15mm;
                background: white;
                font-family: Arial, sans-serif;
                font-size: 10pt;
                line-height: 1.5;
                color: #333333;">
          <!-- PDF Header -->
          <div style="text-align: center; margin-bottom: 10mm;">
            <h1 style="font-size: 18pt; color: #2c3e50; margin: 0 0 5mm 0; padding-bottom: 3mm; border-bottom: 1px solid #eeeeee;">
              Donation Confirmation
            </h1>
          </div>
          <div style="margin-bottom: 7mm;">
            <p v-if="donorName" style="margin: 0 0 2mm 0;">Dear {{ donorName }},</p>
            <p style="margin: 0;">Thank you for your generous donation!</p>
          </div>
          <!-- Event and Charity Information -->
          <div v-if="eventDetailsForPDF" style="margin-bottom: 7mm; padding: 5mm 0; border-top: 1px dashed #dddddd; border-bottom: 1px dashed #dddddd;">
            <p style="margin: 0 0 2mm 0;"><strong>Event:</strong> {{ eventDetailsForPDF.name }}</p>
            <p v-if="eventDetailsForPDF.charity" style="margin: 0;"><strong>Charity:</strong> {{ eventDetailsForPDF.charity.name }}</p>
          </div>
          <!-- Donation Details -->
          <div v-if="donationDetails && donationDetails.isPaid" style="margin-bottom: 7mm;">
            <h2 style="font-size: 12pt; color: #333333; margin: 0 0 3mm 0; padding-bottom: 2mm; border-bottom: 1px solid #eeeeee;">
              Donation Details:
            </h2>
            <table style="width: 100%; border-collapse: collapse;">
            <tbody>
                <tr style="line-height: 1.8;">
                  <td style="width: 40%; padding: 1mm 0; font-weight: bold;">Amount:</td>
                  <td style="width: 60%; padding: 1mm 0;">{{ formatCurrency(donationDetails.amount) }}</td>
                </tr>
                <tr style="line-height: 1.8;">
                  <td style="padding: 1mm 0; font-weight: bold;">Donation ID:</td>
                  <td style="padding: 1mm 0;">{{ donationId }}</td>
                </tr>
                <tr v-if="donationDetails.stripePaymentLinkId" style="line-height: 1.8;">
                  <td style="padding: 1mm 0; font-weight: bold;">Payment Reference:</td>
                  <td style="padding: 1mm 0;">{{ donationDetails.stripePaymentLinkId }}</td>
                </tr>
                <tr style="line-height: 1.8;">
                  <td style="padding: 1mm 0; font-weight: bold;">Status:</td>
                  <td style="padding: 1mm 0;">Paid</td>
                </tr>
                <tr style="line-height: 1.8;">
                  <td style="padding: 1mm 0; font-weight: bold;">Date:</td>
                  <td style="padding: 1mm 0;">{{ formatDate(donationDetails.updated_at) }}</td>
                </tr>
            </tbody>
            </table>
          </div>
          <div style="margin-top: 10mm; padding-top: 5mm; border-top: 1px solid #eeeeee;">
            <p style="font-size: 9pt; line-height: 1.4;">
              Thank you once again for your support. Your contribution makes a real impact and helps us continue our work. We deeply appreciate your trust and partnership.
            </p>
          </div>
          <!-- Footer -->
          <div style="margin-top: 10mm; text-align: center; font-size: 8pt; color: #777777;">
            <p>This is an automatically generated confirmation.</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'; // Import axios for API calls
import jsPDF from 'jspdf'; // Import jsPDF for PDF generation
import html2canvas from 'html2canvas'; // Import html2canvas to capture HTML as image

export default {
  name: 'ThankYouPage', // Component name
  data() { // Component's local state
    return {
      // --- State Management Variables ---
      isLoading: true,              // Tracks if page data is loading
      error: null,                  // Stores any error messages
      isGeneratingPDF: false,       // Tracks if PDF is being generated
      retryCount: 0,                // Counter for API retry attempts for donation status
      maxRetries: 5,                // Maximum number of retry attempts

      // --- Data Storage Variables ---
      donationId: null,             // Donation ID fetched from URL
      donationDetails: null,        // Stores response from /api/donation/status/{id}
      eventDetailsForPDF: null,     // Stores response from /api/event/{id} (for PDF)
      donorName: '',                // Donor's name fetched from Local Storage

      // --- Other Data (for social sharing, etc.) ---
      eventName: 'this cause',      // Placeholder, updated by fetchEventDetailsForPDF
      eventUrl: window.location.origin // Placeholder, base URL of the site
    };
  },
  methods: { // Component methods
    // --- 1. Fetches donation status from the API ---
    async fetchDonationStatus(id) {
      this.error = null; // Reset error on new attempt/retry
      const apiUrl = `https://tap-2025-455910.ts.r.appspot.com/api/donation/status/${id}`;
      // console.log(`Fetching donation status for ID: ${id}, Attempt: ${this.retryCount + 1}`);

      try {
        const response = await axios.get(apiUrl);
        this.donationDetails = response.data;
        // console.log('Received donation status:', this.donationDetails);

        // If payment is confirmed or max retries reached, stop loading
        if (this.donationDetails.isPaid || this.retryCount >= this.maxRetries) {
          this.isLoading = false; // Stop loading
          if (this.donationDetails.isPaid && this.donationDetails.eventId) {
            // If paid, fetch event details for PDF
            this.fetchEventDetailsForPDF(this.donationDetails.eventId);
          } else if (!this.donationDetails.isPaid) {
            // console.warn('Max retries reached, donation status still not paid.');
            this.error = "Could not confirm payment status after multiple attempts. Please check back later or contact support.";
          }
        } else {
          // If not paid and retries left, try again after a delay
          this.retryCount++;
          // console.log(`isPaid is false, retrying in 30 seconds... (Attempt ${this.retryCount})`);
          setTimeout(() => this.fetchDonationStatus(id), 30000); // Retry after 30 seconds
        }

      } catch (err) {
        console.error('Error fetching donation status:', err); // Log error
        this.error = 'Failed to retrieve donation details.';
        if (err.response && err.response.status === 404) {
          this.error = 'Donation record not found.';
        }
        this.isLoading = false; // Stop loading on error
      }
    },

    // --- Fetches event details (for PDF and social sharing) ---
    async fetchEventDetailsForPDF(eventId) {
      try {
        const apiUrl = `https://tap-2025-455910.ts.r.appspot.com/api/event/${eventId}`;
        const response = await axios.get(apiUrl);
        this.eventDetailsForPDF = response.data;
        // Update eventName for social sharing if fetched successfully
        if (this.eventDetailsForPDF && this.eventDetailsForPDF.name) {
          this.eventName = this.eventDetailsForPDF.name;
        }
        // console.log('Fetched event details for PDF/Share:', this.eventDetailsForPDF);
      } catch (error) {
        console.error('Error fetching event details for PDF:', error);
        // Not critical if this fails, PDF might just miss event name
      }
    },

    // --- Formats currency (AUD, no cents as per earlier decision) ---
    formatCurrency(value) {
      // Assuming amount from API is a direct dollar value (integer or float)
      if (value === null || typeof value !== 'number' || isNaN(value)) {
        return '$0.00'; // Default to $ for AUD, as A$ was removed
      }
      return new Intl.NumberFormat('en-AU', { // Using en-AU for AUD specific formatting
        style: 'currency',
        currency: 'AUD' // Still specify AUD for Intl.NumberFormat
      }).format(value);
    },

    // --- Formats date string ---
    formatDate(dateString) {
      if (!dateString) return '';
      try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-AU', { // Australian date format
          day: '2-digit', month: '2-digit', year: 'numeric'
        });
      } catch (e) {
        return dateString; // Return original if parsing fails
      }
    },

    // --- Generates and downloads PDF ---
    async downloadPDF() {
      // Only generate PDF if payment is confirmed
      if (this.isGeneratingPDF || !this.donationDetails || !this.donationDetails.isPaid) return;
      this.isGeneratingPDF = true;

      try {
        const pdfElement = this.$refs.pdfContent;
        if (!pdfElement) {
           throw new Error("PDF content element not found.");
        }
        // Capture HTML element as canvas (image)
        const canvas = await html2canvas(pdfElement, { scale: 2 }); // Higher scale for better resolution
        const imgData = canvas.toDataURL('image/png');

        // Create PDF document
        const pdf = new jsPDF('p', 'mm', 'a4'); // Portrait, mm, A4
        const imgProps = pdf.getImageProperties(imgData);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfPageHeight = pdf.internal.pageSize.getHeight(); // Renamed for clarity
        // let imgHeight = (imgProps.height * pdfWidth) / imgProps.width;
        const margin = 15;

        // Adjust image dimensions to fit within PDF page with margins
        let usableWidth = pdfWidth - (margin * 2);
        let usableHeight = pdfPageHeight - (margin * 2);
        let finalImgWidth = usableWidth;
        let finalImgHeight = (imgProps.height * finalImgWidth) / imgProps.width;

        if (finalImgHeight > usableHeight) {
            finalImgHeight = usableHeight;
            finalImgWidth = (imgProps.width * finalImgHeight) / imgProps.height;
        }

        pdf.addImage(imgData, 'PNG', margin, margin, finalImgWidth, finalImgHeight);
        pdf.save(`donation_${this.donationId}_confirmation.pdf`); // Save PDF with donation ID in filename

      } catch (error) {
        console.error("Error generating PDF:", error);
        alert("Failed to generate PDF confirmation.");
      } finally {
        this.isGeneratingPDF = false; // Reset PDF generation state
      }
    },

    // --- Generates Facebook share URL ---
    getFacebookShareUrl() {
      const eventNameToShare = (this.eventDetailsForPDF && this.eventDetailsForPDF.name) || this.eventName;
      const amountText = this.donationDetails && this.donationDetails.isPaid ? ` ${this.formatCurrency(this.donationDetails.amount)} to` : '';
      const quoteText = `I just donated${amountText} ${eventNameToShare}! Join me in supporting them.`;
      // It's better to share the event page URL or project main URL if available
      const shareUrl = this.eventUrl; // or construct specific event page URL
      const encodedUrl = encodeURIComponent(shareUrl);
      const encodedQuote = encodeURIComponent(quoteText);
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}"e=${encodedQuote}`;
    },

    // --- 7. Generates Twitter share URL ---
    getTwitterShareUrl() {
      const eventNameToShare = (this.eventDetailsForPDF && this.eventDetailsForPDF.name) || this.eventName;
      const amountText = this.donationDetails && this.donationDetails.isPaid ? ` ${this.formatCurrency(this.donationDetails.amount)} to` : '';
      const shareUrl = this.eventUrl; // or construct specific event page URL
      const text = encodeURIComponent(`I just donated${amountText} ${eventNameToShare}! Join me here: ${shareUrl}`);
      return `https://twitter.com/intent/tweet?text=${text}`;
    }
  },
  // --- Component mounted lifecycle hook ---
  mounted() {
    // console.log('Thank You Page Mounted');

    // Load donor name from Local Storage
    const savedName = localStorage.getItem('donorName');
    if (savedName) {
      this.donorName = savedName;
      // console.log('Loaded donorName:', savedName);
    }

    // Read donationId from URL query parameter and start fetching status
    const donationIdFromUrl = this.$route.query.donationId; // Assuming Fai sends it as 'donationId'
    if (donationIdFromUrl) {
      this.donationId = donationIdFromUrl;
      // console.log("Received donation ID from URL:", this.donationId);
      this.isLoading = true; // Start loading before API call
      this.fetchDonationStatus(this.donationId); // Call API to get donation status
    } else {
      console.warn("Donation ID not found in URL.");
      this.error = "Donation ID is missing. Cannot fetch details.";
      this.isLoading = false; // Stop loading if no ID
    }
  }
}
</script>

<style scoped>
/* Wrapper for the entire page to apply background and centering */
.thank-you-page-wrapper {
  background-color: #fafafa; /* Light grey tone with subtle change */
  min-height: 100vh; /* Full viewport height */
  padding: 20.01px; /* Slight internal spacing adjustment */
  display: flex; /* Use Flexbox for layout */
  justify-content: center; /* Center horizontally */
  align-items: flex-start; /* Align items at the top vertically */
  font-family: Arial, 'Helvetica Neue', sans-serif; /* Font fallback rearranged */
}

/* Content container displayed after successful donation */
.thank-you-page {
  background-color: #ffffff; /* Clean white content background */
  padding: 30.02px; /* Slight padding tweak for commit trace */
  max-width: 600px; /* Responsive maximum width */
  width: 100%; /* Full width within limits */
  margin-top: 30.01px; /* Top spacing */
  border-radius: 12.01px; /* Rounded corners with micro adjustment */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.079); /* Subtle shadow adjustment */
  text-align: center; /* Center text alignment */
  color: #343434; /* Dark grey for body text (slightly changed from #333) */
}

/* Container for loading or error states */
.loading-container,
.error-container {
  padding: 40px 20.01px; /* Vertical and horizontal spacing */
  text-align: center; /* Center contents */
}

/* Loading spinner animation (circular rotating element) */
.spinner {
  border: 4px solid rgba(0, 0, 0, 0.1); /* Light outer ring */
  border-left-color: #0080ff; /* Spinner highlight color (slightly different blue) */
  border-radius: 50%; /* Circular shape */
  width: 40.01px; /* Minor width tweak */
  height: 40.01px; /* Minor height tweak */
  animation: spin 1s linear infinite; /* Continuous rotation */
  margin: 0 auto 20.01px auto; /* Centered with bottom spacing */
}
/* Animation keyframes for spinner rotation */
@keyframes spin { 
  to { 
    transform: rotate(360deg); 
  } 
} /* Spin animation definition */

/* Error title inside error container */
.error-container h1 {
  color: #e74d3d; /* Bright red with slight hue difference */
}

/* Title text displayed on successful confirmation */
.content-loaded .thank-you-title {
  font-size: 2.01em; /* Large text for headline */
  color: #2c3f50; /* Dark blue/gray tone slightly shifted */
  margin-bottom: 10.02px; /* Space below the title */
}

/* Confirmation message shown after donation */
.content-loaded .confirmation-message {
  font-size: 1.101em; /* Slight font size increase */
  color: #565656; /* Slightly darker grey */
  margin-bottom: 25.01px; /* Spacing below the message */
}

/* Horizontal separator for visual division between sections */
.separator {
  border: none; /* Remove default border */
  height: 1px; /* Thin horizontal line */
  background-color: #e1e1e1; /* Slightly lighter separator line */
  margin: 30.01px 0; /* Vertical spacing above and below */
}

/* Common container style for structured sections (Summary, Receipt, Social Share) */
.section-box {
  margin-bottom: 30.01px; /* Slight adjustment to spacing below */
  padding: 20.02px; /* Subtle padding update */
  background-color: #ffeaec; /* Slightly adjusted soft pink background */
  border-radius: 8.01px; /* Rounded edges with minimal change */
  border: 1px solid #eeeeee; /* Very light border for section definition */
  text-align: left; /* Align content to the left */
  box-shadow: 0 4px 12px rgb(244, 145, 146); /* Gentle box shadow with slight RGB tweak */
}

/* Section heading style within section-box containers */
.section-box h2 {
  font-size: 1.501em; /* Slight size variation */
  text-align: center; /* Center title within section */
  color: rgb(61, 30, 30); /* Dark reddish-brown title color */
  margin-top: 0;
  margin-bottom: 15.01px;
  border-bottom: 1px solid #eeeeee; /* Underline for visual separation */
  padding-bottom: 10.01px;
}

/* Paragraph styling inside section boxes */
.section-box p {
  font-size: 1.101em; /* Slightly increased for legibility */
  line-height: 1.61; /* Comfortable reading line spacing */
  color: #2a2a2a; /* Almost black text color */
  margin-left: 30.01px; /* Slight left margin for indent */
}

/* Label styling for key-value pairs (e.g., in summary items) */
.detail-item span {
  font-weight: 800; /* Strong emphasis */
  color: #e86249; /* Slight variation from original action red */
  margin-right: 8.01px;
}

/* General-purpose action button styling (e.g., download, share) */
.action-button {
  padding: 10.01px 10.01px; /* Symmetrical internal spacing */
  font-size: 1em;
  border: 2px solid #ff0303; /* Strong red border */
  border-radius: 8.01px;
  cursor: pointer;
  margin: 0;
  text-decoration: none;
  display: inline-block;
  color: #ff0303; /* Matching text color */
  background-color: #ffffff; /* White background for contrast */
  transition: background-color 0.2s ease; /* Smooth interaction */
  font-weight: 500; /* Medium emphasis */
}

/* Hover state for action buttons */
.action-button:hover:not(:disabled) {
  background-color: #bf3a2b; /* Slightly deeper red on hover */
}

/* Layout for button and icon side-by-side (e.g., PDF icon + text) */
.button-with-icon {
  display: flex; /* Horizontal alignment */
  align-items: center;
  gap: 10.01px; /* Space between icon and text */
  margin-top: 10.01px;
  margin-left: 20.01px;
}

/* Sizing for standalone PDF icon */
.pdf-icon-alone {
  width: 50.01px;
  height: 50.01px;
}

/* Wrapper for social share buttons */
.share-buttons {
  text-align: center; /* Center alignment of button block */
}

/* Size of social media icons inside share buttons */
.share-button .icon {
  width: 50.01px;
  height: 50.01px;
}

/* Button-style link directing user to home page */
.home-link {
  display: inline-block; /* Allow for button-like appearance */
  padding: 15.01px 70.02px; /* Balanced button padding */
  border: 1px solid #ff6262; /* Light red border */
  font-size: 1.401rem;
  font-weight: 600;
  color: #ffffff;
  text-decoration: none;
  background-color: #e86249; /* Soft red background */
  border-radius: 8.01px;
}

/* Hover state for home link */
.home-link:hover:not(:disabled) {
  background-color: #bf3a2b; /* Slightly darker red on hover */
}

</style>
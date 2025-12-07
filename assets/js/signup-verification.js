/**
 * Signup Verification Functions
 * Email and Mobile OTP verification
 */

let emailVerified = false;
let mobileVerified = false;
let emailOTP = '';
let mobileOTP = '';

// Load country codes
async function loadCountryCodes() {
  try {
    const response = await fetch('/data/country-codes.json');
    const codes = await response.json();
    const select = document.getElementById('countryCodeSelect');
    
    if (!select) return;
    
    select.innerHTML = '';
    codes.forEach(country => {
      const option = document.createElement('option');
      option.value = country.dial_code;
      option.textContent = `${country.flag} ${country.dial_code} (${country.name})`;
      option.dataset.code = country.code;
      select.appendChild(option);
    });
    
    // Set default to India
    const indiaOption = codes.find(c => c.code === 'IN');
    if (indiaOption) {
      select.value = indiaOption.dial_code;
    }
  } catch (error) {
    console.error('Error loading country codes:', error);
  }
}

// Update verification displays when moving to step 4
function updateVerificationDisplays() {
  const email = document.getElementById('emailInput')?.value || '';
  const phone = document.getElementById('phoneInput')?.value || '';
  const countryCode = document.getElementById('countryCodeSelect')?.value || '+91';
  
  const emailDisplay = document.getElementById('emailDisplay');
  const phoneDisplay = document.getElementById('phoneDisplay');
  
  if (emailDisplay) emailDisplay.textContent = email || 'Enter your email in Step 1';
  if (phoneDisplay) phoneDisplay.textContent = phone ? `${countryCode} ${phone}` : 'Enter your phone in Step 1';
}

// Send email verification OTP
async function sendEmailVerification() {
  const email = document.getElementById('emailInput')?.value;
  
  if (!email) {
    alert('Please enter your email address first.');
    return;
  }
  
  // Generate random 6-digit OTP (in production, this would be sent from server)
  emailOTP = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Simulate sending email (in production, call your backend API)
  console.log(`Email OTP for ${email}: ${emailOTP}`);
  
  // Show OTP input section
  document.getElementById('emailOTPSection').style.display = 'block';
  document.getElementById('verifyEmailBtn').textContent = 'Resend OTP';
  document.getElementById('verifyEmailBtn').disabled = true;
  
  // Re-enable after 30 seconds
  setTimeout(() => {
    document.getElementById('verifyEmailBtn').disabled = false;
  }, 30000);
  
  alert(`OTP sent to ${email}. In production, this will be sent via email. OTP for demo: ${emailOTP}`);
}

// Verify email OTP
function verifyEmailOTP() {
  const otpInputs = document.querySelectorAll('#emailOTPSection .otp-input');
  const enteredOTP = Array.from(otpInputs).map(input => input.value).join('');
  
  if (enteredOTP === emailOTP) {
    emailVerified = true;
    const statusDiv = document.getElementById('emailVerificationStatus');
    statusDiv.className = 'verification-status verified';
    statusDiv.innerHTML = `
      <span class="verification-status-icon">✓</span>
      <div class="verification-status-text">
        <strong>Email Verified</strong>
        <small>${document.getElementById('emailInput').value}</small>
      </div>
      <button class="verify-btn verified" disabled>Verified</button>
    `;
    document.getElementById('emailOTPSection').style.display = 'none';
    checkVerificationStatus();
  } else {
    alert('Invalid OTP. Please try again.');
    // Clear inputs
    otpInputs.forEach(input => input.value = '');
    otpInputs[0]?.focus();
  }
}

// Send mobile verification OTP
async function sendMobileVerification() {
  const phone = document.getElementById('phoneInput')?.value;
  const countryCode = document.getElementById('countryCodeSelect')?.value;
  
  if (!phone) {
    alert('Please enter your phone number first.');
    return;
  }
  
  // Generate random 6-digit OTP (in production, this would be sent from server)
  mobileOTP = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Simulate sending SMS (in production, call your backend API)
  console.log(`SMS OTP for ${countryCode} ${phone}: ${mobileOTP}`);
  
  // Show OTP input section
  document.getElementById('mobileOTPSection').style.display = 'block';
  document.getElementById('verifyMobileBtn').textContent = 'Resend OTP';
  document.getElementById('verifyMobileBtn').disabled = true;
  
  // Re-enable after 30 seconds
  setTimeout(() => {
    document.getElementById('verifyMobileBtn').disabled = false;
  }, 30000);
  
  alert(`OTP sent to ${countryCode} ${phone}. In production, this will be sent via SMS. OTP for demo: ${mobileOTP}`);
}

// Verify mobile OTP
function verifyMobileOTP() {
  const otpInputs = document.querySelectorAll('#mobileOTPSection .otp-input');
  const enteredOTP = Array.from(otpInputs).map(input => input.value).join('');
  
  if (enteredOTP === mobileOTP) {
    mobileVerified = true;
    const phone = document.getElementById('phoneInput').value;
    const countryCode = document.getElementById('countryCodeSelect').value;
    const statusDiv = document.getElementById('mobileVerificationStatus');
    statusDiv.className = 'verification-status verified';
    statusDiv.innerHTML = `
      <span class="verification-status-icon">✓</span>
      <div class="verification-status-text">
        <strong>Mobile Verified</strong>
        <small>${countryCode} ${phone}</small>
      </div>
      <button class="verify-btn verified" disabled>Verified</button>
    `;
    document.getElementById('mobileOTPSection').style.display = 'none';
    checkVerificationStatus();
  } else {
    alert('Invalid OTP. Please try again.');
    // Clear inputs
    otpInputs.forEach(input => input.value = '');
    otpInputs[0]?.focus();
  }
}

// Check if both verifications are complete
function checkVerificationStatus() {
  if (emailVerified && mobileVerified) {
    // Enable submit button or show success message
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.classList.add('verified');
    }
  }
}

// OTP input auto-focus
document.addEventListener('DOMContentLoaded', () => {
  // Email OTP inputs
  const emailOTPInputs = document.querySelectorAll('#emailOTPSection .otp-input');
  emailOTPInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value && index < emailOTPInputs.length - 1) {
        emailOTPInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        emailOTPInputs[index - 1].focus();
      }
    });
  });
  
  // Mobile OTP inputs
  const mobileOTPInputs = document.querySelectorAll('#mobileOTPSection .otp-input');
  mobileOTPInputs.forEach((input, index) => {
    input.addEventListener('input', (e) => {
      if (e.target.value && index < mobileOTPInputs.length - 1) {
        mobileOTPInputs[index + 1].focus();
      }
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !e.target.value && index > 0) {
        mobileOTPInputs[index - 1].focus();
      }
    });
  });
});

// Social login functions
function signInWithGoogle() {
  alert('Google Sign-In will be implemented with backend integration.');
  // In production: window.location.href = '/api/auth/google';
}

function signInWithFacebook() {
  alert('Facebook Sign-In will be implemented with backend integration.');
  // In production: window.location.href = '/api/auth/facebook';
}

function signInWithApple() {
  alert('Apple Sign-In will be implemented with backend integration.');
  // In production: window.location.href = '/api/auth/apple';
}

// Update verification displays when step changes
const originalNextStep = window.nextStep;
window.nextStep = function(step) {
  if (step === 4) {
    updateVerificationDisplays();
    // Disable submit until verifications are complete
    const submitBtn = document.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = !emailVerified || !mobileVerified;
    }
  }
  if (originalNextStep) originalNextStep(step);
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadCountryCodes);
} else {
  loadCountryCodes();
}


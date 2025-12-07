/**
 * Golden Bond - Signup Page JavaScript
 * Dynamic dropdowns for religion, community, country, state, languages
 * Multi-step form with validation
 */

// ===========================================
// DATA CACHES
// ===========================================
let religionsData = [];
let countriesData = {};
let languagesFlat = [];

// ===========================================
// DOM ELEMENTS
// ===========================================
const form = document.getElementById('signupForm');
const steps = document.querySelectorAll('.form-step');
const progressSteps = document.querySelectorAll('.progress-step');
const nextBtns = document.querySelectorAll('.btn-next');
const prevBtns = document.querySelectorAll('.btn-prev');

// Form fields
const religionSelect = document.getElementById('religion');
const communitySelect = document.getElementById('community');
const countrySelect = document.getElementById('country');
const stateSelect = document.getElementById('state');
const motherTongueSelect = document.getElementById('motherTongue');
const languagesContainer = document.getElementById('languagesKnown');
const selectedLanguagesContainer = document.getElementById('selectedLanguages');

let currentStep = 0;
let selectedLanguages = [];

// ===========================================
// INITIALIZATION
// ===========================================
document.addEventListener('DOMContentLoaded', () => {
  loadSignupData();
  initFormNavigation();
  initFormValidation();
});

// ===========================================
// LOAD DATA
// ===========================================
async function loadSignupData() {
  try {
    const [religionsRes, countriesRes, languagesRes] = await Promise.all([
      fetch('data/religions.json'),
      fetch('data/countries.json'),
      fetch('data/languages.json')
    ]);

    if (religionsRes.ok) {
      const religionsJson = await religionsRes.json();
      religionsData = religionsJson.religions || [];
    }

    if (countriesRes.ok) {
      const countriesJson = await countriesRes.json();
      countriesData = countriesJson.countries || {};
    }

    if (languagesRes.ok) {
      const languagesJson = await languagesRes.json();
      languagesFlat = languagesJson.flatList || [];
    }

    // Populate dropdowns
    populateReligions();
    populateCountries();
    populateLanguages();

    console.log('✅ Signup data loaded successfully');
  } catch (error) {
    console.error('Failed to load signup data:', error);
    // Fallback to basic options
    populateFallbackOptions();
  }
}

// ===========================================
// POPULATE DROPDOWNS
// ===========================================
function populateReligions() {
  if (!religionSelect) return;

  religionSelect.innerHTML = '<option value="">Select your religion</option>';

  religionsData.forEach(religion => {
    const option = document.createElement('option');
    option.value = religion.id;
    option.textContent = religion.name;
    religionSelect.appendChild(option);
  });
}

function populateCommunities(religionId) {
  if (!communitySelect) return;

  communitySelect.innerHTML = '<option value="">Select community (optional)</option>';

  if (!religionId) return;

  const religion = religionsData.find(r => r.id === religionId);
  if (!religion || !religion.communities) return;

  religion.communities.forEach(category => {
    if (category.groups && category.groups.length > 0) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = category.category;

      category.groups.forEach(group => {
        const option = document.createElement('option');
        option.value = group;
        option.textContent = group;
        optgroup.appendChild(option);
      });

      communitySelect.appendChild(optgroup);
    }
  });
}

function populateCountries() {
  if (!countrySelect) return;

  countrySelect.innerHTML = '<option value="">Select your country</option>';

  // Flatten the nested structure
  Object.entries(countriesData).forEach(([region, subRegions]) => {
    Object.entries(subRegions).forEach(([subRegion, countries]) => {
      if (Array.isArray(countries) && countries.length > 0) {
        const optgroup = document.createElement('optgroup');
        optgroup.label = `${region} - ${subRegion}`;

        countries.forEach(country => {
          const option = document.createElement('option');
          option.value = country.name;
          option.textContent = country.name;
          option.dataset.code = country.code;
          option.dataset.states = JSON.stringify(country.states || []);
          optgroup.appendChild(option);
        });

        countrySelect.appendChild(optgroup);
      }
    });
  });
}

function populateStates(countryName) {
  if (!stateSelect) return;

  stateSelect.innerHTML = '<option value="">Select state/province (optional)</option>';

  if (!countryName) return;

  // Find the country and its states
  let states = [];
  
  Object.values(countriesData).forEach(subRegions => {
    Object.values(subRegions).forEach(countries => {
      if (Array.isArray(countries)) {
        const country = countries.find(c => c.name === countryName);
        if (country && country.states) {
          states = country.states;
        }
      }
    });
  });

  states.forEach(state => {
    const option = document.createElement('option');
    option.value = state;
    option.textContent = state;
    stateSelect.appendChild(option);
  });
}

function populateLanguages() {
  // Populate mother tongue dropdown
  if (motherTongueSelect) {
    motherTongueSelect.innerHTML = '<option value="">Select mother tongue</option>';
    
    const sortedLanguages = [...languagesFlat].sort();
    sortedLanguages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang;
      motherTongueSelect.appendChild(option);
    });
  }

  // Populate languages known (multi-select with chips)
  if (languagesContainer) {
    languagesContainer.innerHTML = '<option value="">Select languages you speak</option>';
    
    const sortedLanguages = [...languagesFlat].sort();
    sortedLanguages.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang;
      languagesContainer.appendChild(option);
    });
  }
}

function populateFallbackOptions() {
  // Fallback religions
  const fallbackReligions = [
    'Hindu', 'Muslim', 'Christian', 'Sikh', 'Buddhist', 
    'Jain', 'Jewish', 'Parsi', 'Other'
  ];

  if (religionSelect) {
    religionSelect.innerHTML = '<option value="">Select your religion</option>';
    fallbackReligions.forEach(r => {
      const option = document.createElement('option');
      option.value = r.toLowerCase();
      option.textContent = r;
      religionSelect.appendChild(option);
    });
  }

  // Fallback countries
  const fallbackCountries = [
    'India', 'United States', 'United Kingdom', 'Canada', 
    'Australia', 'United Arab Emirates', 'Singapore', 'Other'
  ];

  if (countrySelect) {
    countrySelect.innerHTML = '<option value="">Select your country</option>';
    fallbackCountries.forEach(c => {
      const option = document.createElement('option');
      option.value = c;
      option.textContent = c;
      countrySelect.appendChild(option);
    });
  }

  // Fallback languages
  const fallbackLanguages = [
    'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 
    'Malayalam', 'Marathi', 'Gujarati', 'Punjabi', 'Bengali'
  ];

  if (motherTongueSelect) {
    motherTongueSelect.innerHTML = '<option value="">Select mother tongue</option>';
    fallbackLanguages.forEach(l => {
      const option = document.createElement('option');
      option.value = l;
      option.textContent = l;
      motherTongueSelect.appendChild(option);
    });
  }
}

// ===========================================
// EVENT LISTENERS
// ===========================================
if (religionSelect) {
  religionSelect.addEventListener('change', (e) => {
    populateCommunities(e.target.value);
  });
}

if (countrySelect) {
  countrySelect.addEventListener('change', (e) => {
    populateStates(e.target.value);
  });
}

if (languagesContainer) {
  languagesContainer.addEventListener('change', (e) => {
    const selectedLang = e.target.value;
    if (selectedLang && !selectedLanguages.includes(selectedLang)) {
      addLanguageChip(selectedLang);
    }
    e.target.value = ''; // Reset dropdown
  });
}

// ===========================================
// LANGUAGE CHIPS
// ===========================================
function addLanguageChip(language) {
  if (selectedLanguages.includes(language)) return;
  if (selectedLanguages.length >= 10) {
    alert('You can select up to 10 languages');
    return;
  }

  selectedLanguages.push(language);
  renderLanguageChips();
}

function removeLanguageChip(language) {
  selectedLanguages = selectedLanguages.filter(l => l !== language);
  renderLanguageChips();
}

function renderLanguageChips() {
  if (!selectedLanguagesContainer) return;

  selectedLanguagesContainer.innerHTML = '';

  selectedLanguages.forEach(lang => {
    const chip = document.createElement('span');
    chip.className = 'language-chip';
    chip.innerHTML = `
      ${lang}
      <button type="button" onclick="removeLanguageChip('${lang}')">&times;</button>
    `;
    selectedLanguagesContainer.appendChild(chip);
  });

  // Update hidden input for form submission
  let hiddenInput = document.getElementById('languagesKnownHidden');
  if (!hiddenInput) {
    hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.id = 'languagesKnownHidden';
    hiddenInput.name = 'languagesKnown';
    selectedLanguagesContainer.parentElement.appendChild(hiddenInput);
  }
  hiddenInput.value = JSON.stringify(selectedLanguages);
}

// Make removeLanguageChip available globally
window.removeLanguageChip = removeLanguageChip;

// ===========================================
// FORM NAVIGATION
// ===========================================
function initFormNavigation() {
  // Next buttons
  nextBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      if (validateCurrentStep()) {
        goToStep(currentStep + 1);
      }
    });
  });

  // Previous buttons
  prevBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      goToStep(currentStep - 1);
    });
  });
}

function goToStep(stepIndex) {
  if (stepIndex < 0 || stepIndex >= steps.length) return;

  // Hide current step
  steps[currentStep].classList.remove('active');
  progressSteps[currentStep].classList.remove('active');

  // Show new step
  currentStep = stepIndex;
  steps[currentStep].classList.add('active');
  
  // Update progress
  progressSteps.forEach((step, index) => {
    if (index <= currentStep) {
      step.classList.add('active');
    } else {
      step.classList.remove('active');
    }
  });

  // Scroll to top of form
  form?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===========================================
// FORM VALIDATION
// ===========================================
function initFormValidation() {
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateAllSteps()) {
      return;
    }

    await submitForm();
  });
}

function validateCurrentStep() {
  const currentStepEl = steps[currentStep];
  const requiredFields = currentStepEl.querySelectorAll('[required]');
  let isValid = true;

  requiredFields.forEach(field => {
    if (!field.value.trim()) {
      isValid = false;
      showFieldError(field, 'This field is required');
    } else {
      clearFieldError(field);
    }
  });

  // Step-specific validation
  if (currentStep === 0) {
    // Basic Info validation
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const confirmPassword = document.getElementById('confirmPassword');

    if (email && !isValidEmail(email.value)) {
      showFieldError(email, 'Please enter a valid email address');
      isValid = false;
    }

    if (password && password.value.length < 8) {
      showFieldError(password, 'Password must be at least 8 characters');
      isValid = false;
    }

    if (confirmPassword && password && confirmPassword.value !== password.value) {
      showFieldError(confirmPassword, 'Passwords do not match');
      isValid = false;
    }

    // Age validation
    const dob = document.getElementById('dob');
    if (dob && dob.value) {
      const age = calculateAge(new Date(dob.value));
      if (age < 18) {
        showFieldError(dob, 'You must be at least 18 years old');
        isValid = false;
      }
      if (age > 100) {
        showFieldError(dob, 'Please enter a valid date of birth');
        isValid = false;
      }
    }
  }

  return isValid;
}

function validateAllSteps() {
  let allValid = true;

  steps.forEach((step, index) => {
    const requiredFields = step.querySelectorAll('[required]');
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        allValid = false;
        if (index !== currentStep) {
          goToStep(index);
        }
        showFieldError(field, 'This field is required');
      }
    });
  });

  return allValid;
}

function showFieldError(field, message) {
  clearFieldError(field);
  
  field.classList.add('error');
  
  const errorDiv = document.createElement('div');
  errorDiv.className = 'field-error';
  errorDiv.textContent = message;
  
  field.parentElement.appendChild(errorDiv);
}

function clearFieldError(field) {
  field.classList.remove('error');
  
  const existingError = field.parentElement.querySelector('.field-error');
  if (existingError) {
    existingError.remove();
  }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function calculateAge(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
}

// ===========================================
// FORM SUBMISSION
// ===========================================
async function submitForm() {
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  
  try {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating account...';

    // Gather form data
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    
    // Add languages array
    data.languagesKnown = selectedLanguages;

    // In Phase 1 (static), show success message
    // In Phase 2, this would POST to /api/auth/register
    
    const isBackendAvailable = await checkBackendAvailable();
    
    if (isBackendAvailable) {
      // Send to backend
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        // Store token
        localStorage.setItem('gb_token', result.accessToken);
        localStorage.setItem('gb_user_id', result.userId);
        
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
      } else {
        alert(result.error || 'Registration failed. Please try again.');
      }
    } else {
      // Demo mode - simulate success
      console.log('Registration data:', data);
      
      // Store demo user
      localStorage.setItem('gb_demo_user', JSON.stringify(data));
      
      // Show success
      showSuccessMessage();
    }

  } catch (error) {
    console.error('Registration error:', error);
    alert('Registration failed. Please try again.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function checkBackendAvailable() {
  try {
    const response = await fetch('/api/health', { 
      method: 'GET',
      timeout: 2000 
    });
    return response.ok;
  } catch {
    return false;
  }
}

function showSuccessMessage() {
  const formContainer = form.parentElement;
  
  formContainer.innerHTML = `
    <div class="success-message">
      <div class="success-icon">🎉</div>
      <h2>Welcome to Golden Bond!</h2>
      <p>Your account has been created successfully.</p>
      <p>In the full version, you would receive a verification email.</p>
      <div class="success-actions">
        <a href="dashboard.html" class="btn btn-primary">Go to Dashboard</a>
        <a href="search.html" class="btn btn-secondary">Browse Profiles</a>
      </div>
    </div>
  `;
}

// ===========================================
// EXPORTS
// ===========================================
window.goToStep = goToStep;
window.addLanguageChip = addLanguageChip;


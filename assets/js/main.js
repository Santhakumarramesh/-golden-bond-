/**
 * Golden Bond - Main JavaScript
 * Handles core functionality, search, profiles, and UI interactions
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize theme and language systems
  if (window.SoulMatchThemes) {
    window.SoulMatchThemes.initTheme();
  }
  
  if (window.SoulMatchTranslations) {
    window.SoulMatchTranslations.initLanguage();
  }
  
  // Initialize all components
  initMobileMenu();
  initQuickSearch();
  initFeaturedProfiles();
  initSearchPage();
  initAuthForms();
  initSmoothScroll();
  initAnimations();
});

/**
 * Mobile Menu Toggle
 */
function initMobileMenu() {
  const menuBtn = document.querySelector('.mobile-menu-btn');
  const mobileNav = document.querySelector('.mobile-nav');
  
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener('click', () => {
      mobileNav.classList.toggle('active');
      menuBtn.classList.toggle('active');
    });
    
    // Close menu when clicking a link
    mobileNav.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('active');
        menuBtn.classList.remove('active');
      });
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menuBtn.contains(e.target) && !mobileNav.contains(e.target)) {
        mobileNav.classList.remove('active');
        menuBtn.classList.remove('active');
      }
    });
  }
}

/**
 * Quick Search Form Handler
 */
function initQuickSearch() {
  const quickSearchForm = document.getElementById('quickSearchForm');
  
  if (quickSearchForm) {
    quickSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form data
      const formData = new FormData(quickSearchForm);
      const params = new URLSearchParams();
      
      formData.forEach((value, key) => {
        if (value && value !== 'any') {
          params.append(key, value);
        }
      });
      
      // Redirect to search page with parameters
      window.location.href = `search.html?${params.toString()}`;
    });
  }
}

/**
 * Sample Profiles Data
 */
const sampleProfiles = [
  {
    id: 1,
    name: "Priya Sharma",
    age: 28,
    gender: "female",
    location: { city: "Mumbai", state: "Maharashtra", country: "India" },
    religion: "Hindu",
    education: "MBA",
    profession: "Marketing Manager",
    maritalStatus: "never_married",
    avatar: "👩",
    verified: true,
    about: "A passionate marketing professional who loves traveling and exploring new cuisines. Looking for someone who shares my values and dreams."
  },
  {
    id: 2,
    name: "Ahmed Khan",
    age: 32,
    gender: "male",
    location: { city: "Dubai", state: "Dubai", country: "UAE" },
    religion: "Muslim",
    education: "Engineering",
    profession: "Software Engineer",
    maritalStatus: "divorced",
    avatar: "👨",
    verified: true,
    about: "Tech enthusiast and avid reader. Believe in second chances and looking for a meaningful connection."
  },
  {
    id: 3,
    name: "Sarah Johnson",
    age: 30,
    gender: "female",
    location: { city: "London", state: "England", country: "UK" },
    religion: "Christian",
    education: "Medical Degree",
    profession: "Doctor",
    maritalStatus: "never_married",
    avatar: "👩",
    verified: true,
    about: "Dedicated healthcare professional with a love for music and art. Seeking a partner who values family and compassion."
  },
  {
    id: 4,
    name: "Rahul Patel",
    age: 35,
    gender: "male",
    location: { city: "New York", state: "New York", country: "USA" },
    religion: "Hindu",
    education: "MBA",
    profession: "Investment Banker",
    maritalStatus: "widowed",
    avatar: "👨",
    verified: true,
    about: "Finance professional who enjoys hiking and photography. Looking for a caring partner to share life's journey."
  },
  {
    id: 5,
    name: "Fatima Ali",
    age: 27,
    gender: "female",
    location: { city: "Cairo", state: "Cairo", country: "Egypt" },
    religion: "Muslim",
    education: "Architecture",
    profession: "Architect",
    maritalStatus: "never_married",
    avatar: "👩",
    verified: true,
    about: "Creative architect with a passion for sustainable design. Seeking someone who appreciates art and culture."
  },
  {
    id: 6,
    name: "David Chen",
    age: 34,
    gender: "male",
    location: { city: "Singapore", state: "Singapore", country: "Singapore" },
    religion: "Buddhist",
    education: "Computer Science",
    profession: "Tech Entrepreneur",
    maritalStatus: "divorced",
    avatar: "👨",
    verified: true,
    about: "Startup founder who loves innovation and travel. Looking for an understanding partner who supports ambition."
  },
  {
    id: 7,
    name: "Ananya Reddy",
    age: 29,
    gender: "female",
    location: { city: "Bangalore", state: "Karnataka", country: "India" },
    religion: "Hindu",
    education: "Engineering",
    profession: "Data Scientist",
    maritalStatus: "never_married",
    avatar: "👩",
    verified: true,
    about: "Tech professional who enjoys yoga and cooking. Looking for someone intellectual and kind-hearted."
  },
  {
    id: 8,
    name: "Mohammed Hassan",
    age: 31,
    gender: "male",
    location: { city: "Toronto", state: "Ontario", country: "Canada" },
    religion: "Muslim",
    education: "Medicine",
    profession: "Surgeon",
    maritalStatus: "never_married",
    avatar: "👨",
    verified: true,
    about: "Dedicated surgeon who values family traditions. Seeking a partner who is compassionate and understanding."
  },
  {
    id: 9,
    name: "Maria Garcia",
    age: 33,
    gender: "female",
    location: { city: "Madrid", state: "Madrid", country: "Spain" },
    religion: "Christian",
    education: "Law",
    profession: "Lawyer",
    maritalStatus: "divorced",
    avatar: "👩",
    verified: true,
    about: "Passionate lawyer who loves flamenco and traveling. Believe in love at any age and stage of life."
  },
  {
    id: 10,
    name: "Vikram Singh",
    age: 36,
    gender: "male",
    location: { city: "Delhi", state: "Delhi", country: "India" },
    religion: "Sikh",
    education: "Business",
    profession: "Business Owner",
    maritalStatus: "widowed",
    avatar: "👨",
    verified: true,
    about: "Entrepreneur with a heart of gold. Looking for a partner who values family, honesty, and mutual respect."
  },
  {
    id: 11,
    name: "Aisha Begum",
    age: 26,
    gender: "female",
    location: { city: "Dhaka", state: "Dhaka", country: "Bangladesh" },
    religion: "Muslim",
    education: "Fashion Design",
    profession: "Fashion Designer",
    maritalStatus: "never_married",
    avatar: "👩",
    verified: true,
    about: "Creative fashion designer with dreams of starting my own label. Looking for someone supportive and ambitious."
  },
  {
    id: 12,
    name: "James Wilson",
    age: 38,
    gender: "male",
    location: { city: "Sydney", state: "NSW", country: "Australia" },
    religion: "Christian",
    education: "Engineering",
    profession: "Civil Engineer",
    maritalStatus: "divorced",
    avatar: "👨",
    verified: true,
    about: "Down-to-earth engineer who loves the outdoors. Looking for a genuine connection and partnership."
  }
];

/**
 * Load Featured Profiles on Homepage
 */
function initFeaturedProfiles() {
  const featuredGrid = document.getElementById('featuredProfiles');
  
  if (featuredGrid) {
    // Show first 6 profiles
    const featured = sampleProfiles.slice(0, 6);
    featuredGrid.innerHTML = featured.map(profile => createProfileCard(profile)).join('');
  }
}

/**
 * Create Profile Card HTML
 * @param {object} profile - Profile data
 * @returns {string} - HTML string
 */
function createProfileCard(profile) {
  const t = window.SoulMatchTranslations?.t || ((key) => key);
  
  return `
    <div class="profile-card" data-id="${profile.id}">
      <div class="profile-image">
        ${profile.avatar}
        ${profile.verified ? '<span class="profile-badge">✓ Verified</span>' : ''}
      </div>
      <div class="profile-details">
        <div class="profile-header">
          <div>
            <span class="profile-name">${profile.name}</span>
            <span class="profile-age">${profile.age} years</span>
          </div>
        </div>
        <div class="profile-location">
          📍 ${profile.location.city}, ${profile.location.country}
        </div>
        <div class="profile-tags">
          <span class="profile-tag">${profile.religion}</span>
          <span class="profile-tag">${profile.profession}</span>
          <span class="profile-tag">${formatMaritalStatus(profile.maritalStatus)}</span>
        </div>
        <div class="profile-actions">
          <a href="profile.html?id=${profile.id}" class="btn btn-outline btn-sm">${t('view_profile')}</a>
          <button class="btn btn-primary btn-sm" onclick="sendInterest(${profile.id})">${t('send_interest')}</button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Format marital status for display
 * @param {string} status - Marital status code
 * @returns {string} - Formatted status
 */
function formatMaritalStatus(status) {
  const statusMap = {
    'never_married': 'Never Married',
    'divorced': 'Divorced',
    'widowed': 'Widowed',
    'separated': 'Separated'
  };
  return statusMap[status] || status;
}

/**
 * Send Interest (Demo)
 * @param {number} profileId - Profile ID
 */
function sendInterest(profileId) {
  const profile = sampleProfiles.find(p => p.id === profileId);
  if (profile) {
    alert(`Interest sent to ${profile.name}! They will be notified.\n\n(This is a demo. In the real app, this would send a notification.)`);
  }
}

/**
 * Initialize Search Page
 */
function initSearchPage() {
  const searchFilters = document.getElementById('searchFilters');
  const resultsGrid = document.getElementById('resultsGrid');
  const resultsCount = document.getElementById('resultsCount');
  
  if (!searchFilters || !resultsGrid) return;
  
  // Get URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  
  // Pre-fill filters from URL
  urlParams.forEach((value, key) => {
    const input = searchFilters.querySelector(`[name="${key}"]`);
    if (input) {
      if (input.type === 'checkbox') {
        input.checked = value === 'true';
      } else {
        input.value = value;
      }
    }
  });
  
  // Initial search
  performSearch();
  
  // Filter form submit
  searchFilters.addEventListener('submit', (e) => {
    e.preventDefault();
    performSearch();
  });
  
  // Clear filters
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchFilters.reset();
      performSearch();
    });
  }
  
  // Sort change
  const sortSelect = document.getElementById('sortBy');
  if (sortSelect) {
    sortSelect.addEventListener('change', performSearch);
  }
  
  /**
   * Perform search with current filters
   */
  function performSearch() {
    const formData = new FormData(searchFilters);
    let results = [...sampleProfiles];
    
    // Apply filters
    const gender = formData.get('gender');
    if (gender && gender !== 'all') {
      results = results.filter(p => p.gender === gender);
    }
    
    const ageMin = parseInt(formData.get('ageMin')) || 18;
    const ageMax = parseInt(formData.get('ageMax')) || 80;
    results = results.filter(p => p.age >= ageMin && p.age <= ageMax);
    
    const religion = formData.get('religion');
    if (religion && religion !== 'any') {
      results = results.filter(p => p.religion.toLowerCase() === religion.toLowerCase());
    }
    
    const maritalStatus = formData.get('maritalStatus');
    if (maritalStatus && maritalStatus !== 'any') {
      results = results.filter(p => p.maritalStatus === maritalStatus);
    }
    
    const country = formData.get('country');
    if (country && country !== 'any') {
      results = results.filter(p => p.location.country.toLowerCase() === country.toLowerCase());
    }
    
    // Sort results
    const sortBy = sortSelect?.value || 'newest';
    switch (sortBy) {
      case 'newest':
        // Already sorted by ID (newest first in our sample data)
        break;
      case 'age_asc':
        results.sort((a, b) => a.age - b.age);
        break;
      case 'age_desc':
        results.sort((a, b) => b.age - a.age);
        break;
    }
    
    // Update results count
    if (resultsCount) {
      resultsCount.innerHTML = `Showing <strong>${results.length}</strong> profiles`;
    }
    
    // Render results
    if (results.length > 0) {
      resultsGrid.innerHTML = results.map(profile => createProfileCard(profile)).join('');
    } else {
      resultsGrid.innerHTML = `
        <div class="no-results">
          <div class="no-results-icon">🔍</div>
          <h3>No profiles found</h3>
          <p>Try adjusting your filters to see more results</p>
        </div>
      `;
    }
  }
}

/**
 * Initialize Auth Forms
 */
function initAuthForms() {
  // Login form
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = loginForm.querySelector('[name="email"]').value;
      const password = loginForm.querySelector('[name="password"]').value;
      
      // Demo login
      if (email && password) {
        alert('Login successful! (Demo mode)\n\nIn the real app, this would authenticate you and redirect to your dashboard.');
        // window.location.href = 'dashboard.html';
      }
    });
  }
  
  // Signup form
  const signupForm = document.getElementById('signupForm');
  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const password = signupForm.querySelector('[name="password"]').value;
      const confirmPassword = signupForm.querySelector('[name="confirmPassword"]').value;
      
      if (password !== confirmPassword) {
        alert('Passwords do not match!');
        return;
      }
      
      // Demo signup
      alert('Account created successfully! (Demo mode)\n\nIn the real app, this would create your account and send a verification email.');
      // window.location.href = 'login.html';
    });
  }
}

/**
 * Smooth Scroll for Anchor Links
 */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      
      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

/**
 * Initialize Scroll Animations
 */
function initAnimations() {
  // Intersection Observer for fade-in animations
  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.1
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animate-fadeInUp');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);
  
  // Observe sections
  document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
  });
  
  // Header scroll effect
  const header = document.querySelector('.main-header');
  if (header) {
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;
      
      if (currentScroll > 100) {
        header.style.boxShadow = 'var(--shadow-md)';
      } else {
        header.style.boxShadow = 'none';
      }
      
      lastScroll = currentScroll;
    });
  }
}

/**
 * Load Profile Details Page
 */
function loadProfileDetails() {
  const urlParams = new URLSearchParams(window.location.search);
  const profileId = parseInt(urlParams.get('id'));
  
  if (!profileId) return;
  
  const profile = sampleProfiles.find(p => p.id === profileId);
  
  if (!profile) {
    document.querySelector('.profile-container').innerHTML = `
      <div class="no-results">
        <div class="no-results-icon">😕</div>
        <h3>Profile not found</h3>
        <p>The profile you're looking for doesn't exist or has been removed.</p>
        <a href="search.html" class="btn btn-primary">Browse Profiles</a>
      </div>
    `;
    return;
  }
  
  // Update page with profile data
  document.getElementById('profileAvatar').textContent = profile.avatar;
  document.getElementById('profileName').textContent = profile.name;
  document.getElementById('profileAgeLoc').textContent = `${profile.age} years • ${profile.location.city}, ${profile.location.country}`;
  document.getElementById('profileAbout').textContent = profile.about;
  
  // Basic info
  document.getElementById('infoAge').textContent = `${profile.age} years`;
  document.getElementById('infoGender').textContent = profile.gender === 'male' ? 'Male' : 'Female';
  document.getElementById('infoReligion').textContent = profile.religion;
  document.getElementById('infoStatus').textContent = formatMaritalStatus(profile.maritalStatus);
  document.getElementById('infoEducation').textContent = profile.education;
  document.getElementById('infoProfession').textContent = profile.profession;
  document.getElementById('infoLocation').textContent = `${profile.location.city}, ${profile.location.state}, ${profile.location.country}`;
}

// Initialize profile page if on profile.html
if (window.location.pathname.includes('profile.html')) {
  document.addEventListener('DOMContentLoaded', loadProfileDetails);
}

// Expose functions globally
window.sendInterest = sendInterest;
window.sampleProfiles = sampleProfiles;


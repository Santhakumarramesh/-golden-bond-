/**
 * Search/Browse Profiles JavaScript
 * Loads and displays profiles from localStorage or sample data
 */

// Load profiles when page loads
document.addEventListener('DOMContentLoaded', () => {
  loadProfiles();
  setupSearchFilters();
});

// Load profiles from localStorage (from signups) or sample data
function loadProfiles() {
  let profiles = [];
  
  // First, try to get profiles from localStorage (signed up users)
  const savedProfiles = localStorage.getItem('goldenBondProfiles');
  if (savedProfiles) {
    try {
      profiles = JSON.parse(savedProfiles);
    } catch (e) {
      console.error('Error parsing saved profiles:', e);
    }
  }
  
  // If no saved profiles, load sample profiles
  if (profiles.length === 0) {
    loadSampleProfiles();
  } else {
    displayProfiles(profiles);
  }
}

// Load sample profiles from JSON file
async function loadSampleProfiles() {
  try {
    const response = await fetch('/data/sample_profiles.json');
    const data = await response.json();
    displayProfiles(data.profiles || []);
  } catch (error) {
    console.error('Error loading sample profiles:', error);
    // Fallback to hardcoded profiles
    displayProfiles(getHardcodedProfiles());
  }
}

// Display profiles in the grid
function displayProfiles(profiles) {
  const resultsGrid = document.getElementById('resultsGrid');
  const featuredProfiles = document.getElementById('featuredProfiles');
  
  if (!profiles || profiles.length === 0) {
    const noResults = '<div class="no-results"><p>No profiles found. Be the first to sign up!</p></div>';
    if (resultsGrid) resultsGrid.innerHTML = noResults;
    if (featuredProfiles) featuredProfiles.innerHTML = noResults;
    return;
  }
  
  const profilesHTML = profiles.slice(0, 12).map(profile => createProfileCard(profile)).join('');
  
  if (resultsGrid) {
    resultsGrid.innerHTML = profilesHTML;
    updateResultsCount(profiles.length);
  }
  
  if (featuredProfiles) {
    featuredProfiles.innerHTML = profilesHTML;
  }
}

// Create profile card HTML
function createProfileCard(profile) {
  const age = calculateAge(profile.dob) || profile.age || 'N/A';
  const location = profile.location 
    ? `${profile.location.city || ''}, ${profile.location.country || ''}`.replace(/^,\s*|,\s*$/g, '')
    : profile.city || 'Location not specified';
  
  const verifiedBadge = profile.verified 
    ? '<span class="profile-badge verified">✓ Verified</span>' 
    : '';
  
  const compatibility = calculateCompatibility(profile) || Math.floor(Math.random() * 20 + 80);
  
  return `
    <div class="profile-card" data-profile-id="${profile.id}">
      <div class="profile-image">
        <span class="profile-emoji">${profile.avatar || getDefaultAvatar(profile.gender)}</span>
        ${verifiedBadge}
        <div class="compatibility-badge">${compatibility}% Match</div>
      </div>
      <div class="profile-details">
        <div class="profile-header">
          <div>
            <div class="profile-name">${profile.name || profile.firstName + ' ' + (profile.middleName || '') + ' ' + profile.lastName}</div>
            <div class="profile-age">${age} years</div>
          </div>
        </div>
        <div class="profile-location">
          <span>📍</span> ${location}
        </div>
        <div class="profile-tags">
          <span class="profile-tag">${profile.religion || 'Not specified'}</span>
          ${profile.community ? `<span class="profile-tag">${profile.community}</span>` : ''}
          ${profile.education ? `<span class="profile-tag">${profile.education}</span>` : ''}
        </div>
        <div class="profile-actions">
          <a href="profile.html?id=${profile.id}" class="btn btn-primary btn-sm">View Profile</a>
          <button class="btn btn-outline btn-sm" onclick="shortlistProfile(${profile.id})">Shortlist</button>
        </div>
      </div>
    </div>
  `;
}

// Calculate age from date of birth
function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

// Get default avatar based on gender
function getDefaultAvatar(gender) {
  return gender === 'female' ? '👰' : gender === 'male' ? '🤵' : '👤';
}

// Calculate compatibility score (simple algorithm)
function calculateCompatibility(profile) {
  // Simple compatibility based on various factors
  let score = 70; // Base score
  
  if (profile.verified) score += 10;
  if (profile.education) score += 5;
  if (profile.profession) score += 5;
  if (profile.location) score += 5;
  
  return Math.min(100, score);
}

// Update results count
function updateResultsCount(count) {
  const resultsCount = document.getElementById('resultsCount');
  if (resultsCount) {
    resultsCount.innerHTML = `Showing <strong>${count}</strong> ${count === 1 ? 'profile' : 'profiles'}`;
  }
}

// Setup search filters
function setupSearchFilters() {
  const filterForm = document.getElementById('searchFilters');
  if (filterForm) {
    filterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      applyFilters();
    });
  }
  
  const clearBtn = document.getElementById('clearFilters');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      clearFilters();
    });
  }
}

// Apply filters
function applyFilters() {
  const formData = new FormData(document.getElementById('searchFilters'));
  const filters = {};
  
  for (const [key, value] of formData.entries()) {
    if (value && value !== 'any') {
      filters[key] = value;
    }
  }
  
  // Get all profiles
  let profiles = [];
  const savedProfiles = localStorage.getItem('goldenBondProfiles');
  if (savedProfiles) {
    try {
      profiles = JSON.parse(savedProfiles);
    } catch (e) {
      console.error('Error parsing profiles:', e);
    }
  }
  
  // If no saved profiles, load sample
  if (profiles.length === 0) {
    loadSampleProfiles().then(() => {
      filterProfiles(filters);
    });
  } else {
    filterProfiles(filters, profiles);
  }
}

// Filter profiles based on criteria
function filterProfiles(filters, profilesList) {
  if (!profilesList) {
    const savedProfiles = localStorage.getItem('goldenBondProfiles');
    if (savedProfiles) {
      try {
        profilesList = JSON.parse(savedProfiles);
      } catch (e) {
        profilesList = [];
      }
    }
  }
  
  if (!profilesList || profilesList.length === 0) {
    displayProfiles([]);
    return;
  }
  
  let filtered = profilesList.filter(profile => {
    // Gender filter
    if (filters.gender && profile.gender !== filters.gender) return false;
    
    // Age filter
    if (filters.ageMin || filters.ageMax) {
      const age = calculateAge(profile.dob) || profile.age;
      if (filters.ageMin && age < parseInt(filters.ageMin)) return false;
      if (filters.ageMax && age > parseInt(filters.ageMax)) return false;
    }
    
    // Religion filter
    if (filters.religion && filters.religion !== 'any' && 
        profile.religion && !profile.religion.toLowerCase().includes(filters.religion.toLowerCase())) {
      return false;
    }
    
    // Community filter
    if (filters.community && filters.community !== 'any' && 
        profile.community && profile.community !== filters.community) {
      return false;
    }
    
    // Country filter
    if (filters.country && filters.country !== 'any') {
      const country = profile.location?.country || profile.country || '';
      if (!country.toLowerCase().includes(filters.country.toLowerCase())) return false;
    }
    
    // State filter
    if (filters.state && filters.state !== 'any') {
      const state = profile.location?.state || profile.state || '';
      if (!state.toLowerCase().includes(filters.state.toLowerCase())) return false;
    }
    
    return true;
  });
  
  displayProfiles(filtered);
}

// Clear filters
function clearFilters() {
  const form = document.getElementById('searchFilters');
  if (form) {
    form.reset();
    loadProfiles();
  }
}

// Shortlist profile
function shortlistProfile(profileId) {
  let shortlisted = JSON.parse(localStorage.getItem('goldenBondShortlist') || '[]');
  if (!shortlisted.includes(profileId)) {
    shortlisted.push(profileId);
    localStorage.setItem('goldenBondShortlist', JSON.stringify(shortlisted));
    alert('Profile added to shortlist!');
  } else {
    alert('Profile already in shortlist!');
  }
}

// Hardcoded fallback profiles
function getHardcodedProfiles() {
  return [
    {
      id: 1,
      name: "Priya Sharma",
      age: 28,
      gender: "female",
      dob: "1996-05-15",
      location: { city: "Mumbai", country: "India" },
      religion: "Hindu",
      community: "Maratha",
      education: "MBA",
      profession: "Marketing Manager",
      avatar: "👰",
      verified: true
    },
    {
      id: 2,
      name: "Ahmed Khan",
      age: 32,
      gender: "male",
      dob: "1992-08-20",
      location: { city: "Dubai", country: "UAE" },
      religion: "Islam",
      education: "Engineering",
      profession: "Software Engineer",
      avatar: "🤵",
      verified: true
    }
  ];
}

// Save profile from signup
function saveProfileFromSignup(profileData) {
  let profiles = [];
  const saved = localStorage.getItem('goldenBondProfiles');
  if (saved) {
    try {
      profiles = JSON.parse(saved);
    } catch (e) {
      console.error('Error parsing profiles:', e);
    }
  }
  
  // Generate ID
  const maxId = profiles.length > 0 ? Math.max(...profiles.map(p => p.id || 0)) : 0;
  profileData.id = maxId + 1;
  profileData.createdAt = new Date().toISOString();
  profileData.verified = false; // Will be verified after email/mobile verification
  
  profiles.push(profileData);
  localStorage.setItem('goldenBondProfiles', JSON.stringify(profiles));
  
  return profileData.id;
}

// Make function available globally
window.saveProfileFromSignup = saveProfileFromSignup;


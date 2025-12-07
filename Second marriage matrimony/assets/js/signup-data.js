/**
 * Golden Bond - Signup Form Data & Logic
 * Handles religion, community, country, state, and language dropdowns
 */

// Religion and Community Data
const religionsData = {
  hinduism: {
    name: "Hinduism",
    communities: {
      "North India": [
        "Brahmin - General", "Brahmin - Gaur", "Brahmin - Saraswat", "Brahmin - Kanyakubj", "Brahmin - Maithil",
        "Rajput - General", "Rajput - Chauhan", "Rajput - Sisodia", "Rajput - Rathore",
        "Jat", "Yadav", "Khatri", "Baniya - General", "Baniya - Agarwal", "Baniya - Gupta", "Baniya - Maheshwari",
        "Kurmi", "Lodhi", "Gurjar", "Kayastha", "Tyagi", "Saini", "Ahir"
      ],
      "South India - Tamil Nadu": [
        "Brahmin - Iyer", "Brahmin - Iyengar", "Mudaliyar", "Chettiar", "Gounder", "Nadar", "Pillai", "Vanniyar", "Naicker", "Thevar", "Kallar", "Maravar", "Vishwakarma"
      ],
      "South India - Telugu": [
        "Brahmin - Niyogi", "Brahmin - Vaidiki", "Reddy", "Kamma", "Kapu", "Balija", "Velama", "Naidu", "Kshatriya", "Vysya", "Padmashali"
      ],
      "South India - Karnataka": [
        "Lingayat", "Vokkaliga", "Kuruba", "Gowda", "Brahmin - Madhwa", "Brahmin - Smartha", "Bunt", "Billava", "Devanga"
      ],
      "South India - Kerala": [
        "Nair", "Ezhava", "Namboothiri", "Menon", "Thiyya", "Nambiar", "Pillai", "Kurup", "Warrier", "Vishwakarma"
      ],
      "West India": [
        "Maratha", "Brahmin - Deshastha", "Brahmin - Kokanastha", "Brahmin - Karhade", "Konkani", "Bhandari", "Koli",
        "Patel - Leuva", "Patel - Kadva", "Lohana", "Gujarati Vaishya", "Gujarati Brahmin", "Sindhi", "Kutchi"
      ],
      "East India": [
        "Bengali Brahmin", "Baidya", "Kayastha", "Mahishya", "Namasudra", "Assamese Brahmin", "Assamese Kalita",
        "Odia Brahmin", "Odia Karana", "Odia Khandayat"
      ],
      "Tribal Communities": [
        "Gond", "Bhil", "Santhal", "Munda", "Khasi", "Garo", "Naga", "Mizo", "Bodo", "Adivasi - General"
      ]
    }
  },
  islam: {
    name: "Islam",
    communities: {
      "Major Sects": ["Sunni", "Shia", "Ahmadiyya", "Ibadi", "Sufi"],
      "South Asian Communities": [
        "Syed", "Pathan (Pashtun)", "Sheikh", "Mughal", "Ansari", "Memon", "Bohra - Dawoodi", "Bohra - Alvi", "Qureshi", "Khan", "Malik", "Rajput Muslim"
      ],
      "Middle Eastern Communities": [
        "Arab - Gulf", "Arab - Levant", "Arab - Egyptian", "Persian", "Kurdish", "Turkish", "Yemeni", "Omani", "Emirati"
      ],
      "African Communities": ["Hausa", "Somali", "Berber", "Fulani", "Swahili"],
      "Southeast Asian Communities": ["Malay", "Indonesian", "Javanese", "Minangkabau"]
    }
  },
  christianity: {
    name: "Christianity",
    communities: {
      "Catholic": [
        "Roman Catholic", "Latin Catholic", "Syro-Malabar Catholic", "Syro-Malankara Catholic", "Chaldean Catholic", "Maronite Catholic"
      ],
      "Protestant": [
        "Protestant - General", "Baptist", "Methodist", "Presbyterian", "Lutheran", "Pentecostal", "Evangelical", "Seventh-day Adventist", "Church of Christ"
      ],
      "Orthodox": [
        "Eastern Orthodox", "Greek Orthodox", "Russian Orthodox", "Coptic Orthodox", "Ethiopian Orthodox", "Armenian Orthodox", "Malankara Orthodox"
      ],
      "Anglican & Others": [
        "Anglican", "Church of England", "Episcopal", "Church of South India (CSI)", "Church of North India (CNI)"
      ],
      "Indian Syrian Christian": ["Jacobite Syrian", "Marthoma", "Knanaya", "Syrian Catholic"],
      "Other Denominations": ["Jehovah's Witness", "Mormon (LDS)", "Quaker", "Mennonite", "Salvation Army"]
    }
  },
  sikhism: {
    name: "Sikhism",
    communities: {
      "Sikh Communities": [
        "Jat Sikh", "Ramgarhia", "Khatri Sikh", "Arora Sikh", "Ahluwalia", "Saini Sikh", "Lubana", "Mazhabi Sikh", "Ravidassia", "Bhatia Sikh"
      ]
    }
  },
  buddhism: {
    name: "Buddhism",
    communities: {
      "Buddhist Traditions": ["Theravada", "Mahayana", "Vajrayana (Tibetan)", "Zen", "Nichiren", "Pure Land", "Neo-Buddhist (Ambedkarite)"],
      "Regional Buddhist": ["Sri Lankan Buddhist", "Thai Buddhist", "Burmese Buddhist", "Tibetan Buddhist", "Chinese Buddhist", "Japanese Buddhist", "Korean Buddhist", "Vietnamese Buddhist"]
    }
  },
  jainism: {
    name: "Jainism",
    communities: {
      "Jain Traditions": ["Digambar", "Shwetambar", "Sthanakwasi", "Terapanthi"],
      "Jain Communities": ["Oswal", "Porwal", "Agrawal Jain", "Khandelwal Jain", "Parwar Jain", "Sarawagi", "Humad"]
    }
  },
  judaism: {
    name: "Judaism",
    communities: {
      "Jewish Communities": ["Ashkenazi", "Sephardic", "Mizrahi", "Yemenite", "Ethiopian (Beta Israel)", "Indian Jewish (Bene Israel)", "Cochin Jews"],
      "Jewish Denominations": ["Orthodox", "Conservative", "Reform", "Reconstructionist", "Hasidic"]
    }
  },
  zoroastrianism: {
    name: "Zoroastrianism",
    communities: {
      "Zoroastrian Communities": ["Parsi", "Irani"]
    }
  },
  shinto: {
    name: "Shinto",
    communities: { "Shinto": ["Shinto - General"] }
  },
  taoism: {
    name: "Taoism / Daoism",
    communities: { "Taoist Traditions": ["Taoist - General", "Quanzhen", "Zhengyi"] }
  },
  confucianism: {
    name: "Confucianism",
    communities: { "Confucian": ["Confucian - General"] }
  },
  bahai: {
    name: "Baháʼí Faith",
    communities: { "Baháʼí": ["Baháʼí - General"] }
  },
  indigenous: {
    name: "Indigenous / Tribal Religions",
    communities: {
      "African Traditional": ["Yoruba Traditional", "Akan Traditional", "Zulu Traditional", "Maasai Traditional"],
      "Native American": ["Native American - General", "Navajo", "Cherokee", "Lakota"],
      "Pacific & Oceanian": ["Maori", "Aboriginal Australian", "Pacific Islander"]
    }
  },
  spiritual: {
    name: "Spiritual but not religious",
    communities: { "Spiritual": ["Spiritual - General", "New Age", "Universalist"] }
  },
  atheist: {
    name: "Atheist / Agnostic / No Religion",
    communities: { "Non-Religious": ["Atheist", "Agnostic", "Humanist", "No Religion"] }
  },
  other: {
    name: "Other Religion",
    communities: { "Other": ["Other - Please Specify"] }
  }
};

// Countries with States
const countriesData = {
  "India": ["Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Chandigarh", "Jammu and Kashmir", "Ladakh"],
  "United States": ["Alabama", "Alaska", "Arizona", "California", "Colorado", "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"],
  "United Kingdom": ["England", "Scotland", "Wales", "Northern Ireland"],
  "Canada": ["Alberta", "British Columbia", "Manitoba", "New Brunswick", "Newfoundland and Labrador", "Nova Scotia", "Ontario", "Prince Edward Island", "Quebec", "Saskatchewan"],
  "Australia": ["New South Wales", "Victoria", "Queensland", "Western Australia", "South Australia", "Tasmania", "Northern Territory", "Australian Capital Territory"],
  "United Arab Emirates": ["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain"],
  "Saudi Arabia": ["Riyadh", "Makkah", "Madinah", "Eastern Province", "Asir", "Tabuk", "Hail", "Northern Borders", "Jazan", "Najran", "Al-Baha", "Al-Jawf", "Qassim"],
  "Germany": ["Baden-Württemberg", "Bavaria", "Berlin", "Brandenburg", "Bremen", "Hamburg", "Hesse", "Lower Saxony", "Mecklenburg-Vorpommern", "North Rhine-Westphalia", "Rhineland-Palatinate", "Saarland", "Saxony", "Saxony-Anhalt", "Schleswig-Holstein", "Thuringia"],
  "France": ["Île-de-France", "Auvergne-Rhône-Alpes", "Nouvelle-Aquitaine", "Occitanie", "Hauts-de-France", "Provence-Alpes-Côte d'Azur", "Grand Est", "Pays de la Loire", "Normandy", "Brittany"],
  "Malaysia": ["Kuala Lumpur", "Selangor", "Penang", "Johor", "Perak", "Sabah", "Sarawak", "Pahang", "Kedah", "Kelantan", "Terengganu", "Negeri Sembilan", "Melaka", "Perlis"],
  "Singapore": [],
  "Qatar": [],
  "Kuwait": [],
  "Bahrain": [],
  "Oman": [],
  "Pakistan": ["Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan", "Islamabad Capital Territory", "Gilgit-Baltistan", "Azad Kashmir"],
  "Bangladesh": ["Dhaka", "Chittagong", "Rajshahi", "Khulna", "Sylhet", "Rangpur", "Mymensingh", "Barisal"],
  "Sri Lanka": ["Western Province", "Central Province", "Southern Province", "Northern Province", "Eastern Province", "North Western Province", "North Central Province", "Uva Province", "Sabaragamuwa Province"],
  "Nepal": ["Province No. 1", "Madhesh Province", "Bagmati Province", "Gandaki Province", "Lumbini Province", "Karnali Province", "Sudurpashchim Province"],
  "South Africa": ["Gauteng", "Western Cape", "KwaZulu-Natal", "Eastern Cape", "Free State", "Limpopo", "Mpumalanga", "North West", "Northern Cape"],
  "Nigeria": ["Lagos", "Kano", "Rivers", "Kaduna", "Oyo", "Abuja FCT", "Anambra", "Delta", "Edo", "Enugu"],
  "Kenya": ["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret"],
  "Egypt": ["Cairo", "Alexandria", "Giza", "Shubra El Kheima", "Port Said", "Suez", "Luxor", "Aswan"],
  "Indonesia": ["Jakarta", "West Java", "East Java", "Central Java", "Banten", "Bali", "North Sumatra", "South Sulawesi"],
  "Thailand": ["Bangkok", "Chiang Mai", "Phuket", "Pattaya", "Chonburi"],
  "Philippines": ["Metro Manila", "Cebu", "Davao", "Calabarzon", "Central Luzon"],
  "Vietnam": ["Ho Chi Minh City", "Hanoi", "Da Nang", "Hai Phong", "Can Tho"],
  "Japan": ["Tokyo", "Osaka", "Kanagawa", "Aichi", "Saitama", "Chiba", "Hyogo", "Hokkaido", "Fukuoka", "Kyoto"],
  "South Korea": ["Seoul", "Busan", "Incheon", "Daegu", "Daejeon", "Gwangju", "Ulsan", "Gyeonggi"],
  "China": ["Beijing", "Shanghai", "Guangdong", "Zhejiang", "Jiangsu", "Shandong", "Sichuan", "Henan", "Hubei", "Fujian"],
  "Hong Kong": [],
  "Taiwan": ["Taipei", "New Taipei", "Taichung", "Kaohsiung", "Tainan"],
  "New Zealand": ["Auckland", "Wellington", "Canterbury", "Waikato", "Bay of Plenty", "Otago"],
  "Ireland": ["Dublin", "Cork", "Galway", "Limerick", "Waterford"],
  "Netherlands": ["North Holland", "South Holland", "North Brabant", "Gelderland", "Utrecht"],
  "Belgium": ["Brussels", "Antwerp", "East Flanders", "West Flanders", "Liège"],
  "Switzerland": ["Zurich", "Geneva", "Bern", "Basel", "Lausanne"],
  "Italy": ["Lombardy", "Lazio", "Campania", "Sicily", "Veneto", "Piedmont", "Emilia-Romagna", "Tuscany"],
  "Spain": ["Madrid", "Catalonia", "Andalusia", "Valencia", "Galicia", "Basque Country"],
  "Portugal": ["Lisbon", "Porto", "Braga", "Faro"],
  "Brazil": ["São Paulo", "Rio de Janeiro", "Minas Gerais", "Bahia", "Rio Grande do Sul", "Paraná"],
  "Mexico": ["Mexico City", "Jalisco", "Nuevo León", "Estado de México", "Veracruz"],
  "Argentina": ["Buenos Aires", "Córdoba", "Santa Fe", "Mendoza"],
  "Other": []
};

// All countries list
const allCountries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei", "Bulgaria",
  "Cambodia", "Cameroon", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czech Republic",
  "Denmark", "Dominican Republic",
  "Ecuador", "Egypt", "El Salvador", "Estonia", "Ethiopia",
  "Fiji", "Finland", "France",
  "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guyana",
  "Haiti", "Honduras", "Hong Kong", "Hungary",
  "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Ivory Coast",
  "Jamaica", "Japan", "Jordan",
  "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Libya", "Lithuania", "Luxembourg",
  "Macedonia", "Madagascar", "Malaysia", "Maldives", "Mali", "Malta", "Mauritius", "Mexico", "Moldova", "Mongolia", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Nigeria", "Norway",
  "Oman",
  "Pakistan", "Palestine", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Poland", "Portugal",
  "Qatar",
  "Romania", "Russia", "Rwanda",
  "Saudi Arabia", "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sudan", "Suriname", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Trinidad and Tobago", "Tunisia", "Turkey", "Turkmenistan",
  "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom", "United States", "Uruguay", "Uzbekistan",
  "Venezuela", "Vietnam",
  "Yemen",
  "Zambia", "Zimbabwe"
];

// Languages list
const languagesList = [
  "Afrikaans", "Albanian", "Amharic", "Arabic", "Armenian", "Assamese", "Aymara", "Azerbaijani",
  "Basque", "Belarusian", "Bengali", "Bosnian", "Bulgarian", "Burmese",
  "Cantonese", "Catalan", "Cebuano", "Croatian", "Czech",
  "Danish", "Dari", "Dutch",
  "English", "Estonian",
  "Fijian", "Filipino (Tagalog)", "Finnish", "French",
  "Georgian", "German", "Greek", "Guarani", "Gujarati",
  "Haitian Creole", "Hausa", "Hebrew", "Hindi", "Hungarian",
  "Icelandic", "Igbo", "Indonesian", "Italian",
  "Japanese", "Javanese",
  "Kannada", "Kashmiri", "Kazakh", "Khmer", "Konkani", "Korean", "Kurdish", "Kyrgyz",
  "Lao", "Latvian", "Lithuanian",
  "Macedonian", "Maithili", "Malay", "Malayalam", "Mandarin Chinese", "Manipuri", "Maori", "Marathi", "Mongolian",
  "Nepali", "Norwegian",
  "Odia", "Oromo",
  "Pashto", "Persian (Farsi)", "Polish", "Portuguese", "Punjabi",
  "Quechua",
  "Romanian", "Russian",
  "Samoan", "Sanskrit", "Serbian", "Shona", "Sindhi", "Sinhala", "Slovak", "Slovenian", "Somali", "Spanish", "Swahili", "Swedish",
  "Tajik", "Tamil", "Telugu", "Thai", "Tibetan", "Tigrinya", "Turkish", "Turkmen",
  "Ukrainian", "Urdu", "Uzbek",
  "Vietnamese",
  "Welsh", "Wolof",
  "Xhosa",
  "Yoruba",
  "Zulu"
];

// Selected languages array
let selectedLanguages = [];

// Current step
let currentStep = 1;

/**
 * Initialize form on page load
 */
document.addEventListener('DOMContentLoaded', function() {
  populateCountries();
  populateLanguages();
  
  // Handle form submission
  const form = document.getElementById('signupForm');
  if (form) {
    form.addEventListener('submit', handleSubmit);
  }
});

/**
 * Load communities based on selected religion
 */
function loadCommunities() {
  const religionSelect = document.getElementById('religionSelect');
  const communitySelect = document.getElementById('communitySelect');
  const religion = religionSelect.value;
  
  // Clear existing options
  communitySelect.innerHTML = '<option value="">Select Community</option>';
  
  if (religion && religionsData[religion]) {
    const communities = religionsData[religion].communities;
    
    for (const category in communities) {
      // Create optgroup for each category
      const optgroup = document.createElement('optgroup');
      optgroup.label = category;
      
      communities[category].forEach(community => {
        const option = document.createElement('option');
        option.value = community;
        option.textContent = community;
        optgroup.appendChild(option);
      });
      
      communitySelect.appendChild(optgroup);
    }
  }
}

/**
 * Populate countries dropdown
 */
function populateCountries() {
  const countrySelect = document.getElementById('countrySelect');
  if (!countrySelect) return;
  
  countrySelect.innerHTML = '<option value="">Select Country</option>';
  
  allCountries.forEach(country => {
    const option = document.createElement('option');
    option.value = country;
    option.textContent = country;
    countrySelect.appendChild(option);
  });
}

/**
 * Load states based on selected country
 */
function loadStates() {
  const countrySelect = document.getElementById('countrySelect');
  const stateSelect = document.getElementById('stateSelect');
  const country = countrySelect.value;
  
  stateSelect.innerHTML = '<option value="">Select State/Province</option>';
  
  if (country && countriesData[country] && countriesData[country].length > 0) {
    countriesData[country].forEach(state => {
      const option = document.createElement('option');
      option.value = state;
      option.textContent = state;
      stateSelect.appendChild(option);
    });
  } else {
    // Add "Other" option for countries without states
    const option = document.createElement('option');
    option.value = "other";
    option.textContent = "N/A - Enter city below";
    stateSelect.appendChild(option);
  }
}

/**
 * Populate languages dropdown
 */
function populateLanguages() {
  const motherTongueSelect = document.getElementById('motherTongueSelect');
  const languagesKnownSelect = document.getElementById('languagesKnownSelect');
  
  if (motherTongueSelect) {
    motherTongueSelect.innerHTML = '<option value="">Select Mother Tongue</option>';
    languagesList.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang;
      motherTongueSelect.appendChild(option);
    });
  }
  
  if (languagesKnownSelect) {
    languagesKnownSelect.innerHTML = '<option value="">Add languages you speak</option>';
    languagesList.forEach(lang => {
      const option = document.createElement('option');
      option.value = lang;
      option.textContent = lang;
      languagesKnownSelect.appendChild(option);
    });
  }
}

/**
 * Add language to selected list
 */
function addLanguage() {
  const select = document.getElementById('languagesKnownSelect');
  const container = document.getElementById('selectedLanguages');
  const hiddenInput = document.getElementById('languagesKnownInput');
  const lang = select.value;
  
  if (lang && !selectedLanguages.includes(lang)) {
    selectedLanguages.push(lang);
    
    // Create chip
    const chip = document.createElement('span');
    chip.className = 'language-chip';
    chip.innerHTML = `${lang} <span class="remove-lang" onclick="removeLanguage('${lang}')">×</span>`;
    container.appendChild(chip);
    
    // Update hidden input
    hiddenInput.value = selectedLanguages.join(',');
  }
  
  // Reset select
  select.value = '';
}

/**
 * Remove language from selected list
 */
function removeLanguage(lang) {
  selectedLanguages = selectedLanguages.filter(l => l !== lang);
  
  // Update UI
  const container = document.getElementById('selectedLanguages');
  container.innerHTML = '';
  selectedLanguages.forEach(l => {
    const chip = document.createElement('span');
    chip.className = 'language-chip';
    chip.innerHTML = `${l} <span class="remove-lang" onclick="removeLanguage('${l}')">×</span>`;
    container.appendChild(chip);
  });
  
  // Update hidden input
  document.getElementById('languagesKnownInput').value = selectedLanguages.join(',');
}

/**
 * Navigate to next step
 */
function nextStep(step) {
  // Validate current step before proceeding
  if (!validateStep(currentStep)) {
    return;
  }
  
  // Hide current step
  document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
  document.querySelector(`.step-indicator[data-step="${currentStep}"]`).classList.remove('active');
  document.querySelector(`.step-indicator[data-step="${currentStep}"]`).classList.add('completed');
  
  // Show next step
  currentStep = step;
  document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
  document.querySelector(`.step-indicator[data-step="${step}"]`).classList.add('active');
  
  // Scroll to top of form
  document.querySelector('.auth-card').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Navigate to previous step
 */
function prevStep(step) {
  // Hide current step
  document.querySelector(`.form-step[data-step="${currentStep}"]`).classList.remove('active');
  document.querySelector(`.step-indicator[data-step="${currentStep}"]`).classList.remove('active');
  
  // Show previous step
  currentStep = step;
  document.querySelector(`.form-step[data-step="${step}"]`).classList.add('active');
  document.querySelector(`.step-indicator[data-step="${step}"]`).classList.add('active');
  document.querySelector(`.step-indicator[data-step="${step}"]`).classList.remove('completed');
  
  // Scroll to top of form
  document.querySelector('.auth-card').scrollIntoView({ behavior: 'smooth' });
}

/**
 * Validate current step
 */
function validateStep(step) {
  const stepElement = document.querySelector(`.form-step[data-step="${step}"]`);
  const requiredFields = stepElement.querySelectorAll('[required]');
  let isValid = true;
  
  requiredFields.forEach(field => {
    if (!field.value) {
      field.style.borderColor = '#ef4444';
      isValid = false;
    } else {
      field.style.borderColor = '';
    }
  });
  
  if (!isValid) {
    alert('Please fill in all required fields before proceeding.');
  }
  
  return isValid;
}

/**
 * Handle form submission
 */
function handleSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  // Validate passwords match
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');
  
  if (password !== confirmPassword) {
    alert('Passwords do not match!');
    return;
  }
  
  // Collect all data
  const userData = {
    fullName: formData.get('fullName'),
    email: formData.get('email'),
    phone: formData.get('phone'),
    gender: formData.get('gender'),
    dob: formData.get('dob'),
    maritalStatus: formData.get('maritalStatus'),
    religion: formData.get('religion'),
    community: formData.get('community'),
    subcommunity: formData.get('subcommunity'),
    country: formData.get('country'),
    state: formData.get('state'),
    city: formData.get('city'),
    motherTongue: formData.get('motherTongue'),
    languagesKnown: selectedLanguages,
    education: formData.get('education'),
    profession: formData.get('profession')
  };
  
  console.log('User Registration Data:', userData);
  
  // Show success message (demo mode)
  alert(`🎉 Account Created Successfully!\n\nWelcome to Golden Bond, ${userData.fullName}!\n\nYour profile has been created with:\n• Religion: ${userData.religion}\n• Community: ${userData.community || 'Not specified'}\n• Location: ${userData.city}, ${userData.country}\n• Languages: ${userData.motherTongue}${selectedLanguages.length > 0 ? ', ' + selectedLanguages.join(', ') : ''}\n\n(This is a demo. In production, this would save to database and send verification email.)`);
  
  // In production, you would:
  // 1. Send data to backend API
  // 2. Create user account in database
  // 3. Send verification email
  // 4. Redirect to profile completion or dashboard
}

// Export for global access
window.loadCommunities = loadCommunities;
window.loadStates = loadStates;
window.addLanguage = addLanguage;
window.removeLanguage = removeLanguage;
window.nextStep = nextStep;
window.prevStep = prevStep;


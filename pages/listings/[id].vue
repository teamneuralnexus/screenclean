<script setup>
import { Client, Storage, ID } from "appwrite";

// Appwrite client configuration
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('63e3e727aa9ac1e0b69a'); // Replace with your project ID

const storage = new Storage(client);
const BUCKET_ID = 'screenclean'; // Replace with your bucket ID

const route = useRoute();
const listing = ref(null);
const error = ref(null);
const isLoading = ref(true);
const showSuccessMessage = ref(false);
const showApplicationForm = ref(false);
const showResumeChecker = ref(false);
const resumeCheckResults = ref(null);
const isChecking = ref(false);

// Application form data
const application = ref({
  fullName: '',
  email: '',
  phone: '',
  coverLetter: '',
  resumeFile: null,
  resumeUrl: null,
  linkedin: ''
});

// Form validation
const formErrors = ref({});

// Load cached application data on mount
onMounted(async () => {
  await fetchListing();
  loadCachedApplicationData();
});

const fetchListing = async () => {
  const listingId = route.params.id;
  try {
    isLoading.value = true;
    const response = await $fetch('/api/listings/public', {
      method: 'POST',
      body: { listing_uuid: listingId }
    });
    
    listing.value = response;
    
    // Process skills if they're in string format
    if (typeof listing.value.skills === 'string') {
      if (listing.value.skills.startsWith('{') && listing.value.skills.endsWith('}')) {
        listing.value.skillsArray = listing.value.skills
          .slice(1, -1)
          .split(',')
          .map(skill => skill.replace(/^"(.*)"$/, '$1').trim());
      } else {
        listing.value.skillsArray = listing.value.skills.split(',').map(skill => skill.trim());
      }
    } else if (Array.isArray(listing.value.skills)) {
      listing.value.skillsArray = [...listing.value.skills];
    } else {
      listing.value.skillsArray = [];
    }
  } catch (e) {
    error.value = e.message || 'Failed to fetch listing.';
    console.error(error.value);
  } finally {
    isLoading.value = false;
  }
};

const toggleApplicationForm = () => {
  showApplicationForm.value = !showApplicationForm.value;
  if (!showApplicationForm.value) {
    // Reset form when closing
    resetForm();
  }
};

const resetForm = () => {
  application.value = {
    fullName: '',
    email: '',
    phone: '',
    coverLetter: '',
    resumeFile: null,
    linkedin: ''
  };
  formErrors.value = {};
};

const handleFileUpload = (event) => {
  application.value.resumeFile = event.target.files[0];
};

const validateForm = () => {
  const errors = {};
  
  if (!application.value.fullName.trim()) {
    errors.fullName = 'Full name is required';
  }
  
  if (!application.value.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/^\S+@\S+\.\S+$/.test(application.value.email)) {
    errors.email = 'Please enter a valid email address';
  }
  
  if (!application.value.resumeFile) {
    errors.resumeFile = 'Resume is required';
  }
  
  formErrors.value = errors;
  return Object.keys(errors).length === 0;
};

const loadCachedApplicationData = () => {
  const cachedData = localStorage.getItem('applicationData');
  if (cachedData) {
    const data = JSON.parse(cachedData);
    application.value = {
      ...application.value,
      fullName: data.fullName || '',
      email: data.email || '',
      phone: data.phone || '',
      linkedin: data.linkedin || ''
    };
  }
};

const cacheApplicationData = () => {
  const dataToCache = {
    fullName: application.value.fullName,
    email: application.value.email,
    phone: application.value.phone,
    linkedin: application.value.linkedin
  };
  localStorage.setItem('applicationData', JSON.stringify(dataToCache));
};

const uploadResumeFile = async (file) => {
  try {
    const fileId = ID.unique();
    const response = await storage.createFile(
      BUCKET_ID,
      fileId,
      file
    );
    
    // Get the file URL
    const fileUrl = storage.getFileView(BUCKET_ID, fileId);
    return fileUrl;
  } catch (error) {
    throw new Error('Failed to upload resume: ' + error.message);
  }
};

const submitApplication = async () => {
  if (!validateForm()) {
    return;
  }
  
  try {
    isLoading.value = true;
    // Cache the form data
    cacheApplicationData();

    // Use existing resume URL if available from check, otherwise upload
    let resumeUrl = application.value.resumeUrl;
    if (!resumeUrl) {
      resumeUrl = await uploadResumeFile(application.value.resumeFile);
    }

    // Submit application with the file URL
    await $fetch('/api/listings/apply', {
      method: 'POST',
      body: {
        listing_uuid: route.params.id,
        ...application.value,
        resumeUrl
      }
    });
    
    showApplicationForm.value = false;
    showSuccessMessage.value = true;
    
    setTimeout(() => {
      showSuccessMessage.value = false;
    }, 5000);
    
  } catch (e) {
    error.value = e.message || 'Failed to submit application.';
    console.error(error.value);
  } finally {
    isLoading.value = false;
  }
};

// Resume checker functionality
const toggleResumeChecker = () => {
  showResumeChecker.value = !showResumeChecker.value;
  if (!showResumeChecker.value) {
    // Reset results when closing
    resumeCheckResults.value = null;
  }
};

const checkResumeCompatibility = async () => {
  if (!application.value.resumeFile) {
    formErrors.value.resumeFile = 'Please upload a resume to check compatibility';
    return;
  }

  try {
    isChecking.value = true;
    formErrors.value = {};
    
    // Upload resume to get URL
    const resumeUrl = await uploadResumeFile(application.value.resumeFile);
    
    // Store resume URL for later use during application submission
    application.value.resumeUrl = resumeUrl;
    
    // Send to API for checking
    const response = await $fetch('/api/applicants/check', {
      method: 'POST',
      body: {
        resumeUrl,
        jobTitle: listing.value.title,
        jobDescription: listing.value.description,
        skills: listing.value.skills
      }
    });

    if (response.success) {
      resumeCheckResults.value = response.analysis;
    } else {
      error.value = response.message || 'Failed to check resume compatibility';
    }
  } catch (e) {
    error.value = e.message || 'Error checking resume compatibility';
    console.error(error.value);
  } finally {
    isChecking.value = false;
  }
};

// Score color based on match score
const scoreColorClass = computed(() => {
  if (!resumeCheckResults.value) return '';
  
  const score = resumeCheckResults.value.matchScore;
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  return 'text-red-600';
});

// Recommendation badge class
const recommendationClass = computed(() => {
  if (!resumeCheckResults.value) return '';
  
  const rec = resumeCheckResults.value.recommendation;
  if (rec.includes('Good fit')) return 'bg-green-100 text-green-800';
  if (rec.includes('Consider')) return 'bg-yellow-100 text-yellow-800';
  return 'bg-red-100 text-red-800';
});
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10 px-4 sm:px-6 lg:px-8">
    <div v-if="isLoading" class="flex justify-center items-center h-64">
      <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600"></div>
    </div>
    
    <div v-else-if="error" class="max-w-4xl mx-auto bg-red-50 border-l-4 border-red-500 p-4 rounded-md shadow-md">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>
    
    <div v-else-if="listing" class="max-w-4xl mx-auto">
      <!-- Success Message -->
      <div v-if="showSuccessMessage" class="bg-green-50 border-l-4 border-green-500 p-4 mb-6 rounded-md shadow-md">
        <div class="flex">
          <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-green-800">
              Application submitted successfully! We'll be in touch soon.
            </p>
          </div>
        </div>
      </div>
      
      <!-- Job Details Card -->
      <div class="bg-white rounded-xl shadow-xl overflow-hidden">
        <!-- Header -->
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8 text-white">
          <div class="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div>
              <span class="inline-block px-3 py-1 rounded-full bg-blue-400 bg-opacity-30 text-blue-50 text-sm font-medium mb-2">
                {{ listing.department }}
              </span>
              <h1 class="text-3xl font-bold">{{ listing.title }}</h1>
              <div class="mt-2 flex flex-wrap items-center gap-x-6 gap-y-1 text-blue-100">
                <div class="flex items-center">
                  <svg class="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  {{ listing.employment_type }}
                </div>
                <div class="flex items-center">
                  <svg class="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                  </svg>
                  {{ listing.experience_level }} Level
                </div>
              </div>
            </div>
            <div class="mt-4 sm:mt-0 flex flex-col sm:flex-row gap-2">
              <button 
                @click="toggleResumeChecker" 
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {{ showResumeChecker ? 'Close Checker' : 'Check Resume Match' }}
              </button>
              <button 
                @click="toggleApplicationForm" 
                class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150"
              >
                {{ showApplicationForm ? 'Close Form' : 'Apply Now' }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- Resume Checker Form -->
        <div v-if="showResumeChecker" class="border-b border-gray-200 p-6 bg-gray-50">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Check Resume Compatibility</h2>
          
          <!-- Results Display -->
          <div v-if="resumeCheckResults" class="mb-6 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <div class="flex justify-between items-center mb-3">
              <h3 class="text-lg font-medium text-gray-900">Resume Check Results</h3>
              <div class="flex items-baseline">
                <span class="text-sm text-gray-500 mr-2">Match Score:</span>
                <span :class="['text-lg font-bold', scoreColorClass]">{{ resumeCheckResults.matchScore }}%</span>
              </div>
            </div>
            <div class="mb-4">
              <p class="text-gray-700">{{ resumeCheckResults.assessment }}</p>
            </div>
            <div class="flex justify-between items-center">
              <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium', recommendationClass]">
                {{ resumeCheckResults.recommendation }}
              </span>
              <button 
                @click="toggleApplicationForm" 
                class="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Continue to Application
              </button>
            </div>
          </div>
          
          <!-- Checker Form -->
          <div v-else>
            <form @submit.prevent="checkResumeCompatibility" class="space-y-4">
              <div>
                <label for="resumeCheck" class="block text-sm font-medium text-gray-700">Upload Your Resume</label>
                <input 
                  id="resumeCheck" 
                  type="file" 
                  @change="handleFileUpload"
                  accept=".pdf,.doc,.docx" 
                  class="mt-1 block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-indigo-50 file:text-indigo-700
                  hover:file:bg-indigo-100"
                >
                <p class="mt-1 text-xs text-gray-500">Acceptable formats: PDF, DOC, DOCX (Max 5MB)</p>
                <p v-if="formErrors.resumeFile" class="mt-1 text-sm text-red-600">{{ formErrors.resumeFile }}</p>
              </div>
              <div class="flex justify-between">
                <button 
                  type="button" 
                  @click="toggleResumeChecker" 
                  class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                  :disabled="isChecking"
                >
                  <span v-if="isChecking" class="mr-2 h-4 w-4 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                  {{ isChecking ? 'Checking...' : 'Check Compatibility' }}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <!-- Application Form -->
        <div v-if="showApplicationForm" class="border-b border-gray-200 p-6 bg-gray-50">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Submit Your Application</h2>
          <form @submit.prevent="submitApplication" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="fullName" class="block text-sm font-medium text-gray-700">Full Name *</label>
                <input 
                  id="fullName" 
                  v-model="application.fullName"
                  type="text" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                <p v-if="formErrors.fullName" class="mt-1 text-sm text-red-600">{{ formErrors.fullName }}</p>
              </div>
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700">Email Address *</label>
                <input 
                  id="email" 
                  v-model="application.email"
                  type="email" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
                <p v-if="formErrors.email" class="mt-1 text-sm text-red-600">{{ formErrors.email }}</p>
              </div>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700">Phone Number</label>
                <input 
                  id="phone" 
                  v-model="application.phone"
                  type="tel" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
              </div>
              <div>
                <label for="linkedin" class="block text-sm font-medium text-gray-700">LinkedIn Profile</label>
                <input 
                  id="linkedin" 
                  v-model="application.linkedin"
                  type="url" 
                  class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                >
              </div>
            </div>
            <div v-if="!application.resumeUrl">
              <label for="resume" class="block text-sm font-medium text-gray-700">Resume/CV *</label>
              <input 
                id="resume" 
                type="file" 
                @change="handleFileUpload"
                accept=".pdf,.doc,.docx" 
                class="mt-1 block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-indigo-50 file:text-indigo-700
                hover:file:bg-indigo-100"
              >
              <p class="mt-1 text-xs text-gray-500">Acceptable formats: PDF, DOC, DOCX (Max 5MB)</p>
              <p v-if="formErrors.resumeFile" class="mt-1 text-sm text-red-600">{{ formErrors.resumeFile }}</p>
            </div>
            <div v-else class="bg-green-50 p-3 rounded-md">
              <div class="flex">
                <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span class="ml-2 text-sm text-green-700">Resume already uploaded</span>
              </div>
            </div>
            <div>
              <label for="coverLetter" class="block text-sm font-medium text-gray-700">Cover Letter</label>
              <textarea 
                id="coverLetter" 
                v-model="application.coverLetter"
                rows="4" 
                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                placeholder="Tell us why you're a good fit for this role..."
              ></textarea>
            </div>
            <div class="flex justify-end space-x-3">
              <button 
                type="button" 
                @click="toggleApplicationForm" 
                class="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                class="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Submit Application
              </button>
            </div>
          </form>
        </div>
        
        <!-- Job Content -->
        <div class="p-6">
          <section class="mb-8">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Job Description</h2>
            <p class="text-gray-700 leading-relaxed whitespace-pre-line">{{ listing.description }}</p>
          </section>
          
          <section class="mb-8">
            <h2 class="text-xl font-bold text-gray-900 mb-4">Required Skills</h2>
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="(skill, index) in listing.skillsArray" 
                :key="index"
                class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800"
              >
                {{ skill }}
              </span>
            </div>
          </section>
          
          <!-- Call to Action -->
          <div class="mt-8 flex justify-center gap-4">
            <button 
              @click="toggleResumeChecker" 
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 border-indigo-200"
            >
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              Check Resume Match
            </button>
            
            <button 
              @click="toggleApplicationForm" 
              class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg class="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"></path>
              </svg>
              Apply Now
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-8 text-center">
      <h2 class="text-2xl font-bold text-gray-900">Job listing not found</h2>
      <p class="mt-2 text-gray-600">The job listing you're looking for might have been removed or is no longer available.</p>
      <NuxtLink to="/listings" class="mt-4 inline-block text-indigo-600 hover:text-indigo-800">
        Browse all job listings
      </NuxtLink>
    </div>
  </main>
</template>
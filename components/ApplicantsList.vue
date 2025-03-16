<script setup>
const props = defineProps({
  listingId: {
    type: [String, Number],
    required: true
  }
});

const applicants = ref([]);
const isLoading = ref(false);
const error = ref(null);
const selectedApplicant = ref(null);
const showDetailModal = ref(false);

// Status badge colors
const statusColors = {
  pending: 'bg-yellow-100 text-yellow-800',
  review: 'bg-blue-100 text-blue-800',
  interview: 'bg-purple-100 text-purple-800',
  rejected: 'bg-red-100 text-red-800',
  hired: 'bg-green-100 text-green-800'
};

// Fetch applicants when component mounts
onMounted(async () => {
  await fetchApplicants();
});

// Fetch applicants for this listing
async function fetchApplicants() {
  isLoading.value = true;
  error.value = null;
  
  try {
    const response = await $fetch('/api/applicants/list', {
      method: 'POST',
      body: { listing_id: props.listingId }
    });
    
    if (response.success) {
      applicants.value = response.applicants;
    } else {
      throw new Error('Failed to fetch applicants');
    }
  } catch (err) {
    error.value = err.message || 'Could not load applicants';
    console.error('Error fetching applicants:', err);
  } finally {
    isLoading.value = false;
  }
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// View applicant details
function viewApplicant(applicant) {
  selectedApplicant.value = applicant;
  showDetailModal.value = true;
}

// Close modal
function closeModal() {
  showDetailModal.value = false;
}
</script>

<template>
  <div class="bg-white shadow-lg rounded-lg overflow-hidden">
    <div class="p-6 border-b border-gray-200">
      <h2 class="text-2xl font-semibold text-gray-800 flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        Applicants ({{ applicants.length }})
      </h2>
    </div>

    <!-- Error State -->
    <div v-if="error" class="p-4 bg-red-50 border-l-4 border-red-500">
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

    <!-- Loading State -->
    <div v-else-if="isLoading" class="flex justify-center items-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="applicants.length === 0" class="py-12 flex flex-col items-center justify-center text-gray-500">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <p class="text-xl font-medium">No applicants yet</p>
      <p class="mt-2 text-sm">Applicants will appear here once they apply for this position.</p>
    </div>

    <!-- Applicant List -->
    <div v-else class="overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Score</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applied</th>
            <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="applicant in applicants" :key="applicant.id" class="hover:bg-gray-50">
            <td class="px-6 py-4 whitespace-nowrap">
              <div class="flex items-center">
                <div>
                  <div class="text-sm font-medium text-gray-900">{{ applicant.fullname }}</div>
                  <div class="text-sm text-gray-500">{{ applicant.email }}</div>
                </div>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[applicant.status] || 'bg-gray-100 text-gray-800']">
                {{ applicant.status }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <div v-if="applicant.ai_score" class="flex items-center">
                <div class="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                  <div :class="{
                    'h-full': true,
                    'bg-red-500': applicant.ai_score < 40,
                    'bg-yellow-500': applicant.ai_score >= 40 && applicant.ai_score < 70,
                    'bg-green-500': applicant.ai_score >= 70
                  }" :style="`width: ${applicant.ai_score}%`"></div>
                </div>
                <span class="ml-2 text-sm text-gray-700">{{ applicant.ai_score }}%</span>
              </div>
              <div v-else class="text-sm text-gray-500">Not scored</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {{ formatDate(applicant.created_at) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <button @click="viewApplicant(applicant)" class="text-indigo-600 hover:text-indigo-900 mr-3">
                View Details
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    
    <!-- Applicant Detail Modal -->
    <div v-if="showDetailModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div class="border-b px-6 py-4 flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">Applicant Details</h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-500">
            <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div v-if="selectedApplicant" class="p-6 space-y-6">
          <!-- Applicant Contact Info -->
          <div class="bg-gray-50 p-4 rounded-lg">
            <h4 class="font-medium text-lg text-gray-900 mb-3">{{ selectedApplicant.fullname }}</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-500">Email</p>
                <p class="font-medium">{{ selectedApplicant.email }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Phone</p>
                <p class="font-medium">{{ selectedApplicant.phone || 'Not provided' }}</p>
              </div>
              <div v-if="selectedApplicant.linkedin">
                <p class="text-sm text-gray-500">LinkedIn</p>
                <a :href="selectedApplicant.linkedin" target="_blank" class="text-blue-600 hover:underline">View Profile</a>
              </div>
            </div>
          </div>

          <!-- AI Screening Results -->
          <div v-if="selectedApplicant.ai_score" class="border border-gray-200 rounded-lg p-4">
            <h4 class="font-medium text-lg text-gray-900 mb-3">AI Screening Results</h4>
            
            <div class="flex items-center mb-3">
              <div class="mr-2">Match Score:</div>
              <div class="flex-1">
                <div class="h-2.5 w-full bg-gray-200 rounded-full overflow-hidden">
                  <div :class="{
                    'h-full': true,
                    'bg-red-500': selectedApplicant.ai_score < 40,
                    'bg-yellow-500': selectedApplicant.ai_score >= 40 && selectedApplicant.ai_score < 70,
                    'bg-green-500': selectedApplicant.ai_score >= 70
                  }" :style="`width: ${selectedApplicant.ai_score}%`"></div>
                </div>
              </div>
              <div class="ml-2 font-medium">{{ selectedApplicant.ai_score }}%</div>
            </div>
            
            <!-- Skills Match -->
            <div v-if="selectedApplicant.skills_match && selectedApplicant.skills_match.length > 0" class="mb-4">
              <h5 class="font-medium mb-2">Skills Match</h5>
              <div class="flex flex-wrap gap-2">
                <span v-for="(skill, index) in selectedApplicant.skills_match" :key="index" 
                      class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                  {{ skill }}
                </span>
              </div>
            </div>
            
            <!-- AI Feedback -->
            <div v-if="selectedApplicant.ai_feedback" class="mb-4">
              <h5 class="font-medium mb-2">AI Feedback</h5>
              <div class="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">{{ selectedApplicant.ai_feedback }}</div>
            </div>
            
            <!-- Experience Match -->
            <div v-if="selectedApplicant.experience_match" class="mb-4">
              <h5 class="font-medium mb-2">Experience Analysis</h5>
              <div class="bg-gray-50 p-3 rounded text-sm whitespace-pre-line">{{ selectedApplicant.experience_match }}</div>
            </div>
          </div>
          
          <!-- Resume & Cover Letter -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="font-medium text-lg text-gray-900 mb-3">Resume</h4>
              <div v-if="selectedApplicant.resume_url" class="border border-gray-200 rounded-lg p-4">
                <a :href="selectedApplicant.resume_url" target="_blank" 
                   class="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                  </svg>
                  <span>View Resume</span>
                </a>
              </div>
              <div v-else class="text-gray-500 text-center p-4">No resume provided</div>
            </div>
            
            <div>
              <h4 class="font-medium text-lg text-gray-900 mb-3">Cover Letter</h4>
              <div v-if="selectedApplicant.cover_letter" class="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                <p class="whitespace-pre-line">{{ selectedApplicant.cover_letter }}</p>
              </div>
              <div v-else class="text-gray-500 text-center p-4">No cover letter provided</div>
            </div>
          </div>
          
          <!-- Notes -->
          <div v-if="selectedApplicant.notes">
            <h4 class="font-medium text-lg text-gray-900 mb-3">Recruiter Notes</h4>
            <div class="border border-gray-200 rounded-lg p-4">
              <p class="whitespace-pre-line">{{ selectedApplicant.notes }}</p>
            </div>
          </div>
        </div>
        
        <div class="bg-gray-50 px-6 py-3 flex justify-end">
          <button @click="closeModal" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
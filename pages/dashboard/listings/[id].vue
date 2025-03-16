<script setup>
const route = useRoute();
const listing = ref(null);
const error = ref(null);
const isEditing = ref(false);
const editedListing = ref({});
const showCopiedMessage = ref(false);
const showApplicants = ref(true);
const applicantsLoading = ref(false);
const departments = ref([
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'Human Resources',
    'Finance',
    'Operations'
]);
const experienceLevels = ref([
    'Entry',
    'Mid',
    'Senior',
    'Lead'
]);
const employmentTypes = ref([
    'Full-time',
    'Part-time',
    'Contract',
    'Internship'
]);
const newSkill = ref('');

// Define application status options for consistency
const applicationStatuses = computed(() => ({
    PENDING: 'pending',
    REVIEW: 'review',
    INTERVIEW: 'interview',
    REJECTED: 'rejected'
}));

onMounted(async () => {
    await fetchListing();
});

const fetchListing = async () => {
    const listingId = route.params.id;
    try {
        const response = await $fetch('/api/listings/getbyid', {
            method: 'POST',
            body: { listing_uuid: listingId }
        });
        listing.value = response;
        
        // Handle skills array properly based on its type
        let skillsArray = [];
        if (response.skills) {
            if (Array.isArray(response.skills)) {
                skillsArray = [...response.skills];
            } else if (typeof response.skills === 'string') {
                // Handle string format (either comma-separated or PostgreSQL array format)
                if (response.skills.startsWith('{') && response.skills.endsWith('}')) {
                    // PostgreSQL array format: '{"skill1","skill2"}'
                    skillsArray = response.skills
                        .slice(1, -1)
                        .split(',')
                        .map(skill => skill.replace(/^"(.*)"$/, '$1').trim());
                } else {
                    // Regular comma-separated string
                    skillsArray = response.skills.split(',').map(skill => skill.trim());
                }
            }
        }
        
        editedListing.value = {
            ...response,
            skills: skillsArray,
        };
    } catch (e) {
        error.value = e.message || 'Failed to fetch listing.';
        console.error(error.value);
    }
};

const cancelEditing = () => {
    isEditing.value = false;
    
    // Handle skills array properly based on its type
    let skillsArray = [];
    if (listing.value.skills) {
        if (Array.isArray(listing.value.skills)) {
            skillsArray = [...listing.value.skills];
        } else if (typeof listing.value.skills === 'string') {
            if (listing.value.skills.startsWith('{') && listing.value.skills.endsWith('}')) {
                skillsArray = listing.value.skills
                    .slice(1, -1)
                    .split(',')
                    .map(skill => skill.replace(/^"(.*)"$/, '$1').trim());
            } else {
                skillsArray = listing.value.skills.split(',').map(skill => skill.trim());
            }
        }
    }
    
    editedListing.value = {
        ...listing.value,
        skills: skillsArray,
    };
};

const enableEditing = () => {
    isEditing.value = true;
};

const saveListing = async () => {
    try {
        // No need to join the skills array back into a comma-separated string
        // since the database now expects an array
        const formData = {
            ...editedListing.value,
            // Map snake_case to camelCase for API compatibility
            experienceLevel: editedListing.value.experience_level,
            employmentType: editedListing.value.employment_type,
            customInstructions: editedListing.value.custom_instructions
        };
        
        await $fetch('/api/listings/edit', {
            method: 'POST',
            body: formData
        });
        
        isEditing.value = false;
        await fetchListing(); // Refresh the listing data
    } catch (e) {
        error.value = e.message || 'Failed to update listing.';
        console.error(error.value);
    }
};

function addSkill() {
    if (newSkill.value.trim()) {
        editedListing.value.skills.push(newSkill.value.trim());
        newSkill.value = '';
    }
}

function removeSkill(index) {
    editedListing.value.skills.splice(index, 1);
}

// Get public URL for the job listing
const getPublicUrl = () => {
    return `${window.location.origin}/listings/${route.params.id}`;
};

// Copy public URL to clipboard
const copyPublicUrl = () => {
    const url = getPublicUrl();
    navigator.clipboard.writeText(url).then(() => {
        showCopiedMessage.value = true;
        setTimeout(() => {
            showCopiedMessage.value = false;
        }, 2000);
    });
};

// Open public view in new tab
const openPublicView = () => {
    const url = getPublicUrl();
    window.open(url, '_blank');
};
</script>

<template>
    <div class="min-h-screen bg-gray-50 py-6">
        <div class="container mx-auto px-4">
            <!-- Navigation Header -->
            <header class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                <NuxtLink to="/dashboard/listings" class="text-blue-600 hover:text-blue-800 flex items-center mb-4 md:mb-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                    Back to Listings
                </NuxtLink>
                <div class="hidden md:flex space-x-4">
                    <NuxtLink to="/dashboard" class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Dashboard</NuxtLink>
                    <NuxtLink to="/dashboard/listings" class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Job Listings</NuxtLink>
                    <NuxtLink to="/dashboard/listings/new" class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">New Listing</NuxtLink>
                </div>
            </header>

            <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
                Error: {{ error }}
            </div>
            <div v-else-if="listing" class="bg-white shadow-xl rounded-2xl overflow-hidden">
                <header class="bg-blue-600 p-6 text-white flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h1 class="text-2xl font-semibold">{{ listing.title }}</h1>
                        <p class="text-blue-200 mt-1">Department: {{ listing.department }}</p>
                    </div>
                    
                    <!-- Public URL buttons -->
                    <div class="flex flex-wrap gap-2 items-center">
                        <div class="relative">
                            <button @click="copyPublicUrl"
                                class="bg-indigo-500 hover:bg-indigo-600 text-white font-medium py-2 px-3 rounded flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-400">
                                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                                <span>Copy URL</span>
                            </button>
                            <!-- Copied tooltip -->
                            <div v-if="showCopiedMessage" 
                                class="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                URL copied!
                            </div>
                        </div>
                        
                        <button @click="openPublicView"
                            class="bg-purple-500 hover:bg-purple-600 text-white font-medium py-2 px-3 rounded flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                            <span>View Public</span>
                        </button>
                        
                        <div v-if="!isEditing" class="ml-2">
                            <button @click="enableEditing"
                                class="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Edit Listing
                            </button>
                        </div>
                        <div v-else class="flex space-x-2">
                            <button @click="saveListing"
                                class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Save
                            </button>
                            <button @click="cancelEditing"
                                class="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
                                Cancel
                            </button>
                        </div>
                    </div>
                </header>

                <!-- Job info that will be displayed to applicants -->
                <div class="bg-gradient-to-r from-indigo-50 to-blue-50 p-4 border-b border-gray-200">
                    <div class="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-indigo-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p class="text-sm text-gray-700">This is a preview of public job listing information that applicants will see</p>
                    </div>
                </div>

                <div class="p-6 space-y-4">
                    <section>
                        <h2 class="text-xl font-semibold text-gray-800 mb-2">Description</h2>
                        <p v-if="!isEditing" class="text-gray-700 leading-relaxed">{{ listing.description }}</p>
                        <textarea v-else v-model="editedListing.description" rows="6"
                            class="w-full p-3 border rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:border-blue-300"></textarea>
                    </section>

                    <section>
                        <h2 class="text-xl font-semibold text-gray-800 mb-2">Skills</h2>
                        <div v-if="!isEditing" class="flex flex-wrap gap-2">
                            <!-- Display skills as tags -->
                            <span v-for="(skill, index) in Array.isArray(listing.skills) ? listing.skills : 
                              (listing.skills?.split(',') || [])" :key="index"
                              class="inline-flex items-center bg-indigo-100 text-indigo-800 rounded-full px-3 py-1 text-sm">
                              {{ typeof skill === 'string' ? skill.trim() : skill }}
                            </span>
                        </div>
                        <div v-else>
                            <div v-for="(skill, index) in editedListing.skills" :key="index"
                                class="inline-flex items-center bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm mr-2 mb-2">
                                {{ skill }}
                                <button @click.prevent="removeSkill(index)"
                                    class="ml-2 text-blue-500 hover:text-blue-700 focus:outline-none">&times;</button>
                            </div>
                            <div class="flex items-center mt-2">
                                <input v-model="newSkill" @keydown.enter.prevent="addSkill" type="text"
                                    placeholder="Add a skill and press Enter"
                                    class="w-full p-3 border rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:border-blue-300" />
                                <button @click="addSkill"
                                    class="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none">Add</button>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 class="text-xl font-semibold text-gray-800 mb-2">Details</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <label class="block font-medium text-gray-700">Experience Level:</label>
                                <span v-if="!isEditing" class="text-gray-600">{{ listing.experience_level }}</span>
                                <select v-else v-model="editedListing.experience_level"
                                    class="w-full p-3 border rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:border-blue-300">
                                    <option v-for="level in experienceLevels" :key="level" :value="level">
                                        {{ level }}
                                    </option>
                                </select>
                            </div>
                            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <label class="block font-medium text-gray-700">Employment Type:</label>
                                <span v-if="!isEditing" class="text-gray-600">{{ listing.employment_type }}</span>
                                <select v-else v-model="editedListing.employment_type"
                                    class="w-full p-3 border rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:border-blue-300">
                                    <option v-for="type in employmentTypes" :key="type" :value="type">
                                        {{ type }}
                                    </option>
                                </select>
                            </div>
                            <div class="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                <label class="block font-medium text-gray-700">Department:</label>
                                <span v-if="!isEditing" class="text-gray-600">{{ listing.department }}</span>
                                <select v-else v-model="editedListing.department"
                                    class="w-full p-3 border rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:border-blue-300">
                                    <option v-for="dept in departments" :key="dept" :value="dept">
                                        {{ dept }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <!-- AI Resume Screening Options -->
                    <section class="bg-indigo-50 rounded-lg p-6 border border-indigo-100">
                        <h2 class="text-xl font-semibold text-indigo-800 mb-4 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            AI Resume Screening Custom Settings
                        </h2>
                        <p class="text-sm text-indigo-600 mb-4">
                            Configure how the AI should evaluate applicant resumes based on this job listing
                        </p>
                        
                        <p v-if="!isEditing" class="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded border border-gray-200">
                            {{ listing.custom_instructions || 'No custom instructions provided.' }}
                        </p>
                        <textarea v-else v-model="editedListing.custom_instructions" rows="4" placeholder="Add any additional instructions for applicants"
                            class="w-full p-3 border rounded-md shadow-sm focus:ring focus:ring-blue-200 focus:border-blue-300"></textarea>
                    </section>
                </div>
            </div>
            <div v-else class="flex justify-center items-center h-64">
                <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <div v-if="listing" class="mt-8">
                <div class="flex items-center mb-4">
                    <h2 class="text-xl font-semibold">Applications</h2>
                    <button @click="showApplicants = !showApplicants" 
                            class="ml-2 p-1 rounded-full hover:bg-gray-200">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" :class="{'transform rotate-180': !showApplicants}" 
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
                
                <div v-if="showApplicants">
                    <ApplicantsList :listing-id="listing.id" />
                </div>
            </div>
        </div>

    </div>
</template>
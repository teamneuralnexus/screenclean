<script setup>
definePageMeta({
    middleware: ["protected"]
});

const recentScreenings = computed(() => stats.value?.recentScreenings || []);

const recentJobs = ref([]);
const loadingJobs = ref(true);
const jobsError = ref(null);

const user = useUser();
async function logout() {
    await $fetch("/api/logout", {
        method: "POST"
    });
    await navigateTo("/login");
}

// Fetch real job listings data from API
onMounted(async () => {
  try {
    const data = await $fetch('/api/listings', {
      method: 'POST',
    });
    
    if (data && data.listings) {
      // Get the most recent 4 listings
      recentJobs.value = data.listings
        .slice(0, 3)
        .map(listing => ({
          title: listing.title,
          department: listing.department,
          applicants: listing.applicant_count || 0, 
          posted: formatTimeAgo(listing.created_at),
          status: getListingStatus(listing),
          statusClass: getStatusClass(listing),
          listing_uuid: listing.listing_uuid
        }));
    }
  } catch (err) {
    jobsError.value = 'Failed to fetch listings';
    console.error('Error fetching listings:', err);
  } finally {
    loadingJobs.value = false;
  }
});

const stats = ref({
    processedCount: 0,
    qualifiedCount: 0,
    pendingCount: 0,
    averageScore: 0,
    weeklyChange: 0,
    successRate: 0
});

// Fetch statistics
onMounted(async () => {
    try {
        const response = await $fetch('/api/stats', {
            method: 'POST'
        });
        if (response.stats) {
            stats.value = response.stats;
        }
    } catch (error) {
        console.error('Error fetching stats:', error);
    }
});

// Helper functions for formatting
function formatTimeAgo(dateString) {
  const now = new Date();
  const postedDate = new Date(dateString);
  const diffTime = Math.abs(now - postedDate);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    const months = Math.floor(diffDays / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
}

// You might want to add logic for determining listing status based on your business rules
function getListingStatus(listing) {
  // Example logic - customize based on your actual data model
  const now = new Date();
  const createdDate = new Date(listing.created_at);
  const diffDays = Math.floor(Math.abs(now - createdDate) / (1000 * 60 * 60 * 24));
  
  if (listing.closed) {
    return 'Closed';
  } else if (diffDays > 14) {
    return 'Closing Soon';
  } else {
    return 'Active';
  }
}

function getStatusClass(listing) {
  const status = getListingStatus(listing);
  
  switch(status) {
    case 'Active':
      return 'bg-green-100 text-green-800';
    case 'Closing Soon':
      return 'bg-yellow-100 text-yellow-800';
    case 'Closed':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-blue-100 text-blue-800';
  }
}
</script>
<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <!-- Header Section -->
    <header class="mb-8 flex justify-between items-center">
      <div>
        <h1 class="text-2xl font-bold text-gray-800">ScreenClean Dashboard</h1>
        <p class="text-gray-600">Welcome back, {{user.name }}</p>
      </div>
      <div class="flex items-center space-x-4">
        <nav class="hidden md:flex space-x-4 mr-4">
          <NuxtLink to="/dashboard" class="px-3 py-2 rounded-lg text-blue-700 bg-blue-100 font-medium">Dashboard</NuxtLink>
          <NuxtLink to="/dashboard/listings" class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Job Listings</NuxtLink>
          <NuxtLink to="/dashboard/listings/new" class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">New Listing</NuxtLink>
        </nav>
        <button @click="logout" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Logout
        </button>
      </div>
    </header>

    <!-- Stats Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <h3 class="text-gray-500 text-sm">Resumes Processed</h3>
        <p class="text-2xl font-semibold text-gray-800">{{ stats.processedCount }}</p>
        <div class="text-green-500 text-sm mt-2">
          <span>↑ {{ stats.weeklyChange }}%</span> vs last week
        </div>
      </div>
      
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <h3 class="text-gray-500 text-sm">Qualified Candidates</h3>
        <p class="text-2xl font-semibold text-gray-800">{{ stats.qualifiedCount }}</p>
        <div class="text-blue-500 text-sm mt-2">
          <span>{{ stats.successRate }}% success rate</span>
        </div>
      </div>

      <div class="bg-white rounded-lg p-6 shadow-sm">
        <h3 class="text-gray-500 text-sm">Pending Review</h3>
        <p class="text-2xl font-semibold text-gray-800">{{ stats.pendingCount }}</p>
        <div class="text-yellow-500 text-sm mt-2">
          <span>Est. {{ Math.ceil(stats.pendingCount * 2) }} min</span> to process
        </div>
      </div>

      <div class="bg-white rounded-lg p-6 shadow-sm">
        <h3 class="text-gray-500 text-sm">Average Score</h3>
        <p class="text-2xl font-semibold text-gray-800">{{ Math.round(stats.averageScore) }}/100</p>
        <div class="text-green-500 text-sm mt-2">
          <span>{{ stats.averageScore >= 75 ? '↑' : '↓' }} {{ Math.abs(stats.averageScore - 75) }} points</span> vs benchmark
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Screenings -->
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <h2 class="text-lg font-semibold mb-4">Recent Screenings</h2>
        <div v-if="recentScreenings.length === 0" class="text-center py-8 text-gray-500">
          No screenings yet
        </div>
        <div v-else class="space-y-4">
          <div v-for="(screening, index) in recentScreenings" :key="index" 
               class="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg">
            <div class="flex-shrink-0">
              <div :class="`w-2 h-2 rounded-full mt-2 ${screening.status_color}`"></div>
            </div>
            <div class="flex-grow">
              <p class="text-sm font-medium text-gray-800">{{ screening.name }}</p>
              <p class="text-xs text-gray-500">{{ screening.position }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-800">{{ screening.score }}/100</p>
              <p class="text-xs text-gray-500">{{ screening.time }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Job Listings -->
      <div class="bg-white rounded-lg p-6 shadow-sm">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-lg font-semibold">Recent Job Listings</h2>
          <div class="flex">
            <NuxtLink to="/dashboard/listings/new" class="bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Listing
            </NuxtLink>
            <NuxtLink to="/dashboard/listings/" class="ml-5 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm flex items-center">
              View All Listings
            </NuxtLink>
          </div>
        </div>

        <!-- Loading state -->
        <div v-if="loadingJobs" class="flex justify-center items-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>

        <!-- Error state -->
        <div v-else-if="jobsError" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {{ jobsError }}
        </div>

        <!-- Empty state -->
        <div v-else-if="recentJobs.length === 0" class="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p class="mt-2 text-gray-500">No job listings found</p>
          <NuxtLink to="/dashboard/listings/new" class="mt-3 inline-block bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm">
            Create your first listing
          </NuxtLink>
        </div>

        <!-- Job listings -->
        <div v-else class="space-y-4">
          <div v-for="job in recentJobs" :key="job.listing_uuid" 
               class="flex items-start space-x-4 p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
            <div class="flex-grow">
              <p class="text-sm font-medium text-gray-800">{{ job.title }}</p>
              <p class="text-xs text-gray-500">{{ job.department }}</p>
              <div class="flex items-center mt-2">
                <span class="text-xs text-gray-500">Posted {{ job.posted }}</span>
              </div>
            </div>
            <div class="text-right">
              <span :class="`text-xs px-2 py-1 rounded-full ${job.statusClass}`">
                {{ job.status }}
              </span>
              <NuxtLink :to="`/dashboard/listings/${job.listing_uuid}`" class="block mt-2 text-xs text-blue-600 hover:text-blue-800">
                View Details
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
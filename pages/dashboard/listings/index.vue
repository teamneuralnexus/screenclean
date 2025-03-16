<template>
    <div class="min-h-screen bg-gray-50 p-6">
      <!-- Navigation Header -->
      <header class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-800">Job Listings</h1>
          <p class="text-gray-600">Manage your current job listings</p>
        </div>
        <div class="flex items-center mt-4 md:mt-0">
          <nav class="hidden md:flex space-x-4 mr-4">
            <NuxtLink to="/dashboard" class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Dashboard</NuxtLink>
            <NuxtLink to="/dashboard/listings" class="px-3 py-2 rounded-lg text-blue-700 bg-blue-100 font-medium">Job Listings</NuxtLink>
            <NuxtLink to="/dashboard/listings/new" class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">New Listing</NuxtLink>
          </nav>
          <NuxtLink to="/dashboard/listings/new" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-all flex items-center">
            <span class="mr-2">Create New Listing</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
          </NuxtLink>
        </div>
      </header>

      <!-- Content -->
      <div class="container mx-auto">
        <div class="flex justify-between items-center mb-6">
          <h1 class="text-2xl font-bold text-gray-800">My Job Listings</h1>
          <NuxtLink to="/dashboard/listings/new" class="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-all flex items-center">
            <span class="mr-2">Create New Listing</span>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
          </NuxtLink>
        </div>
    
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center items-center py-20">
          <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    
        <!-- Error state -->
        <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong class="font-bold">Error!</strong>
          <span class="block sm:inline"> {{ error }}</span>
        </div>
    
        <!-- Empty state -->
        <div v-else-if="listings.length === 0" class="text-center py-16">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h2 class="mt-4 text-xl font-semibold text-gray-700">No job listings found</h2>
          <p class="mt-2 text-gray-500">Create your first job listing to start screening resumes</p>
          <NuxtLink to="/dashboard/listings/new" class="mt-6 inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-all">
            Create First Listing
          </NuxtLink>
        </div>
    
        <!-- Listings -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="listing in listings" :key="listing.listing_uuid" class="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200 transition-all hover:shadow-lg">
            <div class="px-6 py-4">
              <div class="font-bold text-xl mb-2 text-gray-800">{{ listing.title }}</div>
              <p class="text-gray-600 text-sm">{{ listing.department }}</p>
              <div class="flex items-center mt-2 text-sm">
                <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full mr-2">{{ listing.employment_type }}</span>
                <span class="bg-green-100 text-green-800 px-2 py-1 rounded-full">{{ listing.experience_level }}</span>
              </div>
              <p class="text-gray-500 text-sm mt-4 line-clamp-2">{{ listing.description }}</p>
            </div>
            <div class="px-6 pb-4">
              <div class="flex flex-wrap gap-2 mb-4">
                <span v-for="(skill, i) in listing.skills" :key="i" class="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                  {{ skill }}
                </span>
              </div>
              <div class="flex justify-between">
                <NuxtLink :to="`/dashboard/listings/${listing.listing_uuid}`" class="text-blue-600 hover:text-blue-800 text-sm font-medium">
                  View Details
                </NuxtLink>
                <span class="text-xs text-gray-500">
                  Created: {{ formatDate(listing.created_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
</template>
  
<script setup>
const listings = ref([]);
const loading = ref(true);
const error = ref(null);

onMounted(async () => {
  try {
    const data = await $fetch('/api/listings', {
      method: 'POST',
    });
    
    if (data && data.listings) {
      listings.value = data.listings;
    }
  } catch (err) {
    error.value = 'Failed to fetch listings. Please try again.';
    console.error('Error fetching listings:', err);
  } finally {
    loading.value = false;
  }
});

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}
</script>
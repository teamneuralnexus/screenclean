<template>
  <nav class="flex flex-wrap items-center space-x-1 md:space-x-4">
    <NuxtLink 
      to="/dashboard" 
      class="px-3 py-2 rounded-lg font-medium transition-colors"
      :class="currentPath === '/dashboard' ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:bg-gray-100'">
      Dashboard
    </NuxtLink>
    <NuxtLink 
      to="/dashboard/listings" 
      class="px-3 py-2 rounded-lg font-medium transition-colors"
      :class="currentPath === '/dashboard/listings' ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:bg-gray-100'">
      Job Listings
    </NuxtLink>
    <NuxtLink 
      to="/dashboard/listings/new" 
      class="px-3 py-2 rounded-lg font-medium transition-colors"
      :class="currentPath === '/dashboard/listings/new' ? 'text-blue-700 bg-blue-100' : 'text-gray-700 hover:bg-gray-100'">
      New Listing
    </NuxtLink>
  </nav>
</template>

<script setup>
const route = useRoute();

// Compute the current path to highlight the appropriate nav item
const currentPath = computed(() => {
  // For listing detail pages, highlight the listings nav item
  if (route.path.startsWith('/dashboard/listings/') && route.params.id) {
    return '/dashboard/listings';
  }
  return route.path;
});
</script>

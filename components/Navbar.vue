<template>
  <nav class="py-10 px-36 flex items-center justify-between">
    <div class="text-black font-bold text-2xl">
      ScreenClean
    </div>
    <div class="space-x-4">
      <NuxtLink to="/login" class="bg-white text-blue-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 hover:scale-105 hover:shadow-sm transition-all duration-200">
        Log In
      </NuxtLink>
      <NuxtLink to="/signup" class="bg-blue-700 text-white font-semibold px-4 py-2 rounded hover:bg-blue-800 hover:scale-105 hover:shadow-sm transition-all duration-200">
        Sign Up
      </NuxtLink>
    </div>
  </nav>
</template>
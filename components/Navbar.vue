<template>
  <nav class="bg-gradient-to-r from-blue-500 to-purple-600 py-4 px-6 flex items-center justify-between">
    <div class="text-white font-bold text-2xl">
      MySaaS
    </div>
    <div class="space-x-4">
      <NuxtLink to="/login" class="bg-white text-blue-600 font-semibold px-4 py-2 rounded hover:bg-gray-100 transition">
        Log In
      </NuxtLink>
      <NuxtLink to="/signup" class="bg-blue-700 text-white font-semibold px-4 py-2 rounded hover:bg-blue-800 transition">
        Sign Up
      </NuxtLink>
    </div>
  </nav>
</template>

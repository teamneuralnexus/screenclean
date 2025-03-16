<template>
    <div class="min-h-screen flex flex-col bg-gray-50">
        <Navbar />

        <main class="flex-grow container mx-auto px-4 py-16 md:py-24">
            <div class="max-w-4xl mx-auto text-center">
                <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
                    Screen Resumes <span class="text-blue-600">Efficiently</span>
                </h1>

                <p class="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
                    The AI-powered solution for HR professionals. Find top talent faster with intelligent resume parsing and analysis.
                </p>

                <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <NuxtLink to="/signup"
                        class="bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold px-8 py-4 rounded-lg hover:opacity-90 transition shadow-lg w-full sm:w-auto">
                        Get Started
                    </NuxtLink>

                    <NuxtLink to="/login"
                        class="bg-white text-blue-600 border border-blue-600 font-semibold px-8 py-4 rounded-lg hover:bg-blue-50 transition w-full sm:w-auto">
                        See in Action
                    </NuxtLink>
                </div>
            </div>

            <div class="mt-20 md:mt-32">
                <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                        <div class="text-blue-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold mb-2">AI-Powered Screening</h3>
                        <p class="text-gray-600">Advanced algorithms match candidates to job requirements with remarkable accuracy.
                        </p>
                    </div>

                    <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                        <div class="text-purple-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold mb-2">Time-Saving</h3>
                        <p class="text-gray-600">Reduce hiring time by up to 75% with automated resume screening and ranking.</p>
                    </div>

                    <div class="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
                        <div class="text-blue-500 mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24"
                                stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <h3 class="text-xl font-semibold mb-2">Data Insights</h3>
                        <p class="text-gray-600">Detailed analytics and reporting to enhance your recruitment strategy.</p>
                    </div>
                </div>
            </div>
        </main>

        <footer class="bg-gray-800 text-white py-8 px-6">
            <div class="container mx-auto">
                <div class="text-center">
                    <p class="text-sm">© 2025 ScreenClean. All rights reserved.</p>
                    <div class="mt-4 flex justify-center space-x-4">
                        <a href="#" class="text-gray-400 hover:text-white transition">Privacy Policy</a>
                        <a href="#" class="text-gray-400 hover:text-white transition">Terms of Service</a>
                        <a href="#" class="text-gray-400 hover:text-white transition">Contact Us</a>
                    </div>
                </div>
            </div>
        </footer>
    </div>
</template>
<script setup>
const user = useUser()
const router = useRouter()
if(user.value) {
    router.push('/dashboard')
}
</script>
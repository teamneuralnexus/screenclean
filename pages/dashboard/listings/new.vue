<template>
    <div class="min-h-screen bg-gray-50 p-6">
        <!-- Navigation Header -->
        <header class="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">Create New Job Listing</h1>
                <p class="text-gray-600">Fill in the details below to create a new job posting</p>
            </div>
            <div class="hidden md:flex space-x-4 mt-4 md:mt-0">
                <NuxtLink to="/dashboard" class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Dashboard</NuxtLink>
                <NuxtLink to="/dashboard/listings" class="px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 font-medium">Job Listings</NuxtLink>
                <NuxtLink to="/dashboard/listings/new" class="px-3 py-2 rounded-lg text-blue-700 bg-blue-100 font-medium">New Listing</NuxtLink>
            </div>
        </header>

        <div class="max-w-3xl mx-auto">
            <form @submit.prevent="createListing" class="bg-white rounded-lg shadow-sm p-6">
                <div class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Job Title</label>
                            <input v-model="form.title" type="text"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Department</label>
                            <select v-model="form.department"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required>
                                <option value="">Select Department</option>
                                <option v-for="dept in departments" :key="dept" :value="dept">
                                    {{ dept }}
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="mt-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Job Description</label>
                        <textarea v-model="form.description" rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            required></textarea>
                    </div>

                    <div class="mt-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Required Skills</label>
                        <div>
                            <div v-for="(skill, index) in form.skills" :key="index"
                                class="bg-blue-100 text-blue-800 px-3 py-1 mb-5 rounded-full text-sm items-center">
                                {{ skill }}
                                <button @click.prevent="removeSkill(index)"
                                    class="ml-2 text-blue-600 hover:text-blue-800">×</button>
                            </div>
                            <input v-model="newSkill" @keydown.enter.prevent="addSkill" type="text"
                                placeholder="Type and press Enter"
                                class="px-3 block py-1 mt-2 w-full border border-gray-300 rounded-full text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                        </div>
                    </div>

                    <!-- Additional Details -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                            <select v-model="form.experienceLevel"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required>
                                <option value="">Select Level</option>
                                <option value="Entry">Entry Level</option>
                                <option value="Mid">Mid Level</option>
                                <option value="Senior">Senior Level</option>
                                <option value="Lead">Lead</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Employment Type</label>
                            <select v-model="form.employmentType"
                                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required>
                                <option value="">Select Type</option>
                                <option value="Full-time">Full-time</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                                <option value="Internship">Internship</option>
                            </select>
                        </div>
                    </div>
                    <div class="mt-2 mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Custom Instructions</label>
                        <textarea v-model="form.customInstructions" rows="4"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Optional. Leave Blank for none"></textarea>
                    </div>
                    <!-- Submit Button -->
                    <div class="flex justify-end space-x-4">
                        <button type="button" @click="$router.back()"
                            class="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
                            Cancel
                        </button>
                        <button type="submit" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Create Listing
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup>
const departments = ref([
    'Engineering',
    'Product',
    'Design',
    'Marketing',
    'Sales',
    'Human Resources',
    'Finance',
    'Operations'
])

const form = ref({
    title: '',
    department: '',
    description: '',
    skills: [],
    experienceLevel: '',
    employmentType: '',
    customInstructions: ''
})

const newSkill = ref('')

function addSkill() {
    if (newSkill.value.trim()) {
        form.value.skills.push(newSkill.value.trim())
        newSkill.value = ''
    }
}

function removeSkill(index) {
    form.value.skills.splice(index, 1)
}

async function createListing() {
    try {
        const data = await $fetch('/api/listings/new', {
            method: 'POST',
            body: form.value
        })
        if(data.listing_uuid) {
            // Navigate back to listings page
            await navigateTo('/dashboard/listings/'+data.listing_uuid)

        }
    } catch (error) {
        console.error('Error creating listing:', error)
    }
}
</script>
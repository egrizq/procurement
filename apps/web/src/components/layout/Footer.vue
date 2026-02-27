<template>
  <footer class="bg-gray-800 text-white mt-auto">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col md:flex-row justify-between items-center">
        <div class="text-sm text-gray-300">
          <p>&copy; {{ currentYear }} Procurement ERP. All rights reserved.</p>
        </div>
        <div class="flex gap-6 mt-4 md:mt-0 text-sm text-gray-300">
          <a href="#" class="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" class="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" class="hover:text-white transition-colors">Support</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
const currentYear = new Date().getFullYear()
</script>

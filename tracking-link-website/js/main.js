// Utility function to format dates
function formatDate(dateString) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Function to load and display links on the dashboard
async function loadDashboardLinks() {
    const linksList = document.getElementById('linksList');
    if (!linksList) return; // Only run on pages with the links list

    try {
        const response = await fetch('/api/links');
        if (!response.ok) {
            throw new Error('Failed to load links');
        }

        const links = await response.json();

        if (links.length === 0) {
            linksList.innerHTML = `
                <div class="px-4 py-5 sm:px-6">
                    <div class="text-center text-gray-500">
                        <i class="fas fa-link text-4xl mb-3"></i>
                        <p class="text-sm">No tracking links created yet.</p>
                        <a href="create.html" class="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200">
                            Create Your First Link
                            <i class="fas fa-arrow-right ml-2"></i>
                        </a>
                    </div>
                </div>
            `;
            return;
        }

        linksList.innerHTML = links.map(link => `
            <div class="px-4 py-5 sm:px-6">
                <div class="flex items-center justify-between">
                    <div class="flex-1 min-w-0">
                        <h3 class="text-lg font-medium leading-6 text-gray-900 truncate">
                            ${link.trackingCode}
                        </h3>
                        <p class="mt-1 text-sm text-gray-500">
                            <i class="fas fa-link mr-1"></i> ${link.destinationUrl}
                        </p>
                        <p class="mt-1 text-sm text-gray-500">
                            <i class="far fa-clock mr-1"></i> Created on ${formatDate(link.createdAt)}
                        </p>
                    </div>
                    <div class="flex flex-col sm:flex-row gap-2">
                        <button onclick="copyTrackingLink('${link.trackingUrl}')" 
                                class="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <i class="fas fa-copy mr-1"></i> Copy
                        </button>
                        <a href="analytics.html?code=${link.trackingCode}" 
                           class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            <i class="fas fa-chart-bar mr-1"></i> Analytics
                        </a>
                    </div>
                </div>
                <div class="mt-4">
                    <div class="bg-gray-50 rounded-md p-3">
                        <div class="flex items-center justify-between text-sm">
                            <div>
                                <span class="font-medium text-gray-900">${link.visits ? link.visits.length : 0}</span>
                                <span class="text-gray-500"> total visits</span>
                            </div>
                            <div>
                                <span class="font-medium text-gray-900">${
                                    link.visits ? new Set(
                                        link.visits
                                            .filter(visit => visit.latitude && visit.longitude)
                                            .map(visit => `${visit.latitude},${visit.longitude}`)
                                    ).size : 0
                                }</span>
                                <span class="text-gray-500"> unique locations</span>
                            </div>
                            <div>
                                <span class="font-medium text-gray-900">${
                                    link.visits && link.visits.length > 0 
                                        ? formatDate(link.visits[link.visits.length - 1].timestamp)
                                        : 'Never'
                                }</span>
                                <span class="text-gray-500"> last visit</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading links:', error);
        linksList.innerHTML = `
            <div class="px-4 py-5 sm:px-6">
                <div class="rounded-md bg-red-50 p-4">
                    <div class="flex">
                        <div class="flex-shrink-0">
                            <i class="fas fa-exclamation-circle text-red-400"></i>
                        </div>
                        <div class="ml-3">
                            <h3 class="text-sm font-medium text-red-800">
                                Error Loading Links
                            </h3>
                            <div class="mt-2 text-sm text-red-700">
                                <p>Unable to load your tracking links. Please try again later.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Function to copy tracking link to clipboard
async function copyTrackingLink(link) {
    try {
        await navigator.clipboard.writeText(link);
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg transform transition-transform duration-300 translate-y-0';
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-check-circle mr-2"></i>
                <span>Link copied to clipboard!</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.add('translate-y-full');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    } catch (error) {
        console.error('Failed to copy link:', error);
        // Show error message
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas fa-exclamation-circle mr-2"></i>
                <span>Failed to copy link</span>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        // Remove toast after 3 seconds
        setTimeout(() => toast.remove(), 3000);
    }
}

// Load dashboard links when the page loads
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardLinks();
});

// Add mobile menu functionality
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.querySelector('[aria-label="Menu"]');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            const expanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !expanded);
            mobileMenu.classList.toggle('hidden');
        });
    }
});

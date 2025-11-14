// Global Variables
let currentRole = 'admin';
let currentUser = {
    email: '',
    role: ''
};

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Login Form Handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Navigation Menu Handlers
    setupNavigationHandlers();

    // Price Toggle Handlers
    setupPriceToggleHandlers();

    // Image Upload Handler
    setupImageUploadHandler();

    // Modal Close on Outside Click
    setupModalHandlers();

    // Form Submissions
    setupFormHandlers();

    // Initialize Charts
    initializeCharts();
}

// Login Handler
function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const role = document.getElementById('roleSelect').value;
    
    currentUser.email = email;
    currentUser.role = role;
    currentRole = role;
    
    // Hide login page
    document.getElementById('loginPage').style.display = 'none';
    
    // Show appropriate dashboard
    showDashboard(role);
    
    // Show success toast
    showToast('Login successful!', 'success');
}

// Show Dashboard Based on Role
function showDashboard(role) {
    // Hide all dashboards
    document.querySelectorAll('.dashboard').forEach(d => {
        d.classList.remove('active');
    });
    
    // Show selected dashboard
    let dashboardId = '';
    switch(role) {
        case 'admin':
            dashboardId = 'adminDashboard';
            break;
        case 'purchase':
            dashboardId = 'purchaseDashboard';
            break;
        case 'sales':
            dashboardId = 'salesDashboard';
            break;
        case 'delivery':
            dashboardId = 'deliveryDashboard';
            break;
    }
    
    const dashboard = document.getElementById(dashboardId);
    if (dashboard) {
        dashboard.classList.add('active');
        
        // Update user email in sidebar
        const emailElement = dashboard.querySelector('.user-email');
        if (emailElement) {
            emailElement.textContent = currentUser.email;
        }
    }
}

// Logout Handler
function logout() {
    // Hide all dashboards
    document.querySelectorAll('.dashboard').forEach(d => {
        d.classList.remove('active');
    });
    
    // Show login page
    document.getElementById('loginPage').style.display = 'flex';
    
    // Reset form
    document.getElementById('loginForm').reset();
    
    // Show info toast
    showToast('Logged out successfully', 'info');
}

// Navigation Menu Handler
function setupNavigationHandlers() {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function() {
            const sectionId = this.getAttribute('data-section');
            if (sectionId) {
                showSection(sectionId, this);
            }
        });
    });
}

function showSection(sectionId, clickedItem) {
    // Get parent dashboard
    const parentDashboard = clickedItem.closest('.dashboard');
    
    // Hide all sections in current dashboard
    parentDashboard.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remove active class from all nav items
    parentDashboard.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
    }
    
    // Add active class to clicked nav item
    clickedItem.classList.add('active');
    
    // Update page title
    updatePageTitle(parentDashboard, clickedItem.textContent.trim());
}

function updatePageTitle(dashboard, title) {
    const pageTitleElement = dashboard.querySelector('.topbar h1');
    if (pageTitleElement) {
        // Remove icon from title
        const cleanTitle = title.replace(/[^\w\s]/gi, '').trim();
        pageTitleElement.textContent = cleanTitle;
    }
}

// Price Toggle Handler for Sales Manager
function setupPriceToggleHandlers() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('toggle-price')) {
            const container = e.target.closest('.price-hidden-container');
            const priceSpan = container.querySelector('.price-hidden');
            const actualPrice = priceSpan.getAttribute('data-price');
            
            if (priceSpan.classList.contains('visible')) {
                priceSpan.textContent = '••••••';
                priceSpan.classList.remove('visible');
                e.target.classList.remove('fa-eye-slash');
                e.target.classList.add('fa-eye');
            } else {
                priceSpan.textContent = actualPrice;
                priceSpan.classList.add('visible');
                e.target.classList.remove('fa-eye');
                e.target.classList.add('fa-eye-slash');
            }
        }
    });
}

// Image Upload Handler
function setupImageUploadHandler() {
    const imageUploadArea = document.getElementById('imageUpload');
    const imageInput = document.getElementById('imageInput');
    const imagePreview = document.getElementById('imagePreview');
    
    if (imageUploadArea && imageInput) {
        imageUploadArea.addEventListener('click', () => {
            imageInput.click();
        });
        
        imageInput.addEventListener('change', function(e) {
            const files = Array.from(e.target.files);
            imagePreview.innerHTML = '';
            
            files.forEach(file => {
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        imagePreview.appendChild(img);
                    };
                    reader.readAsDataURL(file);
                }
            });
            
            if (files.length > 0) {
                showToast(`${files.length} image(s) uploaded`, 'success');
            }
        });
    }
    
    // Document upload handlers
    document.querySelectorAll('.document-upload-item').forEach(item => {
        const input = item.querySelector('input[type="file"]');
        if (input) {
            item.addEventListener('click', () => {
                input.click();
            });
            
            input.addEventListener('change', function(e) {
                if (this.files.length > 0) {
                    const fileName = this.files[0].name;
                    const label = item.querySelector('label');
                    showToast(`${label.textContent} uploaded: ${fileName}`, 'success');
                }
            });
        }
    });
}

// Modal Handlers
function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function setupModalHandlers() {
    // Close modal on outside click
    window.addEventListener('click', function(e) {
        if (e.target.classList.contains('modal')) {
            e.target.classList.remove('active');
        }
    });
    
    // Close button handlers
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// View Vehicle Details
function viewVehicleDetails(vehicleNo) {
    showModal('vehicleModal');
    // In a real application, you would fetch vehicle details here
    console.log('Viewing details for vehicle:', vehicleNo);
}

// Form Submission Handlers
function setupFormHandlers() {
    // Add Vehicle Form
    const addVehicleForm = document.getElementById('addVehicleForm');
    if (addVehicleForm) {
        addVehicleForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showToast('Vehicle added successfully!', 'success');
            this.reset();
            document.getElementById('imagePreview').innerHTML = '';
        });
    }
    
    // Handle all form submissions in modals
    document.querySelectorAll('.modal form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const modalTitle = this.closest('.modal').querySelector('.modal-header h2').textContent;
            showToast(`${modalTitle} completed successfully!`, 'success');
            
            // Close modal
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
            
            // Reset form
            this.reset();
        });
    });
}

// Toast Notification
function showToast(message, type = 'info') {
    // Remove existing toast
    const existingToast = document.querySelector('.toast');
    if (existingToast) {
        existingToast.remove();
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Icon based on type
    let icon = 'fa-info-circle';
    switch(type) {
        case 'success':
            icon = 'fa-check-circle';
            break;
        case 'error':
            icon = 'fa-exclamation-circle';
            break;
        case 'warning':
            icon = 'fa-exclamation-triangle';
            break;
    }
    
    toast.innerHTML = `
        <i class="fas ${icon}" style="font-size: 24px; color: var(--${type}-color);"></i>
        <span style="flex: 1;">${message}</span>
        <i class="fas fa-times" style="cursor: pointer; color: var(--text-muted);" onclick="this.parentElement.remove()"></i>
    `;
    
    document.body.appendChild(toast);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }
    }, 3000);
}

// Initialize Charts using Chart.js
function initializeCharts() {
    // Check if Chart.js is loaded
    if (typeof Chart === 'undefined') {
        console.log('Chart.js not loaded, using CDN...');
        loadChartJS();
        return;
    }
    
    createCharts();
}

function loadChartJS() {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/3.9.1/chart.min.js';
    script.onload = createCharts;
    document.head.appendChild(script);
}

function createCharts() {
    if (typeof Chart === 'undefined') {
        return;
    }
    
    // Sales Chart
    const salesChartCanvas = document.getElementById('salesChart');
    if (salesChartCanvas) {
        const salesCtx = salesChartCanvas.getContext('2d');
        new Chart(salesCtx, {
            type: 'line',
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                datasets: [{
                    label: 'Sales',
                    data: [12, 19, 15, 25, 22, 28],
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
    
    // Status Chart
    const statusChartCanvas = document.getElementById('statusChart');
    if (statusChartCanvas) {
        const statusCtx = statusChartCanvas.getContext('2d');
        new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['In Stock', 'Sold', 'Reserved', 'Processing'],
                datasets: [{
                    data: [24, 28, 8, 6],
                    backgroundColor: [
                        '#27ae60',
                        '#3498db',
                        '#f39c12',
                        '#e74c3c'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }
    
    // Sales Performance Chart
    const salesPerformanceCanvas = document.getElementById('salesPerformanceChart');
    if (salesPerformanceCanvas) {
        const performanceCtx = salesPerformanceCanvas.getContext('2d');
        new Chart(performanceCtx, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [{
                    label: 'Sales',
                    data: [5, 8, 6, 9],
                    backgroundColor: '#667eea'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

// Search Functionality
document.addEventListener('input', function(e) {
    if (e.target.matches('.search-box input')) {
        const searchTerm = e.target.value.toLowerCase();
        const table = e.target.closest('.section-header').nextElementSibling.querySelector('table');
        
        if (table) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const text = row.textContent.toLowerCase();
                row.style.display = text.includes(searchTerm) ? '' : 'none';
            });
        }
    }
});

// Filter Functionality
document.addEventListener('change', function(e) {
    if (e.target.matches('.filter-select')) {
        const filterValue = e.target.value.toLowerCase();
        const table = e.target.closest('.section-header').nextElementSibling.querySelector('table');
        
        if (table) {
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                if (filterValue === 'all status' || filterValue === '') {
                    row.style.display = '';
                } else {
                    const statusCell = row.querySelector('.badge');
                    if (statusCell) {
                        const status = statusCell.textContent.toLowerCase();
                        row.style.display = status.includes(filterValue.replace('all ', '')) ? '' : 'none';
                    }
                }
            });
        }
    }
});

// Generate Random Report Data (Demo)
function generateReport(reportType) {
    showToast(`Generating ${reportType} report...`, 'info');
    setTimeout(() => {
        showToast(`${reportType} report generated successfully!`, 'success');
    }, 2000);
}

// Export Data (Demo)
function exportData(format = 'csv') {
    showToast(`Exporting data as ${format.toUpperCase()}...`, 'info');
    setTimeout(() => {
        showToast('Data exported successfully!', 'success');
    }, 1500);
}

// Print functionality
function printSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write('<html><head><title>Print</title>');
        printWindow.document.write('<link rel="stylesheet" href="style.css">');
        printWindow.document.write('</head><body>');
        printWindow.document.write(section.innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        printWindow.print();
    }
}

// Utility Functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Escape key closes modals
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.active').forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    // Ctrl/Cmd + S prevents default and shows save toast
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        showToast('Changes saved!', 'success');
    }
});

// Animation on Scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animation = 'fadeInUp 0.5s ease forwards';
        }
    });
}, observerOptions);

// Observe all stat cards and data tables
document.querySelectorAll('.stat-card, .data-table-container, .chart-card').forEach(el => {
    observer.observe(el);
});

// Console welcome message
console.log('%c Vehicle Management System ', 'background: #667eea; color: white; font-size: 20px; padding: 10px;');
console.log('%c Demo Version 1.0 ', 'background: #27ae60; color: white; font-size: 14px; padding: 5px;');
console.log('Features: Multi-role access, Vehicle inventory, Purchase/Sales/Delivery management');

// Toggle Dark Mode
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
    const icon = document.querySelector('.btn-icon[title="Dark Mode"] i');
    if (document.body.classList.contains('dark-mode')) {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('darkMode', 'enabled');
        showToast('Dark mode enabled', 'info');
    } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('darkMode', 'disabled');
        showToast('Light mode enabled', 'info');
    }
}

// Load dark mode preference
function loadDarkModePreference() {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'enabled') {
        document.body.classList.add('dark-mode');
        const icon = document.querySelector('.btn-icon[title="Dark Mode"] i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

// Call on load
document.addEventListener('DOMContentLoaded', function() {
    loadDarkModePreference();
});

// Toggle Notifications Panel
function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    if (panel) {
        panel.classList.toggle('active');
        
        // Mark notifications as read when panel is opened
        if (panel.classList.contains('active')) {
            setTimeout(() => {
                document.querySelectorAll('.notification-item.unread').forEach(item => {
                    item.classList.remove('unread');
                });
                const badge = document.querySelector('.badge-dot');
                if (badge) {
                    badge.style.display = 'none';
                }
            }, 2000);
        }
    }
}

// Close notification panel when clicking outside
document.addEventListener('click', function(e) {
    const panel = document.getElementById('notificationPanel');
    const notificationBtn = document.querySelector('.btn-icon[title="Notifications"]');
    
    if (panel && panel.classList.contains('active')) {
        if (!panel.contains(e.target) && e.target !== notificationBtn && !notificationBtn.contains(e.target)) {
            panel.classList.remove('active');
        }
    }
});

// Toggle Profile Menu
function toggleProfileMenu() {
    const menu = document.getElementById('profileMenu');
    if (menu) {
        menu.classList.toggle('active');
    }
}

// Close profile menu when clicking outside
document.addEventListener('click', function(e) {
    const menu = document.getElementById('profileMenu');
    const profileTrigger = document.querySelector('.user-profile');
    
    if (menu && menu.classList.contains('active')) {
        if (!profileTrigger.contains(e.target)) {
            menu.classList.remove('active');
        }
    }
});

// Switch between Grid and Table view
function switchView(viewType) {
    const gridView = document.getElementById('vehicleGrid');
    const tableView = document.getElementById('vehicleTable');
    const gridBtn = document.querySelector('.view-toggle .btn-icon-small:first-child');
    const tableBtn = document.querySelector('.view-toggle .btn-icon-small:last-child');
    
    if (viewType === 'grid') {
        gridView.classList.add('active');
        tableView.classList.remove('active');
        gridBtn.classList.add('active');
        tableBtn.classList.remove('active');
        showToast('Switched to grid view', 'info');
    } else {
        gridView.classList.remove('active');
        tableView.classList.add('active');
        gridBtn.classList.remove('active');
        tableBtn.classList.add('active');
        showToast('Switched to table view', 'info');
    }
}

// Load Vehicle Comparison
function loadComparison() {
    const vehicle1 = document.getElementById('compareVehicle1').value;
    const vehicle2 = document.getElementById('compareVehicle2').value;
    
    if (!vehicle1 || !vehicle2) {
        showToast('Please select both vehicles to compare', 'warning');
        return;
    }
    
    if (vehicle1 === vehicle2) {
        showToast('Please select different vehicles', 'warning');
        return;
    }
    
    // Show comparison result
    const comparisonResult = document.getElementById('comparisonResult');
    if (comparisonResult) {
        comparisonResult.style.display = 'block';
        showToast('Comparison loaded successfully!', 'success');
        
        // Scroll to comparison
        comparisonResult.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Enhanced Vehicle Details View with tabs
function viewVehicleDetails(vehicleNo) {
    showModal('vehicleModal');
    console.log('Viewing details for vehicle:', vehicleNo);
    
    // In a real app, you would fetch vehicle data here
    // For demo, we'll just show a success message
    setTimeout(() => {
        showToast(`Loaded details for ${vehicleNo}`, 'success');
    }, 500);
}

// View Maintenance History
function viewMaintenance(vehicleNo) {
    showModal('maintenanceModal');
    showToast(`Loading maintenance history for ${vehicleNo}`, 'info');
}

// Advanced Search with Filtering
function setupAdvancedSearch() {
    const searchInput = document.getElementById('inventorySearch');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterVehicles();
        });
    }
    
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            filterVehicles();
        });
    }
}

function filterVehicles() {
    const searchTerm = document.getElementById('inventorySearch')?.value.toLowerCase() || '';
    const statusFilter = document.getElementById('statusFilter')?.value.toLowerCase() || 'all status';
    
    // Filter grid view
    const gridCards = document.querySelectorAll('.vehicle-card');
    gridCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const badge = card.querySelector('.vehicle-card-badge')?.textContent.toLowerCase() || '';
        
        const matchesSearch = text.includes(searchTerm);
        const matchesStatus = statusFilter === 'all status' || badge.includes(statusFilter.replace('all ', ''));
        
        card.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
    });
    
    // Filter table view
    const tableRows = document.querySelectorAll('#vehicleTable tbody tr');
    tableRows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const badge = row.querySelector('.badge')?.textContent.toLowerCase() || '';
        
        const matchesSearch = text.includes(searchTerm);
        const matchesStatus = statusFilter === 'all status' || badge.includes(statusFilter.replace('all ', ''));
        
        row.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
    });
}

// Print Purchase/Delivery Note
function printNote(noteType, noteId) {
    showToast(`Preparing ${noteType} note for printing...`, 'info');
    
    setTimeout(() => {
        const printWindow = window.open('', '', 'height=800,width=900');
        printWindow.document.write('<html><head><title>Print Note</title>');
        printWindow.document.write('<style>');
        printWindow.document.write(`
            body { font-family: 'Times New Roman', serif; padding: 40px; }
            .note-header { display: flex; justify-content: space-between; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px solid #2c3e50; }
            .company-info h1 { font-size: 28px; margin: 0 0 10px 0; }
            .note-title { text-align: right; }
            .note-title h2 { font-size: 32px; color: #667eea; margin: 0; }
            .note-section { margin: 30px 0; }
            .note-section h3 { font-size: 18px; padding-bottom: 10px; border-bottom: 2px solid #ecf0f1; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            table td { padding: 10px 15px; border: 1px solid #ddd; }
            table td:first-child { background: #f8f9fa; width: 30%; font-weight: bold; }
            .total-row { border-top: 2px solid #2c3e50; background: #f8f9fa; font-weight: bold; }
            .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
            .signature-block { text-align: center; width: 45%; }
            .signature-line { border-top: 1px solid #2c3e50; margin-bottom: 10px; padding-top: 5px; }
            ol { padding-left: 20px; }
            ol li { margin: 10px 0; line-height: 1.6; }
            @media print {
                body { padding: 20px; }
                .no-print { display: none; }
            }
        `);
        printWindow.document.write('</style></head><body>');
        printWindow.document.write(document.getElementById('purchaseNotePrint').innerHTML);
        printWindow.document.write('</body></html>');
        printWindow.document.close();
        
        setTimeout(() => {
            printWindow.print();
            showToast('Print dialog opened', 'success');
        }, 500);
    }, 1000);
}

// Quick Actions
function quickActionSell(vehicleNo) {
    showModal('markSoldModal');
    showToast(`Initiating sale for ${vehicleNo}`, 'info');
}

function quickActionMaintenance(vehicleNo) {
    showModal('maintenanceModal');
    showToast(`Opening maintenance for ${vehicleNo}`, 'info');
}

// Enhanced Form Validation
function validateForm(formId) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            isValid = false;
            field.style.borderColor = '#e74c3c';
            showToast(`Please fill in all required fields`, 'error');
        } else {
            field.style.borderColor = '';
        }
    });
    
    return isValid;
}

// Auto-save functionality
let autoSaveTimeout;
function enableAutoSave(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const inputs = form.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
        input.addEventListener('input', function() {
            clearTimeout(autoSaveTimeout);
            autoSaveTimeout = setTimeout(() => {
                saveFormData(formId);
            }, 2000);
        });
    });
}

function saveFormData(formId) {
    const form = document.getElementById(formId);
    if (!form) return;
    
    const formData = new FormData(form);
    const data = {};
    
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    
    localStorage.setItem(`form_${formId}`, JSON.stringify(data));
    showToast('Progress saved', 'success');
}

// Initialize advanced features
document.addEventListener('DOMContentLoaded', function() {
    setupAdvancedSearch();
    
    // Enable auto-save for vehicle form
    enableAutoSave('addVehicleForm');
    
    // Add smooth scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
});

// Performance Metrics (Demo)
function showPerformanceMetrics() {
    const metrics = {
        vehiclesSold: 28,
        revenue: '₹1.2Cr',
        profit: '₹18.5L',
        avgMargin: '15.4%'
    };
    
    console.table(metrics);
    showToast('Performance metrics logged to console', 'info');
}

// Export to Excel (Demo)
function exportToExcel(tableId) {
    showToast('Generating Excel file...', 'info');
    
    setTimeout(() => {
        showToast('Excel file downloaded successfully!', 'success');
        console.log('Would download Excel file with data from:', tableId);
    }, 1500);
}

// PDF Generation for Reports
function generatePDFReport(reportType) {
    showToast(`Generating ${reportType} PDF report...`, 'info');
    
    setTimeout(() => {
        showToast('PDF report generated successfully!', 'success');
        console.log('Would generate PDF for:', reportType);
    }, 2000);
}

// Keyboard Shortcuts Enhancement
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + K: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('.search-box input');
        if (searchInput) {
            searchInput.focus();
            showToast('Search focused', 'info');
        }
    }
    
    // Ctrl/Cmd + N: New vehicle (if on inventory page)
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        const addBtn = document.querySelector('[data-section="purchase-add"]');
        if (addBtn) {
            addBtn.click();
            showToast('Opening add vehicle form', 'info');
        }
    }
    
    // Ctrl/Cmd + P: Print
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        showToast('Print functionality', 'info');
    }
});

// Real-time updates simulation (Demo)
let updateInterval;
function startRealtimeUpdates() {
    updateInterval = setInterval(() => {
        // Simulate real-time metric updates
        const statNumbers = document.querySelectorAll('.stat-number');
        statNumbers.forEach((stat, index) => {
            // Random small changes to make it feel live
            if (Math.random() > 0.7) {
                stat.style.animation = 'pulse 0.5s ease';
                setTimeout(() => {
                    stat.style.animation = '';
                }, 500);
            }
        });
    }, 10000); // Update every 10 seconds
}

function stopRealtimeUpdates() {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
}

// Pulse animation for stats
const style = document.createElement('style');
style.textContent = `
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(style);

// Export functions to global scope for onclick handlers
window.logout = logout;
window.showModal = showModal;
window.closeModal = closeModal;
window.viewVehicleDetails = viewVehicleDetails;
window.generateReport = generateReport;
window.exportData = exportData;
window.printSection = printSection;
window.toggleDarkMode = toggleDarkMode;
window.toggleNotifications = toggleNotifications;
window.toggleProfileMenu = toggleProfileMenu;
window.switchView = switchView;
window.loadComparison = loadComparison;
window.viewMaintenance = viewMaintenance;
window.printNote = printNote;
window.quickActionSell = quickActionSell;
window.quickActionMaintenance = quickActionMaintenance;
window.exportToExcel = exportToExcel;
window.generatePDFReport = generatePDFReport;
window.startRealtimeUpdates = startRealtimeUpdates;
window.stopRealtimeUpdates = stopRealtimeUpdates;
/* ============================================
   MGHIC FinanceApp - Main App Logic
   ============================================ */

const App = {
    currentPage: 'dashboard',

    // Initialize the app
    async init() {
        try {
            await DB.init();
            this.setGreeting();
            this.setDefaultDate();
            console.log('✅ MGHIC FinanceApp initialized');
        } catch (error) {
            console.error('❌ App initialization failed:', error);
        }
    },

    // Unlock / Enter app
    unlock() {
        document.getElementById('lockScreen').classList.remove('active');
        document.getElementById('appContainer').classList.remove('hidden');
        this.navigate('dashboard');
    },

    // Navigation
    navigate(page) {
        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        // Map page names to actual HTML element IDs
        const pageMap = {
            'dashboard': 'dashboardPage',
            'transactions': 'transactionsPage',
            'savings': 'savingsPage',
            'categories': 'categoriesPage',
            'reports': 'reportsPage',
            'settings': 'pageSettings'
        };

        const targetId = pageMap[page];
        const targetPage = document.getElementById(targetId);
        
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            console.warn('Page not found:', page, '→', targetId);
        }

        // Update nav
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Show/hide FAB (only on dashboard, transactions, savings)
        const fab = document.getElementById('fabAdd');
        if (fab) {
            const fabPages = ['dashboard', 'transactions', 'savings'];
            fab.style.display = fabPages.includes(page) ? 'flex' : 'none';
        }

        this.currentPage = page;

        // Refresh page data
        switch (page) {
            case 'dashboard':
                this.refreshDashboard();
                break;
            case 'transactions':
                if (typeof Transactions !== 'undefined') Transactions.load();
                break;
            case 'savings':
                if (typeof Savings !== 'undefined') Savings.load();
                break;
            case 'categories':
                if (typeof Categories !== 'undefined') Categories.load();
                break;
            case 'reports':
                if (typeof Reports !== 'undefined') Reports.load();
                break;
        }
    },

    // Refresh dashboard
    async refreshDashboard() {
        if (typeof Dashboard !== 'undefined') {
            await Dashboard.load();
        }
    },

    // Show Add Transaction Modal
    showAddTransaction(type = 'expense') {
        if (typeof Transactions !== 'undefined') {
            Transactions.showAdd(type);
        }
    },

    // Modal management
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    },

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    },

    // Greeting based on time of day
    setGreeting() {
        const hour = new Date().getHours();
        let greeting = 'Good evening';
        if (hour < 12) greeting = 'Good morning';
        else if (hour < 18) greeting = 'Good afternoon';

        const el = document.getElementById('headerGreeting');
        if (el) el.textContent = greeting;
    },

    // Set default date to today
    setDefaultDate() {
        const dateInput = document.getElementById('txDate');
        if (dateInput) {
            dateInput.value = new Date().toISOString().split('T')[0];
        }
    },

    // Set current month label
    getCurrentMonthLabel() {
        return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    },

    // Confirm data wipe
    confirmDataWipe() {
        document.getElementById('confirmTitle').textContent = 'Erase All Data?';
        document.getElementById('confirmMessage').textContent = 'This will permanently delete all transactions, categories, savings goals, and invoices. This cannot be undone.';
        
        const actionBtn = document.getElementById('confirmAction');
        actionBtn.textContent = 'Erase Everything';
        actionBtn.onclick = async () => {
            await DB.clearAll();
            this.closeModal('modalConfirm');
            this.navigate('dashboard');
            this.showToast('All data erased 🗑️');
        };

        this.openModal('modalConfirm');
    },

    // Toast notification
    showToast(message, type = 'success', duration = 2500) {
        // Remove existing toast
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transition = 'opacity 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    // Format date for display
    formatDate(dateStr) {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (dateStr === today.toISOString().split('T')[0]) return 'Today';
        if (dateStr === yesterday.toISOString().split('T')[0]) return 'Yesterday';

        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});

// Handle settings toggles
document.getElementById('settingAutoAllocate')?.addEventListener('change', function() {
    document.getElementById('autoAllocateConfig').style.display = this.checked ? 'flex' : 'none';
});
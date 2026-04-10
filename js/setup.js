// ============================================
// INITIAL SETUP MODULE (One-time only)
// ============================================

const Setup = {

    // Check if setup has been completed
    async isCompleted() {
        try {
            const setting = await DB.get('settings', 'setupCompleted');
            return setting && setting.value === true;
        } catch {
            return false;
        }
    },

    // Mark setup as done (for existing users who already have data)
    async markCompleted() {
        await DB.update('settings', { key: 'setupCompleted', value: true });
    },

    // Show the setup screen
    show() {
        document.getElementById('setupScreen').classList.add('active');
        
        const input = document.getElementById('setupBankBalance');
        if (input) {
            input.addEventListener('input', () => {
                const val = parseFloat(input.value) || 0;
                document.getElementById('setupPreviewAmount').textContent = DB.formatCurrency(val);
            });
        }
    },

    // Save opening balance
    async save(event) {
        event.preventDefault();

        const bankBalance = parseFloat(document.getElementById('setupBankBalance').value);

        if (isNaN(bankBalance)) {
            App.showToast('Please enter a valid amount', 'error');
                return;
        }

        const today = new Date().toISOString().split('T')[0];

        try {
            if (bankBalance > 0) {
                await DB.add('transactions', {
                    amount: bankBalance,
                    type: 'income',
                    categoryId: null,
                    savingsGoalId: null,
                    description: '💰 Opening Balance',
                    date: today,
                    notes: 'Initial bank balance set during app setup',
                    isRecurring: false,
                    isOpeningBalance: true,
                    createdAt: new Date().toISOString()
                });
            }

            // Mark as done — never show again
            await this.markCompleted();

            // Transition to app
            document.getElementById('setupScreen').classList.remove('active');
            document.getElementById('appContainer').classList.remove('hidden');
            App.navigate('dashboard');
            App.showToast('Welcome! Your balance is set 🎉');

        } catch (error) {
            console.error('Setup error:', error);
            App.showToast('Error saving balance. Please try again.', 'error');
        }
    },

    // Skip — start from zero
    async skip() {
        await this.markCompleted();
        document.getElementById('setupScreen').classList.remove('active');
        document.getElementById('appContainer').classList.remove('hidden');
        App.navigate('dashboard');
        App.showToast('Welcome! Start adding transactions 🚀');
    }
};
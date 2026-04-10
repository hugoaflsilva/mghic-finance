// ============================================
// TRANSACTIONS MODULE
// ============================================

const Transactions = {
    selectedType: 'expense',
    filterType: 'all',
    editingId: null,

    // Load and render transactions page
    async load() {
        const transactions = await DB.getAll('transactions');
        const categories = await DB.getAll('categories');
        const goals = await DB.getAll('savingsGoals');
        
        // Sort by date descending
        transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

        // Filter
        const filtered = this.filterType === 'all' 
            ? transactions 
            : transactions.filter(t => t.type === this.filterType);

        const list = document.getElementById('transactionsList');
        if (!list) return;

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">💸</span>
                    <p>No transactions yet</p>
                    <p class="empty-state-sub">Tap the + button to add one</p>
                </div>`;
            return;
        }

        // Group by date
        const grouped = {};
        filtered.forEach(t => {
            const dateKey = new Date(t.date).toLocaleDateString('en-GB', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            });
            if (!grouped[dateKey]) grouped[dateKey] = [];
            grouped[dateKey].push(t);
        });

        let html = '';
        for (const [date, txs] of Object.entries(grouped)) {
            const dayTotal = txs.reduce((sum, t) => {
                return sum + (t.type === 'income' ? t.amount : -t.amount);
            }, 0);

            html += `
                <div class="transaction-date-group">
                    <div class="transaction-date-header">
                        <span class="transaction-date">${date}</span>
                        <span class="transaction-date-total ${dayTotal >= 0 ? 'positive' : 'negative'}">
                            ${dayTotal >= 0 ? '+' : ''}${DB.formatCurrency(dayTotal)}
                        </span>
                    </div>
                    ${txs.map(t => {
                        let icon, name, color;
                        const isSavingsType = ['savings', 'savings-opening', 'savings-withdrawal'].includes(t.type);
                        
                        if (isSavingsType) {
                            const goal = goals.find(g => g.id === t.savingsGoalId);
                            icon = goal ? goal.icon : '🎯';
                            name = goal ? goal.name : 'Savings';
                            color = goal ? goal.color : '#6C2DC7';
                        } else {
                            const cat = categories.find(c => c.id === t.categoryId) || { 
                                icon: '📦', name: 'Uncategorized', color: '#7F8C8D' 
                            };
                            icon = cat.icon;
                            name = cat.name;
                            color = cat.color;
                        }

                        let sign, amountClass;
                        if (t.type === 'income' || t.type === 'savings-withdrawal') {
                            sign = '+';
                            amountClass = 'positive';
                        } else {
                            sign = '-';
                            amountClass = 'negative';
                        }

                        const typeLabel = t.type === 'savings-opening' ? ' · 🏦 Opening' 
                                        : t.type === 'savings-withdrawal' ? ' · 💸 Withdrawal'
                                        : t.type === 'savings' ? ' · 🎯 Deposit'
                                        : '';
                        
                        return `
                            <div class="transaction-card" onclick="Transactions.showEdit(${t.id})">
                                <div class="transaction-left">
                                    <div class="transaction-icon" style="background: ${color}20; color: ${color}">
                                        ${icon}
                                    </div>
                                    <div class="transaction-info">
                                        <span class="transaction-name">${t.description || name}</span>
                                        <span class="transaction-category">${name}${typeLabel}</span>
                                    </div>
                                </div>
                                <div class="transaction-right">
                                    <span class="transaction-amount ${amountClass}">
                                        ${sign}${DB.formatCurrency(Math.abs(t.amount))}
                                    </span>
                                    ${t.isRecurring ? '<span class="transaction-recurring">🔄</span>' : ''}
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
            `;
        }

        list.innerHTML = html;
    },

    // Filter transactions
    filter(type, btn) {
        this.filterType = type;
        document.querySelectorAll('#transactionsPage .filter-btn').forEach(b => {
            b.classList.toggle('active', b === btn);
        });
        this.load();
    },

    // Load category options for the transaction modal
    async loadCategoryOptions(type) {
        await Categories.init();
        const categories = await DB.getAll('categories');
        const filtered = categories.filter(c => c.type === type);
        
        const select = document.getElementById('txCategory');
        if (!select) return;

        select.innerHTML = '<option value="">Select category...</option>' +
            filtered.map(c => `
                <option value="${c.id}">${c.icon} ${c.name}</option>
            `).join('');
    },

    // Load savings goal options
    async loadGoalOptions() {
        const goals = await DB.getAll('savingsGoals');
        const select = document.getElementById('txSavingsGoal');
        if (!select) return;

        select.innerHTML = '<option value="">Select goal...</option>' +
            goals.map(g => `<option value="${g.id}">${g.icon} ${g.name}</option>`).join('');
    },

    // Set transaction type
    setType(type, btn) {
        this.selectedType = type;
        document.getElementById('txType').value = type;
        
        document.querySelectorAll('#modalTransaction .type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === type);
        });

        // Show/hide savings goal selector
        const savingsGroup = document.getElementById('savingsGoalGroup');
        const invoiceGroup = document.getElementById('invoiceGroup');
        const categoryGroup = document.getElementById('txCategory')?.closest('.form-group');
        
        if (type === 'savings') {
            if (savingsGroup) savingsGroup.style.display = 'block';
            if (invoiceGroup) invoiceGroup.style.display = 'none';
            if (categoryGroup) categoryGroup.style.display = 'none';
            this.loadGoalOptions();
        } else {
            if (savingsGroup) savingsGroup.style.display = 'none';
            if (invoiceGroup) invoiceGroup.style.display = 'block';
            if (categoryGroup) categoryGroup.style.display = 'block';
            this.loadCategoryOptions(type);
        }
    },

    // Show add transaction modal
    showAdd(type = 'expense') {
        this.editingId = null;
        this.selectedType = type;

        document.getElementById('modalTransactionTitle').textContent = 'New Transaction';
        document.getElementById('txAmount').value = '';
        document.getElementById('txDescription').value = '';
        document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('txNotes').value = '';
        document.getElementById('txRecurring').checked = false;
        document.getElementById('txType').value = type;
        document.getElementById('deleteTransactionBtn').style.display = 'none';
        document.getElementById('invoicePreview').innerHTML = '';

        // Reset type buttons
        document.querySelectorAll('#modalTransaction .type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === type);
        });

        // Show/hide sections based on type
        const savingsGroup = document.getElementById('savingsGoalGroup');
        const invoiceGroup = document.getElementById('invoiceGroup');
        const categoryGroup = document.getElementById('txCategory')?.closest('.form-group');

        if (type === 'savings') {
            if (savingsGroup) savingsGroup.style.display = 'block';
            if (invoiceGroup) invoiceGroup.style.display = 'none';
            if (categoryGroup) categoryGroup.style.display = 'none';
            this.loadGoalOptions();
        } else {
            if (savingsGroup) savingsGroup.style.display = 'none';
            if (invoiceGroup) invoiceGroup.style.display = 'block';
            if (categoryGroup) categoryGroup.style.display = 'block';
            this.loadCategoryOptions(type);
        }

        App.openModal('modalTransaction');
    },

    // Show edit transaction modal
    async showEdit(id) {
        const tx = await DB.get('transactions', id);
        if (!tx) return;

        this.editingId = id;
        this.selectedType = tx.type;

        document.getElementById('modalTransactionTitle').textContent = 'Edit Transaction';
        document.getElementById('txAmount').value = tx.amount;
        document.getElementById('txDescription').value = tx.description || '';
        document.getElementById('txDate').value = tx.date;
        document.getElementById('txNotes').value = tx.notes || '';
        document.getElementById('txRecurring').checked = tx.isRecurring || false;
        document.getElementById('txType').value = tx.type;
        document.getElementById('deleteTransactionBtn').style.display = 'block';

        // Set type buttons
        document.querySelectorAll('#modalTransaction .type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === tx.type);
        });

        // Show/hide sections
        const savingsGroup = document.getElementById('savingsGoalGroup');
        const invoiceGroup = document.getElementById('invoiceGroup');
        const categoryGroup = document.getElementById('txCategory')?.closest('.form-group');

        if (tx.type === 'savings') {
            if (savingsGroup) savingsGroup.style.display = 'block';
            if (invoiceGroup) invoiceGroup.style.display = 'none';
            if (categoryGroup) categoryGroup.style.display = 'none';
            await this.loadGoalOptions();
            document.getElementById('txSavingsGoal').value = tx.savingsGoalId || '';
        } else {
            if (savingsGroup) savingsGroup.style.display = 'none';
            if (invoiceGroup) invoiceGroup.style.display = 'block';
            if (categoryGroup) categoryGroup.style.display = 'block';
            await this.loadCategoryOptions(tx.type);
            document.getElementById('txCategory').value = tx.categoryId || '';
        }

        App.openModal('modalTransaction');
    },

    // Save transaction
    async save(event) {
        event.preventDefault();

        const amount = parseFloat(document.getElementById('txAmount').value);
        let type = document.getElementById('txType').value;
        const categoryId = parseInt(document.getElementById('txCategory').value) || null;
        const savingsGoalId = parseInt(document.getElementById('txSavingsGoal').value) || null;
        const description = document.getElementById('txDescription').value.trim();
        const date = document.getElementById('txDate').value;
        const notes = document.getElementById('txNotes').value.trim();
        const isRecurring = document.getElementById('txRecurring').checked;

        // Validation
        if (!amount || amount <= 0) {
            App.showToast('Please enter a valid amount', 'error');
            return;
        }
        if (!date) {
            App.showToast('Please select a date', 'error');
            return;
        }
        if ((type === 'savings' || type === 'savings-withdrawal') && !savingsGoalId) {
            App.showToast('Please select a savings goal', 'error');
            return;
        }
        if (type !== 'savings' && type !== 'savings-withdrawal' && !categoryId) {
            App.showToast('Please select a category', 'error');
            return;
        }

        const isSavingsType = type === 'savings' || type === 'savings-withdrawal';

        const data = {
            amount,
            type,
            categoryId: isSavingsType ? null : categoryId,
            savingsGoalId: isSavingsType ? savingsGoalId : null,
            description,
            date,
            notes,
            isRecurring,
            createdAt: new Date().toISOString()
        };

        try {
            if (this.editingId) {
                await DB.update('transactions', { ...data, id: this.editingId });
                App.showToast('Transaction updated! ✅');
            } else {
                await DB.add('transactions', data);
                const emoji = type === 'income' ? '💰' : type === 'savings' ? '🎯' : type === 'savings-withdrawal' ? '💸' : '💸';
                App.showToast(`Transaction added! ${emoji}`);
            }

            App.closeModal('modalTransaction');
            this.refreshCurrentPage();
        } catch (error) {
            App.showToast('Error saving transaction', 'error');
            console.error(error);
        }
    },

    // Delete transaction
    async delete() {
        if (!this.editingId) return;

        if (!confirm('Delete this transaction?')) return;

        try {
            await DB.delete('transactions', this.editingId);
            App.showToast('Transaction deleted 🗑️');
            App.closeModal('modalTransaction');
            this.refreshCurrentPage();
        } catch (error) {
            App.showToast('Error deleting transaction', 'error');
            console.error(error);
        }
    },

    // Refresh whatever page is active
    refreshCurrentPage() {
        const currentPage = document.querySelector('.page.active')?.id;
        if (currentPage === 'dashboardPage') Dashboard.load();
        else if (currentPage === 'transactionsPage') this.load();
        else if (currentPage === 'savingsPage') Savings.load();
    }
};
// ============================================
// DASHBOARD MODULE
// ============================================

const Dashboard = {

    async load() {
        const transactions = await DB.getAll('transactions');
        const categories = await DB.getAll('categories');
        const goals = await DB.getAll('savingsGoals');

        // Current month filter
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const monthTransactions = transactions.filter(t => {
            const d = new Date(t.date);
            return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        // Monthly totals
        const monthIncome = monthTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthExpenses = monthTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

         const monthSavings = monthTransactions
            .filter(t => t.type === 'savings')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthWithdrawals = monthTransactions
            .filter(t => t.type === 'savings-withdrawal')
            .reduce((sum, t) => sum + t.amount, 0);

        // TOTAL balance = ALL transactions ever

        const totalIncome = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalExpenses = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalSavings = transactions
            .filter(t => t.type === 'savings')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalWithdrawals = transactions
            .filter(t => t.type === 'savings-withdrawal')
            .reduce((sum, t) => sum + t.amount, 0);

        const availableBalance = totalIncome - totalExpenses - totalSavings + totalWithdrawals;

        // Update dashboard cards
        document.getElementById('dashMonth').textContent = App.getCurrentMonthLabel();
        document.getElementById('dashAvailableBalance').textContent = DB.formatCurrency(availableBalance);
        document.getElementById('dashTotalIncome').textContent = DB.formatCurrency(monthIncome);
        document.getElementById('dashTotalExpenses').textContent = DB.formatCurrency(monthExpenses);
        document.getElementById('dashTotalSavings').textContent = DB.formatCurrency(monthSavings - monthWithdrawals);

        // Color the balance
        const balanceEl = document.getElementById('dashAvailableBalance');
        if (balanceEl) {
            balanceEl.style.color = availableBalance >= 0 ? '#FFFFFF' : 'var(--danger)';
        }

        // Render expense breakdown (current month)
        this.renderExpenseBreakdown(monthTransactions, categories);

        // Render recent transactions (all time, with goals)
        this.renderRecentTransactions(transactions, categories, goals);
    },

    // Expense breakdown by category
    renderExpenseBreakdown(monthTransactions, categories) {
        const container = document.getElementById('expenseBreakdown');
        if (!container) return;

        const expenses = monthTransactions.filter(t => t.type === 'expense');
        
        if (expenses.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <p>No expenses this month yet</p>
                </div>`;
            return;
        }

        // Group by category
        const byCategory = {};
        expenses.forEach(t => {
            const catId = t.categoryId || 'uncategorized';
            if (!byCategory[catId]) byCategory[catId] = 0;
            byCategory[catId] += t.amount;
        });

        const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

        // Sort by amount descending
        const sorted = Object.entries(byCategory)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6);

        let html = '<div class="breakdown-list">';
        
        for (const [catId, amount] of sorted) {
            const cat = categories.find(c => c.id === parseInt(catId)) || {
                icon: '📦', name: 'Uncategorized', color: '#7F8C8D'
            };
            const percentage = ((amount / totalExpenses) * 100).toFixed(1);

            html += `
                <div class="breakdown-item">
                    <div class="breakdown-header">
                        <div class="breakdown-left">
                            <span class="breakdown-icon">${cat.icon}</span>
                            <span class="breakdown-name">${cat.name}</span>
                        </div>
                        <div class="breakdown-right">
                            <span class="breakdown-amount">${DB.formatCurrency(amount)}</span>
                            <span class="breakdown-percent">${percentage}%</span>
                        </div>
                    </div>
                    <div class="breakdown-bar">
                        <div class="breakdown-bar-fill" style="width: ${percentage}%; background: ${cat.color}"></div>
                    </div>
                </div>
            `;
        }

        html += '</div>';
        container.innerHTML = html;
    },

    // Recent transactions — handles both categories AND savings goals
    renderRecentTransactions(transactions, categories, goals) {
        const container = document.getElementById('recentTransactions');
        if (!container) return;

        const recent = [...transactions]
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 5);

        if (recent.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <p>No transactions yet. Tap + to start!</p>
                </div>`;
            return;
        }

        container.innerHTML = recent.map(t => {
            let icon, name, color;

            if (t.type === 'savings') {
                // Look up the savings goal
                const goal = goals.find(g => g.id === t.savingsGoalId);
                icon = goal ? goal.icon : '🎯';
                name = goal ? goal.name : 'Savings';
                color = goal ? goal.color : '#6C2DC7';
            } else {
                // Look up the category
                const cat = categories.find(c => c.id === t.categoryId) || {
                    icon: '📦', name: 'Uncategorized', color: '#7F8C8D'
                };
                icon = cat.icon;
                name = cat.name;
                color = cat.color;
            }

            const sign = t.type === 'income' ? '+' : '-';
            const amountClass = t.type === 'income' ? 'positive' : 'negative';
            const dateStr = new Date(t.date).toLocaleDateString('en-GB', { 
                day: 'numeric', month: 'short' 
            });

            // Show type badge for savings
            const typeBadge = t.type === 'savings' ? '🎯 ' : '';

            return `
                <div class="transaction-card" onclick="Transactions.showEdit(${t.id})">
                    <div class="transaction-left">
                        <div class="transaction-icon" style="background: ${color}20; color: ${color}">
                            ${icon}
                        </div>
                        <div class="transaction-info">
                            <span class="transaction-name">${t.description || name}</span>
                            <span class="transaction-category">${dateStr} · ${typeBadge}${name}</span>
                        </div>
                    </div>
                    <div class="transaction-right">
                        <span class="transaction-amount ${amountClass}">
                            ${sign}${DB.formatCurrency(Math.abs(t.amount))}
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }
};
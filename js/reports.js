// ============================================
// REPORTS MODULE (Basic - Phase 2)
// ============================================

const Reports = {
    
    async load() {
        const transactions = await DB.getAll('transactions');
        const categories = await DB.getAll('categories');
        
        const container = document.getElementById('reportsContent');
        if (!container) return;

        if (transactions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">📊</span>
                    <p>No data to report yet</p>
                    <p class="empty-state-sub">Add some transactions first</p>
                </div>`;
            return;
        }

        // Monthly summary
        const now = new Date();
        const months = [];
        
        for (let i = 0; i < 6; i++) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthTxs = transactions.filter(t => {
                const td = new Date(t.date);
                return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
            });

            const income = monthTxs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
            const expenses = monthTxs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
            const savings = monthTxs.filter(t => t.type === 'savings').reduce((s, t) => s + t.amount, 0);

            months.push({
                label: d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
                income,
                expenses,
                savings,
                net: income - expenses - savings
            });
        }

        const maxAmount = Math.max(...months.map(m => Math.max(m.income, m.expenses)));

        container.innerHTML = `
            <div class="report-section">
                <h3 class="report-title">📈 Monthly Overview (Last 6 Months)</h3>
                <div class="monthly-chart">
                    ${months.reverse().map(m => `
                        <div class="chart-month">
                            <div class="chart-bars">
                                <div class="chart-bar income" style="height: ${maxAmount > 0 ? (m.income / maxAmount) * 100 : 0}%" 
                                     title="Income: ${DB.formatCurrency(m.income)}"></div>
                                <div class="chart-bar expense" style="height: ${maxAmount > 0 ? (m.expenses / maxAmount) * 100 : 0}%"
                                     title="Expenses: ${DB.formatCurrency(m.expenses)}"></div>
                            </div>
                            <span class="chart-label">${m.label}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="report-section">
                <h3 class="report-title">📋 Monthly Breakdown</h3>
                <div class="report-table">
                    <div class="report-row header">
                        <span>Month</span>
                        <span>Income</span>
                        <span>Expenses</span>
                        <span>Net</span>
                    </div>
                    ${months.map(m => `
                        <div class="report-row">
                            <span>${m.label}</span>
                            <span class="positive">${DB.formatCurrency(m.income)}</span>
                            <span class="negative">${DB.formatCurrency(m.expenses)}</span>
                            <span class="${m.net >= 0 ? 'positive' : 'negative'}">${DB.formatCurrency(m.net)}</span>
                        </div>
                    `).join('')}
                </div>
            </div>

            <div class="report-actions">
                <button class="btn btn-secondary" onclick="Reports.exportCSV()">
                    📥 Export CSV
                </button>
            </div>
        `;
    },

    async exportCSV() {
        const transactions = await DB.getAll('transactions');
        const categories = await DB.getAll('categories');

        if (transactions.length === 0) {
            App.showToast('No transactions to export', 'error');
            return;
        }

        let csv = 'Date,Type,Category,Description,Amount,Notes,Recurring\n';

        transactions
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(t => {
                const cat = categories.find(c => c.id === t.categoryId) || { name: 'Uncategorized' };
                csv += `${t.date},${t.type},${cat.name},"${t.description || ''}",${t.amount},"${t.notes || ''}",${t.isRecurring ? 'Yes' : 'No'}\n`;
            });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mghic-finance-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        App.showToast('CSV exported! 📥');
    },

    exportPDF() {
        App.showToast('PDF export coming in Phase 3! 📄');
    }
};
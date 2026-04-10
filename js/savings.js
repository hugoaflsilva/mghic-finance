// ============================================
// SAVINGS MODULE
// ============================================

const Savings = {
    selectedIcon: '🎯',
    selectedColor: '#6C2DC7',
    editingId: null,

    async load() {
        const goals = await DB.getAll('savingsGoals');
        const transactions = await DB.getAll('transactions');
        
        const list = document.getElementById('savingsList');
        if (!list) return;

        if (goals.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">🎯</span>
                    <p>No savings goals yet</p>
                    <button class="btn btn-primary" onclick="Savings.showAddGoal()">
                        Create a Goal
                    </button>
                </div>`;
            return;
        }

        // Calculate saved amount for each goal
        list.innerHTML = goals.map(goal => {
            // Deposits = savings type, Withdrawals = savings-withdrawal type
            const deposits = transactions
                .filter(t => t.type === 'savings' && t.savingsGoalId === goal.id)
                .reduce((sum, t) => sum + t.amount, 0);
            
            const withdrawals = transactions
                .filter(t => t.type === 'savings-withdrawal' && t.savingsGoalId === goal.id)
                .reduce((sum, t) => sum + t.amount, 0);

            const saved = deposits - withdrawals;
            
            const percentage = goal.targetAmount > 0 
                ? Math.min((saved / goal.targetAmount) * 100, 100) 
                : 0;

            return `
                <div class="savings-card">
                    <div class="savings-header" onclick="Savings.showEditGoal(${goal.id})">
                        <div class="savings-icon" style="background: ${goal.color}20; color: ${goal.color}">
                            ${goal.icon}
                        </div>
                        <div class="savings-info">
                            <span class="savings-name">${goal.name}</span>
                            <span class="savings-target">Target: ${DB.formatCurrency(goal.targetAmount)}</span>
                        </div>
                        <div class="savings-amount">
                            <span class="savings-saved">${DB.formatCurrency(saved)}</span>
                        </div>
                    </div>
                    <div class="savings-progress">
                        <div class="savings-progress-bar">
                            <div class="savings-progress-fill" style="width: ${Math.max(percentage, 0)}%; background: ${goal.color}"></div>
                        </div>
                        <span class="savings-percentage">${percentage.toFixed(1)}%</span>
                    </div>
                    ${goal.deadline ? `<span class="savings-deadline">Deadline: ${new Date(goal.deadline).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>` : ''}
                    <div class="savings-actions">
                        <button class="btn btn-savings-deposit" onclick="Savings.showDeposit(${goal.id}, '${goal.icon}', '${goal.name}')">
                            ➕ Deposit
                        </button>
                        <button class="btn btn-savings-withdraw" onclick="Savings.showWithdraw(${goal.id}, '${goal.icon}', '${goal.name}', ${saved})">
                            ➖ Withdraw
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    },

    // Quick deposit to a goal
    showDeposit(goalId, icon, name) {
        Transactions.editingId = null;
        Transactions.selectedType = 'savings';

        document.getElementById('modalTransactionTitle').textContent = `Deposit to ${name}`;
        document.getElementById('txAmount').value = '';
        document.getElementById('txDescription').value = '';
        document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('txNotes').value = '';
        document.getElementById('txRecurring').checked = false;
        document.getElementById('txType').value = 'savings';
        document.getElementById('deleteTransactionBtn').style.display = 'none';
        document.getElementById('invoicePreview').innerHTML = '';

        // Set type buttons
        document.querySelectorAll('#modalTransaction .type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === 'savings');
        });

        // Show savings goal, hide category
        const savingsGroup = document.getElementById('savingsGoalGroup');
        const invoiceGroup = document.getElementById('invoiceGroup');
        const categoryGroup = document.getElementById('txCategory')?.closest('.form-group');
        if (savingsGroup) savingsGroup.style.display = 'block';
        if (invoiceGroup) invoiceGroup.style.display = 'none';
        if (categoryGroup) categoryGroup.style.display = 'none';

        // Load goals and pre-select
        Transactions.loadGoalOptions().then(() => {
            document.getElementById('txSavingsGoal').value = goalId;
        });

        App.openModal('modalTransaction');
    },

    // Withdraw from a goal
    showWithdraw(goalId, icon, name, currentSaved) {
        Transactions.editingId = null;
        Transactions.selectedType = 'savings-withdrawal';

        document.getElementById('modalTransactionTitle').textContent = `Withdraw from ${name}`;
        document.getElementById('txAmount').value = '';
        document.getElementById('txDescription').value = '';
        document.getElementById('txDate').value = new Date().toISOString().split('T')[0];
        document.getElementById('txNotes').value = '';
        document.getElementById('txRecurring').checked = false;
        document.getElementById('txType').value = 'savings-withdrawal';
        document.getElementById('deleteTransactionBtn').style.display = 'none';
        document.getElementById('invoicePreview').innerHTML = '';

        // Hide type selector for withdrawals (it's always savings-withdrawal)
        document.querySelectorAll('#modalTransaction .type-btn').forEach(b => {
            b.classList.remove('active');
        });

        // Show savings goal, hide category
        const savingsGroup = document.getElementById('savingsGoalGroup');
        const invoiceGroup = document.getElementById('invoiceGroup');
        const categoryGroup = document.getElementById('txCategory')?.closest('.form-group');
        if (savingsGroup) savingsGroup.style.display = 'block';
        if (invoiceGroup) invoiceGroup.style.display = 'none';
        if (categoryGroup) categoryGroup.style.display = 'none';

        // Load goals and pre-select
        Transactions.loadGoalOptions().then(() => {
            document.getElementById('txSavingsGoal').value = goalId;
        });

        App.openModal('modalTransaction');
    },

    showAddGoal() {
        this.editingId = null;
        this.selectedIcon = '🎯';
        this.selectedColor = '#6C2DC7';

        document.getElementById('modalSavingsTitle').textContent = 'New Savings Goal';
        document.getElementById('goalName').value = '';
        document.getElementById('goalAmount').value = '';
        document.getElementById('goalDeadline').value = '';
        document.getElementById('goalExistingAmount').value = '';
        document.getElementById('existingAmountGroup').style.display = 'none';
        document.getElementById('deleteGoalBtn').style.display = 'none';

        // Reset toggle
        const toggle = document.getElementById('goalIsExisting');
        if (toggle) toggle.checked = false;

        this.renderIconPicker();
        this.renderColorPicker();
        App.openModal('modalSavingsGoal');
    },

    async showEditGoal(id) {
        const goal = await DB.get('savingsGoals', id);
        if (!goal) return;

        this.editingId = id;
        this.selectedIcon = goal.icon;
        this.selectedColor = goal.color;

        document.getElementById('modalSavingsTitle').textContent = 'Edit Goal';
        document.getElementById('goalName').value = goal.name;
        document.getElementById('goalAmount').value = goal.targetAmount;
        document.getElementById('goalDeadline').value = goal.deadline || '';
        document.getElementById('goalExistingAmount').value = '';
        document.getElementById('existingAmountGroup').style.display = 'none';
        document.getElementById('deleteGoalBtn').style.display = 'block';

        // Hide existing toggle when editing
        const toggle = document.getElementById('goalIsExisting');
        if (toggle) {
            toggle.checked = false;
            toggle.closest('.form-group').style.display = 'none';
        }

        this.renderIconPicker();
        this.renderColorPicker();
        App.openModal('modalSavingsGoal');
    },

    renderIconPicker() {
        const icons = ['🎯','🏠','✈️','🚗','💍','🎓','💻','📱','🏖️','💊','👶','🎮','📷','🏋️','🎵','🐶','🏥','👗','🎄','💎'];
        const container = document.getElementById('goalIconPicker');
        if (!container) return;

        container.innerHTML = icons.map(icon => `
            <button type="button" class="icon-option ${icon === this.selectedIcon ? 'selected' : ''}"
                    onclick="Savings.setIcon('${icon}', this)">
                ${icon}
            </button>
        `).join('');
    },

    renderColorPicker() {
        const colors = [
            '#6C2DC7','#2ECC71','#3498DB','#9B59B6','#F39C12',
            '#E74C3C','#1ABC9C','#E67E22','#FF6B9D','#8E44AD'
        ];
        const container = document.getElementById('goalColorPicker');
        if (!container) return;

        container.innerHTML = colors.map(color => `
            <button type="button" class="color-option ${color === this.selectedColor ? 'selected' : ''}"
                    style="background: ${color}"
                    onclick="Savings.setColor('${color}', this)">
                ${color === this.selectedColor ? '✓' : ''}
            </button>
        `).join('');
    },

    setIcon(icon, btn) {
        this.selectedIcon = icon;
        document.querySelectorAll('#goalIconPicker .icon-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    },

    setColor(color, btn) {
        this.selectedColor = color;
        document.querySelectorAll('#goalColorPicker .color-option').forEach(b => {
            b.classList.remove('selected');
            b.textContent = '';
        });
        btn.classList.add('selected');
        btn.textContent = '✓';
    },

    async saveGoal(event) {
        event.preventDefault();

        const name = document.getElementById('goalName').value.trim();
        const targetAmount = parseFloat(document.getElementById('goalAmount').value);
        const deadline = document.getElementById('goalDeadline').value || null;
        const isExisting = document.getElementById('goalIsExisting')?.checked || false;
        const existingAmount = parseFloat(document.getElementById('goalExistingAmount')?.value) || 0;

        if (!name) {
            App.showToast('Please enter a goal name', 'error');
            return;
        }
        if (!targetAmount || targetAmount <= 0) {
            App.showToast('Please enter a valid target amount', 'error');
            return;
        }
        if (isExisting && existingAmount > targetAmount) {
            App.showToast('Existing amount cannot exceed target', 'error');
            return;
        }

        const data = {
            name,
            targetAmount,
            deadline,
            icon: this.selectedIcon,
            color: this.selectedColor,
            createdAt: new Date().toISOString()
        };

        try {
            let savedGoal;

            if (this.editingId) {
                await DB.update('savingsGoals', { ...data, id: this.editingId });
                savedGoal = { ...data, id: this.editingId };
                App.showToast('Goal updated! ✅');
            } else {
                savedGoal = await DB.add('savingsGoals', data);
                App.showToast('Goal created! 🎯');

                // If existing goal with money already saved, create opening transaction
                if (isExisting && existingAmount > 0) {
                    const today = new Date().toISOString().split('T')[0];
                    await DB.add('transactions', {
                        amount: existingAmount,
                        type: 'savings',
                        categoryId: null,
                        savingsGoalId: savedGoal.id,
                        description: `🎯 Existing balance — ${name}`,
                        date: today,
                        notes: 'Pre-existing savings set during goal creation',
                        isRecurring: false,
                        isOpeningBalance: true,
                        createdAt: new Date().toISOString()
                    });

                    App.showToast(`Goal created with ${DB.formatCurrency(existingAmount)} already saved! 🎯`);
                }
            }

            App.closeModal('modalSavingsGoal');
            
            // Show existing toggle again for next time
            const toggle = document.getElementById('goalIsExisting');
            if (toggle) toggle.closest('.form-group').style.display = 'block';

            this.load();
        } catch (error) {
            App.showToast('Error saving goal', 'error');
            console.error(error);
        }
    },

    async deleteGoal() {
        if (!this.editingId) return;
        if (!confirm('Delete this savings goal? Savings transactions linked to it will be kept.')) return;

        try {
            await DB.delete('savingsGoals', this.editingId);
            App.showToast('Goal deleted 🗑️');
            App.closeModal('modalSavingsGoal');
            this.load();
        } catch (error) {
            App.showToast('Error deleting goal', 'error');
            console.error(error);
        }
    },

    async loadGoalOptions() {
        const goals = await DB.getAll('savingsGoals');
        const select = document.getElementById('txSavingsGoal');
        if (!select) return;

        select.innerHTML = '<option value="">Select goal...</option>' +
            goals.map(g => `<option value="${g.id}">${g.icon} ${g.name}</option>`).join('');
    }
};
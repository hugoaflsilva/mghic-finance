// ============================================
// CATEGORIES MODULE
// ============================================

const Categories = {
    selectedType: 'expense',
    selectedIcon: '🛒',
    selectedColor: '#6C2DC7',
    editingId: null,

    // Default categories pre-loaded on first use
    defaults: [
        // Expenses
        { name: 'Groceries', type: 'expense', icon: '🛒', color: '#2ECC71' },
        { name: 'Transport', type: 'expense', icon: '🚗', color: '#3498DB' },
        { name: 'Housing', type: 'expense', icon: '🏠', color: '#9B59B6' },
        { name: 'Utilities', type: 'expense', icon: '💡', color: '#F39C12' },
        { name: 'Food & Dining', type: 'expense', icon: '🍽️', color: '#E74C3C' },
        { name: 'Health', type: 'expense', icon: '🏥', color: '#1ABC9C' },
        { name: 'Entertainment', type: 'expense', icon: '🎬', color: '#E67E22' },
        { name: 'Shopping', type: 'expense', icon: '🛍️', color: '#FF6B9D' },
        { name: 'Education', type: 'expense', icon: '📚', color: '#8E44AD' },
        { name: 'Insurance', type: 'expense', icon: '🛡️', color: '#2C3E50' },
        { name: 'Subscriptions', type: 'expense', icon: '📱', color: '#16A085' },
        { name: 'Personal Care', type: 'expense', icon: '💅', color: '#D35400' },
        { name: 'Pets', type: 'expense', icon: '🐾', color: '#27AE60' },
        { name: 'Gifts', type: 'expense', icon: '🎁', color: '#C0392B' },
        { name: 'Other Expense', type: 'expense', icon: '📦', color: '#7F8C8D' },
        // Income
        { name: 'Salary', type: 'income', icon: '💰', color: '#2ECC71' },
        { name: 'Freelance', type: 'income', icon: '💻', color: '#3498DB' },
        { name: 'Investments', type: 'income', icon: '📈', color: '#9B59B6' },
        { name: 'Rental Income', type: 'income', icon: '🏘️', color: '#F39C12' },
        { name: 'Side Business', type: 'income', icon: '🏪', color: '#E67E22' },
        { name: 'Refunds', type: 'income', icon: '🔄', color: '#1ABC9C' },
        { name: 'Other Income', type: 'income', icon: '💵', color: '#7F8C8D' }
    ],

    // Initialize default categories if first time
    async init() {
        const existing = await DB.getAll('categories');
        if (existing.length === 0) {
            for (const cat of this.defaults) {
                await DB.add('categories', {
                    ...cat,
                    isDefault: true,
                    createdAt: new Date().toISOString()
                });
            }
        }
    },

    // Load and render categories page
    async load() {
        await this.init();
        const categories = await DB.getAll('categories');
        const filtered = categories.filter(c => c.type === this.selectedType);
        
        const list = document.getElementById('categoriesList');
        if (!list) return;

        if (filtered.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <span class="empty-state-icon">📂</span>
                    <p>No ${this.selectedType} categories yet</p>
                    <button class="btn btn-primary" onclick="Categories.showAdd()">
                        Add Category
                    </button>
                </div>`;
            return;
        }

        list.innerHTML = filtered.map(cat => `
            <div class="category-card" onclick="Categories.showEdit(${cat.id})">
                <div class="category-card-left">
                    <div class="category-icon" style="background: ${cat.color}20; color: ${cat.color}">
                        ${cat.icon}
                    </div>
                    <div class="category-info">
                        <span class="category-name">${cat.name}</span>
                        <span class="category-type">${cat.type}</span>
                    </div>
                </div>
                <div class="category-card-right">
                    <span class="category-arrow">›</span>
                </div>
            </div>
        `).join('');
    },

    // Filter categories by type
    filter(type, btn) {
        this.selectedType = type;
        document.querySelectorAll('#categoriesPage .filter-btn').forEach(b => {
            b.classList.toggle('active', b === btn);
        });
        this.load();
    },

    // Show add category modal
    showAdd() {
        this.editingId = null;
        this.selectedIcon = '🛒';
        this.selectedColor = '#6C2DC7';
        
        document.getElementById('modalCategoryTitle').textContent = 'New Category';
        document.getElementById('catName').value = '';
        document.getElementById('catType').value = this.selectedType;
        document.getElementById('deleteCategoryBtn').style.display = 'none';
        
        // Set type buttons
        document.querySelectorAll('#modalCategory .type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === this.selectedType);
        });

        this.renderIconPicker();
        this.renderColorPicker();
        App.openModal('modalCategory');
    },

    // Show edit category modal
    async showEdit(id) {
        const cat = await DB.get('categories', id);
        if (!cat) return;

        this.editingId = id;
        this.selectedIcon = cat.icon;
        this.selectedColor = cat.color;

        document.getElementById('modalCategoryTitle').textContent = 'Edit Category';
        document.getElementById('catName').value = cat.name;
        document.getElementById('catType').value = cat.type;
        document.getElementById('deleteCategoryBtn').style.display = 'block';

        document.querySelectorAll('#modalCategory .type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === cat.type);
        });

        this.renderIconPicker();
        this.renderColorPicker();
        App.openModal('modalCategory');
    },

    // Set category type
    setType(type, btn) {
        document.getElementById('catType').value = type;
        document.querySelectorAll('#modalCategory .type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === type);
        });
    },

    // Render icon picker
    renderIconPicker() {
        const icons = [
            '🛒','🚗','🏠','💡','🍽️','🏥','🎬','🛍️','📚','🛡️',
            '📱','💅','🐾','🎁','📦','💰','💻','📈','🏘️','🏪',
            '🔄','💵','✈️','⛽','🏋️','🎮','🎵','☕','🍕','🎂',
            '👶','💊','🔧','📝','🏦','💳','🎓','🚌','🏖️','❤️'
        ];

        const container = document.getElementById('iconPicker');
        if (!container) return;

        container.innerHTML = icons.map(icon => `
            <button type="button" class="icon-option ${icon === this.selectedIcon ? 'selected' : ''}" 
                    onclick="Categories.setIcon('${icon}', this)">
                ${icon}
            </button>
        `).join('');
    },

    // Render color picker
    renderColorPicker() {
        const colors = [
            '#6C2DC7','#2ECC71','#3498DB','#9B59B6','#F39C12',
            '#E74C3C','#1ABC9C','#E67E22','#FF6B9D','#8E44AD',
            '#2C3E50','#16A085','#D35400','#27AE60','#C0392B',
            '#7F8C8D','#34495E','#00A3E0','#FF4757','#2ED573'
        ];

        const container = document.getElementById('colorPicker');
        if (!container) return;

        container.innerHTML = colors.map(color => `
            <button type="button" class="color-option ${color === this.selectedColor ? 'selected' : ''}"
                    style="background: ${color}"
                    onclick="Categories.setColor('${color}', this)">
                ${color === this.selectedColor ? '✓' : ''}
            </button>
        `).join('');
    },

    // Set selected icon
    setIcon(icon, btn) {
        this.selectedIcon = icon;
        document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
    },

    // Set selected color
    setColor(color, btn) {
        this.selectedColor = color;
        document.querySelectorAll('.color-option').forEach(b => {
            b.classList.remove('selected');
            b.textContent = '';
        });
        btn.classList.add('selected');
        btn.textContent = '✓';
    },

    // Save category
    async save(event) {
        event.preventDefault();

        const name = document.getElementById('catName').value.trim();
        const type = document.getElementById('catType').value;

        if (!name) {
            App.showToast('Please enter a category name', 'error');
            return;
        }

        const data = {
            name,
            type,
            icon: this.selectedIcon,
            color: this.selectedColor,
            isDefault: false,
            createdAt: new Date().toISOString()
        };

        try {
            if (this.editingId) {
                await DB.update('categories', { ...data, id: this.editingId });
                App.showToast('Category updated! ✅');
            } else {
                await DB.add('categories', data);
                App.showToast('Category created! 🎉');
            }

            App.closeModal('modalCategory');
            this.load();
        } catch (error) {
            App.showToast('Error saving category', 'error');
            console.error(error);
        }
    },

    // Delete category
    async delete() {
        if (!this.editingId) return;

        const cat = await DB.get('categories', this.editingId);
        
        if (!confirm(`Delete "${cat.name}"? Any transactions using this category will keep their data but show as uncategorized.`)) {
            return;
        }

        try {
            await DB.delete('categories', this.editingId);
            App.showToast('Category deleted 🗑️');
            App.closeModal('modalCategory');
            this.load();
        } catch (error) {
            App.showToast('Error deleting category', 'error');
            console.error(error);
        }
    }
};
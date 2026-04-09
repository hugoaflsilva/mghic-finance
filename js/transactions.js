const Transactions = {
    async load() {},
    filter(type, btn) {},
    async loadCategoryOptions(type) {},
    setType(type, btn) {
        document.getElementById('txType').value = type;
        document.querySelectorAll('#modalTransaction .type-btn').forEach(b => {
            b.classList.toggle('active', b.dataset.type === type);
        });
        document.getElementById('savingsGoalGroup').style.display = type === 'savings' ? 'block' : 'none';
        document.getElementById('invoiceGroup').style.display = type === 'savings' ? 'none' : 'block';
    },
    save(event) { event.preventDefault(); }
};
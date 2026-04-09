const Dashboard = {
    async load() {
        document.getElementById('dashMonth').textContent = App.getCurrentMonthLabel();
        document.getElementById('dashAvailableBalance').textContent = DB.formatCurrency(0);
        document.getElementById('dashTotalIncome').textContent = DB.formatCurrency(0);
        document.getElementById('dashTotalExpenses').textContent = DB.formatCurrency(0);
        document.getElementById('dashTotalSavings').textContent = DB.formatCurrency(0);
    }
};
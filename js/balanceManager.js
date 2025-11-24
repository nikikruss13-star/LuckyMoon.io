class BalanceManager {
    constructor() {
        this.balanceKey = 'casinoBalance';
        this.initBalance();
    }

    initBalance() {
        if (!localStorage.getItem(this.balanceKey)) {
            localStorage.setItem(this.balanceKey, '1000');
        }
    }

    getBalance() {
        return parseInt(localStorage.getItem(this.balanceKey));
    }

    setBalance(amount) {
        localStorage.setItem(this.balanceKey, amount.toString());
        this.updateAllBalances();
        this.notifyOtherPages();
    }

    addToBalance(amount) {
        const newBalance = this.getBalance() + amount;
        this.setBalance(newBalance);
        return newBalance;
    }

    subtractFromBalance(amount) {
        const newBalance = this.getBalance() - amount;
        this.setBalance(newBalance);
        return newBalance;
    }

    updateAllBalances() {
        // Обновляем все элементы баланса на текущей странице
        const balanceElements = document.querySelectorAll('#balance');
        const currentBalance = this.getBalance();
        
        balanceElements.forEach(element => {
            if (element) {
                element.textContent = currentBalance;
            }
        });
    }

    notifyOtherPages() {
        // Отправляем событие для обновления других вкладок
        localStorage.setItem('balance_update', Date.now().toString());
    }

    listenForChanges() {
        // Слушаем изменения из других вкладок
        window.addEventListener('storage', (e) => {
            if (e.key === this.balanceKey || e.key === 'balance_update') {
                this.updateAllBalances();
            }
        });
    }
}

// Создаем глобальный экземпляр
const balanceManager = new BalanceManager();
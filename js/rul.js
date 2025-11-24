class SlotMachine {
    constructor() {
        this.symbols = [
            {symbol: '🍒', weight: 45},
            {symbol: '🍋', weight: 30},
            {symbol: '🍊', weight: 25},
            {symbol: '🍇', weight: 20},
            {symbol: '🔔', weight: 15},
            {symbol: '💎', weight: 10},
            {symbol: '7', weight: 5}
        ];
        
        this.reels = [
            document.getElementById('reel1'),
            document.getElementById('reel2'),
            document.getElementById('reel3')
        ];
        
        this.initializeReels();
        
        // Слушаем изменения баланса из других вкладок
        balanceManager.listenForChanges();
    }

    initializeReels() {
        // Создаем барабаны с символами
        this.reels.forEach(reel => {
            // Очищаем reel
            reel.innerHTML = '';
            reel.style.transform = 'translateY(0)';
            
            // Создаем контейнер для символов
            const reelContainer = document.createElement('div');
            reelContainer.className = 'slot-reel-container';
            reelContainer.style.position = 'absolute';
            reelContainer.style.width = '100%';
            reelContainer.style.transition = 'transform 2s cubic-bezier(0.21, 0.53, 0.29, 0.99)';
            
            // Добавляем символы (9 копии для бесконечного эффекта)
            for (let i = 0; i < 9; i++) {
                this.symbols.forEach(symbolObj => {
                    const symbolElement = document.createElement('div');
                    symbolElement.className = 'slot-symbol';
                    symbolElement.textContent = symbolObj.symbol;
                    symbolElement.style.width = '100%';
                    symbolElement.style.height = '160px';
                    symbolElement.style.display = 'flex';
                    symbolElement.style.alignItems = 'center';
                    symbolElement.style.justifyContent = 'center';
                    symbolElement.style.fontSize = '60px';
                    symbolElement.style.fontFamily = 'Cambria, "Hoefler Text", "Liberation Serif", Times, "Times New Roman", "serif"';
                    symbolElement.style.borderBottom = '2px solid #ffd700';
                    reelContainer.appendChild(symbolElement);
                });
            }
            
            reel.appendChild(reelContainer);
            reel.style.overflow = 'hidden';
            reel.style.position = 'relative';
        });
    }

    getWeightedRandomElement() {
        const totalWeight = this.symbols.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (const item of this.symbols) {
            random -= item.weight;
            if (random <= 0) {
                return item.symbol;
            }
        }
        
        return this.symbols[this.symbols.length - 1].symbol;
    }

    spinSlot() {
        const spinSound = document.getElementById('spinSound');
        const resultMessage = document.getElementById('resultMessage');
        const betInput = document.querySelector('.input');
        const spinBtn = document.getElementById('spinBtn');
        
        const currentBalance = balanceManager.getBalance();
        let bet = parseInt(betInput.value);
        
        // Проверка минимальной ставки
        const minBet = 1;
        if (bet < minBet) {
            bet = minBet;
            betInput.value = minBet;
        }
        
        if (bet > currentBalance) {
            resultMessage.textContent = "Недостаточно средств!";
            resultMessage.style.color = "red";
            return;
        }
        
        // Вычитаем ставку
        balanceManager.subtractFromBalance(bet);
        
        // Звук и блокировка кнопки
        spinSound.currentTime = 0;
        spinSound.play();
        spinBtn.disabled = true;
        resultMessage.textContent = "";
        
        // Генерируем финальные символы
        const finalSymbols = [
            this.getWeightedRandomElement(),
            this.getWeightedRandomElement(),
            this.getWeightedRandomElement()
        ];
        
        // Анимация вращения для каждого барабана
        this.reels.forEach((reel, index) => {
            this.animateReel(reel, index, finalSymbols[index]);
        });
        
        // Завершение вращения
        setTimeout(() => {
            this.checkWin(finalSymbols, bet, resultMessage);
            spinBtn.disabled = false;
        }, 2500);
    }

    animateReel(reel, index, finalSymbol) {
        const reelContainer = reel.querySelector('.slot-reel-container');
        const symbolHeight = 160;
        
        // Находим индекс финального символа
        const symbolIndex = this.symbols.findIndex(s => s.symbol === finalSymbol);
        const targetPosition = -(symbolIndex * symbolHeight + (11 * symbolHeight));
        
        // Устанавливаем начальную позицию
        reelContainer.style.transition = 'transform 0s';
        reelContainer.style.transform = `translateY(0)`;
        
        // Запускаем анимацию
        setTimeout(() => {
            reelContainer.style.transition = 'transform 2s cubic-bezier(0.21, 0, 0, 0.99)';
            reelContainer.style.transform = `translateY(${targetPosition}px)`;
        }, index * 250);
    }

    checkWin(symbols, bet, resultMessage) {
        let winMultiplier = 0;
        let winMessage = "";
        
        // Проверяем комбинации
        if (symbols[0] === '7' && symbols[1] === '7' && symbols[2] === '7') {
            winMultiplier = 30000;
            winMessage = "ДЖЕКПОТ! 777!";
        } else if (symbols[0] === '💎' && symbols[1] === '💎' && symbols[2] === '💎') {
            winMultiplier = 3000;
            winMessage = "Бриллианты!";
        } else if (symbols[0] === '🔔' && symbols[1] === '🔔' && symbols[2] === '🔔') {
            winMultiplier = 1000;
            winMessage = "Колокольчики!";
        } else if (symbols[0] === '🍇' && symbols[1] === '🍇' && symbols[2] === '🍇') {
            winMultiplier = 400;
            winMessage = "Виноград!";
        } else if (symbols[0] === '🍊' && symbols[1] === '🍊' && symbols[2] === '🍊') {
            winMultiplier = 250;
            winMessage = "Апельсины!";
        } else if (symbols[0] === '🍋' && symbols[1] === '🍋' && symbols[2] === '🍋') {
            winMultiplier = 120;
            winMessage = "Лимоны!";
        } else if (symbols[0] === '🍒' && symbols[1] === '🍒' && symbols[2] === '🍒') {
            winMultiplier = 30;
            winMessage = "Вишни!";
        }
        
        // Обновляем баланс и сообщение
        if (winMultiplier > 0) {
            const winAmount = bet * winMultiplier;
            balanceManager.addToBalance(winAmount);
            resultMessage.textContent = `${winMessage} Вы выиграли ${winAmount}$!`;
            resultMessage.style.color = "yellow";
            
            // Анимация выигрыша
            resultMessage.classList.add('win-animation');
            setTimeout(() => {
                resultMessage.classList.remove('win-animation');
            }, 1500);
        } else {
            resultMessage.textContent = "Повезет в следующий раз!";
            resultMessage.style.color = "white";
        }
    }
}

// Глобальная функция для вызова из HTML
let slotMachine;

function spinSlot() {
    if (!slotMachine) {
        slotMachine = new SlotMachine();
    }
    slotMachine.spinSlot();
}

function updateBetDisplay(value) {
    const minBet = 1;
    const maxBet = 5000;
    
    if (value < minBet) {
        value = minBet;
    }
    if (value > maxBet) {
        value = maxBet;
    }
    
    document.querySelector('.input').value = value;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    slotMachine = new SlotMachine();
    // Обновляем отображение баланса при загрузке
    balanceManager.updateAllBalances();
});
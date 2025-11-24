document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const cardContainer = document.getElementById('card-container');
    const dealBtn = document.getElementById('deal-btn');
    const drawBtn = document.getElementById('draw-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultDiv = document.getElementById('result');
    const pokerBetInput = document.getElementById('pokerBet');
    
    // Переменные игры
    let deck = [];
    let playerHand = [];
    let selectedCards = [];
    let gameState = 'initial'; // initial, dealt, drawn
    
    // Масти и достоинства карт
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    
    // Функция для обновления отображения ставки
    function updateBetDisplay(value) {
        const minBet = parseInt(pokerBetInput.min);
        const maxBet = parseInt(pokerBetInput.max);
        
        if (value < minBet) {
            value = minBet;
        }
        if (value > maxBet) {
            value = maxBet;
        }
        
        pokerBetInput.value = value;
    }
    
    // Получение текущей ставки
    function getCurrentBet() {
        return parseInt(pokerBetInput.value);
    }
    
    // Инициализация игры
    function initGame() {
        // Обновляем отображение баланса
        if (typeof balanceManager !== 'undefined') {
            balanceManager.updateAllBalances();
        }
        
        createDeck();
        updateUI();
        
        // Добавляем обработчик изменения ставки
        pokerBetInput.addEventListener('input', function() {
            updateBetDisplay(this.value);
        });
    }
    
    // Создание колоды
    function createDeck() {
        deck = [];
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }
        shuffleDeck();
    }
    
    // Перемешивание колоды
    function shuffleDeck() {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
    }
    
    // Раздача карт
    function dealCards() {
        const bet = getCurrentBet();
        
        // Проверяем доступность balanceManager
        if (typeof balanceManager === 'undefined') {
            resultDiv.innerHTML = 'Ошибка системы баланса!';
            resultDiv.style.color = 'red';
            return;
        }
        
        const currentBalance = balanceManager.getBalance();
        
        // Проверка баланса
        if (bet > currentBalance) {
            resultDiv.innerHTML = 'Недостаточно средств для ставки!';
            resultDiv.style.color = 'red';
            return;
        }
        
        // Проверка минимальной ставки
        if (bet < 10) {
            resultDiv.innerHTML = 'Минимальная ставка: 10$!';
            resultDiv.style.color = 'red';
            return;
        }
        
        playerHand = [];
        selectedCards = [];
        createDeck(); // Создаем новую колоду для каждой игры
        
        for (let i = 0; i < 5; i++) {
            playerHand.push(deck.pop());
        }
        
        gameState = 'dealt';
        updateUI();
        updateButtons();
        
        // Снимаем ставку с баланса через balanceManager
        balanceManager.subtractFromBalance(bet);
        
        resultDiv.innerHTML = 'Выберите карты для замены и нажмите "Заменить карты"';
        resultDiv.style.color = 'white';
    }
    
    // Замена карт
    function drawCards() {
        const bet = getCurrentBet();
        
        // Заменяем выбранные карты
        for (let i = 0; i < playerHand.length; i++) {
            if (selectedCards.includes(i)) {
                if (deck.length === 0) {
                    createDeck(); // Если колода пуста, создаем новую
                }
                playerHand[i] = deck.pop();
            }
        }
        
        selectedCards = [];
        gameState = 'drawn';
        updateUI();
        updateButtons();
        
        // Определяем комбинацию и начисляем выигрыш
        const combination = evaluateHand(playerHand);
        const winAmount = calculateWin(combination, bet);
        
        if (winAmount > 0) {
            // Начисляем выигрыш через balanceManager
            balanceManager.addToBalance(winAmount);
            resultDiv.innerHTML = `У вас <span style="color: gold">${combination}</span>! Вы выиграли ${winAmount}$!`;
            resultDiv.style.color = 'gold';
        } else {
            resultDiv.innerHTML = `У вас <span style="color: white">${combination}</span>. Попробуйте еще раз!`;
            resultDiv.style.color = 'white';
        }
    }
    
    // Сброс игры
    function resetGame() {
        playerHand = [];
        selectedCards = [];
        gameState = 'initial';
        updateUI();
        updateButtons();
        resultDiv.innerHTML = 'Нажмите "Раздать карты" чтобы начать игру';
        resultDiv.style.color = 'white';
    }
    
    // Обновление интерфейса
    function updateUI() {
        cardContainer.innerHTML = '';
        
        // Если карты есть - отображаем их, иначе показываем рубашки
        if (playerHand.length > 0) {
            playerHand.forEach((card, index) => {
                const cardElement = document.createElement('div');
                cardElement.className = `card ${selectedCards.includes(index) ? 'selected' : ''}`;
                
                // Определяем символ масти
                let suitSymbol;
                let suitColor;
                switch(card.suit) {
                    case 'hearts': 
                        suitSymbol = '♥'; 
                        suitColor = 'red';
                        break;
                    case 'diamonds': 
                        suitSymbol = '♦'; 
                        suitColor = 'red';
                        break;
                    case 'clubs': 
                        suitSymbol = '♣'; 
                        suitColor = 'black';
                        break;
                    case 'spades': 
                        suitSymbol = '♠'; 
                        suitColor = 'black';
                        break;
                }
                
                cardElement.innerHTML = `
                    <div class="card-top" style="color: ${suitColor}">${card.value} ${suitSymbol}</div>
                    <div class="card-center" style="color: ${suitColor}">${suitSymbol}</div>
                    <div class="card-bottom" style="color: ${suitColor}">${card.value} ${suitSymbol}</div>
                `;
                
                cardElement.addEventListener('click', () => toggleCardSelection(index));
                cardContainer.appendChild(cardElement);
            });
        } else {
            // Показываем 5 карт рубашками вверх
            for (let i = 0; i < 5; i++) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card back';
                cardElement.innerHTML = '🂠';
                cardContainer.appendChild(cardElement);
            }
        }
    }
    
    // Выбор/отмена выбора карты
    function toggleCardSelection(index) {
        if (gameState !== 'dealt') return;
        
        if (selectedCards.includes(index)) {
            selectedCards = selectedCards.filter(i => i !== index);
        } else {
            selectedCards.push(index);
        }
        
        updateUI();
    }
    
    // Обновление состояния кнопок
    function updateButtons() {
        dealBtn.disabled = gameState !== 'initial';
        drawBtn.disabled = gameState !== 'dealt';
        resetBtn.disabled = gameState !== 'drawn';
    }
    
    // Оценка комбинации
    function evaluateHand(hand) {
        // Сортируем карты по достоинству
        const sortedHand = [...hand].sort((a, b) => {
            return values.indexOf(a.value) - values.indexOf(b.value);
        });
        
        // Проверяем комбинации от самой сильной к самой слабой
        if (isRoyalFlush(sortedHand)) return 'Роял-флэш';
        if (isStraightFlush(sortedHand)) return 'Стрит-флэш';
        if (isFourOfAKind(sortedHand)) return 'Каре';
        if (isFullHouse(sortedHand)) return 'Фулл-хаус';
        if (isFlush(sortedHand)) return 'Флэш';
        if (isStraight(sortedHand)) return 'Стрит';
        if (isThreeOfAKind(sortedHand)) return 'Тройка';
        if (isTwoPairs(sortedHand)) return 'Две пары';
        if (isOnePair(sortedHand)) return 'Пара';
        
        // Если ничего не найдено, возвращаем старшую карту
        return `Старшая карта: ${sortedHand[4].value}`;
    }
    
    // Проверка на Роял-флэш
    function isRoyalFlush(hand) {
        return isStraightFlush(hand) && hand[4].value === 'A';
    }
    
    // Проверка на Стрит-флэш
    function isStraightFlush(hand) {
        return isFlush(hand) && isStraight(hand);
    }
    
    // Проверка на Каре
    function isFourOfAKind(hand) {
        const valueCounts = countValues(hand);
        return Object.values(valueCounts).some(count => count === 4);
    }
    
    // Проверка на Фулл-хаус
    function isFullHouse(hand) {
        const valueCounts = countValues(hand);
        const counts = Object.values(valueCounts);
        return counts.includes(3) && counts.includes(2);
    }
    
    // Проверка на Флэш
    function isFlush(hand) {
        const suit = hand[0].suit;
        return hand.every(card => card.suit === suit);
    }
    
    // Проверка на Стрит
    function isStraight(hand) {
        const indices = hand.map(card => values.indexOf(card.value));
        
        // Проверяем обычный стрит
        for (let i = 1; i < indices.length; i++) {
            if (indices[i] !== indices[i-1] + 1) {
                // Проверяем стрит с тузом как 1 (A-2-3-4-5)
                if (indices[0] === 0 && indices[1] === 1 && indices[2] === 2 && 
                    indices[3] === 3 && indices[4] === 12) {
                    return true;
                }
                return false;
            }
        }
        return true;
    }
    
    // Проверка на Тройку
    function isThreeOfAKind(hand) {
        const valueCounts = countValues(hand);
        return Object.values(valueCounts).some(count => count === 3);
    }
    
    // Проверка на Две пары
    function isTwoPairs(hand) {
        const valueCounts = countValues(hand);
        const pairs = Object.values(valueCounts).filter(count => count === 2);
        return pairs.length === 2;
    }
    
    // Проверка на Пару
    function isOnePair(hand) {
        const valueCounts = countValues(hand);
        return Object.values(valueCounts).some(count => count === 2);
    }
    
    // Подсчет количества карт каждого достоинства
    function countValues(hand) {
        const counts = {};
        hand.forEach(card => {
            counts[card.value] = (counts[card.value] || 0) + 1;
        });
        return counts;
    }
    
    // Расчет выигрыша
    function calculateWin(combination, bet) {
        const winMultipliers = {
            'Роял-флэш': 250,
            'Стрит-флэш': 50,
            'Каре': 25,
            'Фулл-хаус': 9,
            'Флэш': 6,
            'Стрит': 4,
            'Тройка': 3,
            'Две пары': 2,
            'Пара': 1
        };
        
        return winMultipliers[combination] ? winMultipliers[combination] * bet : 0;
    }
    
    // Обработчики событий
    dealBtn.addEventListener('click', dealCards);
    drawBtn.addEventListener('click', drawCards);
    resetBtn.addEventListener('click', resetGame);
    
    // Инициализация игры
    initGame();
});
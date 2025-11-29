document.addEventListener('DOMContentLoaded', function () {

    const playerCardContainer = document.getElementById('player-card-container');
    const opponentCardContainer = document.getElementById('opponent-card-container');
    const dealBtn = document.getElementById('deal-btn');
    const drawBtn = document.getElementById('draw-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultDiv = document.getElementById('result');
    const pokerBetInput = document.getElementById('pokerBet');

    let deck = [];
    let playerHand = [];
    let opponentHand = [];
    let selectedCards = [];
    let gameState = 'initial';

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

    // текущая ставка
    function getCurrentBet() {
        return parseInt(pokerBetInput.value);
    }

    function initGame() {

        // Обновляем отображение баланса
        if (typeof balanceManager !== 'undefined') {
            balanceManager.updateAllBalances();
        }

        createDeck();
        updateUI();

        // Добавляем обработчик изменения ставки
        pokerBetInput.addEventListener('input', function () {
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
        opponentHand = [];
        selectedCards = [];
        createDeck();

        // Раздаем карты
        for (let i = 0; i < 5; i++) {
            playerHand.push(deck.pop());
        }

        for (let i = 0; i < 5; i++) {
            opponentHand.push(deck.pop());
        }

        gameState = 'dealt';
        updateUI();
        updateButtons();

        // Снимаем ставку с баланса
        balanceManager.subtractFromBalance(bet);

        resultDiv.innerHTML = 'Выберите карты для замены и нажмите "Заменить карты"';
        resultDiv.style.color = 'white';
    }

    // Замена карт
    function drawCards() {
        const bet = getCurrentBet();

        for (let i = 0; i < playerHand.length; i++) {
            if (selectedCards.includes(i)) {
                if (deck.length === 0) {
                    createDeck(); // Если колода пуста, создаем новую
                }
                playerHand[i] = deck.pop();
            }
        }

        // Противник заменяет карты (простая логика)
        opponentReplaceCards();

        selectedCards = [];
        gameState = 'drawn';
        updateUI();
        updateButtons();

        // Определяем комбинации и победителя
        const playerCombination = evaluateHand(playerHand);
        const opponentCombination = evaluateHand(opponentHand);

        const result = determineWinner(playerHand, opponentHand);

        if (result.winAmount > 0) {
            // Начисляем выигрыш через balanceManager
            balanceManager.addToBalance(result.winAmount);
            resultDiv.innerHTML = `
                <div>У вас: <span style="color: gold">${playerCombination}</span></div>
                <div>У противника: <span style="color: gold">${opponentCombination}</span></div>
                <div style="margin-top: 10px; font-size: 1.2em; color: gold">${result.message} Вы выиграли ${result.winAmount}$!</div>
            `;
        } else {
            resultDiv.innerHTML = `
                <div>У вас: <span style="color: white">${playerCombination}</span></div>
                <div>У противника: <span style="color: white">${opponentCombination}</span></div>
                <div style="margin-top: 10px; font-size: 1.2em; color: white">${result.message}</div>
            `;
        }
    }

    // Логика замены карт противником
    function opponentReplaceCards() {
        // Простая логика: противник заменяет карты, которые не входят в комбинацию
        const combination = evaluateHand(opponentHand);
        const valueCounts = countValues(opponentHand);

        // Определяем, какие карты нужно сохранить
        let cardsToKeep = [];

        if (combination.includes('Пара') || combination.includes('Тройка') ||
            combination.includes('Две пары') || combination.includes('Фулл-хаус') ||
            combination.includes('Каре')) {

            // Находим карты, которые входят в комбинацию
            for (let value in valueCounts) {
                if (valueCounts[value] >= 2) {
                    opponentHand.forEach((card, index) => {
                        if (card.value === value) {
                            cardsToKeep.push(index);
                        }
                    });
                }
            }
        }

        // Заменяем карты, которые не входят в комбинацию
        for (let i = 0; i < opponentHand.length; i++) {
            if (!cardsToKeep.includes(i)) {
                if (deck.length === 0) {
                    createDeck();
                }
                opponentHand[i] = deck.pop();
            }
        }
    }

    // Определение победителя
    function determineWinner(playerHand, opponentHand) {
        const playerRank = getHandRank(playerHand);
        const opponentRank = getHandRank(opponentHand);
        const bet = getCurrentBet();

        if (playerRank > opponentRank) {
            return {
                winAmount: bet * 2,
                message: 'Вы победили!'
            };
        } else if (playerRank < opponentRank) {
            return {
                winAmount: 0,
                message: 'Противник победил!'
            };
        } else {
            // При равных комбинациях сравниваем по значениям карт
            const comparison = compareEqualHands(playerHand, opponentHand, playerRank);

            if (comparison > 0) {
                return {
                    winAmount: bet * 2,
                    message: 'Вы победили по сильнейшей комбинации!'
                };
            } else if (comparison < 0) {
                return {
                    winAmount: 0,
                    message: 'Противник победил по сильнейшей комбинации!'
                };
            } else {
                return {
                    winAmount: bet, // Возвращаем ставку при полной ничье
                    message: 'Абсолютная ничья! Ставка возвращена.'
                };
            }
        }
    }

    // Сравнение одинаковых комбинаций
    function compareEqualHands(hand1, hand2, handRank) {
        switch (handRank) {
            case 10: // Роял-флэш - всегда ничья
                return 0;

            case 9: // Стрит-флэш
            case 5: // Стрит
                return compareStraights(hand1, hand2);

            case 8: // Каре
                return compareFourOfAKind(hand1, hand2);

            case 7: // Фулл-хаус
                return compareFullHouse(hand1, hand2);

            case 6: // Флэш
            case 1: // Старшая карта
                return compareHighCards(hand1, hand2);

            case 4: // Тройка
                return compareThreeOfAKind(hand1, hand2);

            case 3: // Две пары
                return compareTwoPairs(hand1, hand2);

            case 2: // Пара
                return compareOnePair(hand1, hand2);

            default:
                return 0;
        }
    }

    // Сравнение стритов
    function compareStraights(hand1, hand2) {
        const high1 = getStraightHighCard(hand1);
        const high2 = getStraightHighCard(hand2);
        return high1 - high2;
    }

    // Получение старшей карты в стрите
    function getStraightHighCard(hand) {
        const indices = hand.map(card => values.indexOf(card.value)).sort((a, b) => a - b);

        // Проверяем стрит с тузом как 1 (A-2-3-4-5)
        if (indices[0] === 0 && indices[1] === 1 && indices[2] === 2 &&
            indices[3] === 3 && indices[4] === 12) {
            return 3; // 5 - старшая карта в таком стрите
        }

        return Math.max(...indices);
    }

    // Сравнение каре
    function compareFourOfAKind(hand1, hand2) {
        const four1 = getFourOfAKindValue(hand1);
        const four2 = getFourOfAKindValue(hand2);

        if (four1 !== four2) {
            return four1 - four2;
        }

        // Если четверки одинаковые, сравниваем кикеры
        return compareKickers(hand1, hand2, [four1]);
    }

    // Получение значения каре
    function getFourOfAKindValue(hand) {
        const valueCounts = countValues(hand);
        for (let value in valueCounts) {
            if (valueCounts[value] === 4) {
                return values.indexOf(value);
            }
        }
        return -1;
    }

    // Сравнение фулл-хаусов
    function compareFullHouse(hand1, hand2) {
        const triple1 = getThreeOfAKindValue(hand1);
        const triple2 = getThreeOfAKindValue(hand2);

        if (triple1 !== triple2) {
            return triple1 - triple2;
        }

        // Если тройки одинаковые, сравниваем пары
        const pair1 = getPairValue(hand1, triple1);
        const pair2 = getPairValue(hand2, triple2);

        return pair1 - pair2;
    }

    // Получение значения тройки
    function getThreeOfAKindValue(hand) {
        const valueCounts = countValues(hand);
        for (let value in valueCounts) {
            if (valueCounts[value] === 3) {
                return values.indexOf(value);
            }
        }
        return -1;
    }

    // Получение значения пары (исключая указанное значение)
    function getPairValue(hand, excludeValue) {
        const valueCounts = countValues(hand);
        for (let value in valueCounts) {
            const valueIndex = values.indexOf(value);
            if (valueCounts[value] === 2 && valueIndex !== excludeValue) {
                return valueIndex;
            }
        }
        return -1;
    }

    // Сравнение троек
    function compareThreeOfAKind(hand1, hand2) {
        const triple1 = getThreeOfAKindValue(hand1);
        const triple2 = getThreeOfAKindValue(hand2);

        if (triple1 !== triple2) {
            return triple1 - triple2;
        }

        // Если тройки одинаковые, сравниваем кикеры
        return compareKickers(hand1, hand2, [triple1]);
    }

    // Сравнение двух пар
    function compareTwoPairs(hand1, hand2) {
        const pairs1 = getTwoPairsValues(hand1);
        const pairs2 = getTwoPairsValues(hand2);

        // Сравниваем старшие пары
        if (pairs1.highPair !== pairs2.highPair) {
            return pairs1.highPair - pairs2.highPair;
        }

        // Сравниваем младшие пары
        if (pairs1.lowPair !== pairs2.lowPair) {
            return pairs1.lowPair - pairs2.lowPair;
        }

        // Если все пары одинаковые, сравниваем кикер
        return compareKickers(hand1, hand2, [pairs1.highPair, pairs1.lowPair]);
    }

    // Получение значений двух пар
    function getTwoPairsValues(hand) {
        const valueCounts = countValues(hand);
        const pairs = [];

        for (let value in valueCounts) {
            if (valueCounts[value] === 2) {
                pairs.push(values.indexOf(value));
            }
        }

        pairs.sort((a, b) => a - b);
        return {
            highPair: pairs[1],
            lowPair: pairs[0]
        };
    }

    // Сравнение одной пары
    function compareOnePair(hand1, hand2) {
        const pair1 = getOnePairValue(hand1);
        const pair2 = getOnePairValue(hand2);

        if (pair1 !== pair2) {
            return pair1 - pair2;
        }

        // Если пары одинаковые, сравниваем кикеры
        return compareKickers(hand1, hand2, [pair1]);
    }

    // Получение значения одной пары
    function getOnePairValue(hand) {
        const valueCounts = countValues(hand);
        for (let value in valueCounts) {
            if (valueCounts[value] === 2) {
                return values.indexOf(value);
            }
        }
        return -1;
    }

    // Сравнение кикеров (оставшихся карт)
    function compareKickers(hand1, hand2, excludeValues) {
        const kickers1 = getKickers(hand1, excludeValues);
        const kickers2 = getKickers(hand2, excludeValues);

        for (let i = kickers1.length - 1; i >= 0; i--) {
            if (kickers1[i] !== kickers2[i]) {
                return kickers1[i] - kickers2[i];
            }
        }

        return 0; // Все кикеры одинаковые
    }

    // Получение кикеров (отсортированных значений карт, исключая указанные)
    function getKickers(hand, excludeValues) {
        const cardValues = hand.map(card => values.indexOf(card.value));
        return cardValues
            .filter(value => !excludeValues.includes(value))
            .sort((a, b) => a - b);
    }

    // Сравнение по старшим картам (для флэша и старшей карты)
    function compareHighCards(hand1, hand2) {
        const values1 = hand1.map(card => values.indexOf(card.value)).sort((a, b) => a - b);
        const values2 = hand2.map(card => values.indexOf(card.value)).sort((a, b) => a - b);

        for (let i = values1.length - 1; i >= 0; i--) {
            if (values1[i] !== values2[i]) {
                return values1[i] - values2[i];
            }
        }

        return 0;
    }

    // Обновленная логика замены карт противника
    function opponentReplaceCards() {
        const combination = evaluateHand(opponentHand);
        const handRank = getHandRank(opponentHand);
        const valueCounts = countValues(opponentHand);

        let cardsToKeep = [];

        // Улучшенная логика замены в зависимости от комбинации
        switch (handRank) {
            case 10: // Роял-флэш - ничего не меняем
            case 9:  // Стрит-флэш - ничего не меняем
                cardsToKeep = [0, 1, 2, 3, 4];
                break;

            case 8: // Каре - сохраняем четверку
            case 7: // Фулл-хаус - сохраняем всю комбинацию
                for (let value in valueCounts) {
                    if (valueCounts[value] >= 2) {
                        opponentHand.forEach((card, index) => {
                            if (card.value === value) {
                                cardsToKeep.push(index);
                            }
                        });
                    }
                }
                break;

            case 6: // Флэш - сохраняем все карты одной масти
                const suit = opponentHand[0].suit;
                opponentHand.forEach((card, index) => {
                    if (card.suit === suit) {
                        cardsToKeep.push(index);
                    }
                });
                break;

            case 5: // Стрит - сохраняем все карты стрита
                cardsToKeep = [0, 1, 2, 3, 4];
                break;

            case 4: // Тройка - сохраняем тройку
            case 3: // Две пары - сохраняем обе пары
            case 2: // Пара - сохраняем пару
                for (let value in valueCounts) {
                    if (valueCounts[value] >= 2) {
                        opponentHand.forEach((card, index) => {
                            if (card.value === value) {
                                cardsToKeep.push(index);
                            }
                        });
                    }
                }
                break;

            default: // Старшая карта - сохраняем только старшие карты
                const cardValues = opponentHand.map((card, index) => ({
                    value: values.indexOf(card.value),
                    index
                })).sort((a, b) => b.value - a.value);

                // Сохраняем 2-3 старшие карты
                cardsToKeep = cardValues.slice(0, 3).map(card => card.index);
                break;
        }

        // Заменяем карты, которые не входят в сохраняемые
        for (let i = 0; i < opponentHand.length; i++) {
            if (!cardsToKeep.includes(i)) {
                if (deck.length === 0) {
                    createDeck();
                }
                opponentHand[i] = deck.pop();
            }
        }
    }

    // Получение числового ранга комбинации
    function getHandRank(hand) {
        if (isRoyalFlush(hand)) return 10;
        if (isStraightFlush(hand)) return 9;
        if (isFourOfAKind(hand)) return 8;
        if (isFullHouse(hand)) return 7;
        if (isFlush(hand)) return 6;
        if (isStraight(hand)) return 5;
        if (isThreeOfAKind(hand)) return 4;
        if (isTwoPairs(hand)) return 3;
        if (isOnePair(hand)) return 2;
        return 1; // Старшая карта
    }

    // Получение значения старшей карты
    function getHighCardValue(hand) {
        const sortedHand = [...hand].sort((a, b) => {
            return values.indexOf(a.value) - values.indexOf(b.value);
        });
        return values.indexOf(sortedHand[4].value);
    }

    // Сброс игры
    function resetGame() {
        playerHand = [];
        opponentHand = [];
        selectedCards = [];
        gameState = 'initial';
        updateUI();
        updateButtons();
        resultDiv.innerHTML = 'Нажмите "Раздать карты" чтобы начать игру';
        resultDiv.style.color = 'white';
    }

    // Обновление интерфейса
    function updateUI() {
        playerCardContainer.innerHTML = '';
        opponentCardContainer.innerHTML = '';

        // Отображаем карты игрока
        if (playerHand.length > 0) {
            playerHand.forEach((card, index) => {
                const cardElement = createCardElement(card, index, true);
                playerCardContainer.appendChild(cardElement);
            });
        } else {
            // Показываем 5 карт рубашками вверх для игрока
            for (let i = 0; i < 5; i++) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card back';
                cardElement.innerHTML = '🂠';
                playerCardContainer.appendChild(cardElement);
            }
        }

        // Отображаем карты противника
        if (opponentHand.length > 0) {
            if (gameState === 'drawn') {
                // После замены показываем карты противника
                opponentHand.forEach((card, index) => {
                    const cardElement = createCardElement(card, index, false);
                    opponentCardContainer.appendChild(cardElement);
                });
            } else {
                // До замены показываем рубашки
                for (let i = 0; i < 5; i++) {
                    const cardElement = document.createElement('div');
                    cardElement.className = 'card back';
                    cardElement.innerHTML = '🂠';
                    opponentCardContainer.appendChild(cardElement);
                }
            }
        } else {
            // Показываем 5 карт рубашками вверх для противника
            for (let i = 0; i < 5; i++) {
                const cardElement = document.createElement('div');
                cardElement.className = 'card back';
                cardElement.innerHTML = '🂠';
                opponentCardContainer.appendChild(cardElement);
            }
        }
    }

    // Создание элемента карты
    function createCardElement(card, index, isPlayer) {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${isPlayer && selectedCards.includes(index) ? 'selected' : ''}`;

        // Определяем символ масти
        let suitSymbol;
        let suitColor;
        switch (card.suit) {
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

        if (isPlayer && gameState === 'dealt') {
            cardElement.addEventListener('click', () => toggleCardSelection(index));
        }

        return cardElement;
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
            if (indices[i] !== indices[i - 1] + 1) {
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

    // Обработчики событий
    dealBtn.addEventListener('click', dealCards);
    drawBtn.addEventListener('click', drawCards);
    resetBtn.addEventListener('click', resetGame);

    // Инициализация игры
    initGame();
});
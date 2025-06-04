// assets/js/profitCalculator.js

/**
 * Bybit Klines 데이터를 백엔드 프록시를 통해 가져오는 함수
 * @param {string} symbol 코인 심볼 (예: BTCUSDT)
 * @param {string} interval 캔들스틱 간격 (예: 1d, 1h)
 * @param {number} startTime 시작 시간 (Unix timestamp in milliseconds)
 * @param {number} endTime 종료 시간 (Unix timestamp in milliseconds)
 * @returns {Promise<Array>} Klines 데이터 배열
 */
async function fetchBybitKlines(symbol, interval, startTime, endTime) {
    const url = `/api/klines?symbol=${symbol}&interval=${interval}&startTime=${startTime}&endTime=${endTime}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch Klines data: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching Bybit Klines:', error);
        throw error;
    }
}

/**
 * 손익을 계산하는 함수
 */
async function calculateProfitLoss() {
    const symbol = document.getElementById('profit-symbol-select').value;
    const startDateStr = document.getElementById('start-date-input').value;
    const endDateStr = document.getElementById('end-date-input').value;
    const coinAmount = parseFloat(document.getElementById('coin-amount-input').value);
    const position = document.querySelector('input[name="position"]:checked').value;

    const totalProfitLossElem = document.getElementById('total-profit-loss');
    const profitLossPercentageElem = document.getElementById('profit-loss-percentage');
    const profitStatusElem = document.getElementById('profit-status');
    const startPriceElem = document.getElementById('start-price');
    const endPriceElem = document.getElementById('end-price');

    // 결과 초기화
    totalProfitLossElem.textContent = '-';
    profitLossPercentageElem.textContent = '-';
    startPriceElem.textContent = '-';
    endPriceElem.textContent = '-';
    profitStatusElem.textContent = '';
    profitStatusElem.className = 'status-message'; // 클래스 초기화

    if (!startDateStr || !endDateStr || isNaN(coinAmount) || coinAmount <= 0) {
        profitStatusElem.textContent = '모든 필드를 올바르게 입력해주세요.';
        profitStatusElem.classList.add('error');
        return;
    }

    const startTime = new Date(startDateStr).getTime();
    const endTime = new Date(endDateStr).getTime();

    if (endTime <= startTime) {
        profitStatusElem.textContent = '종료 기간은 시작 기간보다 미래여야 합니다.';
        profitStatusElem.classList.add('error');
        return;
    }

    try {
        // Bybit Klines API는 UTC 시간을 사용하므로, 로컬 시간을 UTC로 변환하여 전달
        const klines = await fetchBybitKlines(symbol, '1m', startTime, endTime); // 1분봉 데이터 요청

        if (klines.length === 0) {
            profitStatusElem.textContent = '해당 기간의 가격 데이터를 찾을 수 없습니다.';
            profitStatusElem.classList.add('info');
            return;
        }

        // Klines 데이터에서 Open time (인덱스 0)과 Close price (인덱스 4) 추출
        // Bybit->Binance 변환된 형식: [open_time, open_price, high_price, low_price, close_price, ...]
        const startPriceData = klines[0]; // 첫 번째 캔들의 시가 또는 종가
        const endPriceData = klines[klines.length - 1]; // 마지막 캔들의 시가 또는 종가

        // 시작 가격과 종료 가격을 어떤 기준으로 잡을지 결정 (여기서는 편의상 첫/마지막 캔들의 종가 사용)
        const startPrice = parseFloat(startPriceData[1]); // Open price
        const endPrice = parseFloat(endPriceData[4]);   // Close price

        let profitLoss = 0;
        let percentage = 0;

        if (position === 'long') {
            profitLoss = (endPrice - startPrice) * coinAmount;
            if (startPrice !== 0) {
                percentage = (profitLoss / (startPrice * coinAmount)) * 100;
            }
        } else { // short
            profitLoss = (startPrice - endPrice) * coinAmount;
            if (startPrice !== 0) {
                percentage = (profitLoss / (startPrice * coinAmount)) * 100;
            }
        }

        totalProfitLossElem.textContent = `$${profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        profitLossPercentageElem.textContent = `${percentage.toFixed(2)}%`;
        startPriceElem.textContent = `$${startPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        endPriceElem.textContent = `$${endPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        if (profitLoss > 0) {
            profitStatusElem.textContent = '🎉 이익이 발생했습니다!';
            profitStatusElem.classList.add('profit');
        } else if (profitLoss < 0) {
            profitStatusElem.textContent = '😢 손실이 발생했습니다.';
            profitStatusElem.classList.add('loss');
        } else {
            profitStatusElem.textContent = '변동 없음.';
            profitStatusElem.classList.add('neutral');
        }

    } catch (error) {
        profitStatusElem.textContent = '손익 계산 중 오류가 발생했습니다: ' + error.message;
        profitStatusElem.classList.add('error');
        console.error('Profit calculation error:', error);
    }
}

/**
 * 손익 계산기 초기화 함수
 * DOM이 로드된 후 호출될 예정
 */
export function initializeProfitCalculator() {
    const calculateBtn = document.getElementById('calculate-profit-btn');
    if (calculateBtn) {
        calculateBtn.addEventListener('click', calculateProfitLoss);
    } else {
        console.error("ID 'calculate-profit-btn'를 가진 버튼을 찾을 수 없습니다.");
    }
}
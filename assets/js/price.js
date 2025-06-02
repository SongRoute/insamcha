// Price page functionality
const API_URL = 'http://localhost:3000/api/crypto/prices';
const REFRESH_INTERVAL = 60000; // 60 seconds

let refreshTimer = null;

// Format numbers with Korean locale
const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '₩0';
    return new Intl.NumberFormat('ko-KR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(num);
};

// Format price in KRW
const formatPrice = (price) => {
    if (price === null || price === undefined) return '₩0';
    
    // 가격에 따라 소수점 자리수 조정
    let decimals = 0;
    if (price < 1) decimals = 4;
    else if (price < 10) decimals = 2;
    else if (price < 1000) decimals = 1;
    
    return `₩${formatNumber(price, decimals)}`;
};

// Format large numbers (volume, market cap)
const formatLargeNumber = (num) => {
    if (num === null || num === undefined) return '₩0';
    
    const billion = 1000000000;
    const trillion = 1000000000000;
    
    if (num >= trillion) {
        return `₩${formatNumber(num / trillion, 2)}조`;
    } else if (num >= billion) {
        return `₩${formatNumber(num / billion, 2)}억`;
    } else {
        return `₩${formatNumber(num, 0)}`;
    }
};

// Format percentage
const formatPercentage = (percent) => {
    if (percent === null || percent === undefined) return '0.00%';
    const formatted = Math.abs(percent).toFixed(2);
    const sign = percent > 0 ? '+' : percent < 0 ? '-' : '';
    return `${sign}${formatted}%`;
};

// Get percentage class
const getPercentageClass = (percent) => {
    if (percent > 0) return 'positive';
    if (percent < 0) return 'negative';
    return 'neutral';
};

// Create table row for cryptocurrency
const createCryptoRow = (crypto) => {
    const { cmc_rank, name, symbol, quote } = crypto;
    const krwQuote = quote.KRW;
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="rank">${cmc_rank}</td>
        <td class="name">
            <div class="crypto-info">
                <div class="crypto-icon">${symbol.substring(0, 2).toUpperCase()}</div>
                <div class="crypto-name-wrapper">
                    <div class="crypto-name">${name}</div>
                    <div class="crypto-symbol">${symbol}</div>
                </div>
            </div>
        </td>
        <td class="price">
            <span class="price-value">${formatPrice(krwQuote.price)}</span>
        </td>
        <td class="change change-24h ${getPercentageClass(krwQuote.percent_change_24h)}">
            ${formatPercentage(krwQuote.percent_change_24h)}
        </td>
        <td class="change change-7d ${getPercentageClass(krwQuote.percent_change_7d)}">
            ${formatPercentage(krwQuote.percent_change_7d)}
        </td>
        <td class="change change-30d ${getPercentageClass(krwQuote.percent_change_30d)}">
            ${formatPercentage(krwQuote.percent_change_30d)}
        </td>
        <td class="volume">${formatLargeNumber(krwQuote.volume_24h)}</td>
        <td class="market-cap">${formatLargeNumber(krwQuote.market_cap)}</td>
        <td class="actions">
            <a href="#" class="chart-link" title="차트 보기">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 3v18h18"/>
                    <path d="M7 12l4-4 4 4 5-5"/>
                </svg>
            </a>
        </td>
    `;
    
    return row;
};

// Show error message
const showError = (message, details = '') => {
    const tbody = document.getElementById('crypto-tbody');
    tbody.innerHTML = '';
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <h3>오류가 발생했습니다</h3>
        <p>${message}</p>
        ${details ? `<p style="font-size: 12px; margin-top: 8px;">${details}</p>` : ''}
    `;
    
    const priceContent = document.getElementById('price-content');
    const tableWrapper = priceContent.querySelector('.price-table-wrapper');
    tableWrapper.insertAdjacentElement('afterend', errorDiv);
};

// Show refresh indicator
const showRefreshIndicator = () => {
    let indicator = document.querySelector('.refresh-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'refresh-indicator';
        indicator.innerHTML = `
            <div class="spinner"></div>
            <span>데이터 갱신 중...</span>
        `;
        document.body.appendChild(indicator);
    }
    indicator.classList.add('show');
};

// Hide refresh indicator
const hideRefreshIndicator = () => {
    const indicator = document.querySelector('.refresh-indicator');
    if (indicator) {
        indicator.classList.remove('show');
    }
};

// Fetch cryptocurrency data
const fetchCryptoData = async (showIndicator = false) => {
    try {
        if (showIndicator) {
            showRefreshIndicator();
        }
        
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API 호출 실패');
        }
        
        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('잘못된 데이터 형식');
        }
        
        renderCryptoData(data.data);
        
    } catch (error) {
        console.error('Error fetching crypto data:', error);
        
        let errorMessage = '암호화폐 데이터를 불러올 수 없습니다.';
        let errorDetails = '';
        
        if (error.message.includes('CMC_API_KEY')) {
            errorDetails = 'CoinMarketCap API 키가 서버에 설정되지 않았습니다.';
        } else if (error.message.includes('401') || error.message.includes('403')) {
            errorDetails = 'API 키가 유효하지 않거나 권한이 없습니다.';
        } else {
            errorDetails = error.message;
        }
        
        showError(errorMessage, errorDetails);
    } finally {
        if (showIndicator) {
            hideRefreshIndicator();
        }
    }
};

// Render cryptocurrency data
const renderCryptoData = (cryptoList) => {
    const tbody = document.getElementById('crypto-tbody');
    tbody.innerHTML = '';
    
    // Remove any existing error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    cryptoList.forEach(crypto => {
        const row = createCryptoRow(crypto);
        tbody.appendChild(row);
    });
};

// Initialize the page
const initializePage = () => {
    // Initial data fetch
    fetchCryptoData();
    
    // Set up auto-refresh
    refreshTimer = setInterval(() => {
        fetchCryptoData(true);
    }, REFRESH_INTERVAL);
    
    // Add event listener for chart links
    document.addEventListener('click', (e) => {
        if (e.target.closest('.chart-link')) {
            e.preventDefault();
            // TODO: Implement chart view
            console.log('Chart view not implemented yet');
        }
    });
};

// Clean up on page unload
const cleanup = () => {
    if (refreshTimer) {
        clearInterval(refreshTimer);
        refreshTimer = null;
    }
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializePage);
} else {
    initializePage();
}

// Cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Export for use in other modules if needed
export { fetchCryptoData, formatPrice, formatLargeNumber }; 
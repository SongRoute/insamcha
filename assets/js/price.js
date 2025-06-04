// Price page functionality
import { fetchFavorites, addFavorite, removeFavorite } from './exchanges.js';
import { authManager } from './auth.js';

const API_URL = 'http://localhost:3000/api/crypto/prices';
const REFRESH_INTERVAL = 60000; // 60 seconds

let refreshTimer = null;
let allCryptoData = [];

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
const createCryptoRow = async (crypto, favorites = []) => {
    const { cmc_rank, name, symbol, quote } = crypto;
    const krwQuote = quote.KRW;
    const isFavorited = favorites.includes(symbol);
    
    const row = document.createElement('tr');
    row.innerHTML = `
        <td class="actions">
            <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
                    data-crypto-symbol="${symbol}"
                    onclick="handleCryptoFavoriteToggle('${symbol}', this)">
                ${isFavorited ? '★' : '☆'}
            </button>
        </td>
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
        <td class="chart">
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
        
        await renderCryptoData(data.data);
        
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
const renderCryptoData = async (cryptoList) => {
    allCryptoData = cryptoList; // Store for filtering
    
    const tbody = document.getElementById('crypto-tbody');
    tbody.innerHTML = '';
    
    // Remove any existing error messages
    const errorMessages = document.querySelectorAll('.error-message');
    errorMessages.forEach(msg => msg.remove());
    
    // Get favorites if authenticated
    let favorites = [];
    if (authManager.isAuthenticated) {
        try {
            favorites = await fetchFavorites();
        } catch (error) {
            console.error('즐겨찾기 정보를 가져오는데 실패했습니다:', error);
        }
    }
    
    // Apply filters
    const filteredData = await applyFilters(cryptoList, favorites);
    
    // Render rows
    for (const crypto of filteredData) {
        const row = await createCryptoRow(crypto, favorites);
        tbody.appendChild(row);
    }
    
    if (filteredData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="no-data">검색 결과가 없습니다.</td></tr>';
    }
};

// Apply search and favorite filters
async function applyFilters(cryptoList = allCryptoData, favorites = []) {
    let filteredData = [...cryptoList];
    
    // Apply search filter
    const searchInput = document.getElementById('crypto-search-input');
    if (searchInput && searchInput.value.trim()) {
        const searchTerm = searchInput.value.trim().toLowerCase();
        filteredData = filteredData.filter(crypto => 
            crypto.name.toLowerCase().includes(searchTerm) ||
            crypto.symbol.toLowerCase().includes(searchTerm)
        );
    }
    
    // Apply favorites filter
    const favoritesOnlyCheckbox = document.getElementById('show-favorites-only');
    if (favoritesOnlyCheckbox && favoritesOnlyCheckbox.checked) {
        filteredData = filteredData.filter(crypto =>
            favorites.includes(crypto.symbol)
        );
    }
    
    return filteredData;
}

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
    
    // Add search functionality
    const searchInput = document.getElementById('crypto-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(async () => {
            if (allCryptoData.length > 0) {
                await renderCryptoData(allCryptoData);
            }
        }, 300));
    }
    
    // Add favorites filter functionality
    const favoritesCheckbox = document.getElementById('show-favorites-only');
    if (favoritesCheckbox) {
        favoritesCheckbox.addEventListener('change', async () => {
            if (allCryptoData.length > 0) {
                await renderCryptoData(allCryptoData);
            }
        });
    }
};

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

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

// Toggle favorite function for crypto
async function toggleCryptoFavorite(cryptoSymbol) {
    const favorites = await fetchFavorites();
    const isFavorited = favorites.includes(cryptoSymbol);
    
    if (isFavorited) {
        return await removeFavorite(cryptoSymbol);
    } else {
        return await addFavorite(cryptoSymbol);
    }
}

// Handle favorite toggle for crypto
window.handleCryptoFavoriteToggle = async function(cryptoSymbol, buttonElement) {
    // Check authentication status
    await authManager.checkAuth();
    
    if (!authManager.isAuthenticated) {
        // Show login prompt with options
        const userChoice = confirm('즐겨찾기 기능을 사용하려면 로그인이 필요합니다.\n\n확인을 누르면 로그인 페이지로 이동합니다.\n취소를 누르면 현재 페이지에 머무릅니다.');
        
        if (userChoice) {
            // Redirect to login page with return URL
            const currentUrl = window.location.href;
            window.location.href = `/login.html?returnUrl=${encodeURIComponent(currentUrl)}`;
        }
        return;
    }

    // 버튼 비활성화 (중복 클릭 방지)
    buttonElement.disabled = true;
    const originalText = buttonElement.textContent;
    buttonElement.textContent = '...';

    try {
        const success = await toggleCryptoFavorite(cryptoSymbol);
        if (success) {
            const isFavorited = buttonElement.classList.contains('favorited');
            
            if (isFavorited) {
                buttonElement.classList.remove('favorited');
                buttonElement.textContent = '☆';
                // Show success message
                showTemporaryMessage('즐겨찾기에서 제거되었습니다.');
            } else {
                buttonElement.classList.add('favorited');
                buttonElement.textContent = '★';
                // Show success message
                showTemporaryMessage('즐겨찾기에 추가되었습니다.');
            }
        } else {
            buttonElement.textContent = originalText;
            alert('즐겨찾기 설정에 실패했습니다. 다시 시도해주세요.');
        }
    } catch (error) {
        console.error('즐겨찾기 토글 실패:', error);
        buttonElement.textContent = originalText;
        
        // Provide more specific error messages
        if (error.message.includes('403') || error.message.includes('401')) {
            alert('로그인이 만료되었습니다. 다시 로그인해주세요.');
            window.location.href = '/login.html';
        } else {
            alert('즐겨찾기 설정에 실패했습니다. 네트워크 연결을 확인해주세요.');
        }
    } finally {
        buttonElement.disabled = false;
    }
};

// Show temporary success message
function showTemporaryMessage(message) {
    // Remove existing message if any
    const existingMessage = document.querySelector('.temp-message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    // Create new message element
    const messageElement = document.createElement('div');
    messageElement.className = 'temp-message';
    messageElement.textContent = message;
    messageElement.style.cssText = `
        position: fixed;
        bottom: 80px;
        right: 20px;
        background: var(--success);
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 1000;
        font-size: 14px;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(messageElement);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        messageElement.style.opacity = '0';
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }, 3000);
}

// Export for use in other modules if needed
export { fetchCryptoData, formatPrice, formatLargeNumber }; 
// Exchange information display functionality
import { fetchExchanges, fetchFavorites, addFavorite, removeFavorite } from './exchanges.js';
import { authManager } from './auth.js';

let allExchanges = [];

// Toggle favorite function
async function toggleFavorite(exchangeId) {
    const favorites = await fetchFavorites();
    const isFavorited = favorites.includes(exchangeId);
    
    if (isFavorited) {
        return await removeFavorite(exchangeId);
    } else {
        return await addFavorite(exchangeId);
    }
}

// Display loading state
function showLoading() {
    const tbody = document.getElementById('exchange-tbody');
    if (tbody) {
        tbody.innerHTML = `
            <tr class="loading">
                <td colspan="7">
                    <div class="loading-text">
                        <div class="loading-spinner"></div>
                        거래소 정보를 불러오는 중...
                    </div>
                </td>
            </tr>
        `;
    }
}

// Display error state
function showError(message) {
    const tbody = document.getElementById('exchange-tbody');
    if (tbody) {
        tbody.innerHTML = `<tr><td colspan="7" class="error-message">${message}</td></tr>`;
    }
}

// Display exchanges in table format
async function displayExchangesTable(exchanges) {
    const tbody = document.getElementById('exchange-tbody');
    if (!tbody) return;

    if (!exchanges || exchanges.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="no-data">거래소 정보가 없습니다.</td></tr>';
        return;
    }

    let favorites = [];
    if (authManager.isAuthenticated) {
        try {
            favorites = await fetchFavorites();
        } catch (error) {
            console.error('즐겨찾기 정보를 가져오는데 실패했습니다:', error);
        }
    }

    tbody.innerHTML = exchanges.map((exchange, index) => {
        const isFavorited = favorites.includes(exchange.id);
        const trustScore = exchange.trust_score || 0;
        const trustScoreClass = trustScore >= 8 ? 'positive' : trustScore >= 5 ? 'neutral' : 'negative';
        
        return `
            <tr>
                <td class="actions">
                    <button class="favorite-btn ${isFavorited ? 'favorited' : ''}" 
                            data-exchange-id="${exchange.id}"
                            onclick="handleFavoriteToggle('${exchange.id}', this)">
                        ${isFavorited ? '★' : '☆'}
                    </button>
                </td>
                <td class="rank">${exchange.trust_score_rank || index + 1}</td>
                <td class="name">
                    <div class="crypto-info">
                        <div class="crypto-icon">
                            <img src="${exchange.image || 'assets/icons/exchange-default.svg'}" 
                                 alt="${exchange.name}" 
                                 width="32" height="32"
                                 onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                            <div class="crypto-icon" style="display: none;">${exchange.name.charAt(0)}</div>
                        </div>
                        <div class="crypto-name-wrapper">
                            <span class="crypto-name">${exchange.name}</span>
                            <span class="crypto-symbol">${exchange.country || 'Global'}</span>
                        </div>
                    </div>
                </td>
                <td class="volume-24h">${formatVolume(exchange.trade_volume_24h_btc)}</td>
                <td class="trust-score">
                    <span class="change ${trustScoreClass}">${trustScore > 0 ? trustScore : '-'}/10</span>
                </td>
                <td class="country">${exchange.country || '-'}</td>
                <td class="year">${exchange.year_established || '-'}</td>
            </tr>
        `;
    }).join('');
}

// Format volume with appropriate units
function formatVolume(volume) {
    if (!volume || volume === 'NaN' || volume === null) return '-';
    
    const num = parseFloat(volume);
    if (isNaN(num) || num <= 0) return '-';
    
    if (num >= 1000000) {
        return `${(num / 1000000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}M BTC`;
    } else if (num >= 1000) {
        return `${(num / 1000).toLocaleString('ko-KR', { maximumFractionDigits: 1 })}K BTC`;
    } else {
        return `${num.toLocaleString('ko-KR', { maximumFractionDigits: 2 })} BTC`;
    }
}

// Handle favorite toggle
window.handleFavoriteToggle = async function(exchangeId, buttonElement) {
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
        const success = await toggleFavorite(exchangeId);
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
                messageElement.remove();
            }
        }, 300);
    }, 3000);
}

// Apply filters (search and favorites)
async function applyFilters() {
    const searchInput = document.getElementById('exchange-search-input');
    const favOnlyCheckbox = document.getElementById('show-favorites-only');

    let filtered = allExchanges;
    const query = searchInput?.value.trim().toLowerCase() || '';

    if (query) {
        filtered = filtered.filter(ex => ex.name.toLowerCase().includes(query));
    }

    if (favOnlyCheckbox?.checked) {
        // Check authentication status first
        await authManager.checkAuth();
        
        if (!authManager.isAuthenticated) {
            // Show login prompt and uncheck the checkbox
            const userChoice = confirm('즐겨찾기 필터를 사용하려면 로그인이 필요합니다.\n\n확인을 누르면 로그인 페이지로 이동합니다.\n취소를 누르면 현재 페이지에 머무릅니다.');
            
            favOnlyCheckbox.checked = false;
            
            if (userChoice) {
                const currentUrl = window.location.href;
                window.location.href = `/login.html?returnUrl=${encodeURIComponent(currentUrl)}`;
                return;
            }
            
            return displayExchangesTable(allExchanges);
        }
        
        try {
            const favorites = await fetchFavorites();
            if (favorites.length === 0) {
                // No favorites yet
                showTemporaryMessage('아직 즐겨찾기에 추가된 거래소가 없습니다.');
                filtered = [];
            } else {
                filtered = filtered.filter(ex => favorites.includes(ex.id));
            }
        } catch (error) {
            console.error('즐겨찾기 목록 가져오기 실패:', error);
            favOnlyCheckbox.checked = false;
            alert('즐겨찾기 목록을 가져오는데 실패했습니다.');
        }
    }

    await displayExchangesTable(filtered);
}

// Load exchange information with retry logic
async function loadExchangeInfo(retryCount = 0) {
    showLoading();
    
    try {
        allExchanges = await fetchExchanges();
        
        if (!allExchanges || allExchanges.length === 0) {
            showError('거래소 정보가 없습니다.');
            return;
        }
        
        await displayExchangesTable(allExchanges);

        // Set up event listeners
        const searchInput = document.getElementById('exchange-search-input');
        const favOnlyCheckbox = document.getElementById('show-favorites-only');

        searchInput?.addEventListener('input', applyFilters);
        favOnlyCheckbox?.addEventListener('change', applyFilters);

    } catch (error) {
        console.error('Error loading exchange information:', error);
        
        // 구체적인 에러 메시지 표시
        let errorMessage = '거래소 정보를 불러오는데 실패했습니다.';
        
        if (error.message.includes('status: 500')) {
            errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        } else if (error.message.includes('status: 403') || error.message.includes('status: 401')) {
            errorMessage = '인증에 실패했습니다. 다시 로그인해주세요.';
        } else if (error.message.includes('fetch') || error.name === 'TypeError') {
            errorMessage = '네트워크 연결을 확인해주세요.';
        }
        
        // Retry mechanism for network errors
        if (retryCount < 2 && (error.message.includes('fetch') || error.name === 'TypeError')) {
            setTimeout(() => {
                console.log(`Retrying... Attempt ${retryCount + 1}`);
                loadExchangeInfo(retryCount + 1);
            }, 2000 * (retryCount + 1)); // Exponential backoff
            
            showError(`${errorMessage} 재시도 중... (${retryCount + 1}/2)`);
            return;
        }
        
        showError(errorMessage + ' <button onclick="loadExchangeInfo()" style="margin-left: 10px; padding: 5px 10px; background: var(--primary); color: white; border: none; border-radius: 4px; cursor: pointer;">다시 시도</button>');
    }
}

// Make loadExchangeInfo globally accessible for retry button
window.loadExchangeInfo = loadExchangeInfo;

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', loadExchangeInfo); 
// API URL for cryptocurrency data (same as price.js)
const API_URL = 'http://localhost:3000/api/crypto/prices';

// Format price in KRW
const formatPrice = (price) => {
    if (price === null || price === undefined) return '₩0';
    
    // 가격에 따라 소수점 자리수 조정
    let decimals = 0;
    if (price < 1) decimals = 4;
    else if (price < 10) decimals = 2;
    else if (price < 1000) decimals = 1;
    
    return `₩${new Intl.NumberFormat('ko-KR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(price)}`;
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

async function fetchCoinData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(API_URL, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.data || !Array.isArray(data.data)) {
            throw new Error('Invalid data format');
        }
        
        return data.data;
    } catch (error) {
        console.error("Could not fetch coin data:", error);
        return null;
    }
}

function createCoinElement(crypto) {
    const { name, symbol, quote } = crypto;
    const krwQuote = quote.KRW;
    
    const itemGroup = document.createElement('div');
    itemGroup.classList.add('footer-item-group');

    const nameDiv = document.createElement('div');
    nameDiv.classList.add('footer-coin-label');
    nameDiv.textContent = `${name} (${symbol})`;

    const priceDiv = document.createElement('div');
    priceDiv.classList.add('footer-coin-value');
    priceDiv.textContent = formatPrice(krwQuote.price);

    const changeDiv = document.createElement('div');
    changeDiv.classList.add('footer-coin-change');
    changeDiv.textContent = formatPercentage(krwQuote.percent_change_24h);
    changeDiv.classList.add(getPercentageClass(krwQuote.percent_change_24h));

    // 색상 클래스 적용
    if (krwQuote.percent_change_24h > 0) {
        changeDiv.classList.add('coin-value-red');
    } else if (krwQuote.percent_change_24h < 0) {
        changeDiv.classList.add('coin-value-blue');
    }

    itemGroup.appendChild(nameDiv);
    itemGroup.appendChild(priceDiv);
    itemGroup.appendChild(changeDiv);
    return itemGroup;
}

async function populateFooter() {
    console.log("Starting populateFooter function");
    
    const cryptoData = await fetchCoinData();
    if (!cryptoData || !Array.isArray(cryptoData)) {
        console.error("No crypto data received or invalid format");
        return;
    }
    
    console.log("Crypto data fetched successfully:", cryptoData);

    const marqueeContent = document.querySelector('#footer .ltr-marquee-content');
    if (!marqueeContent) {
        console.error("Marquee content element not found");
        return;
    }
    
    console.log("Marquee content element found:", marqueeContent);
    marqueeContent.innerHTML = '';

    // 상위 10개 암호화폐만 footer에 표시
    const topCryptos = cryptoData.slice(0, 10);
    let oneSetWidth = 0;
    const fragment = document.createDocumentFragment();

    topCryptos.forEach((crypto, index) => {
        const coinElement = createCoinElement(crypto);
        fragment.appendChild(coinElement);

        if (index < topCryptos.length - 1) {
            const separator = document.createElement('div');
            separator.classList.add('footer-separator');
            separator.textContent = '|';
            fragment.appendChild(separator);
        }
    });
    
    marqueeContent.appendChild(fragment.cloneNode(true)); 

    // Calculate width after elements are added
    setTimeout(() => {
        Array.from(marqueeContent.children).forEach(child => {
            oneSetWidth += child.offsetWidth + 
                           parseFloat(getComputedStyle(child).marginLeft) + 
                           parseFloat(getComputedStyle(child).marginRight);
        });

        const fullSetWithSeparators = fragment.cloneNode(true);
        marqueeContent.appendChild(fullSetWithSeparators); 
        marqueeContent.style.width = `${oneSetWidth * 2}px`;

        const speed = 50;
        const duration = oneSetWidth / speed;

        const styleSheet = document.styleSheets[0];
        const keyframes = 
            `@keyframes scrollLeftToRight {
                0% { transform: translateX(0); }
                100% { transform: translateX(-${oneSetWidth}px); }
            }`;
        
        try {
             styleSheet.insertRule(keyframes, styleSheet.cssRules.length);
        } catch (e) {
            console.warn("Could not insert keyframes rule:", e);
            const styleTag = document.createElement('style');
            styleTag.type = 'text/css';
            styleTag.innerHTML = keyframes;
            document.head.appendChild(styleTag);
        }

        marqueeContent.style.animation = `scrollLeftToRight ${duration}s linear infinite`;
    }, 100);
}

// Export functions to be used in other modules
export { fetchCoinData, createCoinElement, populateFooter }; 
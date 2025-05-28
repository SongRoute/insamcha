async function fetchCoinData() {
    try {
        const response = await fetch('../../data.json'); // Corrected path to root directory
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Could not fetch coin data:", error);
        return null;
    }
}

function formatCoinValue(value, change, percentage) {
    const valueFormatter = new Intl.NumberFormat('en-US');
    const sign = change >= 0 ? '+' : '';
    return `${valueFormatter.format(value)} (${sign}${valueFormatter.format(change)}, ${sign}${percentage.toFixed(2)}%)`;
}

function createCoinElement(coin) {
    const itemGroup = document.createElement('div');
    itemGroup.classList.add('footer-item-group');

    const label = document.createElement('div');
    label.classList.add('footer-coin-label');
    label.textContent = coin.name;

    const valueDiv = document.createElement('div');
    valueDiv.classList.add('footer-coin-value');
    valueDiv.textContent = formatCoinValue(coin.value, coin.change, coin.change_percentage);

    if (coin.change > 0) {
        valueDiv.classList.add('coin-value-red');
    } else if (coin.change < 0) {
        valueDiv.classList.add('coin-value-blue');
    } else {
        valueDiv.style.color = 'white';
    }

    itemGroup.appendChild(label);
    itemGroup.appendChild(valueDiv);
    return itemGroup;
}

async function populateFooter() {
    const coinData = await fetchCoinData();
    if (!coinData) return;

    const marqueeContent = document.querySelector('#footer .ltr-marquee-content');
    if (!marqueeContent) {
        console.error("Marquee content element not found");
        return;
    }
    marqueeContent.innerHTML = '';

    const coinKeys = Object.keys(coinData);
    let oneSetWidth = 0;
    const fragment = document.createDocumentFragment();

    coinKeys.forEach((key, index) => {
        const coin = coinData[key];
        const coinElement = createCoinElement(coin);
        fragment.appendChild(coinElement);

        if (index < coinKeys.length - 1) {
            const separator = document.createElement('div');
            separator.classList.add('footer-separator');
            separator.textContent = '|';
            fragment.appendChild(separator);
        }
    });
    
    marqueeContent.appendChild(fragment.cloneNode(true)); 

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
}

// Export functions to be used in other modules
export { fetchCoinData, formatCoinValue, createCoinElement, populateFooter }; 
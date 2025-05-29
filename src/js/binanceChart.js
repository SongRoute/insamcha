// insamcha/src/js/binanceChart.js

// Chart.js 라이브러리가 이 스크립트보다 먼저 로드되었는지 확인하세요 (index.html에서 처리됨).

class BinanceChart {
    constructor() {
        this.ws = null;
        this.chart = null;
        this.priceData = [];
        this.maxDataPoints = 50;
        this.currentSymbol = 'btcusdt';
        this.lastPrice = 0;

        this.initChart();
        this.bindEvents();
    }

   initChart() {
        const ctx = document.getElementById('priceChart').getContext('2d');
        if (!ctx) {
            console.error("ID 'priceChart'를 가진 캔버스 요소를 찾을 수 없습니다.");
            return;
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: '가격',
                    data: [],
                    // 색상 조정: 추세선은 #f0b90b (바이낸스 강조색) 또는 #00ff88 (상승) / #ff4757 (하락)
                    // 초기 색상을 바이낸스 강조색으로 설정하고, 데이터 수신 시 변경
                    borderColor: '#f0b90b', // 초기 차트 선 색상을 바이낸스 강조색으로 설정
                    backgroundColor: 'rgba(240, 185, 11, 0.1)', // 강조색의 투명한 버전
                    borderWidth: 3,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#f0b90b', // 초기 포인트 색상
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#e0e0e0', // 범례 텍스트 색상을 밝은 회색으로 변경
                            font: {
                                size: 14,
                                family: 'Roboto, sans-serif' // 글꼴 일관성 유지
                            }
                        }
                    },
                    tooltip: { // 툴팁 스타일 개선
                        backgroundColor: '#333333', // 어두운 배경
                        titleColor: '#f0b90b', // 제목 색상 강조
                        bodyColor: '#e0e0e0', // 본문 색상 밝게
                        borderColor: '#555555', // 테두리 색상
                        borderWidth: 1,
                        cornerRadius: 4,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += '$' + context.parsed.y.toLocaleString();
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: {
                            color: '#a0a0a0', // x축 눈금 색상
                            maxTicksLimit: 10,
                            font: {
                                family: 'Roboto, sans-serif' // 글꼴 일관성 유지
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)', // 더 미묘한 격자선 (거의 보이지 않게)
                            drawBorder: true,
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                        }
                    },
                    y: {
                        ticks: {
                            color: '#a0a0a0', // y축 눈금 색상
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            },
                            font: {
                                family: 'Roboto, sans-serif' // 글꼴 일관성 유지
                            }
                        },
                        grid: {
                            color: 'rgba(255, 255, 255, 0.08)', // 더 미묘한 격자선
                            drawBorder: true,
                            borderColor: 'rgba(255, 255, 255, 0.1)'
                        }
                    }
                },
                animation: {
                    duration: 500 // 애니메이션 부드럽게
                }
            }
        });
    }

    bindEvents() {
        // 리스너를 추가하기 전에 요소가 존재하는지 확인
        const connectBtn = document.getElementById('connectBtn');
        const disconnectBtn = document.getElementById('disconnectBtn');
        const clearBtn = document.getElementById('clearBtn');
        const symbolSelect = document.getElementById('symbolSelect');

        if (connectBtn) connectBtn.addEventListener('click', () => { this.connect(); });
        else console.error("요소 #connectBtn을 찾을 수 없습니다.");

        if (disconnectBtn) disconnectBtn.addEventListener('click', () => { this.disconnect(); });
        else console.error("요소 #disconnectBtn을 찾을 수 없습니다.");

        if (clearBtn) clearBtn.addEventListener('click', () => { this.clearChart(); });
        else console.error("요소 #clearBtn을 찾을 수 없습니다.");

        if (symbolSelect) symbolSelect.addEventListener('change', (e) => {
            this.currentSymbol = e.target.value;
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                this.disconnect();
                setTimeout(() => this.connect(), 500);
            }
        });
        else console.error("요소 #symbolSelect을 찾을 수 없습니다.");
    }

    connect() {
        if (this.ws) {
            this.ws.close();
        }

        const tickerStream = `${this.currentSymbol}@ticker`;
        this.ws = new WebSocket(`wss://stream.binance.com:9443/ws/${tickerStream}`);

        this.ws.onopen = () => {
            this.updateStatus('연결됨', true);
            console.log('바이낸스 웹소켓 연결됨');
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.handleTickerData(data);
            } catch (error) {
                console.error('데이터 파싱 오류:', error);
            }
        };

        this.ws.onclose = () => {
            this.updateStatus('연결 해제됨', false);
            console.log('바이낸스 웹소켓 연결 해제됨');
        };

        this.ws.onerror = (error) => {
            this.updateStatus('연결 오류', false);
            console.error('웹소켓 오류:', error);
        };
    }

    handleTickerData(data) {
        const currentPrice = parseFloat(data.c);
        const priceChange = parseFloat(data.P);
        const volume = parseFloat(data.v);
        const highPrice = parseFloat(data.h);
        const lowPrice = parseFloat(data.l);

        this.updatePriceInfo(currentPrice, priceChange, volume, highPrice, lowPrice);
        this.addPricePoint(currentPrice);
        this.lastPrice = currentPrice;
    }

    updatePriceInfo(price, change, volume, high, low) {
        const currentPriceElem = document.getElementById('currentPrice');
        if (currentPriceElem) currentPriceElem.textContent = '$' + price.toLocaleString();

        const changeElement = document.getElementById('priceChange');
        if (changeElement) {
            changeElement.textContent = change.toFixed(2) + '%';
            changeElement.className = 'price-value ' + (change >= 0 ? 'price-up' : 'price-down');
        }

        const volumeElem = document.getElementById('volume');
        if (volumeElem) volumeElem.textContent = volume.toLocaleString();

        const highPriceElem = document.getElementById('highPrice');
        if (highPriceElem) highPriceElem.textContent = '$' + high.toLocaleString();

        const lowPriceElem = document.getElementById('lowPrice');
        if (lowPriceElem) lowPriceElem.textContent = '$' + low.toLocaleString();
    }

    addPricePoint(price) {
        const now = new Date();
        const timeLabel = now.getHours().toString().padStart(2, '0') + ':' +
            now.getMinutes().toString().padStart(2, '0') + ':' +
            now.getSeconds().toString().padStart(2, '0');

        this.priceData.push(price);
        this.chart.data.labels.push(timeLabel);
        this.chart.data.datasets[0].data.push(price);

        if (this.priceData.length > this.maxDataPoints) {
            this.priceData.shift();
            this.chart.data.labels.shift();
            this.chart.data.datasets[0].data.shift();
        }

        // 가격 추세에 따라 선 색상 변경
        if (this.lastPrice > 0) {
            const color = price >= this.lastPrice ? '#00ff88' : '#ff4757'; // 녹색 또는 빨간색
            this.chart.data.datasets[0].borderColor = color;
            this.chart.data.datasets[0].pointBackgroundColor = color;
        }

        this.chart.update('none');
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    clearChart() {
        this.priceData = [];
        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];
        this.chart.update();

        // 가격 정보 초기화
        if (document.getElementById('currentPrice')) document.getElementById('currentPrice').textContent = '-';
        if (document.getElementById('priceChange')) document.getElementById('priceChange').textContent = '-';
        if (document.getElementById('volume')) document.getElementById('volume').textContent = '-';
        if (document.getElementById('highPrice')) document.getElementById('highPrice').textContent = '-';
        if (document.getElementById('lowPrice')) document.getElementById('lowPrice').textContent = '-';
    }

    updateStatus(message, isConnected) {
        const statusElement = document.getElementById('status');
        if (statusElement) {
            statusElement.textContent = message;
            statusElement.className = 'status ' + (isConnected ? 'connected' : 'disconnected');
        }
    }
}

// 다른 모듈에서 사용할 수 있도록 클래스를 내보냅니다.
export default BinanceChart;
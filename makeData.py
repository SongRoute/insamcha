import datetime
import random
import json

def generate_price_data(days=3, initial_price=1000.0):
    data = []
    # 시작 날짜를 2024년 1월 1일 00:00:00 UTC로 설정 (원하는 날짜로 변경 가능)
    start_time = datetime.datetime(2024, 1, 1, 0, 0, 0, tzinfo=datetime.timezone.utc)
    current_price = initial_price

    for i in range(days * 24 * 60): # 일 * 시간 * 분
        timestamp = start_time + datetime.timedelta(minutes=i)
        
        # 가격 변동 시뮬레이션 (현재 가격의 -0.5% ~ +0.5% 범위)
        price_change_percent = random.uniform(-0.005, 0.005)
        current_price += current_price * price_change_percent
        
        # 가격이 너무 낮아지지 않도록 최소 가격 설정 (예: 1 KRW)
        current_price = max(current_price, 1.0)

        data.append({
            "timestamp": timestamp.isoformat().replace("+00:00", "Z"), # UTC 표현을 Z로 변경
            "price": round(current_price, 2) # 소수점 둘째 자리까지 반올림
        })
    return data

if __name__ == "__main__":
    # 한 달치 데이터 생성
    price_data = generate_price_data(days=3)
    # JSON 형식으로 출력
    print(json.dumps(price_data, indent=2))
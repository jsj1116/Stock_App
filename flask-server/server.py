from flask import Flask, request, jsonify
from flask_cors import CORS
from sqlalchemy import create_engine
import pandas as pd
import matplotlib.pyplot as plt
# import io
# import base64
import pymysql
import json
import numpy as np
import plotly
import plotly.graph_objs as go

app = Flask(__name__)
CORS(app)

# 데이터베이스 연결 함수
def get_db_connection():
    connection = pymysql.connect(
        host='127.0.0.1',
        user='root',
        password='0000',
        db='stock_db',
        port=3306,
        cursorclass=pymysql.cursors.DictCursor
    )
    return connection

@app.route("/", methods=["POST", "GET"])
def home():
    top_10 = []
    bottom_10 = []
    
    # 기본값 설정
    sector = "IT"  
    start_date = "2019-08-29"  
    end_date = "2024-08-29"   
    
    if request.method == "POST":
        data = request.get_json()  # JSON 요청 데이터 가져오기
        sector = data.get("category", "IT")
        start_date = data.get("startDate", "2019-08-29")
        end_date = data.get("endDate", "2024-08-29")
        
        with get_db_connection() as connection:
            with connection.cursor() as cursor:

                query1 = """
                SELECT kt.*
                FROM kor_ticker kt
                JOIN kor_sector ks ON kt.종목코드 = ks.CMP_CD
                WHERE kt.기준일 = (SELECT MAX(기준일) FROM kor_ticker)
                    AND kt.종목구분 = '보통주'
                    AND ks.SEC_NM_KOR = %s
                """
                cursor.execute(query1, (sector,))
                stocks = cursor.fetchall()
                
 
                query2 = """
                SELECT 종목코드, 날짜, 종가 
                FROM kor_price 
                WHERE 날짜 >= %s AND 날짜 <= %s
                """
                cursor.execute(query2, (start_date, end_date))
                prices = cursor.fetchall()
       
        if prices and stocks: 
            price_list = pd.DataFrame(prices)
            price_pivot = price_list.pivot(index='날짜', columns='종목코드', values='종가')
            
            ret_list = pd.DataFrame(data=(price_pivot.iloc[-1] / price_pivot.iloc[0]) - 1, columns=['return'])
            
            stocks_df = pd.DataFrame(stocks)
            data_bind = stocks_df[['종목코드', '종목명']].merge(ret_list, how='left', left_on='종목코드', right_index=True)
            
            data_bind['return'] = data_bind['return'].fillna(0)
            data_bind['momentum_rank'] = data_bind['return'].rank(axis=0, ascending=False, method='first')
            data_bind = data_bind.sort_values(by='momentum_rank')
            
            top_10_momentum = data_bind[data_bind['momentum_rank'] <= 10]
            top_10_momentum_sorted = top_10_momentum.sort_values(by='momentum_rank')
            top_10_momentum_sorted['return'] = (top_10_momentum_sorted['return']).round(2)
            top_10 = top_10_momentum_sorted.to_dict('records')

            bottom_10_momentum = data_bind[data_bind['momentum_rank'] > len(data_bind) - 10]
            bottom_10_momentum_sorted = bottom_10_momentum.sort_values(by='momentum_rank', ascending=False)
            bottom_10_momentum_sorted['return'] = (bottom_10_momentum_sorted['return']).round(2)
            bottom_10 = bottom_10_momentum_sorted.to_dict('records')
        
        # JSON 데이터 반환
        return jsonify({
            "top_10": top_10,
            "bottom_10": bottom_10,
            "selected_category": sector,
            "start_date": start_date,
            "end_date": end_date,
        })

    # 기본 GET 요청에 대한 처리 (옵션)
    return {
        "message": "Use POST request to get momentum data."
    }, 405

def calculate_momentum_returns(price_data, dates):
    df = pd.DataFrame(price_data)
    df['날짜'] = pd.to_datetime(df['날짜'])
    df = df.sort_values('날짜')
    
    momentum_periods = {
        '1일': 1,
        '1주': 7,
        '15일': 15,
        '1개월': 30,
        '2개월': 60,
        '3개월': 90,
        '6개월': 180,
        '1년': 365
    }
    
    returns = {}
    
    for period_name, days in momentum_periods.items():
        try:
            if len(df) > days:
                past_price = df['종가'].iloc[-days-1]  # days+1 전의 가격
                current_price = df['종가'].iloc[-days]  # days 전의 가격
                momentum = ((current_price - past_price) / past_price) * 100
                returns[period_name] = round(momentum, 2)
            else:
                returns[period_name] = None
        except Exception as e:
            returns[period_name] = None
    
    return returns

@app.route("/page", methods=["GET", "POST"])
def page():
    stock_info = None
    stock_info1 = None
    stock_info2 = {}
    top_10 = []
    bottom_10 = []
    
    if request.method == "POST":
        data = request.get_json()
        stock_code = data.get('stock_code')
        # stock_code = request.form.get('stock_code')
        start_date = "2023-08-29"  
        end_date = "2024-08-29"   
        
        with get_db_connection() as connection:
            with connection.cursor(pymysql.cursors.DictCursor) as cursor:
                # 주식 재무제표 데이터 조회
                sample_fs = """
                SELECT * FROM kor_fis
                WHERE 공시구분 = 'q'
                AND 종목코드 = %s
                AND 계정 IN ('당기순이익', '자본', '영업활동으로인한현금흐름', '매출액');
                """
                cursor.execute(sample_fs, (stock_code,))
                sample_fs = cursor.fetchall()
                
                # 주식 티커 데이터 조회
                ticker_list = """
                SELECT * FROM kor_ticker
                WHERE 기준일 = (SELECT MAX(기준일) FROM kor_ticker) 
                AND 종목구분 = '보통주'
                AND 종목코드 = %s;
                """
                cursor.execute(ticker_list, (stock_code,))
                ticker_list = cursor.fetchone()

                # DY 계산 (배당수익률)
                if ticker_list and ticker_list['종가'] != 0:  
                    DY = (ticker_list['주당배당금'] / ticker_list['종가']) * 100  
                    stock_info2['DY'] = round(DY, 2)
                else:
                    stock_info2['DY'] = 0
                
                # 특정 날짜 주식 데이터 조회
                query4 = """
                SELECT 날짜, 시가, 고가, 저가, 종가, 거래량
                FROM kor_price
                WHERE 종목코드 = %s
                AND 날짜 = '2024-08-29'
                """
                cursor.execute(query4, (stock_code,))
                price_data1 = cursor.fetchone()
                
                if price_data1:
                    stock_info1 = { 
                        '시가': int(price_data1['시가']),
                        '고가': int(price_data1['고가']),
                        '저가': int(price_data1['저가']),
                        '거래량': int(price_data1['거래량'])
                    }
                
                # 주식 종목 정보 조회
                query3 = """
                SELECT 날짜, 시가, 고가, 저가, 종가, 거래량
                FROM kor_price
                WHERE 종목코드 = %s
                """
                cursor.execute(query3, (stock_code,))
                price_data = cursor.fetchall()

                # 종목 상세 정보 조회
                query4 = """
                SELECT kt.*, ks.SEC_NM_KOR
                FROM kor_ticker kt
                JOIN kor_sector ks ON kt.종목코드 = ks.CMP_CD
                WHERE kt.종목코드 = %s
                AND kt.기준일 = (SELECT MAX(기준일) FROM kor_ticker)
                """
                cursor.execute(query4, (stock_code,))
                stock_info = cursor.fetchone()
                
                if stock_info:
                    stock_info['price_history'] = price_data

                # 모멘텀 계산 (상위 10개, 하위 10개 종목)
                query1 = """
                SELECT kt.* FROM kor_ticker kt
                JOIN kor_sector ks ON kt.종목코드 = ks.CMP_CD
                WHERE kt.기준일 = (SELECT MAX(기준일) FROM kor_ticker)
                    AND kt.종목구분 = '보통주'
                """
                cursor.execute(query1)
                stocks = cursor.fetchall()

                query2 = """
                SELECT 종목코드, 날짜, 종가 
                FROM kor_price 
                WHERE 날짜 >= %s AND 날짜 <= %s
                """
                cursor.execute(query2, (start_date, end_date))
                prices = cursor.fetchall()
                
        if prices and stocks:  
            price_list = pd.DataFrame(prices)
            price_pivot = price_list.pivot(index='날짜', columns='종목코드', values='종가')
            
            ret_list = pd.DataFrame(data=(price_pivot.iloc[-1] / price_pivot.iloc[0]) - 1, columns=['return'])
            
            stocks_df = pd.DataFrame(stocks)
            data_bind = stocks_df[['종목코드', '종목명']].merge(ret_list, how='left', left_on='종목코드', right_index=True)
            
            data_bind['return'] = data_bind['return'].fillna(0)
            data_bind['momentum_rank'] = data_bind['return'].rank(axis=0, ascending=False, method='first')
            data_bind = data_bind.sort_values(by='momentum_rank')
            
            top_10_momentum = data_bind[data_bind['momentum_rank'] <= 10]
            top_10_momentum_sorted = top_10_momentum.sort_values(by='momentum_rank')
            top_10_momentum_sorted['return'] = (top_10_momentum_sorted['return']).round(2)
            top_10 = top_10_momentum_sorted.to_dict('records')

            bottom_10_momentum = data_bind[data_bind['momentum_rank'] > len(data_bind) - 10]
            bottom_10_momentum_sorted = bottom_10_momentum.sort_values(by='momentum_rank', ascending=False)
            bottom_10_momentum_sorted['return'] = (bottom_10_momentum_sorted['return']).round(2)
            bottom_10 = bottom_10_momentum_sorted.to_dict('records')

        if price_data:
            # 주가 차트 생성
            dates = [item['날짜'] for item in price_data]
            prices = [item['종가'] for item in price_data]
            
            fig1 = go.Figure(data=[go.Scatter(x=dates, y=prices, mode='lines')])
            fig1.update_layout(
                title=None,
                template='plotly_white',
                plot_bgcolor='#f8f9fa',
                paper_bgcolor='#f8f9fa',
                yaxis=dict(
                    tickformat=',',
                    separatethousands=True,
                    ticksuffix='.00',
                    fixedrange=True
                ),
                xaxis=dict(fixedrange=True),
                margin=dict(l=40, r=20, t=30, b=20),
                showlegend=False,
                height=245
            )
            
            # 모멘텀 차트 생성
            momentum_returns = calculate_momentum_returns(price_data, dates)
            fig2 = go.Figure(data=[go.Bar(
                x=list(momentum_returns.keys()), y=list(momentum_returns.values())
            )])
            fig2.update_layout(
                title=None,
                template='plotly_white',
                plot_bgcolor='#f8f9fa',
                paper_bgcolor='#f8f9fa',
                yaxis=dict(
                    tickformat=',',
                    separatethousands=True,
                    ticksuffix='%'
                ),
                xaxis=dict(fixedrange=True),
                margin=dict(l=40, r=20, t=30, b=20),
                showlegend=False,
                height=245
            )
            
            chart_json = json.dumps(fig1, cls=plotly.utils.PlotlyJSONEncoder)
            momentum_json = json.dumps(fig2, cls=plotly.utils.PlotlyJSONEncoder)

            return jsonify(
                chart_json=chart_json, 
                momentum_json=momentum_json, 
                stock_info=stock_info,
                stock_info1=stock_info1,
                stock_info2=stock_info2,
                top_10=top_10,
                bottom_10=bottom_10
            )

if __name__ == '__main__':
    app.run(debug=True)

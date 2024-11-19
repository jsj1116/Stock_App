import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Plot from 'react-plotly.js';
import { useLocation, useNavigate } from 'react-router-dom';

const StockDetailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();  // 페이지 이동을 위한 훅
  const { stockData } = location.state; // 전달된 데이터 받아오기
  const [graph, setGraph] = useState(null); // 종가 그래프 이미지
  const [momentumGraph, setMomentumGraph] = useState(null); // 모멘텀 그래프 이미지
  const [stockInfo, setStockInfo] = useState(null);
  const [stockInfo1, setStockInfo1] = useState(null);
  const [stockInfo2, setStockInfo2] = useState(null);
  const [loading, setLoading] = useState(true); // 로딩 상태
  const [top10, setTop10] = useState([]); // Top 10 데이터
  const [bottom10, setBottom10] = useState([]); // Bottom 10 데이터

  useEffect(() => {
    // localStorage에서 Top 10과 Bottom 10 데이터를 가져옴
    const storedTop10 = JSON.parse(localStorage.getItem('topListData')) || [];
    const storedBottom10 = JSON.parse(localStorage.getItem('bottomListData')) || [];
    setTop10(storedTop10);
    setBottom10(storedBottom10);

    const fetchStockDetails = async () => {
      try {
        // API 요청 보내기
        const response = await axios.post('http://localhost:5000/page', {
          stock_code: stockData.종목코드,  // 요청 데이터 추가
        });
        
        // 서버로부터 받은 응답 데이터 출력
        console.log('서버 응답:', response.data);
        
        const data = response.data;
        setGraph(data.chart_json);
        setMomentumGraph(data.momentum_json);
        setStockInfo(data.stock_info);
        setStockInfo1(data.stock_info1);
        setStockInfo2(data.stock_info2);
        setTop10(data.top_10);
        setBottom10(data.bottom_10);
        setLoading(false);  // 로딩 끝내기
  
      } catch (error) {
        console.error('데이터를 가져오는 데 실패했습니다:', error);
      }
    };
  
    fetchStockDetails();
  }, [stockData]);

  const handleBackToMain = () => {
    navigate('/'); // 메인 페이지로 이동
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <button
        onClick={handleBackToMain}
        style={{
          padding: '10px 20px',
          backgroundColor: '#f9f9f9',
          color: 'black',
          border: 'none',
          borderRadius: '5px',
          marginBottom: '20px',
          cursor: 'pointer',
        }}
      >
        홈으로 돌아가기
      </button>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>{stockData.종목명}</h2>

      {/* 메인 레이아웃 */}
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 왼쪽: 그래프 섹션 */}
        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 종가 그래프 */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '20px',
            }}
          >
            <h3>종가 그래프</h3>
            {loading ? (
              <p>데이터를 불러오는 중...</p>
            ) : graph ? (
              // <img
              //   src={`data:image/png;base64,${graph}`}
              //   alt={`${stockData.종목명} Graph`}
              //   style={{ width: '100%', borderRadius: '10px' }}
              // />
              <Plot
                data={graph.data} // chart_json의 data 부분을 전달
                layout={graph.layout} // chart_json의 layout 부분을 전달
                config={graph.config} // chart_json의 config 부분을 전달 (옵션)
              />
            ) : (
              <p>그래프 데이터를 불러오는 중...</p>
            )}
          </div>

          {/* 모멘텀 그래프 */}
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '10px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              padding: '20px',
            }}
          >
            <h3>모멘텀 그래프</h3>
            {loading ? (
              <p>데이터를 불러오는 중...</p>
            ) : momentumGraph ? (
              <Plot
                data={momentumGraph.data} // chart_json의 data 부분을 전달
                layout={momentumGraph.layout} // chart_json의 layout 부분을 전달
                config={momentumGraph.config} // chart_json의 config 부분을 전달 (옵션)
              />
            ) : (
              <p>모멘텀 그래프 데이터를 불러오는 중...</p>
            )}
          </div>
        </div>
        {/* 지표 섹션 */}
        <div
          style={{
            flex: 1,
            marginTop: '20px',
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            padding: '20px',
          }}
        >
          <h3>종목 지표</h3>
          {loading ? (
            <p>데이터를 불러오는 중...</p>
          ) : stockInfo ? (
            <ul style={{ listStyle: 'none', padding: '0' }}>
              <li>• 종목명: {stockInfo.name}</li>
              <li>• 현재가: {stockInfo.price}</li>
              <li>• 시가총액: {stockInfo.market_cap}</li>
            </ul>
          ) : (
            <p>종목 정보 데이터를 불러오는 중...</p>
          )}

          <h4>기타 지표 1</h4>
          {stockInfo1 ? (
            <ul style={{ listStyle: 'none', padding: '0' }}>
              <li>• P/E: {stockInfo1["P/E"]}</li>
              <li>• EPS: {stockInfo1["EPS"]}</li>
            </ul>
          ) : (
            <p>기타 지표 데이터를 불러오는 중...</p>
          )}

          <h4>기타 지표 2</h4>
          {stockInfo2 ? (
            <ul style={{ listStyle: 'none', padding: '0' }}>
              <li>• 배당 수익률: {stockInfo2.dividend_yield}</li>
              <li>• Beta: {stockInfo2.beta}</li>
            </ul>
          ) : (
            <p>기타 지표 데이터를 불러오는 중...</p>
          )}
        </div>
        <div
          style={{
            flex: 1,
            backgroundColor: '#f9f9f9',
            borderRadius: '10px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            padding: '20px',
          }}
        >
          <h3>Top 10</h3>
          <ul style={{ listStyle: 'none', padding: '0' }}>
            {top10.length === 0 ? (
              <p>데이터가 없습니다.</p>
            ) : (
              top10.map((item, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>
                  {index + 1}. {item.종목명}{' '}
                  <span style={{ color: 'green' }}>+{item.return.toFixed(2)}%</span>
                </li>
              ))
            )}
          </ul>

          <h3 style={{ marginTop: '20px' }}>Bottom 10</h3>
          <ul style={{ listStyle: 'none', padding: '0' }}>
            {bottom10.length === 0 ? (
              <p>데이터가 없습니다.</p>
            ) : (
              bottom10.map((item, index) => (
                <li key={index} style={{ marginBottom: '10px' }}>
                  {index + 1}. {item.종목명}{' '}
                  <span style={{ color: 'red' }}>{item.return.toFixed(2)}%</span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StockDetailPage;


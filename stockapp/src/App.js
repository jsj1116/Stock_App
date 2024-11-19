// App.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BrowserRouter as Router, Route, Routes, useNavigate } from 'react-router-dom';
import StockDetailPage from './component/stock';  // StockDetailPage를 stock.js에서 가져옴
import './App.css';

// App 컴포넌트
const App = () => {
  const [sector, setSector] = useState("IT");
  const [topListData, setTopListData] = useState([]);
  const [bottomListData, setBottomListData] = useState([]);
  // const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [startDate, setStartDate] = useState('2020-01-01'); // 시작일 기본값
  const [endDate, setEndDate] = useState('2024-01-31'); // 종료일 기본값
  const [isLoading, setIsLoading] = useState(false); // 로딩 상태 추가
  const navigate = useNavigate();  // 페이지 이동을 위한 훅

  useEffect(() => {
    const storedTopListData = localStorage.getItem('topListData');
    const storedBottomListData = localStorage.getItem('bottomListData');

    if (storedTopListData && storedBottomListData) {
      // localStorage에 데이터가 있으면 해당 데이터를 불러옴
      setTopListData(JSON.parse(storedTopListData));
      setBottomListData(JSON.parse(storedBottomListData));
    } else {
      // localStorage에 데이터가 없으면 서버에서 데이터를 요청
      setTopListData([]);
      setBottomListData([]);
    }
  }, []);

  const handleCategoryButtonClick = (category) => {
    setSector(category);
  };

  const fetchData = () => {
    setIsLoading(true);
    axios
      .post('http://localhost:5000/', {
        category: sector,
        start_date: startDate, // 선택한 시작일
        end_date: endDate, // 선택한 종료일
      })
      .then((response) => {
        console.log(response.data);
        const { top_10, bottom_10 } = response.data;
        setTopListData(top_10);
        setBottomListData(bottom_10);

        // 로컬 스토리지에 데이터 저장
        localStorage.setItem('topListData', JSON.stringify(top_10));
        localStorage.setItem('bottomListData', JSON.stringify(bottom_10));
      })
      .catch((error) => {
        console.error('데이터 요청에 실패했습니다:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // const handleITButtonClick = () => {
  //   setIsButtonClicked(true);
  //   fetchData(); // 데이터 요청 함수 호출
  // };

  const handleDateChange = (e, isStartDate) => {
    const newDate = e.target.value;
    if (isStartDate) {
      setStartDate(newDate);
    } else {
      setEndDate(newDate);
    }
  };

  const handleStockClick = (stockData) => {
    // 종목 클릭 시, 종목 데이터를 전달하여 상세 페이지로 이동
    navigate('/page', { state: { stockData } });
  };

  return (
    <div className="container">
      {/* 카테고리 버튼 */}
      <div className="category-buttons">
        <button
          onClick={() => handleCategoryButtonClick("IT")}
          className={sector === "IT" ? 'button-clicked' : ''}
        >
          IT
        </button>
        <button
          onClick={() => handleCategoryButtonClick("금융")}
          className={sector === "금융" ? 'button-clicked' : ''}
        >
          금융
        </button>
        <button
          onClick={() => handleCategoryButtonClick("반도체")}
          className={sector === "반도체" ? 'button-clicked' : ''}
        >
          반도체
        </button>
      </div>

      {/* 기간 설정 */}
      <div className="date-settings">
        <span>기간 설정</span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => handleDateChange(e, true)}
        />
        <span>~</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => handleDateChange(e, false)}
        />
        <button onClick={fetchData}>데이터 요청</button>
      </div>

      {/* 로딩 표시 */}
      {isLoading ? (
        <div className="loading">
          <p>로딩 중...</p>
        </div>
      ) : (
        <div className="top-list">
          {/* Top 10 리스트 */}
          <div className="top-list-column">
            <h2>Top 10</h2>
            {topListData.length === 0 ? (
              <p>데이터가 없습니다.</p>
            ) : (
              topListData.map((item, index) => (
                <div className="list-item" key={index} onClick={() => handleStockClick(item)}>
                  <span className="rank">{item.momentum_rank}</span>
                  <div>
                    <span>{item.종목명}</span>
                    {/* <span>{item.종목코드}</span> */}
                  </div>
                  <span className="change positive">+{(item.return).toFixed(2)}%</span>
                </div>
              ))
            )}
          </div>

          {/* 구분선 */}
          <div className="divider" />

          {/* Bottom 10 리스트 */}
          <div className="top-list-column">
            <h2>Bottom 10</h2>
            {bottomListData.length === 0 ? (
              <p>데이터가 없습니다.</p>
            ) : (
              bottomListData.map((item, index) => (
                <div className="list-item" key={index} onClick={() => handleStockClick(item)}>
                  <span className="rank">{item.momentum_rank}</span>
                  <div>
                    <span>{item.종목명}</span>
                  </div>
                  <span className="change negative">{(item.return).toFixed(2)}%</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// React Router 설정
const MainApp = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/page" element={<StockDetailPage />} /> {/* StockDetailPage를 stock.js에서 가져옴 */}
      </Routes>
    </Router>
  );
};

export default MainApp;

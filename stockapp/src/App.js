import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import StockPage from './component/stock'; // StockPage 컴포넌트 불러오기

// 주식 데이터
const categories = ["IT", "금융", "생명"];
const stocks = [
  { rank: 1, name: "삼성전자", category: "전자제품", change: "+23.5%", positive: true, id: 1 },
  { rank: 2, name: "SK하이닉스", category: "반도체", change: "+21.2%", positive: true, id: 2 },
  // 더 많은 종목 데이터 추가 가능
];

function App() {
  return (
    <Router>
      <div style={{ padding: '20px' }}>
        <Header />
        <FilterBar />
        <TopStocks />
      </div>

      {/* 라우팅 설정 */}
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/stock/:id" element={<StockPage />} /> {/* StockPage로 이동하는 라우트 */}
      </Routes>
    </Router>
  );
}

function Header() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
      {categories.map(category => (
        <button key={category} style={buttonStyle}>
          {category}
        </button>
      ))}
    </div>
  );
}

function FilterBar() {
  return (
    <div style={{ marginBottom: '20px' }}>
      <h3>기간 설정</h3>
      <div style={{ display: 'flex', gap: '10px' }}>
        <input type="date" placeholder="연도. 월. 일." />
        <span>~</span>
        <input type="date" placeholder="연도. 월. 일." />
      </div>
    </div>
  );
}

function TopStocks() {
  return (
    <div>
      <h2>Top 10</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {stocks.map(stock => (
          <StockCard key={stock.rank} stock={stock} />
        ))}
      </div>
    </div>
  );
}

function StockCard({ stock }) {
  return (
    <Link to={`/stock/${stock.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        border: '1px solid #eee',
        borderRadius: '10px',
        padding: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        backgroundColor: stock.positive ? '#e8f5e9' : '#ffebee',
      }}>
        <div>
          <strong>{stock.rank}. {stock.name}</strong>
          <p>{stock.category}</p>
        </div>
        <span style={{ color: stock.positive ? 'green' : 'red' }}>{stock.change}</span>
      </div>
    </Link>
  );
}

const buttonStyle = {
  backgroundColor: '#f1f1f1',
  border: 'none',
  borderRadius: '5px',
  padding: '10px 20px',
  cursor: 'pointer',
  marginRight: '10px',
};

export default App;

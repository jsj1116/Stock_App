import React from 'react';
import { useParams } from 'react-router-dom';

// 주식 데이터
const stocks = [
  { rank: 1, name: "삼성전자", category: "전자제품", change: "+23.5%", positive: true, id: 1 },
  { rank: 2, name: "SK하이닉스", category: "반도체", change: "+21.2%", positive: true, id: 2 },
  // 더 많은 종목 데이터 추가 가능
];

function StockPage() {
  // URL에서 stock ID 파라미터를 가져옴
  const { id } = useParams();

  // 해당 ID에 맞는 주식 찾기
  const stock = stocks.find(s => s.id === parseInt(id));

  if (!stock) return <div>주식 정보를 찾을 수 없습니다.</div>;

  return (
    <div>
      <h1>{stock.name}</h1>
      <p>카테고리: {stock.category}</p>
      <p>변화율: {stock.change}</p>
      <p>{stock.positive ? '긍정적 변화' : '부정적 변화'}</p>
    </div>
  );
}

export default StockPage;

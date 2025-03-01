# BTSE Order Book

即時顯示 BTSE 期貨交易所的 BTCPFC 訂單簿，包含買賣報價、最新成交價格和累計數量顯示。

## Demo

**[👉 線上 Demo](https://websocket-btse.vercel.app/)**

在線體驗完整功能，包括：
- 即時訂單簿更新
- 最新成交價格顯示
- 動態效果和視覺化展示

## 功能特點

- **即時訂單簿更新**
  - 透過 WebSocket 連接 BTSE API
  - 處理快照(snapshot)和增量(delta)更新
  - 自動處理序列號檢查和重新同步
  - 斷線自動重連

- **買賣報價顯示**
  - 顯示前 8 筆買賣報價
  - 賣單(Asks)從低到高排序
  - 買單(Bids)從高到低排序
  - 價格顯示到小數點後 1 位
  - 買賣報價使用不同顏色區分

- **最新成交價格**
  - 即時更新最新成交價格
  - 價格上漲/下跌時顯示不同顏色
  - 顯示趨勢箭頭指示器

- **累計數量視覺化**
  - 顯示每個價格等級的累計數量
  - 使用背景條展示累計數量比例
  - 買賣單使用不同顏色區分

- **動態效果**
  - 新價格出現時整行閃爍提示
  - 數量變化時對應單元格閃爍提示
  - 價格列表支持 hover 效果

## 安裝和運行

1. 克隆專案：
```bash
git clone [repository-url]
```

2. 安裝依賴：
```bash
npm install
# 或
yarn install
```

3. 運行開發服務器：
```bash
npm run dev
# 或
yarn dev
```

4. 打開瀏覽器訪問 `http://localhost:3000`

## WebSocket API

使用 BTSE Futures WebSocket API：

**Order Book**
- Endpoint: `wss://ws.btse.com/ws/oss/futures`
- Topic: `update:BTCPFC`
- 處理邏輯：
  - 首次連接接收完整快照(snapshot)
  - 後續接收增量更新(delta)
  - 通過序列號(seqNum)確保數據同步
  - 序列號不連續時自動重新訂閱

**Trade History**
- Endpoint: `wss://ws.btse.com/ws/futures`
- Topic: `tradeHistoryApi:BTCPFC`
- 用於更新最新成交價格

## 顏色方案

**背景色**
- 主背景：`#131B29`
- Hover 背景：`#1E3059`

**文字顏色**
- 表頭：`#8698aa`
- 一般文字：`#F0F4F8`
- 買入價格：`#00b15d`
- 賣出價格：`#FF5B5A`

**背景條顏色**
- 買入累計量：`rgba(16,186,104,0.12)`
- 賣出累計量：`rgba(255,90,90,0.12)`

**動畫顏色**
- 買入閃爍：`rgba(0,177,93,0.5)`
- 賣出閃爍：`rgba(255,91,90,0.5)`

## 專案結構

```
src/
├── components/
│   └── OrderList.tsx    # 訂單簿列表組件
├── pages/
│   ├── _app.tsx        # Next.js 應用入口
│   └── index.tsx       # 主頁面
├── styles/
│   └── globals.css     # 全局樣式
└── tailwind.config.js  # Tailwind 配置
```

## 使用技術

- Next.js
- TypeScript
- Tailwind CSS
- WebSocket API

## License

MIT

import { useState, useEffect, useCallback, useRef } from 'react'
import Head from 'next/head'
import OrderList from '../components/OrderList'

interface Order {
  price: number
  size: number
}

interface OrderBook {
  bids: Order[]
  asks: Order[]
}

interface BTSEOrderBookData {
  data: {
    asks: [string, string][]
    bids: [string, string][]
    prevSeqNum: number
    seqNum: number
    timestamp: number
    type: 'snapshot' | 'delta'
  }
  topic: string
}

interface BTSETradeData {
  data: {
    price: string
    size: string
    timestamp: number
    side: string
  }[]
  topic: string
}

export default function Home() {
  const [orderBook, setOrderBook] = useState<OrderBook>({
    bids: [],
    asks: []
  })
  const [lastPrice, setLastPrice] = useState<number | null>(null)
  const [priceDirection, setPriceDirection] = useState<'up' | 'down' | null>(null)
  const lastSeqNumRef = useRef<number | null>(null)
  const orderBookWs = useRef<WebSocket | null>(null)
  const tradeWs = useRef<WebSocket | null>(null)

  const processOrderBookData = useCallback((message: BTSEOrderBookData) => {
    const processOrders = (orders: [string, string][]) => {
      return orders.map(([price, size]) => ({
        price: parseFloat(price),
        size: parseFloat(size)
      }))
    }

    if (message.data.type === 'snapshot') {
      // 接收到快照數據，直接更新整個訂單簿
      console.log('snapshot data',message.data)
      lastSeqNumRef.current = message.data.seqNum
      const processedData = {
        bids: processOrders(message.data.bids),
        asks: processOrders(message.data.asks)
      }
      setOrderBook(processedData)
    } else if (message.data.type === 'delta') {
      console.log('data',message.data)

      // 檢查增量更新的序列號是否連續
      if (!lastSeqNumRef.current || message.data.prevSeqNum !== lastSeqNumRef.current) {
        console.log('Sequence gap detected, requesting new snapshot', {
          lastSeqNum: lastSeqNumRef.current,
          receivedPrevSeqNum: message.data.prevSeqNum,
          receivedSeqNum: message.data.seqNum
        })
        // 重新訂閱以獲取新的快照
        if (orderBookWs.current?.readyState === WebSocket.OPEN) {
          // 清空當前的序列號，等待新的快照
          lastSeqNumRef.current = null
          orderBookWs.current.send(JSON.stringify({
            op: "subscribe",
            args: ["update:BTCPFC"]
          }))
        }
        return
      }

      // 序列號連續，處理增量更新
      lastSeqNumRef.current = message.data.seqNum
      setOrderBook(prevOrderBook => {
        const bidMap = new Map(prevOrderBook.bids.map(bid => [bid.price, bid]))
        const askMap = new Map(prevOrderBook.asks.map(ask => [ask.price, ask]))

        const processNewOrders = (
          orders: [string, string][], 
          orderMap: Map<number, Order>
        ) => {
          orders.forEach(([price, size]) => {
            const numPrice = parseFloat(price)
            const numSize = parseFloat(size)
            
            if (numSize === 0) {
              // 移除價格等級
              orderMap.delete(numPrice)
            } else {
              // 更新或添加價格等級
              orderMap.set(numPrice, { price: numPrice, size: numSize })
            }
          })
          return Array.from(orderMap.values())
        }

        const newBids = processNewOrders(message.data.bids, bidMap)
          .sort((a, b) => b.price - a.price)
        
        const newAsks = processNewOrders(message.data.asks, askMap)
          .sort((a, b) => a.price - b.price)

        return {
          bids: newBids,
          asks: newAsks
        }
      })
    }
  }, [])

  // 設置交易WebSocket連接
  useEffect(() => {
    tradeWs.current = new WebSocket('wss://ws.btse.com/ws/futures')

    tradeWs.current.onopen = () => {
      console.log('Trade WebSocket connected')
      if (tradeWs.current?.readyState === WebSocket.OPEN) {
        tradeWs.current.send(JSON.stringify({
          op: "subscribe",
          args: ["tradeHistoryApi:BTCPFC"]
        }))
      }
    }

    tradeWs.current.onmessage = (event) => {
      try {
        const message: BTSETradeData = JSON.parse(event.data)
        if (message.topic === "tradeHistoryApi" && message.data.length > 0) {
          const newPrice = parseFloat(message.data[0].price)
          setLastPrice(prevPrice => {
            if (prevPrice !== null) {
              setPriceDirection(newPrice > prevPrice ? 'up' : 'down')
            }
            return newPrice
          })
        }
      } catch (error) {
        console.error('Error processing trade message:', error)
      }
    }

    return () => {
      if (tradeWs.current?.readyState === WebSocket.OPEN) {
        tradeWs.current.close()
      }
    }
  }, [])

  // 訂單簿WebSocket連接
  useEffect(() => {
    orderBookWs.current = new WebSocket('wss://ws.btse.com/ws/oss/futures')

    orderBookWs.current.onopen = () => {
      console.log('WebSocket connected')
      // 修正訂閱格式
      if (orderBookWs.current?.readyState === WebSocket.OPEN) {
        orderBookWs.current.send(JSON.stringify({
          op: "subscribe",
          args: ["update:BTCPFC"]
        }))
      }
    }

    orderBookWs.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        // console.log('Received message:', message)
        
        // 更新消息檢查邏輯
        if (message.topic === "update:BTCPFC") {
          processOrderBookData(message)
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error)
      }
    }

    orderBookWs.current.onerror = (error) => {
      console.error('WebSocket error:', error)
    }

    orderBookWs.current.onclose = () => {
      console.log('WebSocket connection closed')
    }

    return () => {
      if (orderBookWs.current?.readyState === WebSocket.OPEN) {
        orderBookWs.current.close()
      }
    }
  }, [processOrderBookData])

  const getLastPriceStyles = (direction: 'up' | 'down' | null) => {
    switch (direction) {
      case 'up':
        return {
          text: 'text-[#00b15d]',
          bg: 'bg-[rgba(16,186,104,0.12)]'
        }
      case 'down':
        return {
          text: 'text-[#FF5B5A]',
          bg: 'bg-[rgba(255,90,90,0.12)]'
        }
      default:
        return {
          text: 'text-[#F0F4F8]',
          bg: 'bg-[rgba(134,152,170,0.12)]'
        }
    }
  }

  return (
    <>
      <Head>
        <title>Order Book - BTCPFC</title>
        <meta name="description" content="Real-time BTSE futures order book" />
      </Head>
      <main className="min-h-screen bg-[#111] text-white p-8">
        <div className="max-w-[600px] mx-auto">
          <h1 className="text-2xl font-bold mb-8 text-center">BTCPFC Order Book</h1>
          
          <div className="bg-[#131B29] rounded p-8">
            {/* Table Headers */}
            <div className="grid grid-cols-3 text-[#8698aa] px-2 h-8 items-center text-sm mb-2">
              <span>Price (USD)</span>
              <span className="text-right">Size</span>
              <span className="text-right">Total</span>
            </div>

            {/* Asks (賣單) */}
              <OrderList orders={orderBook.asks} type="asks" />
   
            
            {/* Last Price */}
              <div className={`py-1 my-1 text-center ${getLastPriceStyles(priceDirection).bg}`}>
                {lastPrice && (
                  <span className={`text-xl font-bold px-3 py-1 rounded ${
                    getLastPriceStyles(priceDirection).text
                  }`}>
                    {lastPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1
                    })}
                    <span className="ml-2">
                      {priceDirection === 'up' && '▲'}
                      {priceDirection === 'down' && '▼'}
                    </span>
                  </span>
                )}
                {!lastPrice && (
                  <span className={`text-xl font-bold px-3 py-1 rounded ${
                    getLastPriceStyles(null).text
                  } ${getLastPriceStyles(null).bg}`}>
                    -
                  </span>
                )}
              </div>
            {/* </div> */}

            {/* Bids (買單) */}
            
              <OrderList orders={orderBook.bids} type="bids" />

          </div>
        </div>
      </main>
    </>
  )
} 
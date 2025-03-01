import { useEffect, useRef } from 'react'

interface Order {
  price: number
  size: number
}

interface OrderListProps {
  orders: Order[]
  type: 'bids' | 'asks'
}

interface OrderWithTotal extends Order {
  total: number
}

export default function OrderList({ orders = [], type }: OrderListProps) {
  const textColor = type === 'bids' ? 'text-[#00b15d]' : 'text-[#FF5B5A]'
  const highlightColor = type === 'bids' 
    ? 'bg-[rgba(0,177,93,0.5)]' 
    : 'bg-[rgba(255,91,90,0.5)]'
  const totalBarColor = type === 'bids'
    ? 'bg-[rgba(16,186,104,0.12)]'
    : 'bg-[rgba(255,90,90,0.12)]'
  
  // 用於追踪之前的所有價格
  const prevPricesRef = useRef<Set<number>>(new Set())
  const newPricesRef = useRef<Set<number>>(new Set())
  const prevSizesRef = useRef<Map<number, number>>(new Map())
  const sizeChangesRef = useRef<Map<number, 'increase' | 'decrease'>>(new Map())

  // 先計算所有訂單的累計總量
  const allOrdersWithTotal = orders.reduce<OrderWithTotal[]>((acc, order, index) => {
    const total = order.size + (index === 0 ? 0 : acc[index - 1].total)
    acc.push({ ...order, total })
    return acc
  }, [])

  // 獲取整個買賣方向的總量
  const totalSize = allOrdersWithTotal.length > 0 
    ? allOrdersWithTotal[allOrdersWithTotal.length - 1].total 
    : 0

  // 限制顯示前8個報價，但保持累計總量
  const displayOrders = type === 'asks' 
    ? allOrdersWithTotal.slice(0, 8).reverse()
    : allOrdersWithTotal.slice(0, 8)

  useEffect(() => {
    // 獲取所有當前價格
    const currentPrices = new Set(orders.map(order => order.price))
    const prevPrices = prevPricesRef.current

    // 檢查新價格（與所有訂單比較）
    newPricesRef.current = new Set(
      Array.from(currentPrices).filter(price => !prevPrices.has(price))
    )

    // 檢查數量變化
    sizeChangesRef.current.clear()
    orders.forEach(order => {
      const prevSize = prevSizesRef.current.get(order.price)
      if (prevSize !== undefined && prevSize !== order.size) {
        sizeChangesRef.current.set(
          order.price, 
          order.size > prevSize ? 'increase' : 'decrease'
        )
      }
    })

    // 更新參考值
    prevPricesRef.current = currentPrices
    prevSizesRef.current = new Map(
      orders.map(order => [order.price, order.size])
    )

    const timer = setTimeout(() => {
      newPricesRef.current.clear()
      sizeChangesRef.current.clear()
    }, 1000)

    return () => clearTimeout(timer)
  }, [orders])

  return (
    <>
      {displayOrders.map((order, index) => {
        const isNewPrice = newPricesRef.current.has(order.price)
        const sizeChange = sizeChangesRef.current.get(order.price)
        const totalPercentage = (order.total / totalSize) * 100

        return (
          <div 
            key={index} 
            className="grid grid-cols-3 px-2 my-0.5 h-8 items-center cursor-pointer relative hover:bg-[#1E3059] group"
          >
            {/* 總量背景條 */}
            <div className="col-span-3 grid grid-cols-3 absolute inset-0">
              <div className="col-start-3 relative overflow-hidden">
                <div 
                  className={`absolute right-0 top-0 bottom-0 ${totalBarColor} transition-all duration-200`}
                  style={{ width: `${totalPercentage}%` }}
                />
              </div>
            </div>

            {/* 新價格動畫背景層 */}
            {isNewPrice && (
              <div 
                className={`absolute inset-0 ${highlightColor} animate-highlight`}
              />
            )}
            
            {/* 內容層 */}
            <span className={`relative ${textColor} font-semibold`}>
              {order.price.toLocaleString(undefined, {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1
              })}
            </span>
            <div className="relative h-full">
              {sizeChange && (
                <div 
                  className={`absolute inset-0 ${
                    sizeChange === 'increase' 
                      ? 'bg-[rgba(0,177,93,0.5)]' 
                      : 'bg-[rgba(255,91,90,0.5)]'
                  } animate-sizeChange`}
                />
              )}
              <span className="block text-right text-[#F0F4F8] font-semibold relative z-10">
                {Math.floor(order.size).toLocaleString()}
              </span>
            </div>
            <span className="relative text-right text-[#F0F4F8] font-semibold">
              {Math.floor(order.total).toLocaleString()}
            </span>
          </div>
        )
      })}
    </>
  )
}
import { useEffect, useRef, useState } from "react";
import Controller from "./Controller";
import OrderManager, {
  type IOrder,
  ORDER_STATUS,
  EVENT_TYPE,
  type OrderEvent,
} from "./BaseClass/Order";
import { BOT_TYPE, type IBot } from "./BaseClass/Bot";

import "./App.css";

function App() {
  const [botList, setBotList] = useState<IBot[]>([]);
  const [orderList, setOrderList] = useState<IOrder[]>([]);
  let orderManagerRef = useRef<OrderManager | null>(null);
  let controllerRef = useRef<Controller | null>(null);

  useEffect(() => {
    const orderManager = new OrderManager();
    orderManagerRef.current = orderManager;

    const controller = new Controller({
      orderManager,
    });
    controllerRef.current = controller;

    orderManager.subscribe((data: OrderEvent) => {
      // update order
      if (data.type === EVENT_TYPE.ORDER_UPDATED) {
        setOrderList(orderManagerRef.current?.getOrderList() || []);
      }

      if (data.type === EVENT_TYPE.ORDER_COUNTER) {
        setBotList(controllerRef.current?.getBots() || []);
      }
    });
  }, []);

  return (
    <>
      <h1>FeedMe</h1>
      <div className="card">
        <button
          onClick={() => {
            controllerRef.current?.increase({ type: BOT_TYPE.NORMAL });
            setBotList(controllerRef.current?.getBots() || []);
          }}
        >
          + Bot
        </button>
        <button
          onClick={() => {
            controllerRef.current?.increase({ type: BOT_TYPE.VIP });
            setBotList(controllerRef.current?.getBots() || []);
          }}
        >
          + VIP Bot
        </button>
        <button
          onClick={() => {
            controllerRef.current?.decrease();
            setBotList(controllerRef.current?.getBots() || []);
          }}
        >
          - Bot
        </button>
      </div>
      <div className="card">
        <button
          onClick={() => {
            orderManagerRef.current?.createNormalOrder();
            setOrderList(orderManagerRef.current?.getOrderList() || []);
          }}
        >
          New Normal Order
        </button>
        <button
          onClick={() => {
            orderManagerRef.current?.createVipOrder();
            setOrderList(orderManagerRef.current?.getOrderList() || []);
          }}
        >
          New VIP Order
        </button>
      </div>
      <div className="bot-list section">
        <h2>bot list</h2>
        {botList.map((bot) => {
          return (
            <div key={bot.uid}>
              <div>
                {bot.uid}({bot.type} {bot.status} {bot.currentOrder?.counter})
              </div>
            </div>
          );
        })}
      </div>
      <div className="order-list-ready section">
        <h2>order list(preparing)</h2>
        {orderList.map((order) => {
          if (order.status === ORDER_STATUS.PENDING) {
            return (
              <div key={order.uid}>
                <div>
                  {order.uid}({order.orderType} {order.status})
                </div>
              </div>
            );
          }
        })}
      </div>
      <div className="order-list-complete section">
        <h2>order list(complete)</h2>
        {orderList.map((order) => {
          if (order.status === ORDER_STATUS.COMPLETE) {
            return (
              <div key={order.uid}>
                <div>
                  {order.uid}({order.orderType} {order.status})
                </div>
              </div>
            );
          }
        })}
      </div>
    </>
  );
}

export default App;

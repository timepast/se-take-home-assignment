/**
 * ## Order
 *
 * ### Status
 * - PENDING: Order waiting to be processed.
 * - COMPLETE: Order has been processed.
 *
 * ### Priority Rules
 * The processing priority is as follows:
 * 1. queueCache (recovered orders from destroyed bots)
 * 2. queueVipOrder
 * 3. queueNormalOrder
 *
 * ### Description
 * Each order requires 10 seconds to be processed by a bot.
 *
 * ### Actions
 * - "New Normal Order"
 *   - Creates a new normal order and appends it to queueNormalOrder.
 * - "New VIP Order"
 *   - Creates a new VIP order and appends it to queueVipOrder,
 *     which takes precedence over normal orders but not over cache orders.
 */
export type OrderStatus = "PENDING" | "COMPLETE";
export type OrderType = "NORMAL" | "VIP";

export const ORDER_STATUS = {
  PENDING: "PENDING",
  COMPLETE: "COMPLETE",
} as const;

export const ORDER_TYPE = {
  NORMAL: "NORMAL",
  VIP: "VIP",
} as const;

export interface IOrder {
  status: OrderStatus;
  uid: number;
  orderType: OrderType;
  counter: number;
}

interface IProps {
  type: OrderType;
}

export type EventType = "ORDER_ADDED" | "ORDER_UPDATED" | "ORDER_COUNTER";
export const EVENT_TYPE = {
  ORDER_ADDED: "ORDER_ADDED",
  ORDER_UPDATED: "ORDER_UPDATED",
  ORDER_COUNTER: "ORDER_COUNTER",
} as const;

export interface OrderEvent {
  type: EventType;
}

const getUid = (() => {
  let uid = 0;
  return () => uid++;
})();

class Order implements IOrder {
  status: OrderStatus = ORDER_STATUS.PENDING;
  uid = getUid();
  orderType: OrderType;
  counter: number;

  constructor(props: IProps) {
    this.orderType = props.type;
    this.counter = 0;
  }
}

/**
 * ## OrderManager
 *
 * This class handles all order creation, management, and queueing logic.
 * It also provides subscription capabilities to allow UI or controllers to react to changes.
 */
class OrderManager {
  /**
   * queueCache: High priority queue for unprocessed orders returned from destroyed bots.
   */
  private queueCache: Order[] = [];

  /**
   * queueVipOrder: Medium priority queue for VIP customer orders.
   */
  private queueVipOrder: Order[] = [];

  /**
   * queueNormalOrder: Lowest priority queue for normal customer orders.
   */
  private queueNormalOrder: Order[] = [];

  /**
   * queueComplete: Orders that have been successfully processed.
   */
  private queueComplete: Order[] = [];

  /**
   * messageQueue: Event subscribers (e.g. UI, controller).
   */
  private messageQueue: ((event: OrderEvent) => void)[] = [];

  /**
   * Create a new normal order and add it to the normal queue.
   *
   * @returns {Order} The created normal order instance.
   */
  createNormalOrder(): Order {
    const order = new Order({ type: ORDER_TYPE.NORMAL });
    this.queueNormalOrder.push(order);
    this.publish({ type: EVENT_TYPE.ORDER_ADDED });
    return order;
  }

  /**
   * Create a new VIP order and add it to the VIP queue.
   *
   * @returns {Order} The created VIP order instance.
   */
  createVipOrder(): Order {
    const order = new Order({ type: ORDER_TYPE.VIP });
    this.queueVipOrder.push(order);
    this.publish({ type: EVENT_TYPE.ORDER_ADDED });
    return order;
  }

  /**
   * Get the next order to be processed based on priority.
   * Priority: Cache > VIP > Normal
   *
   * @returns {Order | null} The next order to process, or null if no pending orders exist.
   */
  processNextOrder(): Order | null {
    const order =
      this.queueCache.shift() ||
      this.queueVipOrder.shift() ||
      this.queueNormalOrder.shift();

    if (order) {
      this.publish({ type: EVENT_TYPE.ORDER_UPDATED });
    }
    return order || null;
  }

  /**
   * Mark the given order as completed and move it to completed queue.
   *
   * @param {IOrder} order - The order to mark as completed.
   * @returns {void}
   */
  completeOrder(order: IOrder) {
    order.status = ORDER_STATUS.COMPLETE;
    this.queueComplete.push(order);
    this.publish({ type: EVENT_TYPE.ORDER_UPDATED });
  }

  /**
   * Move an interrupted (incomplete) order back to the front of the processing queue.
   *
   * @param {IOrder} order - The order to return to the pending queue.
   */
  updateCache(order: IOrder) {
    this.queueCache.unshift(order);
    this.publish({ type: EVENT_TYPE.ORDER_UPDATED });
  }

  /**
   * Subscribe to order state changes (added or updated).
   */
  subscribe(callback: (event: OrderEvent) => void) {
    this.messageQueue.push(callback);
  }

  /**
   * Notify all subscribers of an event.
   *
   * @param data - The event to broadcast.
   */
  publish(data: OrderEvent) {
    this.messageQueue.forEach((task) => {
      task(data);
    });
  }

  /**
   * Return all orders for rendering or inspection.
   *
   * @returns {Order[]} All orders in memory.
   */
  getOrderList() {
    return [
      ...this.queueCache,
      ...this.queueVipOrder,
      ...this.queueNormalOrder,
      ...this.queueComplete,
    ].slice();
  }
}

export default OrderManager;

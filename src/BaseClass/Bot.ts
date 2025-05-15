/**
 * ## Bot
 *
 * This class represents a cooking bot that processes orders one at a time.
 * Each bot can be either IDLE or RUNNING, and executes one order in 10 seconds.
 *
 * ### Bot Status
 * - RUN: Currently processing an order.
 * - IDLE: Waiting for an order.
 *
 * ### Bot Queue Behavior
 * - "+ Bot":
 *   - A new bot is created and immediately starts processing pending orders.
 *   - Once an order is picked, it takes 10 seconds to complete, and then moves to the next.
 * - "- Bot":
 *   - The latest bot is destroyed.
 *   - If it was processing an order, that order is returned to the front of the pending queue (`queue_cache`).
 */

import OrderManager, { EVENT_TYPE, type IOrder } from "./Order";

export type BotStatus = "RUN" | "IDLE";
export const BOT_STATUS = {
  RUN: "RUN",
  IDLE: "IDLE",
} as const;

export type BotType = "NORMAL" | "VIP";

export const BOT_TYPE = {
  NORMAL: "NORMAL",
  VIP: "VIP",
} as const;

export interface IBot {
  uid: number;
  status: BotStatus;
  type: BotType;
  currentOrder: IOrder | null;
  updateOrder: (order: IOrder) => void;
  completeOrder: () => void;
  counterHandle: ReturnType<typeof setInterval>;
  isDestroyed?: boolean;
}

const getUid = (() => {
  let uid = 0;
  return () => uid++;
})();

/**
 * Bot instance that can pick and process one order at a time.
 */
class Bot implements IBot {
  status: BotStatus = BOT_STATUS.IDLE;
  uid = getUid();
  type: BotType = BOT_TYPE.NORMAL;
  currentOrder: IOrder | null = null;
  orderManager: OrderManager;
  counterHandle!: ReturnType<typeof setInterval>;
  isDestroyed?: boolean;

  constructor(props: { orderManager: OrderManager; type: BotType }) {
    this.type = props.type;
    this.orderManager = props.orderManager;
    this.processNextOrder();
  }

  /**
   * Assigns a new order to the bot and sets its status to RUN.
   *
   * @param order - The order to process.
   * @returns void
   */
  updateOrder(order: IOrder): void {
    this.status = BOT_STATUS.RUN;
    this.currentOrder = order;
  }

  /**
   * Completes the current order and moves it to the completed queue.
   */
  completeOrder() {
    if (!this.currentOrder) return;
    this.orderManager.completeOrder(this.currentOrder);
    this.currentOrder = null;
  }

  /**
   * Starts processing the next available order in the queue.
   * Waits 10 seconds to complete the order, then proceeds to the next.
   */
  processNextOrder() {
    const nextOrder = this.orderManager.processNextOrder();
    if (!nextOrder) {
      this.status = BOT_STATUS.IDLE;
      return;
    }

    this.updateOrder(nextOrder);

    // order counter update
    nextOrder.counter = this.type === BOT_TYPE.VIP ? 5 : 10;
    this.orderManager.publish({ type: EVENT_TYPE.ORDER_COUNTER });

    this.counterHandle = setInterval(() => {
      nextOrder.counter--;
      this.orderManager.publish({ type: EVENT_TYPE.ORDER_COUNTER });

      // complete the order after WORKING_TIME
      if (nextOrder.counter === 0) {
        clearInterval(this.counterHandle);
        this.completeOrder();
        this.processNextOrder();
      }
    }, 1000);
  }

  destroy() {
    if (this.counterHandle) {
      clearTimeout(this.counterHandle);
    }
    if (!this.currentOrder) return;
    this.orderManager.updateCache(this.currentOrder);
    this.currentOrder = null;
    this.status = BOT_STATUS.IDLE;
    this.isDestroyed = true;
  }
}

export default Bot;

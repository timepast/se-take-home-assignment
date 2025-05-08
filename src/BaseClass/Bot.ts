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

import OrderManager, { type IOrder } from "./Order";

export type BotStatus = "RUN" | "IDLE";
export const BOT_STATUS = {
  RUN: "RUN",
  IDLE: "IDLE",
} as const;

export interface IBot {
  uid: number;
  status: BotStatus;
  currentOrder: IOrder | null;
  updateOrder: (order: IOrder) => void;
  completeOrder: () => void;
  taskHandle: ReturnType<typeof setTimeout>;
  isDestroyed?: boolean;
}

const getUid = (() => {
  let uid = 0;
  return () => uid++;
})();

// Processing time per order (10 seconds)
const WORKING_TIME = 3000;

/**
 * Bot instance that can pick and process one order at a time.
 */
class Bot implements IBot {
  status: BotStatus = BOT_STATUS.IDLE;
  uid = getUid();
  currentOrder: IOrder | null = null;
  orderManager: OrderManager;
  taskHandle!: ReturnType<typeof setTimeout>;
  isDestroyed?: boolean;

  constructor(props: { orderManager: OrderManager }) {
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
    // complete the order after WORKING_TIME
    this.taskHandle = setTimeout(() => {
      this.completeOrder();
      this.processNextOrder();
    }, WORKING_TIME);
  }

  destroy() {
    if (this.taskHandle) {
      clearTimeout(this.taskHandle);
    }
    if (!this.currentOrder) return;
    this.orderManager.updateCache(this.currentOrder);
    this.currentOrder = null;
    this.status = BOT_STATUS.IDLE;
    this.isDestroyed = true;
  }
}

export default Bot;

import { describe, beforeEach, expect, test, vi } from "vitest";
import Controller from "../Controller";
import OrderManager, { ORDER_STATUS } from "../BaseClass/Order";
import { BOT_STATUS } from "../BaseClass/Bot";

let controller: Controller;
let orderManager: OrderManager;

beforeEach(() => {
  vi.useFakeTimers();
  orderManager = new OrderManager();
  controller = new Controller({ orderManager });
});

describe("Controller & Bot & Order integration tests", () => {
  test("order uid should be unique and increasing", () => {
    const orders = [
      orderManager.createNormalOrder(),
      orderManager.createNormalOrder(),
      orderManager.createVipOrder(),
    ];
    const uids = orders.map((o) => o.uid);
    expect(new Set(uids).size).toBe(uids.length); // no duplicate
    expect(uids).toEqual([0, 1, 2]); // increasing
  });

  test("should add remove bot", () => {
    expect(controller.getBots().length).toBe(0); // the initial is empty

    controller.increase(); // add a bot
    expect(controller.getBots().length).toBe(1);

    controller.increase();
    expect(controller.getBots().length).toBe(2);

    controller.decrease();
    expect(controller.getBots().length).toBe(1);
  });

  test("should process VIP before NORMAL", () => {
    controller.increase();
    orderManager.createNormalOrder();
    orderManager.createNormalOrder();
    const vipOrder = orderManager.createVipOrder();

    const orderList = orderManager.getOrderList();
    expect(orderList[0].uid).toBe(vipOrder.uid);
  });

  test("bot should complete order after 10s", () => {
    const vipOrder = orderManager.createVipOrder();
    controller.increase();

    vi.advanceTimersByTime(10000);

    const list = orderManager.getOrderList();
    const completed = list.find((o) => o.uid === vipOrder.uid);
    expect(completed?.status).toBe(ORDER_STATUS.COMPLETE);
  });

  test("destroying a bot should return its order to pending queue", () => {
    const order = orderManager.createNormalOrder();
    controller.increase();

    const [bot] = controller.getBots();
    expect(bot.currentOrder?.uid).toBe(order.uid);
    expect(bot.status).toBe("RUN");

    controller.decrease();

    const list = orderManager.getOrderList();
    const cashed = list.find((o) => o.uid === order.uid);
    expect(cashed?.status).toBe(ORDER_STATUS.PENDING);
  });

  test("from idle to run for bot", () => {
    // Add two bots; initially the pending queue is empty, so bots should be idle
    controller.increase();
    controller.increase();

    // Create the first normal order, which should wake up a bot to process it
    orderManager.createNormalOrder();

    vi.advanceTimersByTime(12000);
    const [bot] = controller.getBots();
    expect(bot.status).toBe(BOT_STATUS.IDLE); // Bot has returned to IDLE after completing the task

    orderManager.createNormalOrder();
    orderManager.createNormalOrder();
    orderManager.createNormalOrder();
    const vipOrder = orderManager.createVipOrder();

    const [order] = orderManager.getOrderList();
    // The VIP order should be at the front of the pending queue
    expect(order.uid).toBe(vipOrder.uid);
  });

  test("multiple bots should process orders in parallel", () => {
    controller.increase(); // bot 1
    controller.increase(); // bot 2

    orderManager.createNormalOrder(); // uid: 0
    orderManager.createNormalOrder(); // uid: 1

    vi.advanceTimersByTime(10000);

    const completed = orderManager
      .getOrderList()
      .filter((o) => o.status === ORDER_STATUS.COMPLETE);
    expect(completed.length).toBe(2);
  });

  test("idle bot should stay idle when no orders exist", () => {
    controller.increase(); // no orders
    const [bot] = controller.getBots();
    expect(bot.status).toBe(BOT_STATUS.IDLE);
  });

  test("should call subscribers on order change", () => {
    const spy = vi.fn();
    orderManager.subscribe(spy);

    orderManager.createNormalOrder();
    expect(spy).toHaveBeenCalledWith({ type: "ORDER_ADDED" });
  });
});

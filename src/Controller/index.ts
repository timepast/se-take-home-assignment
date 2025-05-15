import Bot, { BOT_STATUS, BOT_TYPE, type BotType } from "../BaseClass/Bot";
import OrderManager, { EVENT_TYPE, type OrderEvent } from "../BaseClass/Order";

class Controller {
  private queue: Bot[] = [];
  orderManager: OrderManager;

  constructor(props: { orderManager: OrderManager }) {
    this.orderManager = props.orderManager;
    this.orderManager.subscribe((data: OrderEvent) => {
      if (data.type === EVENT_TYPE.ORDER_ADDED && this.hasIdleBot()) {
        // allocate idle bot start working
        this.queue.forEach((bot) => {
          if (bot.status === BOT_STATUS.IDLE) bot.processNextOrder();
        });
      }
    });
  }

  hasIdleBot() {
    return this.queue.some((bot) => bot.status === BOT_STATUS.IDLE);
  }

  increase(params?: { type: BotType }) {
    const bot = new Bot({
      orderManager: this.orderManager,
      type: params?.type || BOT_TYPE.NORMAL,
    });
    this.queue.push(bot);
    return bot;
  }

  decrease() {
    let bot = this.queue.pop();
    bot?.destroy();
  }

  getBots() {
    return this.queue.slice();
  }
}

export default Controller;

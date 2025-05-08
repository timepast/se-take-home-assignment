## role

- normal customer
- VIP member
- manager
- bot

## Order

### status

- PENDING
- COMPLETE

### rules priority:

queue_cache > queue_vip_order > queue_normal_order

### describtion

each order required 10 seconds to complete process.

### Action

- "New Normal Order"
  - a new order should show up "PENDING" Area.
    - create a new order, insert queue_normal_order;
- "New VIP Order"
  - a new order should show up in "PENDING" Area. It should place in-front of all existing "Normal" order but behind of all existing "VIP" order.
    - create a new order, insert queue_vip_order;

## Bot

queue_bot

### status

- RUN
- IDLE

### Action

- "+ Bot"

  - a bot should be created and start processing the order inside "PENDING" area. after 10 seconds picking up the order, the order should move to "COMPLETE" area. Then the bot should start processing another order if there is any left in "PENDING" area.

- "- Bot"

  - the newest bot should be destroyed. If the bot is processing an order, it should also stop the process. The order now back to "PENDING" and ready to process by other bot.
    - remove the order of bot before queue_cache

## Controller

pedding order count === 0, then add new order, will pub message, call bot run order task;

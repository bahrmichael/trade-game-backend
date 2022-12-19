import {Order} from "@libs/model";

export interface Update {
    orderId: string;
    action: 'update' | 'delete';
    delta?: number;
}

export function matchOrders(order: Order, orders: Order[]): Update[] {
    const matchableOrders = orders
        .filter(({orderType}) => order.orderType !== orderType)
        .filter(({good}) => order.good === good)
        .filter(({atBuildingId}) => order.atBuildingId === atBuildingId)
        .filter((o) => (order.orderType === 'buy' && order.pricePerUnit >= o.pricePerUnit) || (order.orderType === 'sell' && order.pricePerUnit <= o.pricePerUnit))

    if (matchableOrders.length === 0) {
        return [];
    }

    const orderChanges: Map<string, number> = new Map<string, number>();
    orderChanges.set(order.orderId, 0);
    for (const o of matchableOrders) {
        const current = orderChanges.get(o.orderId) ?? 0;
        if (order.quantity <= o.quantity) {
            orderChanges.set(o.orderId, current - order.quantity);
            orderChanges.set(order.orderId, orderChanges.get(order.orderId) - order.quantity);
            o.quantity -= order.quantity;
            order.quantity = 0;
            break;
        } else {
            orderChanges.set(o.orderId, current - o.quantity);
            orderChanges.set(order.orderId, orderChanges.get(order.orderId) - o.quantity);
            order.quantity -= o.quantity;
            o.quantity = 0;
        }
    }

    const updates: Update[] = []
    for (const [orderId, delta] of orderChanges.entries()) {
        // If we can't find the order in the matching orders, then it must be the single function parameter
        const o = orders.find((o) => o.orderId === orderId) ?? order;
        if (o.quantity === 0) {
            updates.push({
                orderId,
                action: 'delete',
            });
        } else {
            updates.push({
                orderId,
                action: 'update',
                delta,
            });
        }
    }

    return updates;
}
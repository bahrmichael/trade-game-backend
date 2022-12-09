import {Order} from "@libs/model";

interface Update {
    orderId: string;
    action: 'update' | 'delete';
    newAmount?: number;
}

export function matchOrders(order: Order, orders: Order[]): Update[] {
    const matchableOrders = orders
        .filter(({orderType}) => order.orderType !== orderType)
        .filter(({good}) => order.good === good)
        .filter(({atBuildingId}) => order.atBuildingId === atBuildingId)
    if (matchableOrders.length === 0) {
        return [];
    }
    const updates: Update[] = []
    for (const o of matchableOrders) {
        if (order.quantity <= o.quantity) {
            updates.push({
                orderId: o.orderId,
                action: order.quantity === o.quantity ? 'delete' : 'update',
                newAmount: o.quantity - order.quantity,
            })
            order.quantity = 0;
            break;
        } else if (order.quantity > o.quantity) {
            order.quantity -= o.quantity;
            updates.push({
                orderId: o.orderId,
                action: 'delete'
            })
        }
    }
    return [
        {
            orderId: order.orderId,
            action: order.quantity === 0 ? 'delete' : 'update',
            newAmount: order.quantity === 0 ? undefined : order.quantity,
        },
        ...updates
    ];
}
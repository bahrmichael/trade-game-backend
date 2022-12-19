import {matchOrders} from "../logic";
import {Good, Order} from "../../../../../libs/model";

function generateOrder(input: Pick<Order, 'orderId' | 'orderType' | 'good' | 'quantity'>): Order {
    return {
        ownerId: '123',
        atBuildingId: '456',
        cargoId: '789',
        gsi1pk: `456#${input.good}#${input.orderType}`,
        pricePerUnit: 10,
        ...input,
    }
}

function findOrder(orderId: string, result: any[]) {
    return result.find((r) => r.orderId === orderId);
}

describe('matchOrders', () => {
    it('should yield no action when there are no available orders', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 10}),
            []
        )

        expect(result.length).toBe(0);
    })

    it('should fully match to equal orders', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 10}),
            [generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 10})]
        )

        expect(result.length).toBe(2);
        expect(findOrder('1', result)).toBeDefined();
        expect(findOrder('1', result).action).toBe('delete');
        expect(findOrder('2', result)).toBeDefined();
        expect(findOrder('2', result).action).toBe('delete');
    })

    it('should fully match with inverted orderType', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'sell', good: 'potato', quantity: 10}),
            [generateOrder({orderId: '2', orderType: 'buy', good: 'potato', quantity: 10})]
        )

        expect(result.length).toBe(2);
        expect(findOrder('1', result)).toBeDefined();
        expect(findOrder('1', result).action).toBe('delete');
        expect(findOrder('2', result)).toBeDefined();
        expect(findOrder('2', result).action).toBe('delete');
    })

    it('should match two orders with a larger new order', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 20}),
            [generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 10})]
        )

        expect(result.length).toBe(2);
        expect(findOrder('1', result)).toBeDefined();
        expect(findOrder('1', result).action).toBe('update');
        expect(findOrder('1', result).delta).toBe(-10);
        expect(findOrder('2', result)).toBeDefined();
        expect(findOrder('2', result).action).toBe('delete');
    })

    it('should match two orders with larger existing orders', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 10}),
            [generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 15})]
        )

        expect(result.length).toBe(2);
        expect(findOrder('1', result)).toBeDefined();
        expect(findOrder('1', result).action).toBe('delete');
        expect(findOrder('2', result)).toBeDefined();
        expect(findOrder('2', result).action).toBe('update');
        expect(findOrder('2', result).delta).toBe(-10);
    })

    it('should fully match with equal sum and multiple orders', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 35}),
            [
                generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 15}),
                generateOrder({orderId: '3', orderType: 'sell', good: 'potato', quantity: 20})
            ]
        )

        expect(result.length).toBe(3);
        expect(findOrder('1', result)).toBeDefined();
        expect(findOrder('1', result).action).toBe('delete');
        expect(findOrder('2', result)).toBeDefined();
        expect(findOrder('2', result).action).toBe('delete');
        expect(findOrder('3', result)).toBeDefined();
        expect(findOrder('3', result).action).toBe('delete');
    })

    it('should partially match a large with multiple small orders', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 35}),
            [
                generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 7}),
                generateOrder({orderId: '3', orderType: 'sell', good: 'potato', quantity: 12})
            ]
        )

        expect(result.length).toBe(3);
        expect(findOrder('1', result)).toBeDefined();
        expect(findOrder('1', result).action).toBe('update');
        expect(findOrder('1', result).delta).toBe(-19);
        expect(findOrder('2', result)).toBeDefined();
        expect(findOrder('2', result).action).toBe('delete');
        expect(findOrder('3', result)).toBeDefined();
        expect(findOrder('3', result).action).toBe('delete');
    })

    it('should not match orders with different goods', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 35}),
            [
                generateOrder({orderId: '2', orderType: 'sell', good: 'grass' as Good, quantity: 7}),
            ]
        )

        expect(result.length).toBe(0);
    })

    it('should not match orders with equal orderType', () => {
        const mismatchOrder = generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 7});
        mismatchOrder.orderType = 'buy';
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 35}),
            [
                mismatchOrder,
            ]
        )

        expect(result.length).toBe(0);
    })
    it('should not match orders with different buildingIds', () => {
        const mismatchOrder = generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 7});
        mismatchOrder.atBuildingId = 'somethingElse';
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 35}),
            [
                mismatchOrder,
            ]
        )

        expect(result.length).toBe(0);
    })

    it('should match buy/sell with equal price', () => {
        const o1 = generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 10});
        o1.pricePerUnit = 10;
        const o2 = generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 10});
        o2.pricePerUnit = 10;
        const result = matchOrders(o1, [o2])

        expect(result.length).toBe(2);
        expect(findOrder('1', result)).toBeDefined();
        expect(findOrder('1', result).action).toBe('delete');
        expect(findOrder('2', result)).toBeDefined();
        expect(findOrder('2', result).action).toBe('delete');
    })

    it('should match for buy order if price is lower', () => {
        const o1 = generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 10});
        o1.pricePerUnit = 10;
        const o2 = generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 10});
        o2.pricePerUnit = 9;
        const result = matchOrders(o1, [o2])

        expect(result.length).toBe(2);
        expect(findOrder('1', result)).toBeDefined();
        expect(findOrder('1', result).action).toBe('delete');
        expect(findOrder('2', result)).toBeDefined();
        expect(findOrder('2', result).action).toBe('delete');
    })

    it('should not match for buy order if price is higher', () => {
        const o1 = generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 10});
        o1.pricePerUnit = 10;
        const o2 = generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 10});
        o2.pricePerUnit = 11;
        const result = matchOrders(o1, [o2])

        expect(result.length).toBe(0);
    })

    it('should match sell/buy with equal price', () => {
        const o1 = generateOrder({orderId: '1', orderType: 'sell', good: 'potato', quantity: 10});
        o1.pricePerUnit = 10;
        const o2 = generateOrder({orderId: '2', orderType: 'buy', good: 'potato', quantity: 10});
        o2.pricePerUnit = 10;
        const result = matchOrders(o1, [o2])

        expect(result.length).toBe(2);
        expect(findOrder('1', result)).toBeDefined();
        expect(findOrder('1', result).action).toBe('delete');
        expect(findOrder('2', result)).toBeDefined();
        expect(findOrder('2', result).action).toBe('delete');
    })

    it('should match for sell order if price is higher', () => {
        const o1 = generateOrder({orderId: '1', orderType: 'sell', good: 'potato', quantity: 10});
        o1.pricePerUnit = 10;
        const o2 = generateOrder({orderId: '2', orderType: 'buy', good: 'potato', quantity: 10});
        o2.pricePerUnit = 11;
        const result = matchOrders(o1, [o2])

        expect(result.length).toBe(2);
        expect(findOrder('1', result)).toBeDefined();
        expect(findOrder('1', result).action).toBe('delete');
        expect(findOrder('2', result)).toBeDefined();
        expect(findOrder('2', result).action).toBe('delete');
    })

    it('should not match for sell order if price is lower', () => {
        const o1 = generateOrder({orderId: '1', orderType: 'sell', good: 'potato', quantity: 10});
        o1.pricePerUnit = 10;
        const o2 = generateOrder({orderId: '2', orderType: 'buy', good: 'potato', quantity: 10});
        o2.pricePerUnit = 9;
        const result = matchOrders(o1, [o2])

        expect(result.length).toBe(0);
    })
})
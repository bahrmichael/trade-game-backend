import {matchOrders} from "../logic";
import {Good, Order} from "../../../../libs/model";

function generateOrder(input: Pick<Order, 'orderId' | 'orderType' | 'good' | 'quantity'>): Order {
    return {
        ownerId: '123',
        atBuildingId: '456',
        cargoId: '789',
        gsi1pk: `456#${input.good}#${input.orderType}`,
        ...input,
    }
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
        expect(result[0].orderId).toBe('1');
        expect(result[0].action).toBe('delete');
        expect(result[1].orderId).toBe('2');
        expect(result[1].action).toBe('delete');
    })

    it('should fully match with inverted orderType', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'sell', good: 'potato', quantity: 10}),
            [generateOrder({orderId: '2', orderType: 'buy', good: 'potato', quantity: 10})]
        )

        expect(result.length).toBe(2);
        expect(result[0].orderId).toBe('1');
        expect(result[0].action).toBe('delete');
        expect(result[1].orderId).toBe('2');
        expect(result[1].action).toBe('delete');
    })

    it('should match two orders with a larger new order', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 20}),
            [generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 10})]
        )

        expect(result.length).toBe(2);
        expect(result[0].orderId).toBe('1');
        expect(result[0].action).toBe('update');
        expect(result[0].newAmount).toBe(10);
        expect(result[1].orderId).toBe('2');
        expect(result[1].action).toBe('delete');
    })

    it('should match two orders with larger existing orders', () => {
        const result = matchOrders(
            generateOrder({orderId: '1', orderType: 'buy', good: 'potato', quantity: 10}),
            [generateOrder({orderId: '2', orderType: 'sell', good: 'potato', quantity: 15})]
        )

        expect(result.length).toBe(2);
        expect(result[0].orderId).toBe('1');
        expect(result[0].action).toBe('delete');
        expect(result[1].orderId).toBe('2');
        expect(result[1].action).toBe('update');
        expect(result[1].newAmount).toBe(5);
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
        expect(result[0].orderId).toBe('1');
        expect(result[0].action).toBe('delete');
        expect(result[1].orderId).toBe('2');
        expect(result[1].action).toBe('delete');
        expect(result[2].orderId).toBe('3');
        expect(result[2].action).toBe('delete');
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
        expect(result[0].orderId).toBe('1');
        expect(result[0].action).toBe('update');
        expect(result[0].newAmount).toBe(16);
        expect(result[1].orderId).toBe('2');
        expect(result[1].action).toBe('delete');
        expect(result[2].orderId).toBe('3');
        expect(result[2].action).toBe('delete');
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
})
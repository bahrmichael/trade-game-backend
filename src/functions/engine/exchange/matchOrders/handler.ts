import {matchOrders} from "./logic";

export const main = async (event: any) => {
    console.log(event)
    return matchOrders(event.newOrder, event.matchableOrders);
};


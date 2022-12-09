export interface Player {
    id: string;
}

export interface Wallet {
    ownerId: string;
    walletId: string;
    balance: number;
}

export interface Transaction {
    walletId: string;
    transactionId: string;
    amount: number;
    created: string;
}

export interface Loan {
    ownerId: string;
    loanId: string;
    amount: number;
    created: string;
}

export interface Transport {
    ownerId: string;
    transportId: string;
}

export interface Building {
    ownerId: string;
    buildingId: string;
}

export interface Cargo {
    parentId: string;
    cargoId: string;
    space: number;
    items: { good: Good, quantity: number }[]
}

export type Good = 'potato'

export interface Order {
    orderId: string; // also used as GSI1SK
    ownerId: string;
    atBuildingId: string;
    cargoId: string;
    orderType: OrderType;
    good: Good;
    quantity: number;
    // If an order is place from or for a transport, that transport can't move
    locksTransport?: string;
    // GSI1
    gsi1pk: OrderGsi1pk
}

// atBuildingId#good#orderType
export type OrderGsi1pk = `${string}#${Good}#${OrderType}`

export type OrderType = 'buy' | 'sell';

export interface Recipe {
    input: Good;
    output: Good;
}
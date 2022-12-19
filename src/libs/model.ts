export interface Player {
    playerId: string;
    balance: number;
}

export interface Transaction {
    ownerId: string;
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

export interface StorageUnit {
    storageUnitId: string;
    ownerId: string;
    locationId: string;
    good: Good;
    quantity: number;
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
    pricePerUnit: number;
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
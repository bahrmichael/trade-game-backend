export const main = async (event: any) => {
    console.log(event);

    const transactionAmount = Math.abs(event.delta) * event.Item.pricePerUnit;

    return {transactionAmount};
}


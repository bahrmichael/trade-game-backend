export const main = async (event: any) => {
    console.log(event);

    const usagePlan = event.usagePlans.items.find((usagePlan) => usagePlan.name === event.targetId);

    return {
        usagePlan,
    }
};

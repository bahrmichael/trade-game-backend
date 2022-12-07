export const main = async (event: any) => {
    console.log(event);

    const usagePlan = event.usagePlans.Items.find((usagePlan) => usagePlan.Name === event.targetId) ?? null;

    return {
        usagePlan,
    }
};

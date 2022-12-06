export const main = async (event: any) => {
    console.log(event);

    const apiStageAttachment = event.usagePlan.apiStages?.find((apiStage) => apiStage.apiId === event.apiId)

    return {
        apiStageAttachment,
    }
};

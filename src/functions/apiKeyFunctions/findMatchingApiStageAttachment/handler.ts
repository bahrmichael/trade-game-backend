export const main = async (event: any) => {
    console.log(event);

    const apiStageAttachment = event.usagePlan.ApiStages?.find((apiStage) => apiStage.ApiId === event.apiId)

    return {
        apiStageAttachment,
    }
};

export const main = async (event: any) => {
    console.log(event);
    console.log(event.usagePlan.ApiStages);

    const apiStageAttachment = event.usagePlan.ApiStages?.find((apiStage) => apiStage.ApiId === event.apiId) ?? null;

    console.log(apiStageAttachment)

    return {
        apiStageAttachment,
    }
};

import {handlerPath} from '@libs/handler-resolver';

export default {
    handler: `${handlerPath(__dirname)}/handler.main`,
    tags: {
        function: 'generate-jwt-secret'
    }
};

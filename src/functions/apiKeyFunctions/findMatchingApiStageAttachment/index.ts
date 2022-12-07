import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  tags: {
    function: 'api-key-find-matching-api-stage-attachment'
  },
};

export default {
  '$schema': "http://json-schema.org/draft-04/schema#",
  type: "object",
  properties: {
    name: { type: 'string' }
  },
  required: ['name']
} as const;

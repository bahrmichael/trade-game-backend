export const API_KEY_IAM = [
    {
        Effect: 'Allow',
        Action: ['apigateway:GET', 'apigateway:POST'],
        Resource: [
            'arn:aws:apigateway:${aws:region}::/usageplans',
            'arn:aws:apigateway:${aws:region}::/usageplans/*/keys',
            'arn:aws:apigateway:${aws:region}::/apikeys',
        ]
    },
    {
        Effect: 'Allow',
        Action: ['apigateway:DELETE'],
        Resource: [
            'arn:aws:apigateway:${aws:region}::/apikeys/*',
            'arn:aws:apigateway:${aws:region}::/usageplans/*'
        ]
    },
    {
        Effect: 'Allow',
        Action: ['apigateway:PATCH'],
        Resource: ['arn:aws:apigateway:${aws:region}::/usageplans/*']
    },
]
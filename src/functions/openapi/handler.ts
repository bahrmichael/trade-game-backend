const { readFileSync } = require('fs');

export const main = async (event) => {

  console.log('path', event.path)

  if (event.path === '/openapi.json') {
    let body1 = readFileSync('openapi.json');
    console.log(body1)
    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json'
      },
      body: body1.toString()
    }
  }

  const body = `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <title>OpenAPI Spec</title>
            <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@3/swagger-ui.css">
        </head>
        <body>
            <div id="swagger"></div>
            <script src="https://unpkg.com/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
            <script>
              SwaggerUIBundle({
                dom_id: '#swagger',
                url: '/openapi.json'
            });
            </script>
        </body>
        </html>`;

  return {
    statusCode: 200,
    headers: {
      ['Content-Type']: 'text/html',
    },
    body
  };
};

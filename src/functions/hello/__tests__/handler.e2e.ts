import axios from 'axios';

const {API_ID, VERSION} = process.env;

const BASE_URL = `https://${API_ID}.execute-api.us-east-1.amazonaws.com/${VERSION}`

it('should receive a hello message', async() => {
    const result = await axios.post(`${BASE_URL}/hello`, { name: 'Michael' })
    expect(result.data.message).toBe('Hello Michael, welcome to the exciting Serverless world!')
})
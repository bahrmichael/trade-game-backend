import axios from 'axios';

const {BASE_URL} = process.env;

it('should receive a hello message', async() => {
    const result = await axios.post(`${BASE_URL}/hello`, { name: 'Michael' })
    expect(result.data.message).toBe('Hello Michael, welcome to the exciting Serverless world!')
})
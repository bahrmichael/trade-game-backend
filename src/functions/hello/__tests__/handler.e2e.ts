import client from "@libs/__tests__/axios";

it('should receive a hello message', async() => {
    const result = await client.post(`/hello`, { name: 'Michael' })
    expect(result.data).toBe('Hello Michael, welcome to the exciting Serverless world!')
})
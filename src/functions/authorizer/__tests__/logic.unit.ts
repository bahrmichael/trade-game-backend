import {lowerCaseHeaders} from "../handler";

it("should lowercase all headers", () => {
    const input = {
        Authorization: 'test',
        otherHeader: 'VaLue',
        SomeMore: 'VaLUE'
    }
    expect(lowerCaseHeaders(input)).toMatchObject({
        authorization: 'test',
        otherheader: 'VaLue',
        somemore: 'VaLUE'
    })
})
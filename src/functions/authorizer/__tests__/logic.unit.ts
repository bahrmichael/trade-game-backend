import {lowerCaseHeaderNames} from "../handler";

it("should lowercase all header names", () => {
    const input = {
        Authorization: 'test',
        otherHeader: 'VaLue',
        SomeMore: 'VaLUE'
    }
    expect(lowerCaseHeaderNames(input)).toMatchObject({
        authorization: 'test',
        otherheader: 'VaLue',
        somemore: 'VaLUE'
    })
})
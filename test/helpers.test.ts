import * as t from 'io-ts'
import * as h from '../src/helpers';


describe('helpers', () => {
  it('can validate', () => {
    const minLengthString = h
        .string()
        .min(5, 'Too short. ');

    expect(minLengthString.decode('123456')).toMatchSnapshot();
    expect(minLengthString.decode('1234')).toMatchSnapshot();

    const maxLengthString = h
        .string()
        .max(5, 'Too long. ');

    expect(maxLengthString.decode('123456')).toMatchSnapshot();
    expect(maxLengthString.decode('1234')).toMatchSnapshot();
  });

});

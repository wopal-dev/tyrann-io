import { isLeft, isRight } from 'fp-ts/lib/These';
import * as t from 'io-ts'
import * as h from '../src/helpers';

const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/g;

const newEmailField = (name: string) => {
  return h.string()
    .min(1)
    .max(64)
    .matches(emailRegex, `${name}は有効なメールアドレスを入力してください。`);
};
  

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

    const emailSchema = t.type({
      new_email: newEmailField('変更メールアドレス'),
    });
  
    expect(emailSchema.decode({
      new_email: 'wangchenyu2017@gmail.com',
    })).toMatchSnapshot();
  
    const minArray = h.array(h.string()).min(5, 'Too little. ');
  
    expect(
      isLeft(minArray.decode(['1', '2', '3', '4']))
    ).toBe(true);
  
    expect(
      isRight(minArray.decode(['1', '2', '3', '4', '5']))
    ).toBe(true);
  
    expect(
      isRight(minArray.decode(['1', '2', '3', '4', '5', '6']))
    ).toBe(true);

    const maxArray = h.array(h.string()).max(5, 'Too many. ');

    expect(
      isLeft(maxArray.decode(['1', '2', '3', '4', '5', '6']))
    ).toBe(true);

    expect(
      isRight(maxArray.decode(['1', '2', '3', '4', '5']))
    ).toBe(true);

    expect(
      isRight(maxArray.decode(['1', '2', '3', '4']))
    ).toBe(true);

    expect(
      isLeft(maxArray.decode([1, 2, 3]))
    ).toBe(true);
  });

});

import { isLeft, isRight } from 'fp-ts/lib/These';
import * as t from 'io-ts';
import * as h from '../src/helpers';

const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$/g;

const newEmailField = (name: string) => {
  return h
    .string()
    .min(1)
    .max(64)
    .matches(emailRegex, `${name}は有効なメールアドレスを入力してください。`);
};

describe('helpers', () => {
  it('can validate', () => {
    const minLengthString = h.string().min(5, 'Too short. ');

    expect(minLengthString.decode('123456')).toMatchSnapshot();
    expect(minLengthString.decode('1234')).toMatchSnapshot();

    const maxLengthString = h.string().max(5, 'Too long. ');

    expect(maxLengthString.decode('123456')).toMatchSnapshot();
    expect(maxLengthString.decode('1234')).toMatchSnapshot();

    const emailSchema = t.type({
      new_email: newEmailField('変更メールアドレス'),
    });

    expect(
      emailSchema.decode({
        new_email: 'wangchenyu2017@gmail.com',
      })
    ).toMatchSnapshot();

    const minArray = h.array(h.string()).min(5, 'Too little. ');

    const upperSchema = t.type({
      s: h
        .string()
        .cast((s) => (typeof s === 'string' ? s.toUpperCase() : (s as any))),
    });

    expect(
      upperSchema.decode({
        s: 'sss',
      })
    ).toMatchObject({
      _tag: 'Right',
      right: {
        s: 'SSS',
      },
    });

    expect(isLeft(minArray.decode(['1', '2', '3', '4']))).toBe(true);

    expect(isRight(minArray.decode(['1', '2', '3', '4', '5']))).toBe(true);

    expect(isRight(minArray.decode(['1', '2', '3', '4', '5', '6']))).toBe(true);

    const maxArray = h.array(h.string()).max(5, 'Too many. ');

    expect(isLeft(maxArray.decode(['1', '2', '3', '4', '5', '6']))).toBe(true);

    expect(isRight(maxArray.decode(['1', '2', '3', '4', '5']))).toBe(true);

    expect(isRight(maxArray.decode(['1', '2', '3', '4']))).toBe(true);

    expect(isLeft(maxArray.decode([1, 2, 3]))).toBe(true);

    expect(isLeft(maxArray.decode(undefined))).toBe(true);

    const number = h.number();

    expect(isLeft(number.decode('123123'))).toBe(true);

    expect(isRight(number.decode(123123))).toBe(true);

    const maxNumber = h.number().max(100);

    expect(isLeft(maxNumber.decode(101))).toBe(true);

    expect(isRight(maxNumber.decode(100))).toBe(true);

    expect(isRight(maxNumber.decode(50))).toBe(true);

    const minNumber = h.number().min(100);

    expect(isLeft(minNumber.decode(99))).toBe(true);

    expect(isRight(minNumber.decode(100))).toBe(true);

    expect(isRight(minNumber.decode(101))).toBe(true);

    const castNumber = h.number().cast().min(100);

    expect(isRight(castNumber.decode('101'))).toBe(true);

    expect(isLeft(castNumber.decode('xyz'))).toBe(true);

    expect(isRight(castNumber.decode(101))).toBe(true);

    const integerNumber = h.number().integer();

    expect(isRight(integerNumber.decode(101))).toBe(true);

    expect(isRight(integerNumber.decode(Number.MAX_SAFE_INTEGER))).toBe(true);

    expect(isLeft(integerNumber.decode(Number.MAX_SAFE_INTEGER + 1))).toBe(
      true
    );

    const omittableString = h.omittable(h.string().min(5, 'Too short'));

    expect(isLeft(omittableString.decode('1234'))).toBe(true);

    const integerCast = h
      .number()
      .cast(`は有効な整数を入力してください。`)
      .integer(`は有効な整数を入力してください。`);

    expect(integerCast.decode('xyz')).toMatchSnapshot();

    const interfaceType = h.type({
      a: t.number,
    });

    expect(
      isRight(
        interfaceType.decode({
          a: 114514,
        })
      )
    ).toBe(true);

    expect(
      isRight(
        interfaceType.decode({
          a: '123123',
        })
      )
    ).toBe(false);

    const refinedInterfaceType = h
      .type({
        a: t.number,
        b: t.number,
      })
      .refine((s) => s.a === s.b);

    expect(
      isRight(
        refinedInterfaceType.decode({
          a: 123,
          b: 123,
        })
      )
    ).toBe(true);

    expect(
      isRight(
        refinedInterfaceType.decode({
          a: 123,
          b: 12345,
        })
      )
    ).toBe(false);

    const booleanType = h.boolean().true();

    expect(isRight(booleanType.decode(true))).toBe(true);

    expect(isRight(booleanType.decode(false))).toBe(false);

    const castBooleanType = h.boolean().cast().true();

    expect(isRight(castBooleanType.decode(1))).toBe(true);

    expect(isRight(castBooleanType.decode(0))).toBe(false);

    expect(isRight(castBooleanType.decode(0))).toBe(false);

    expect(isRight(castBooleanType.decode(''))).toBe(false);

    const requiredStringInterfaceType = h.type({
      s: h.string().required('required'),
    });

    expect(
      isLeft(
        requiredStringInterfaceType.decode({
          s: '',
        })
      )
    ).toBe(true);

    const numberCastString = h.number().castString();

    expect(isRight(numberCastString.decode('114514'))).toBe(true);

    expect(isLeft(numberCastString.decode(''))).toBe(true);

    const omittableNumber = h.omittableNumber().cast();

    expect(isRight(omittableNumber.decode(''))).toBe(true);

    expect(isRight(omittableNumber.decode('123123'))).toBe(true);

    expect(isRight(omittableNumber.decode('   '))).toBe(true);

    expect(isLeft(omittableNumber.decode('ABC'))).toBe(true);

    expect(isRight(omittableNumber.decode(undefined))).toBe(true);

    expect(isRight(omittableNumber.decode(null))).toBe(true);

    expect(h.string().withLabel('label').min(1).label).toBe('label');

    expect(h.number().withDescription('description').min(1).description).toBe(
      'description'
    );

    expect(h.boolean().withDescription('description').cast().description).toBe(
      'description'
    );
  });
});

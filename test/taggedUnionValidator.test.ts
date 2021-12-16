import { isLeft, isRight } from 'fp-ts/lib/These';
import * as t from 'io-ts'
import { number } from '../src';
import { taggedUnion } from '../src/validators/taggedUnion'

describe('TaggedUnionValidator', () => {
  it('can validate', () => {
    const v1 = taggedUnion([
      {
        tag: t.literal('a'),
        a: t.number,
      },
    ]);

    const v2 = taggedUnion([
      {
        tag: t.literal('a'),
        a: t.number,
      },
      {
        tag: t.literal('b'),
        b: t.number,
      },
    ]);

    const v3 = taggedUnion([
      {
        tag: t.literal('a'),
        a: t.number,
      },
      {
        tag: t.literal('b'),
        b: t.number,
      },
      {
        tag: t.literal('b'),
        c: t.number,
      },
    ]);

    const v4 = taggedUnion([
      {
        tag: t.literal('a'),
        a: t.number,
      },
      {
        tag: t.literal('b'),
        b: t.number,
      },
      {
        tag: t.literal('c'),
        c: t.number,
      },
      {
        tag: t.literal('d'),
        d: t.number,
      },
    ]);

    const v5 = taggedUnion([
      {
        tag: t.literal('a'),
        a: t.number,
      },
      {
        tag: t.literal('b'),
        b: t.number,
      },
      {
        tag: t.literal('c'),
        c: t.number,
      },
      {
        tag: t.literal('d'),
        d: t.number,
      },
      {
        tag: t.literal('e'),
        e: t.number,
      },
    ]);

    expect(
      isRight(v1.decode({
        tag: 'a',
        a: 1,
      }))
    ).toBeTruthy();

    expect(
      isRight(v1.decode({
        tag: 'a',
        a: "1",
      }))
    ).toBeFalsy();

    expect(
      isRight(v2.decode({
        tag: 'a',
        a: 1,
      }))
    ).toBeTruthy();

    expect(
      isRight(v2.decode({
        tag: 'a',
        a: '1',
      }))
    ).toBeFalsy();

    expect(
      isRight(v2.decode({
        tag: 'b',
        b: 1,
      }))
    ).toBeTruthy();

    expect(
      isRight(v3.decode({
        tag: 'a',
        a: 1,
      }))
    ).toBeTruthy();

  });

  it('can give correct context', ()  => {
    const schema = taggedUnion([
      {
        tag: t.literal('LWH'),
        length: number().min(5, 'too small'),
        width: number().min(5, 'too small'),
        height: number().min(5, 'too small'),
      },
      {
        tag: t.literal('WV'),
        weight: number().min(5, 'too small'),
        volume: number().min(5, 'too small'),
      },
    ]);

    expect(schema.decode({
      tag: 'WV',
      weight: 0,
      volume: 0,
    }))
      .toMatchSnapshot();
  });
});

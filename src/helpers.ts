import { Either, isLeft, isRight } from 'fp-ts/lib/Either';
import * as t from 'io-ts';

export type OmittableKeys<A extends {}> = {
  [K in keyof A]: undefined extends A[K] ? K : null extends A[K] ? K : undefined
}[keyof A] & string;


export type Defaultable<A extends {}> = {
  [K in keyof A & OmittableKeys<A>]?:  A[K]
} & {
  [K in Exclude<keyof A, OmittableKeys<A>>]:  A[K]
}

export const transformable = <AType extends t.Any, OutType, A = t.TypeOf<AType>>(
  a: AType,
  transform: (a: A) => OutType,
) => {
  return new t.Type<A, OutType>(
    `Transformable<${a.name}>`,
    a.is,
    a.validate,
    transform,
  );
};

export const defaultable = <AType extends t.Any, Placeholder, A = t.TypeOf<AType>>(
  a: AType,
  placeholder: Placeholder,
) => {
  return transformable<t.Type<Defaultable<A>>, Defaultable<A> & Placeholder>(
    a,
    (a: Defaultable<A>) => ({
      ...placeholder,
      ...a,
    })
  );
}

export const omittable = <AType extends t.Any>(
  a: AType,
) => {
  return t.union([
    a,
    t.nullType,
    t.undefined,
  ]);
}

export type Validate<A, I> = (input: I, context: t.Context) => Either<t.Errors, A>; 
export interface Validator<A, I> {
  validates: Validate<A, I>[],
  extend(validate: Validate<A, I>): Validator<A, I>,
}

export class StringValidator extends t.Type<string> implements Validator<string, any> {
  validates = [
    (input: unknown, context: t.Context): Either<t.Errors, string> => 
      typeof input === 'string' ? t.success(input) : t.failure(input, context),
  ];

  constructor() {
    super(
      'string',
      (u): u is string => typeof u === 'string',
      (u, c) => {
        let e: Either<t.Errors, string> | undefined = undefined;
        for (const validate of this.validates) {
          e = validate(u, c);
          if (isLeft(e)) {
            return e;
          }
        }
        return e!;
      },
      t.identity
    )
  }

  extend(validate: Validate<string, any>) {
    const clone = new StringValidator();
    clone.validates = [...this.validates, validate];
    return clone;
  }

  refine(refiner: (s: string) => boolean, message?: string) {
    return this.extend(
      (input: string, context) => refiner(input)
        ? t.success(input)
        : t.failure(input, context, message),
    )
  }

  length(n: number, message?: string) {
    return this.refine((s) => s.length === n, message);
  }

  required(message?: string) {
    return this.min(1, message);
  }

  max(n: number, message?: string) {
    return this.refine((s) => s.length <= n, message);
  }

  min(n: number, message?: string) {
    return this.refine((s) => s.length >= n, message);
  }

  matches(regExp: RegExp, message?: string) {
    return this.refine((s) => regExp.test(s), message);
  }
}

export const string = () => new StringValidator();
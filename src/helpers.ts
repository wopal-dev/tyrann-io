import * as t from 'io-ts';
import { TyrannError } from '.';
import { ArrayValidator, BooleanValidator, InterfaceValidator, NumberValidator, OmittableNumberValidator, StringValidator, Validator } from './validators/basicValidators';

export type OmittableKeys<A extends any> = {
  [K in keyof A]: undefined extends A[K] ? K : null extends A[K] ? K : undefined
}[keyof A] & string;


export type Defaultable<A extends any> = {
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

export const number = () => new NumberValidator();

export const omittableNumber = () => new OmittableNumberValidator();

export const string = () => new StringValidator();

export const array = <C extends t.Mixed>(item: C) => new ArrayValidator(item);

export const type = <P extends t.Props>(p: P) => new InterfaceValidator(t.type(p));

export const boolean = () => new BooleanValidator();

export { taggedUnion } from './validators/taggedUnion';

export { Validator } from './validators/basicValidators';

export const unwrap = <T extends t.Any>(validator: T, value: unknown): t.TypeOf<T> => {
  const e = validator.decode(value);
  if (e._tag === 'Left') {
    throw new TyrannError('Failed to unwrap value');
  }
  return e.right;
}

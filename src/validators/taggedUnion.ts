import * as t from 'io-ts'

import { InterfaceValidator, Validator } from "./basicValidators";

export type TaggedProps<Tag extends string = string, E extends t.Props = {}> = {
  [K in keyof E]: E[K];
} & {
  tag: t.LiteralC<Tag>;
}

type TypeOf<T extends string, P extends t.Props> = t.TypeOf<t.TypeC<TaggedProps<T, P>>>;

export function taggedUnion<
T1 extends string,
P1 extends t.Props,
>(args: [TaggedProps<T1, P1>]): Validator<TypeOf<T1, P1>>;

export function taggedUnion<
T1 extends string,
P1 extends t.Props,
T2 extends string,
P2 extends t.Props,
>(args: [TaggedProps<T1, P1>, TaggedProps<T2, P2>]): Validator<TypeOf<T1, P1> | TypeOf<T2, P2>>;

export function taggedUnion<
T1 extends string,
P1 extends t.Props,
T2 extends string,
P2 extends t.Props,
T3 extends string,
P3 extends t.Props,
>(args: [TaggedProps<T1, P1>, TaggedProps<T2, P2>, TaggedProps<T3, P3>]): Validator<TypeOf<T1, P1> | TypeOf<T2, P2> | TypeOf<T3, P3>>;

export function taggedUnion(union: TaggedProps<any, any>[]) {
  return new Validator<TaggedProps<any, any>>(
    'taggedUnion',
    (u): u is TaggedProps<any, any> => {
      if (typeof u !== 'object' || u == null) return false;
      const { tag } = u as any;
      const typeProps = union.find((u) => u.tag.value === tag);
      if (typeProps === undefined) return false;
      const type = t.type(typeProps);
      return type.is(u);
    },
    (u, context) => {
      if (typeof u !== 'object' || u == null) {
        return t.failure(u, context);
      }
      const { tag } = u as any;
      const typeProps = union.find((u) => u.tag.value === tag);
      if (typeProps === undefined) {
        return t.failure(u, context);
      }
      const type = t.type(typeProps);
      return type.validate(u, context);
    },
    t.identity,
  );
}

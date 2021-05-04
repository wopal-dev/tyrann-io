import queryString, { ParseOptions } from 'query-string';
import format from 'string-format';
import * as E from 'io-ts/Encoder';


export const createQueryEncoder = <O extends {}>(
  opts?: ParseOptions,
): E.Encoder<string, O> => {
  return {
    encode: (o: O) => queryString.stringify(o, opts)
  };
}

export type QueryEncoder = ReturnType<typeof createQueryEncoder>;


export const createJsonEncoder = <O extends {}>(
  ...jsonArgs: any[]
): E.Encoder<string, O> => {
  return {
    encode: (o: O) => JSON.stringify(o, ...jsonArgs)
  };
}

export type JsonEncoder = ReturnType<typeof createJsonEncoder>;

// Decoders seems not to be interoperable with t.Type, give up using it for the time.

// export const jsonDecoder = <T extends t.Any>(
//   type: T,
// ): D.Decoder<string, t.TypeOf<T>> => {
//   return {
//     decode: (s: string) => {
//       const result = JSON.parse(s);
//       return type.asDecoder().decode(result);
//     },
//   }
// }

export const createPathEncoder = <O extends {}>(
  path: string,
): E.Encoder<string, O> => {
  return {
    encode: (o: O) => format(path, o),
  };
}

export const createIdentityEncoder = <O extends {}>(): E.Encoder<O, O> => {
  return {
    encode: (o: O) => o,
  };
}

export type IdentityEncoder = ReturnType<typeof createIdentityEncoder>;
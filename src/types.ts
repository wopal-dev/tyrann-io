import * as t from 'io-ts'
import * as E from 'io-ts/Encoder'

export type BaseMethods = "get" | "post" | "put" | "delete" | "options" | "patch";

export type TyrannApis = {
  [path in string]: Path;
}

export interface Path {
  get?: Operation;
  post?: Operation;
  put?: Operation;
  delete?: Operation;
  trace?: Operation;
  options?: Operation;
  patch?: Operation;
}

export interface Operation {
  query?: t.Any;
  path?: t.Any;
  body?: t.Any;
  response: {
    [code in number]: t.Any;
  },
  options?: OperationOptions;
}

export interface OperationOptions {
  queryEncoder?: E.Encoder<string, any>;
  pathEncoder?: E.Encoder<string, any>;
  bodyEncoder?: E.Encoder<string, any>;
}

export interface Request<
  Query extends {} = any,
  Path extends {} = any,
  Body extends {} = any,
  > {
  query?: Query;
  path?: Path;
  body?: Body;
}

export type MethodsOf<P extends Path> = keyof P & BaseMethods;

export type RequestOf<O extends Operation> = (
  O['query'] extends t.Any ? { query: t.TypeOf<O['query']>  } : {}
) & (
  O['path'] extends t.Any ? { path: t.TypeOf<O['path']> } : {}
) & (
  O['body'] extends t.Any  ? { body: t.TypeOf<O['body']> } : {}
);

export type ResponseOf<O extends Operation> = {
  [code in keyof O['response'] & number]?: t.TypeOf<O['response'][code]>
};

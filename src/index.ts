import { MethodsOf, Operation, RequestOf, TyrannApis, Request, ResponseOf, BaseMethods } from './types'
import { isLeft } from 'fp-ts/Either'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import * as t from 'io-ts'
import Axios from 'axios';
import {
  createIdentityEncoder,
  createJsonEncoder,
  createPathEncoder,
  createQueryEncoder,
} from './codecs';
import { PathReporter } from 'io-ts/PathReporter'

export type TyrannOptions = {
  instance?: AxiosInstance;
  axiosRequestConfig?: AxiosRequestConfig | (() => AxiosRequestConfig);
}

export class TyrannError extends Error {}

export class StatusNotHandled extends TyrannError {
  constructor(public status: number, ...args: any) {
    super(...args);
    this.name = "StatusNotHandled";
  }
}

export class BadResponse extends TyrannError {
  constructor(public errors: t.Errors, ...args: any[]) {
    super(...args);
    this.name = "BadResponse";
  }
}

export const tyrann = <Apis extends TyrannApis>(
  apis: Apis,
  options: TyrannOptions = {},
) => {
  type Names = keyof Apis & string;

  type CallAction<Name extends Names, Path extends Apis[Name], Methods extends MethodsOf<Path>> = {
    type: `tyrann/${Name}`,
    method: Methods,
    name: Name,
    request: RequestOf<Exclude<Path[Methods], undefined>>,
  };

  type CallResponse<O extends Operation> = {
    response: AxiosResponse<any>,
  } & ResponseOf<O>;

  const instance = options.instance ?? Axios.create();

  const createCall = <Name extends Names, Path extends Apis[Name], Methods extends MethodsOf<Path>>(
    method: Methods,
    name: Name,
    request: RequestOf<Exclude<Path[Methods], undefined>>,
  ): CallAction<Name, Path, Methods> => {
    return {
      type: `tyrann/${name}` as const,
      method,
      name,
      request,
    }
  }
  
  const call = async <Name extends Names, Path extends Apis[Name], Methods extends MethodsOf<Path>>(
    callAction: CallAction<Name, Path, Methods>,
    localOptions: TyrannOptions = options, 
  ) => {
    const {
      method,
      name,
      request,
    } = callAction;

    const path = apis[name] as Path;
    const operation = path[method] as Operation;

    const {
      queryEncoder = createQueryEncoder(),
      pathEncoder = createPathEncoder(name),
      bodyEncoder = createIdentityEncoder<{}>(),
    } = operation.options ?? {};

    const requestCasted = request as Request;

    const queryString = 'query' in requestCasted ? queryEncoder.encode(
      operation.query!.encode(requestCasted.query)
    ) : '';
    const realPath = operation.path ? pathEncoder.encode(
      operation.path!.encode(requestCasted.path),
    ) : name;
    const body = 'body' in requestCasted ? bodyEncoder.encode(
      operation.body!.encode(requestCasted.body),
    ) : undefined;

    const url = realPath + (queryString ? ('?' + queryString) : '');

    const axiosRequestConfig = typeof options.axiosRequestConfig === 'function' ?
      options.axiosRequestConfig() : options.axiosRequestConfig;

    const localRequestConfig = typeof localOptions.axiosRequestConfig === 'function' ?
      localOptions.axiosRequestConfig() : localOptions.axiosRequestConfig;

    const localAxiosRequestConfigs: AxiosRequestConfig = {
      ...axiosRequestConfig,
      ...localRequestConfig,
      url,
      method,
      data: body,
    };

    const response = await (localOptions.instance ?? instance).request(localAxiosRequestConfigs);

    const { status, data } = response;

    if (!(status in operation.response)) {
      throw new StatusNotHandled(response.status, `Status ${response.status} is not handled. `);
    }

    const decoder = operation.response[status]!;
    const decoded = decoder.decode(data);
    if (isLeft(decoded)) {
      throw new BadResponse(decoded.left, `Invalid response data: ${PathReporter.report(decoded)}`);
    }

    return {
      response,
      ...{
        [status]: decoded.right,
      },
    } as CallResponse<Exclude<Path[Methods], undefined>>;
  };

  const withMethod = <Method extends BaseMethods>(m: Method) =>
    <Name extends Names, Path extends Apis[Name]>(
      name: Name,
      request: RequestOf<Exclude<Path[Method], undefined>>,
      localOptions: TyrannOptions = options, 
    ) => {
      return call(
        createCall(
          m,
          name,
          request,
        ),
        localOptions,
      )
    };

  return {
    createCall,
    call,
    get: withMethod('get'),
    post: withMethod('post'),
    put: withMethod('put'),
    delete: withMethod('delete'),
    options: withMethod('options'),
    patch: withMethod('patch'),
  }
}

export * from './helpers';

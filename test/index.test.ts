// @ts-ignore
import encodings from '../node_modules/iconv-lite/encodings';
const iconvLite = require('../node_modules/iconv-lite/lib');                                                                                                                                                                             
iconvLite.getCodec('UTF-8');

import * as t from 'io-ts'
import { BadResponse, StatusNotHandled, tyrann } from '../src/index';
import { isRight, isLeft } from 'fp-ts/Either'
import { ResponseOf } from '../src/types';
import { getServer } from './server';
import * as h from '../src/helpers';

const apis = tyrann({
  '/brotli': {
    get: {
      query: t.type({
        brotli: t.string,
        method: t.string,
      }),
      response: {
        200: t.type({
          result: t.number,
        }),
      },
    }
  },
  '/brotli/{id}': {
    get: {
      path: t.type({
        id: t.number,
      }),
      response: {
        200: t.type({
          result: t.number,
        }),
      },
    }
  },
  '/array': {
    get: {
      query: t.type({
        ids: t.array(t.number),
      }),
      response: {
        200: t.array(t.number),
      },
    }
  },
  '/body': {
    post: {
      body: t.type({
        x: t.number,
        y: t.number,
      }),
      response: {
        200: t.type({
          x: t.number,
          y: t.number,
        }),
      },
    }
  },
  '/omit-query': {
    get: {
      query: h.defaultable(
        t.type({
          a: h.omittable(t.number),
        }),
        {
          a: 123123,
        }
      ),
      response: {
        200: t.type({
          result: t.number,
        }),
      },
    }
  },
  '/omit-path/{a}': {
    get: {
      path: h.defaultable(
        t.type({
          a: h.omittable(t.number),
        }),
        {
          a: 123123,
        }
      ),
      response: {
        200: t.type({
          result: t.number,
        }),
      },
    }
  },
  '/omit-body': {
    post: {
      body: h.defaultable(
        t.type({
          a: h.omittable(t.number),
        }),
        {
          a: 123123,
        }
      ),
      response: {
        200: t.type({
          result: t.number,
        }),
      },
    }
  },
}, {
  axiosRequestConfig: {
    baseURL: 'http://localhost:3123',
    validateStatus: () => true,
  }
});

let server: any;

beforeAll(async () => {
  server = await getServer();
});

afterAll(() => {
  server.close();
});

const { createCall } = apis;

describe('tyrann-io', () => {
  it('gives correct type', () => {

    createCall('get', '/brotli', {
      query: {
        brotli: '123',
        method: '123312',
      },
    });

    createCall('get', '/brotli', {
      // @ts-expect-error
      query: {
        brotli: '123',
      },
    });

    createCall('get', '/brotli', {
      // @ts-expect-error
      body: {},
    });
  });

  it('can decode', () => {
    const T = t.type({
      brotli: t.string,
      method: t.string,
    });

    const right = T.decode({
      brotli: "123",
      method: "12",
    });

    expect(isRight(right)).toBe(true);

    const left = T.decode({
      brotli: 12312,
      method: "12",
    });

    expect(isLeft(left)).toBe(true);
  });

  it('can default', async () => {
    const t0 = t.type({
      x: h.omittable(t.number),
    });

    const dft0 = h.defaultable(
      t0,
      {
        x: 8964,
      },
    );

    expect(dft0.encode({})).toMatchObject({
      x: 8964,
    });

    expect(dft0.encode({
      x: 123,
    })).toMatchObject({
      x: 123,
    });

    const result1 = await apis.call(
      apis.createCall(
        'get',
        '/omit-query',
        {
          query: {},
        }
      ));

    expect(result1[200]).toMatchObject({
      result: 123123,
    });

    const result2 = await apis.call(
      apis.createCall(
        'get',
        '/omit-query',
        {
          query: {
            a: 114514
          },
        }
      ));

    expect(result2[200]).toMatchObject({
      result: 114514,
    })

    const result3 = await apis.call(
      apis.createCall(
        'get',
        '/omit-path/{a}',
        {
          path: {},
        }
      ));

    expect(result3[200]).toMatchObject({
      result: 123123,
    });

    const result4 = await apis.call(
      apis.createCall(
        'post',
        '/omit-body',
        {
          body: {},
        }
      ));

    expect(result4[200]).toMatchObject({
      result: 123123,
    });

  });

  it('can call', async () => {
    const r = {
      response: {
        200: t.type({
          a: t.string
        })
      }
    };

    type Response = ResponseOf<typeof r>;

    let result;

    result = await apis.call(createCall(
      "get",
      "/brotli",
      {
        query: {
          brotli: "123",
          method: "456",
        }
      }
    ));

    expect(result[200]).toMatchObject({
      result: 1,
    });

    result = await apis.call(createCall(
      "get",
      "/brotli/{id}",
      {
        path: {
          id: 42,
        },
      }
    ));

    expect(result[200]).toMatchObject({
      result: 42,
    });

    await expect(
      apis.call(createCall(
        "get",
        "/brotli/{id}",
        {
          path: {
            id: 77,
          },
        }
      ))
    ).rejects.toThrowError(BadResponse);


    await expect(
      apis.call(createCall(
        "get",
        "/brotli/{id}",
        {
          path: {
            id: 404,
          },
        }
      ))
    ).rejects.toThrowError(StatusNotHandled);

    result = await apis.call(createCall(
      "get",
      "/array",
      {
        query: {
          ids: [1, 2, 3]
        }
      }
    ));

    expect(result[200]).toMatchObject([1, 2, 3]);

    result = await apis.call(createCall(
      "post",
      "/body",
      {
        body: {
          x: 1,
          y: 2,
        }
      }
    ));

    expect(result[200]).toMatchObject({
      x: 1,
      y: 2,
    })
  });
});

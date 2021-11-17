# Welcome to tyrann-io 👋
![Version](https://img.shields.io/badge/version-0.1.0-blue.svg?cacheSeconds=2592000)
![Prerequisite](https://img.shields.io/badge/node-%3E%3D10-blue.svg)
[![Documentation](https://img.shields.io/badge/documentation-yes-brightgreen.svg)](https://github.com/wopal-dev/tyrann-io)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](#)

> Yet another easy solution to keep your REST calls and data types in the same place (deprecating tyrann) 

### 🏠 [Homepage](https://wopal-dev.github.io)

## Prerequisites

- ES6
- TypeScript >= 4.1

## Install

```sh
yarn add tyrann-io
```

## Usage

1. Describe your data

```typescript
import { tyrann } from 'tyrann-io';
import * as t from 'io-ts';

const apis = tyrann({
  '/user/{id}': {
    get: {
      path: t.type({
        id: t.number,
      }),
      response: {
        200: t.type({
          name: t.string,
          address: t.string,
        }),
      },
    }
  },
  '/login': {
    post: {
      body: t.type({
        username: t.string,
        password: t.string,
      }),
      response: {
        200: t.type({
          successful: t.boolean,
        }),
        403: t.type({
          successful: t.boolean,
          reason: t.string,
        })
      },
    }
  },
};
```

2. Ask for what you want

```
const response = await apis.get(
  "/user/{id}",
  {
    path: {
      id: 1,
    }
  }
);
```

3. Get predictable results

```
console.log(response[200]);
{
  "name": "John Doe",
  "address": "Nowhere"
}
```

## User Guide

`tyrann-io` works in tandem with [io-ts](https://github.com/gcanti/io-ts). This means tyrann typically harnesses the power of `io-ts` to define interface and check runtime types to ensure a predictable behavior of REST calls.

### API Definition

To define a set of REST calls, you first need to import `tyrann-io`.

```typescript
import { tyrann } from 'tyrann-io';
import * as t from 'io-ts';

const apis = tyrann({});
```

To define an API, add an entry to the input, with the key as the (template) of path:

```typescript
const apis = tyrann({
  '/user/{id}': {
    // `Path` object content
  },
});
```

In the `Path` object, you can define the HTTP Methods associated with that path `/user/{id}`. For example, this is how we define a `get` method:

```typescript
const apis = tyrann({
  '/user/{id}': {
    get: {
      path: t.type({
        id: t.number,
      }),
      response: {
        200: t.type({
          name: t.string,
          address: t.string,
        }),
      },
    }
  },
});
```

Look at `Path.path`, it describe the values supplied to the path template. `/user/{id}`.

```typescript
t.type({
  id: t.number,
})
```
This description describes exactly the type

```
interface T {
  id: number;
}
```

You can also supply parameters to the query string and the body.

```typescript
const apis = tyrann({
  '/login': {
    post: {
      query: t.type({
        next: t.string,
      }),
      body: t.type({
        username: t.string,
        password: t.password,
      }),
      response: {
        200: t.type({
          successful: t.boolean,
        }),
        403: t.type({
          reason: t.string,
        })
      },
    }
  },
};
```

By default, the query is created with the default parameters with [query-string](https://www.npmjs.com/package/query-string). You can also supply your own options to `queryString` (take a look at the [API Reference](#api-reference)).

As you have already seen, the field `response` specifies different types with `io-ts` for diffrent status codes. We generally make it opinionated to define one type for each status code, but you can also use `t.union` when you have to handle different types. When the response is returned from the server, we first check if the type is defined for the returned status code. It'll raise `StatusNotHandled` if the status is not defined. Then, it checks the return body (parsed in JSON by default) against the associated type you just defined. It raises `BadResponse` if such type does not match.

### API Invocation

To call the APIs right now, you can handily use `apis.<method>`.

```typescript
const response = await apis.get(
  "/user/{id}",
  {
    path: {
      id: 1,
    }
  }
);
```

In this case, an request `GET /user/1` is sent, according to what we supply to `path.id`. Then you can check the response object to get the result:

```typescript
const {
  response,        // AxiosResponse<any>
  200: data,       // { name: string, address: string }
} = response;
```

Generally, `response.response` is the [AxiosResponse](https://github.com/axios/axios#response-schema) object directly passed from the `axios.request` call. `response[<status-code>]` is the data returned when the response code is `<status-code>`. 

Now, you have a typed result `data` and you can confidently believe it is matches the type you just defined!

## API Reference

1. `tyrann`

    ```typescript
    import { tyrann } from 'tyrann-io';
    const tyrann = <Apis extends TyrannApis>(apis: Apis, options: TyrannOptions = {}): Tyrann<Apis>;
    ```

    `tyrann` is used to define a set of API object. The result is used to perform API calls with strict type checkings against both the input and output. Check [User Guide](#user-guide) to have an overall understanding with it.

    You can also customise the behavior by specifying the optional `options`. `options` is a `TyrannOptions` that contains two fields:

    ```typescript
    type TyrannOptions = {
      instance?: AxiosInstance;
      axiosRequestConfig?: AxiosRequestConfig | (() => AxiosRequestConfig);
    }
    ```

    `instance` is the `AxiosInstance` that is used to make API calls. If you don't specify one, we create one for you.

    `axiosRequestConfig` is passed to `axios.request` to configure the Axios call. The default is an empty config. If it is passed with an function, the function is called on every request, so you can pass changing headers like `Authentication` to the configuration. You can also pass `baseURL` in case that you need to specify the domain rather than the current origin. `validateStatus: (s) => s < 500` is useful when you don't want to let `axios` through an error on 4XX responses. (This will skip `io-ts` check because axios check happens first. )

2. `Tyrann<Apis>.(get|post|put|delete|options|patch)`

    ```typescript
    const get = async <Name extends Names, Path extends Apis[Name]>(
      name: Name,
      request: Request,
      localOptions: TyrannOptions = options, 
    ): Promise<Response>
    ```
   
    These are the methods of the object returned by `tyrann`. 

    `name` is path name of the request, which must be one of the path given in the parameter `apis` when you called `tyrann`. `request` is an object that describes the parameters supplied to the request, statically checked against the API definition. The caller is required to fill in `query`, `path`, or `body` according to the definition. Here you can also supply a local `TyrannOptions` is shallowly merged into the `options` supplied to `tyrann.` The response object from the promise and errors that it raises are described in [User Guide](#user-guide).

3. `omittable`

    ```typescript
    import { omittable } from 'tyrann-io';
    const omittable = (a: t.Type): t.Type;
    ```

    `omittable` takes a type `A` and returns its nullable counterpart `A | undefined | null`.

4. `defaultable`

    ```typescript
    import { defaultable } from 'tyrann-io';
    const defaultable = (a: t.Any, placeholder: P): t.Type
    ```

    The missing transformation for types with default values. The caller provides the original typing (with nullable fields), and a new type that `encode`s an input object with missing values to the object filled by `placehoder`, is returned.

    ```typescript
    const t0 = t.type({
      x: omittable(t.number),
    });

    const dft0 = defaultable(
      t0,
      {
        x: 123,
      },
    );

    dft0.encode({});
    // { x: 123 }
    ```

5. `string`
    ```typescript
    import { string } from 'tyrann-io';
    const minLengthString = h
        .string()
        .min(5, 'Too short. ');
    ```

    A string with chainable validations, useful in form validation. The input is string is first checked with 'isString', then checked by chained validators. Check the methods below.

    ```typescript
    refine(refiner: (s: string) => boolean, message?: string)
    ```
    Chain a custom validator. This validator should return `isValid`.

    ```typescript
    min(n: number, message?: string)
    ```
    Check the minimum length.

    ```typescript
    max(n: number, message?: string)
    ```
    Check the maximum length.

    ```typescript
    matches(regExp: RegExp, message?: string)
    ```
    Check the string against `RegExp.test`.

6. `taggedUnion`
    ```typescript
    import { taggedUnion } from 'tyrann-io';
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
    ```

    A special union type of structs tagged with constant strings. Useful if you have 'conditional form', e.g. the user can either input the length & width & height or weight & volume of the stuff, but for each situation all the fields are verified.

## Author

👤 **Chenyu Wang**

* Website: https://blog.chenyu.pw
* Github: [@hanayashiki](https://github.com/hanayashiki)

## Show your support

Give a ⭐️ if this project helped you!


***
_This README was generated with ❤️ by [readme-md-generator](https://github.com/kefranabg/readme-md-generator)_

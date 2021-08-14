import { Either, isLeft } from 'fp-ts/lib/Either';
import * as t from 'io-ts';
import { Encode } from 'io-ts';

export type Validate<A, I> = (input: I, context: t.Context) => Either<t.Errors, A>; 

export class Validator<A> extends t.Type<A> {
  validates: Validate<A, any>[] = [
    (input: unknown, context: t.Context): Either<t.Errors, A> => 
      this.baseValidate(input, context),
  ];

  constructor(
    name: string,
    is: t.Is<A>,
    public baseValidate: Validate<A, any>,
    encode: Encode<A, A>
  ) {
    super(
      name,
      is,
      (u, c) => {
        return this.validateAll(u, c);
      },
      encode,
    )
  }

  validateAll(u: unknown, c: t.Context) {
    let e: Either<t.Errors, A> | undefined = undefined;
    for (const validate of this.validates) {
      e = validate(u, c);
      if (isLeft(e)) {
        return e;
      } else {
        u = e.right;
      }
    }
    return e!;
  }

  clone(v: Validator<A>) {
    const c = new Validator(
      v.name,
      v.is,
      v.baseValidate,
      v.encode,
    );
    c.validates = v.validates;
    return c;
  }
  
  extend(validate: Validate<A, any>): Validator<A> {
    const clone = this.clone(this);
    clone.validates = [...this.validates, validate];
    return clone;
  }

  refine(refiner: (s: A) => boolean, message?: string) {
    return this.extend(
      (input: A, context) => refiner(input)
        ? t.success(input)
        : t.failure(input, context, message),
    )
  }
}

export class StringValidator extends Validator<string> {
  constructor() {
    super(
      'string',
      (u): u is string => typeof u === 'string',
      t.string.validate,
      t.identity,
    )
  }

  clone(v: StringValidator) {
    const c = new StringValidator();
    c.validates = v.validates;
    return c;
  }

  refine(refiner: (s: string) => boolean, message?: string): StringValidator {
    return super.refine(refiner, message) as StringValidator;
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

export class BooleanValidator extends Validator<boolean> {
  constructor() {
    super(
      'number',
      (u): u is boolean => typeof u === 'boolean',
      t.boolean.validate,
      t.identity,
    )
  }

  refine(refiner: (s: boolean) => boolean, message?: string): BooleanValidator {
    return super.refine(refiner, message) as BooleanValidator;
  }

  clone(v: BooleanValidator) {
    const c = new BooleanValidator();
    c.validates = v.validates;
    return c;
  }

  // This never raises
  cast() {
    const c = this.clone(this);
    c.validates = [
      (input: unknown): Either<t.Errors, boolean> => 
        t.success(Boolean(input))
    ];
    return c;
  }

  booleanish() {
    const c = this.clone(this);
    c.validates = [
      (input: unknown, context): Either<t.Errors, boolean> => 
        input === 'true' ? t.success(true) : input === 'false' ? t.success(false) : t.failure(input, context),
    ];
    return c;
  }

  true(message?: string) {
    return this.refine((s) => s === true, message);
  }

  false(message?: string) {
    return this.refine((s) => s === false, message);
  }
}

export class NumberValidator extends Validator<number> {
  constructor() {
    super(
      'number',
      (u): u is number => typeof u === 'number',
      t.number.validate,
      t.identity,
    )
  }

  refine(refiner: (s: number) => boolean, message?: string): NumberValidator {
    return super.refine(refiner, message) as NumberValidator;
  }

  clone(v: NumberValidator) {
    const c = new NumberValidator();
    c.validates = v.validates;
    return c;
  }

  // Clear all validates, casting anything castable
  cast(message?: string) {
    const c = this.clone(this);
    c.validates = [
      (input: unknown, context: t.Context): Either<t.Errors, number> => 
        !Number.isNaN(Number(input))
        ? t.success(Number(input))
        : t.failure(input, context, message),
    ];
    return c;
  }

  min(n: number, message?: string) {
    return this.refine((s) => s >= n, message);
  }

  max(n: number, message?: string) {
    return this.refine((s) => s <= n, message);
  }

  positive(message?: string) {
    return this.refine((s) => s > 0, message);
  }

  negative(message?: string) {
    return this.refine((s) => s < 0, message);
  }

  integer(message?: string) {
    return this.refine((s) => Number.isSafeInteger(s), message);
  }
}

export class ArrayValidator<C extends t.Mixed> extends Validator<t.TypeOf<C>[]> {
  arrayType: t.ArrayType<C>;
  itemType: C;

  constructor(item: C) {
    super(
      `array<${item.name}>`,
      (u): u is Array<t.TypeOf<C>> => this.arrayType.is(u),
      t.array(item).validate,
      (u) => this.arrayType.encode(u),
    );

    this.itemType = item;
    this.arrayType = t.array(item);
    this.validates.push((u, c) => this.arrayType.validate(u, c));
  }

  clone(v: ArrayValidator<C>) {
    const c = new ArrayValidator<C>(v.itemType);
    c.arrayType = v.arrayType;
    c.itemType = v.itemType;
    c.validates = v.validates;
    return c;
  }

  refine(refiner: (s: t.TypeOf<C>[]) => boolean, message?: string): ArrayValidator<C> {
    return super.refine(refiner, message) as ArrayValidator<C>;
  }

  min(n: number, message?: string) {
    return this.refine((s) => s.length >= n, message);
  }

  max(n: number, message?: string) {
    return this.refine((s) => s.length <= n, message);
  }

  required(message?: string) {
    return this.min(1, message);
  }
}

export class InterfaceValidator<A extends {}> extends Validator<A> {
  interfaceType: t.Type<A>;

  constructor(
    inferfaceType: t.Type<A>,
  ) {
    super(
      'interface',
      (u): u is A => inferfaceType.is(u),
      inferfaceType.validate,
      (u) => inferfaceType.encode(u),
    );

    this.interfaceType = inferfaceType;
  }

  clone(v: InterfaceValidator<A>) {
    const c = new InterfaceValidator<A>(v.interfaceType);
    c.validates = v.validates;
    return c;
  }

  refine(refiner: (s: A) => boolean, message?: string): InterfaceValidator<A> {
    return super.refine(refiner, message) as InterfaceValidator<A>;
  }

}

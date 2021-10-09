'use strict';

/* Types */
export type Primitive = string | number | bigint | boolean | undefined | null;

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends Primitive ? T[P] : DeepReadonly<T[P]>;
};

export type DeepReadonlyArray<T> = ReadonlyArray<DeepReadonly<T>>;

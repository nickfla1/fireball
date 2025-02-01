import fastJson from 'fast-json-stringify';

export interface FunctionError<AdditionInfo extends object = object> {
  code: string;
  message: string;
  additionalInfo: AdditionInfo;
}

export type FunctionResponseSuccess<Data extends object = object> = {
  success: true;
  data: Data;
};

export type FunctionResponseError<
  Err extends FunctionError<AdditionInfo>,
  AdditionInfo extends object = object,
> = {
  success: false;
  error: Err;
};

export type FunctionResponse<
  Data extends object = object,
  Err extends FunctionError = FunctionError,
> = FunctionResponseSuccess<Data> | FunctionResponseError<Err>;

const stringifySuccess = fastJson({
  title: 'Success response schema',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: { type: 'object' },
  },
  required: ['success', 'data'],
});

const stringifyError = fastJson({
  title: 'Error response schema',
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        additionalInfo: { type: 'object' },
      },
      required: ['code', 'message'],
    },
  },
  required: ['success', 'error'],
});

export function serializeSuccess(res: FunctionResponseSuccess): string {
  return stringifySuccess(res);
}

export function serializeError(
  res: FunctionResponseError<FunctionError<object>>,
): string {
  return stringifyError(res);
}

export function success<Data extends object>(
  data: Data,
): FunctionResponseSuccess<Data> {
  const res = Object.create(null, {
    success: { value: true },
    data: { value: data },
  });

  return res;
}

export function fail<Err extends FunctionError>(
  error: Err,
): FunctionResponseError<Err> {
  const res = Object.create(null, {
    success: { value: false },
    error: { value: error },
  });

  return res;
}

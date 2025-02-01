import fastJson, {
  type AnySchema,
  type ObjectSchema,
} from 'fast-json-stringify';

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

export function createSuccessSchema<Data extends ObjectSchema>(data: Data) {
  return {
    title: 'Success response schema',
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data,
    },
    required: ['success', 'data'],
  } satisfies ObjectSchema;
}

export function createErrorSchema<ErrInfo extends ObjectSchema>(
  additionalInfo: ErrInfo,
) {
  return {
    title: 'Error response schema',
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      error: {
        type: 'object',
        properties: {
          code: { type: 'string' },
          message: { type: 'string' },
          additionalInfo,
        },
        required: ['code', 'message'],
      },
    },
  } satisfies ObjectSchema;
}

export function createSuccessStringify<
  Data extends ObjectSchema,
  Schema extends ReturnType<typeof createSuccessSchema<Data>>,
>(schema: Schema) {
  return fastJson(schema);
}

export function createErrorStringify<
  ErrInfo extends ObjectSchema,
  Schema extends ReturnType<typeof createErrorSchema<ErrInfo>>,
>(schema: Schema) {
  return fastJson(schema);
}

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
        additionalInfo: { type: 'null' },
      },
      required: ['code', 'message'],
    },
  },
  required: ['success', 'error'],
});

export function serializeError(
  res: FunctionResponseError<FunctionError<object>>,
): string {
  return stringifyError(res);
}

export function success<Data extends object>(
  data: Data,
): FunctionResponseSuccess<Data> {
  return Object.create(null, {
    success: { value: true, enumerable: true },
    data: { value: data, enumerable: true },
  });
}

export function fail<Err extends FunctionError>(
  error: Err,
): FunctionResponseError<Err> {
  return Object.create(null, {
    success: { value: false, enumerable: true },
    error: { value: error, enumerable: true },
  });
}

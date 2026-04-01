export type RpcRequest = {
  method: string;
  params: unknown;
};

export type RpcSuccessResponse = {
  result: unknown;
};

export type RpcErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

export type RpcResponse = RpcSuccessResponse | RpcErrorResponse;

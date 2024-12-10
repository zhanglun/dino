import { Context } from "hono";
import { z } from "zod";
import { fromError } from "zod-validation-error";

// 统一的返回数据格式
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 统一的错误处理中间件
export const errorHandler = (error: any, c: Context) => {
  let response: ApiResponse<null> = {
    success: false,
    message: "An error occurred",
  };

  if (error instanceof z.ZodError) {
    response.message = fromError(error).toString();

    return c.json(response, 400); // Zod 验证错误
  }
  if (error.code === "P2002") {
    response.message = "Wallet address already exists";
    return c.json(response, 400);
  }
  if (error.code === "P2025") {
    response.message = "Wallet not found";
    return c.json(response, 404);
  }
  response.message = "Failed to create wallet";
  return c.json(response, 500);
};

// 统一的成功响应格式
export const successResponse = <T>(
  c: Context,
  message: string,
  data: T,
  status: number = 200
) => {
  return c.json({ success: true, message, data }, status);
};

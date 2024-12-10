import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { z } from "zod";
import { successResponse, errorHandler } from "../lib/apiUtils"; // 引入新的工具模块

const router = new Hono();

// 输入验证 schema
const walletSchema = z.object({
  address: z.string().min(1, {
    message: "Address is required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
  color: z.string().optional(),
  emoji: z.string().optional(),
});

const updateSchema = z.object({
  name: z.string().optional(),
  color: z.string().optional(),
  emoji: z.string().optional(),
});

// 统一的返回数据格式
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// 统一的错误处理中间件
const errorHandlerMiddleware = (error, c) => {
  return errorHandler(error, c);
};

// 创建钱包
router.post("/", async (c) => {
  try {
    const { address, name, color, emoji } = await c.req.json();

    // 输入验证
    walletSchema.parse({ address, name, color, emoji });

    const wallet = await prisma.wallet.create({
      data: {
        address,
        name,
        color,
        emoji,
      },
    });

    return successResponse(c, "Wallet created successfully", wallet, 201); // 201 Created
  } catch (error) {
    return errorHandlerMiddleware(error, c); // 使用统一的错误处理
  }
});

// 获取所有钱包
router.get("/", async (c) => {
  try {
    const wallets = await prisma.wallet.findMany({
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
        assets: {
          select: {
            chainId: true,
            value: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // 处理统计数据
    const walletsWithStats = wallets.map((wallet) => {
      const chainCount = new Set(wallet.assets.map((a) => a.chainId)).size;
      const totalValue = wallet.assets.reduce(
        (sum, asset) => sum + Number(asset.value),
        0
      );

      return {
        ...wallet,
        chainCount,
        tokenCount: wallet._count.assets,
        totalValue,
        assets: undefined,
        _count: undefined,
      };
    });

    return successResponse(c, "Wallets fetched successfully", walletsWithStats);
  } catch (error) {
    return errorHandlerMiddleware(error, c); // 使用统一的错误处理
  }
});

// 获取单个钱包
router.get("/:address", async (c) => {
  try {
    const address = c.req.param("address");

    const wallet = await prisma.wallet.findUnique({
      where: {
        address: address.toLowerCase(),
      },
      include: {
        _count: {
          select: {
            assets: true,
          },
        },
        assets: {
          select: {
            chainId: true,
            value: true,
          },
        },
      },
    });

    if (!wallet) {
      return errorHandlerMiddleware({ code: "P2025" }, c);
    }

    // 处理统计数据
    const chainCount = new Set(wallet.assets.map((a) => a.chainId)).size;
    const totalValue = wallet.assets.reduce(
      (sum, asset) => sum + Number(asset.value),
      0
    );

    const walletWithStats = {
      ...wallet,
      chainCount,
      tokenCount: wallet._count.assets,
      totalValue,
      assets: undefined,
      _count: undefined,
    };

    return successResponse(c, "Wallet fetched successfully", walletWithStats);
  } catch (error) {
    return errorHandlerMiddleware(error, c); // 使用统一的错误处理
  }
});

// 更新钱包
router.put("/:address", async (c) => {
  try {
    const address = c.req.param("address");
    const updates = await c.req.json();

    // 输入验证
    updateSchema.parse(updates);

    // 只允许更新特定字段
    const allowedUpdates = ["name", "color", "emoji"];
    const updateData = Object.keys(updates)
      .filter((key) => allowedUpdates.includes(key))
      .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {});

    if (Object.keys(updateData).length === 0) {
      return c.json(
        {
          success: false,
          message: "No valid fields to update",
        } as ApiResponse<null>,
        400
      );
    }

    const wallet = await prisma.wallet.update({
      where: {
        address: address.toLowerCase(),
      },
      data: updateData,
    });

    return successResponse(c, "Wallet updated successfully", wallet);
  } catch (error) {
    return errorHandlerMiddleware(error, c); // 使用统一的错误处理
  }
});

// 删除钱包
router.delete("/:address", async (c) => {
  try {
    const address = c.req.param("address");

    const wallet = await prisma.wallet.delete({
      where: {
        address: address.toLowerCase(),
      },
    });

    return successResponse(c, "Wallet deleted successfully", wallet);
  } catch (error) {
    return errorHandlerMiddleware(error, c); // 使用统一的错误处理
  }
});

export { router as walletsRouter };

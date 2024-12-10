import { Hono } from 'hono';
import { prisma } from '../lib/prisma';
import { z } from "zod";

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
const errorHandler = (error, c) => {
  console.error("Error:", error);
  let response: ApiResponse<null> = {
    success: false,
    message: "An error occurred",
  };

  if (error instanceof z.ZodError) {
    response.message = error.errors.map((e) => e.message).join(", ");
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

    return c.json(
      { success: true, message: "Wallet created successfully", data: wallet },
      200
    ); // 201 Created
  } catch (error) {
    return errorHandler(error, c); // 使用统一的错误处理
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

    return c.json({
      success: true,
      message: "Wallets fetched successfully",
      data: walletsWithStats,
    });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return errorHandler(error, c);
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
      return errorHandler({ code: "P2025" }, c);
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

    return c.json({
      success: true,
      message: "Wallet fetched successfully",
      data: walletWithStats,
    });
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return errorHandler(error, c);
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

    return c.json({
      success: true,
      message: "Wallet updated successfully",
      data: wallet,
    });
  } catch (error) {
    return errorHandler(error, c); // 使用统一的错误处理
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

    return c.json({ success: true, message: "Wallet deleted successfully" });
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return errorHandler(error, c);
  }
});

export { router as walletsRouter };

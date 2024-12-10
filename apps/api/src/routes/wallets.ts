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

// 统一的错误处理中间件
const errorHandler = (error, c) => {
  console.error("Error:", error);
  if (error instanceof z.ZodError) {
    return c.json(
      { error: error.errors.map((e) => e.message).join(", ") },
      400
    ); // Zod 验证错误
  }
  if (error.code === "P2002") {
    // Prisma 唯一约束违反
    return c.json({ error: "Wallet address already exists" }, 400);
  }
  if (error.code === "P2025") {
    // Prisma 记录不存在
    return c.json({ error: "Wallet not found" }, 404);
  }
  return c.json({ error: "Failed to create wallet" }, 500);
};

// 创建钱包
router.post("/", async (c) => {
  try {
    const { address, name, color, emoji } = await c.req.json();

    // 输入验证
    walletSchema.parse({ address, name, color, emoji });

    console.log(
      "🚀 ~ file: wallets.ts:10 ~ router.post ~ address, name, color, emoji:",
      address,
      name,
      color,
      emoji
    );

    const wallet = await prisma.wallet.create({
      data: {
        address,
        name,
        color,
        emoji,
      },
    });

    return c.json(wallet, 201); // 201 Created
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

    return c.json(walletsWithStats);
  } catch (error) {
    console.error("Error fetching wallets:", error);
    return c.json({ error: "Failed to fetch wallets" }, 500);
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
      return c.json({ error: "Wallet not found" }, 404);
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

    return c.json(walletWithStats);
  } catch (error) {
    console.error("Error fetching wallet:", error);
    return c.json({ error: "Failed to fetch wallet" }, 500);
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
      return c.json({ error: "No valid fields to update" }, 400);
    }

    const wallet = await prisma.wallet.update({
      where: {
        address: address.toLowerCase(),
      },
      data: updateData,
    });

    return c.json(wallet);
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

    return c.json({ message: "Wallet deleted successfully" });
  } catch (error) {
    console.error("Error deleting wallet:", error);
    return c.json({ error: "Failed to delete wallet" }, 500);
  }
});

export { router as walletsRouter };

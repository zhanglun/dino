import { Hono } from 'hono';
import { query, transaction } from '../utils/db';

const router = new Hono();

// 创建钱包
router.post('/', async (c) => {
  try {
    const { address, name, color, emoji } = await c.req.json();
    
    const result = await query(
      'INSERT INTO wallets (address, name, color, emoji) VALUES ($1, $2, $3, $4) RETURNING *',
      [address.toLowerCase(), name, color, emoji]
    );
    
    return c.json(result.rows[0], 201);
  } catch (error) {
    console.error('Error creating wallet:', error);
    if (error.code === '23505') { // 唯一约束违反
      return c.json({ error: 'Wallet address already exists' }, 400);
    }
    return c.json({ error: 'Failed to create wallet' }, 500);
  }
});

// 获取所有钱包
router.get('/', async (c) => {
  try {
    const result = await query(`
      SELECT w.*, 
             COALESCE(s.chain_count, 0) as chain_count,
             COALESCE(s.token_count, 0) as token_count,
             COALESCE(s.total_value, 0) as total_value
      FROM wallets w
      LEFT JOIN wallet_summaries s ON w.id = s.wallet_id
      ORDER BY w.created_at DESC
    `);
    
    return c.json(result.rows);
  } catch (error) {
    console.error('Error fetching wallets:', error);
    return c.json({ error: 'Failed to fetch wallets' }, 500);
  }
});

// 获取单个钱包
router.get('/:address', async (c) => {
  try {
    const address = c.req.param('address');
    
    const result = await query(`
      SELECT w.*, 
             COALESCE(s.chain_count, 0) as chain_count,
             COALESCE(s.token_count, 0) as token_count,
             COALESCE(s.total_value, 0) as total_value
      FROM wallets w
      LEFT JOIN wallet_summaries s ON w.id = s.wallet_id
      WHERE w.address = $1
    `, [address.toLowerCase()]);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Wallet not found' }, 404);
    }
    
    return c.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching wallet:', error);
    return c.json({ error: 'Failed to fetch wallet' }, 500);
  }
});

// 更新钱包
router.put('/:address', async (c) => {
  try {
    const address = c.req.param('address');
    const updates = await c.req.json();
    
    // 只允许更新特定字段
    const allowedUpdates = ['name', 'color', 'emoji'];
    const updateFields = Object.keys(updates)
      .filter(key => allowedUpdates.includes(key))
      .map((key, index) => `${key} = $${index + 2}`);
    
    if (updateFields.length === 0) {
      return c.json({ error: 'No valid fields to update' }, 400);
    }
    
    const values = [address.toLowerCase(), ...updateFields.map(field => updates[field.split(' = ')[0]])];
    const result = await query(`
      UPDATE wallets 
      SET ${updateFields.join(', ')} 
      WHERE address = $1
      RETURNING *
    `, values);
    
    if (result.rows.length === 0) {
      return c.json({ error: 'Wallet not found' }, 404);
    }
    
    return c.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating wallet:', error);
    return c.json({ error: 'Failed to update wallet' }, 500);
  }
});

// 删除钱包
router.delete('/:address', async (c) => {
  try {
    const address = c.req.param('address');
    
    // 使用事务确保相关数据也被清理
    await transaction(async (client) => {
      // 删除钱包会通过外键级联删除相关的资产和历史记录
      const result = await client.query(
        'DELETE FROM wallets WHERE address = $1 RETURNING *',
        [address.toLowerCase()]
      );
      
      if (result.rows.length === 0) {
        return c.json({ error: 'Wallet not found' }, 404);
      }
    });
    
    return c.json({ message: 'Wallet deleted successfully' });
  } catch (error) {
    console.error('Error deleting wallet:', error);
    return c.json({ error: 'Failed to delete wallet' }, 500);
  }
});

export { router as walletsRouter };

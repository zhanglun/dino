import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index';

describe('Wallets API', () => {
    let server;

    beforeAll(() => {
        server = app.listen();
    });

    afterAll((done) => {
        server.close(done);
    });

    it('应能成功添加钱包', async () => {
        const response = await request(server)
            .post('/api/wallets')
            .send({ name: 'My Wallet', address: '0x1234567890abcdef' })
            .expect('Content-Type', /json/)
            .expect(201);

        expect(response.body).toEqual({
            id: expect.any(Number),
            name: 'My Wallet',
            address: '0x1234567890abcdef'
        });
    });

    it('添加钱包时缺少必需字段应返回 400', async () => {
        const response = await request(server)
            .post('/api/wallets')
            .send({ name: 'My Wallet' }) // 缺少 address
            .expect('Content-Type', /json/)
            .expect(400);

        expect(response.body).toEqual({ error: 'Name and address are required' });
    });

    it('应能成功获取钱包列表', async () => {
        await request(server)
            .post('/api/wallets')
            .send({ name: 'My Wallet', address: '0x1234567890abcdef' });

        const response = await request(server)
            .get('/api/wallets')
            .expect('Content-Type', /json/)
            .expect(200);

        expect(response.body).toEqual(expect.arrayContaining([
            expect.objectContaining({
                name: 'My Wallet',
                address: '0x1234567890abcdef'
            })
        ]));
    });
});

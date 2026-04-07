"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stellarService_1 = require("../src/blockchain/stellarService");
describe('Stellar verification', () => {
    it('should verify a minimal transaction record', () => {
        const record = {
            id: '12345',
            source_account: 'GABC',
            amount: '100',
            ledger: 1234,
        };
        expect((0, stellarService_1.verifyTransaction)(record)).toBe(true);
    });
    it('should reject an invalid transaction record', () => {
        const record = {
            id: '',
            source_account: 'GABC',
            amount: '100',
        };
        expect((0, stellarService_1.verifyTransaction)(record)).toBe(false);
    });
});
//# sourceMappingURL=stellar.test.js.map
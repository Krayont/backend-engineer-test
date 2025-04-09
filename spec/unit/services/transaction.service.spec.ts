import { describe, it, expect, mock, afterEach, beforeAll, beforeEach, spyOn } from "bun:test";
import type { PoolClient } from "pg";

import TransactionService from "../../../src/services/transaction.service";
import OutputService from "../../../src/services/output.service";
import TransactionModal from "../../../src/modals/transaction.modal";
import Logger from "../../../src/utilities/logger";
import type { IOutput } from "../../../src/interfaces/output.interface";
import type { ITransaction } from "../../../src/interfaces/transaction.interface";

//
import { 
  genesisBlockFixtures,
  normalTransactionBlockFixtures,
  coinbaseTransactionBlockFixtures 
} from "../../fixtures/block.fixture";

describe("TransactionService", () => {
  const mockClient = {} as PoolClient;

  let mockTransactionModal: { 
    createTransaction: ReturnType<typeof mock>,
    deleteTransactions: ReturnType<typeof mock>
  };

  //
  beforeAll(() => {
    Logger.error = mock((message: string, error: Error) => {
      //
    });
  })

  //
  beforeEach(() => {
    //
    mockTransactionModal = {
      createTransaction: mock(
        (
          blockId: string, 
          height: number, 
          txId: string, 
          client: PoolClient
        ) => Promise.resolve(undefined),
      ),
      deleteTransactions: mock(
        (
          height: number, client: PoolClient
        ) => Promise.resolve(undefined)
      ),
    };

    //
    TransactionModal.createTransaction = mockTransactionModal.createTransaction;
    TransactionModal.deleteTransactions = mockTransactionModal.deleteTransactions;
  })

  //
  afterEach(() => {
    (Logger.error as any).mockClear();
    mockTransactionModal.createTransaction.mockClear();
    mockTransactionModal.deleteTransactions.mockClear();
  });

  //
  describe("validateTransactionBalance", () => {
    //
    let spy = {} as any;
    beforeEach(() => {
      spy = {
        getUnspentOutputsByTransactionInput: spyOn(OutputService, "getUnspentOutputsByTransactionInput")
      }
    });

    afterEach(() => {
      spy.getUnspentOutputsByTransactionInput.mockRestore();
    });

    const txBase = {
      id: 'txn1',
      inputs: [
        { txId: 'abc', index: 0 }
      ],
      outputs: [{ value: 100 }],
    } as ITransaction;

    //
    it("should return true if transaction balance is valid - within block", async () => {
      //
      const utxoMap = new Map([
        ['abc:0', { value: 100 }],
      ]) as Map<string, IOutput>;

      const spentUtxo = new Set() as Set<string>;

      const result = await TransactionService.validateTransactionBalance(
        txBase,
        utxoMap,
        spentUtxo
      );

      expect(result.success).toBeTrue();
      expect(spy.getUnspentOutputsByTransactionInput).toHaveBeenCalledTimes(0);
    });

    //
    it("should return true if transaction balance is valid - from db", async () => {
      //
      const utxoMap = new Map() as Map<string, IOutput>;
      const spentUtxo = new Set() as Set<string>;

      //
      spy.getUnspentOutputsByTransactionInput.mockResolvedValue({
        success: true,
        response: {
          address: 'address',
          value: 100,
        }
      });

      const result = await TransactionService.validateTransactionBalance(
        txBase,
        utxoMap,
        spentUtxo
      );

      expect(result.success).toBeTrue();
      expect(spy.getUnspentOutputsByTransactionInput).toHaveBeenCalledTimes(1);
    });

    //
    it("should return true if transaction balance is valid", async () => {
      //
      const utxoMap = new Map([
        ['abc:0', { value: 50 }],
      ]) as Map<string, IOutput>;
      const spentUtxo = new Set() as Set<string>;

      //
      spy.getUnspentOutputsByTransactionInput.mockResolvedValue({
        success: true,
        response: {
          address: 'address',
          value: 50,
        }
      });

      const result = await TransactionService.validateTransactionBalance(
        {
          ...txBase,
          inputs: [
            ...txBase.inputs,
            { txId: 'abc', index: 1 }
          ]
        },
        utxoMap,
        spentUtxo
      );

      expect(result.success).toBeTrue();
      expect(spy.getUnspentOutputsByTransactionInput).toHaveBeenCalledTimes(1);
      expect(spy.getUnspentOutputsByTransactionInput).toHaveBeenCalledWith({
        txId: 'abc',
        index: 1
      });
    });

    //
    it('should return failure if double spend detected - within block', async () => {
      //
      const utxoMap = new Map([
        ['abc:0', { value: 100 }],
      ]) as Map<string, IOutput>;
      const spentUtxo = new Set(['abc:0']) as Set<string>;

      const result = await TransactionService.validateTransactionBalance(txBase, utxoMap, spentUtxo);

      expect(result.success).toBe(false);
      expect(spy.getUnspentOutputsByTransactionInput).toHaveBeenCalledTimes(0);
    });

    //
    it('should return failure if double spend detected - from db', async () => {
      //
      const utxoMap = new Map() as Map<string, IOutput>;
      const spentUtxo = new Set() as Set<string>;
      //
      spy.getUnspentOutputsByTransactionInput.mockResolvedValue({
        success: false,
        response: ""
      });
  
      const result = await TransactionService.validateTransactionBalance(txBase, utxoMap, spentUtxo);

      expect(result.success).toBe(false);
      expect(spy.getUnspentOutputsByTransactionInput).toHaveBeenCalledTimes(1);
    });

    //
    it('should return failure if OutputService fails', async () => {
      const utxoMap = new Map() as Map<string, IOutput>;
      const spentUtxo = new Set() as Set<string>;
  
      //
      spy.getUnspentOutputsByTransactionInput.mockResolvedValue({
        success: false,
        response: ""
      });
  
      const result = await TransactionService.validateTransactionBalance(txBase, utxoMap, spentUtxo);
      expect(result.success).toBeFalse();
    });

    //
    it('should return failure if input total not equal to output total', async () => {
      const tx = {
        ...txBase,
        outputs: [{ value: 90 }],
      } as ITransaction;
      const utxoMap = new Map([
        ['abc:0', { value: 100 }],
      ]) as Map<string, IOutput>;
      const spentUtxo = new Set() as Set<string>;

      //
      const result = await TransactionService.validateTransactionBalance(tx, utxoMap, spentUtxo);

      //
      expect(result.success).toBeFalse();
    });

    //
    it('should return failure if output service fails', async () => {
      //
      const utxoMap = new Map() as Map<string, IOutput>;
      const spentUtxo = new Set() as Set<string>;

      //
      const ERROR_MESSAGE = "Failed to get unspent outputs";
      spy.getUnspentOutputsByTransactionInput.mockRejectedValueOnce(new Error(ERROR_MESSAGE));

      const result = await TransactionService.validateTransactionBalance(txBase, utxoMap, spentUtxo);

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(spy.getUnspentOutputsByTransactionInput).toHaveBeenCalledTimes(1);
    });
  });

  //
  describe("isCoinbaseTransaction", () => {
    //
    it("should return true if transaction is coinbase", async () => {
      const result = await TransactionService.isCoinbaseTransaction(coinbaseTransactionBlockFixtures.transactions[0]);
      expect(result).toBeTrue();
    });

    //
    it("should return false if transaction inputs is not 0", async () => {
      const result = await TransactionService.isCoinbaseTransaction({
        ...coinbaseTransactionBlockFixtures.transactions[0],
        inputs: [
          {
            txId: "sample",
            index: 0
          }
        ]
      });
      expect(result).toBeFalse();
    });

    //
    it("should return false if transaction outputs is not 1", async () => {
      const result = await TransactionService.isCoinbaseTransaction({
        ...coinbaseTransactionBlockFixtures.transactions[0],
        outputs: []
      });
      expect(result).toBeFalse();
    });
  });

  //
  describe("createTransaction", () => {
    //
    let spy = {} as any;
    beforeEach(() => {
      spy = {
        updateSpentOutputs: spyOn(OutputService, "updateSpentOutputs"),
        createUnspentOutputs: spyOn(OutputService, "createUnspentOutputs")
      }
    });

    afterEach(() => {
      spy.updateSpentOutputs.mockRestore();
      spy.createUnspentOutputs.mockRestore();
    });

    //
    it("should return success if normal transaction created successfully", async () => {
      //
      spy.updateSpentOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      spy.createUnspentOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      mockTransactionModal.createTransaction.mockResolvedValueOnce(undefined);

      const result = await TransactionService.createTransaction(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0],
        mockClient
      );

      expect(result.success).toBeTrue();
    });

    //
    it("should return success if coinbase transaction created successfully", async () => {
      //
      spy.updateSpentOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      spy.createUnspentOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      mockTransactionModal.createTransaction.mockResolvedValueOnce(undefined);

      const result = await TransactionService.createTransaction(
        coinbaseTransactionBlockFixtures.id,
        coinbaseTransactionBlockFixtures.height,
        coinbaseTransactionBlockFixtures.transactions[0],
        mockClient
      );

      expect(result.success).toBeTrue();
    });

    //
    it("should return success if genesis transaction created successfully", async () => {
      //
      spy.updateSpentOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      spy.createUnspentOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      mockTransactionModal.createTransaction.mockResolvedValueOnce(undefined);

      const result = await TransactionService.createTransaction(
        genesisBlockFixtures.id,
        genesisBlockFixtures.height,
        genesisBlockFixtures.transactions[0],
        mockClient
      );

      expect(result.success).toBeTrue();
    });

    //
    it("should return failure if updateSpentOutputs fails", async () => {
      //
      spy.updateSpentOutputs.mockResolvedValueOnce({
        success: false,
        response: "Failed to update outputs"
      });

      const result = await TransactionService.createTransaction(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0],
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe("Failed to update outputs");
    });

    //
    it("should return failure if createUnspentOutputs fails", async () => {
      //
      spy.updateSpentOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      spy.createUnspentOutputs.mockResolvedValueOnce({
        success: false,
        response: "Failed to create outputs"
      });

      const result = await TransactionService.createTransaction(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0],
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe("Failed to create outputs");
    });

    //
    it("should return failure if createTransaction fails", async () => {
      //
      spy.updateSpentOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      spy.createUnspentOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      mockTransactionModal.createTransaction.mockRejectedValueOnce(new Error("Failed to create transaction"));

      const result = await TransactionService.createTransaction(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0],
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe("Failed to create transaction");
    });

  });

  //
  describe("deleteTransactions", () => {
    //
    let spy = {} as any;
    beforeEach(() => {
      spy = {
        deleteOutputs: spyOn(OutputService, "deleteOutputs")
      }
    });

    afterEach(() => {
      spy.deleteOutputs.mockRestore();
    });

    //
    it("should return success if transactions deleted successfully", async () => {
      //
      spy.deleteOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      mockTransactionModal.deleteTransactions.mockResolvedValueOnce(undefined);

      const result = await TransactionService.deleteTransactions(
        normalTransactionBlockFixtures.height,
        mockClient
      );

      expect(result.success).toBeTrue();
    });

    //
    it("should return failure if deleteOutputs fails", async () => {
      //
      const ERROR_MESSAGE = "Failed to delete outputs";
      spy.deleteOutputs.mockResolvedValueOnce({
        success: false,
        response: ERROR_MESSAGE
      });

      const result = await TransactionService.deleteTransactions(
        normalTransactionBlockFixtures.height,
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
    });

    //
    it("should return failure if deleteTransactions fails", async () => {
      //
      const ERROR_MESSAGE = "Failed to delete transactions";
      spy.deleteOutputs.mockResolvedValueOnce({
        success: true,
        response: ""
      });
      mockTransactionModal.deleteTransactions.mockRejectedValueOnce(new Error(ERROR_MESSAGE));

      const result = await TransactionService.deleteTransactions(
        normalTransactionBlockFixtures.height,
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
    });

  });
});

import { describe, it, expect, mock, afterEach, beforeAll, beforeEach, spyOn } from "bun:test";
import type { PoolClient, Pool } from "pg";

import DBClient from "../../../src/utilities/database/client";
import TransactionModal from "../../../src/modals/transaction.modal";
import { genesisBlockFixtures, normalTransactionBlockFixtures } from "../../fixtures/block.fixture";

type MockPoolClient = PoolClient & {
  query: ReturnType<typeof mock>;
  release: ReturnType<typeof mock>;
  connect: ReturnType<typeof mock>;
};

//
describe("TransactionModal", () => {
  //
  let mockClient: MockPoolClient;

  let spy = {} as any; 
  //
  beforeEach(() => {
    //
    spy = {
      get: spyOn(DBClient, "get").mockReturnValue(mockClient as unknown as Pool)
    };

    mockClient = {
      query: mock((query: string, params?: any[]) => Promise.resolve({ rowCount: 1 })),
      release: mock(() => undefined),
      connect: mock(() => Promise.resolve(mockClient)),
    } as unknown as MockPoolClient;
  });

  afterEach(() => {
    //
    mockClient.query.mockClear();
    mockClient.release.mockClear();
    mockClient.connect.mockClear();
    spy.get.mockRestore();
  });

  //
  describe("createTransaction", () => {
    //
    it("should create transaction successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 }); 

      expect(TransactionModal.createTransaction(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        mockClient)
      ).resolves.toBeUndefined();;
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw error if transaction cannot be created", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }); 

      expect(TransactionModal.createTransaction(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        mockClient)
      ).rejects.toThrowError();
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw an error if the query fails", async () => {
      const ERROR_MESSAGE = "Query failed";
      mockClient.query.mockRejectedValueOnce(new Error(ERROR_MESSAGE));
    
      expect(TransactionModal.createTransaction(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        mockClient)
      ).rejects.toThrow(ERROR_MESSAGE);
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
    });

  });

  //
  describe("deleteTransactions", () => {
    //
    it("should update transactions on delete successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 }); 

      await TransactionModal.deleteTransactions(
        normalTransactionBlockFixtures.height,
        mockClient
      );

      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw error if transactions cannot be updated on delete", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }); 

      expect(TransactionModal.deleteTransactions(
        normalTransactionBlockFixtures.height,
        mockClient)
      ).rejects.toThrowError();
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

  });


});
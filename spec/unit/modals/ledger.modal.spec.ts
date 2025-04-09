import { describe, it, expect, mock, afterEach, beforeAll, beforeEach, spyOn } from "bun:test";
import type { PoolClient, Pool } from "pg";

import DBClient from "../../../src/utilities/database/client";
import LedgerModal from "../../../src/modals/ledger.modal";
import { genesisBlockFixtures, normalTransactionBlockFixtures } from "../../fixtures/block.fixture";

type MockPoolClient = PoolClient & {
  query: ReturnType<typeof mock>;
  release: ReturnType<typeof mock>;
  connect: ReturnType<typeof mock>;
};

//
describe("LedgerModal", () => {
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
  describe("creditAddress", () => {
    //
    it("should create credit to address successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 }); 

      expect(LedgerModal.creditAddress(
        normalTransactionBlockFixtures.transactions[0].outputs[0].address,
        normalTransactionBlockFixtures.transactions[0].outputs[0].value,
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        0,
        mockClient
      )).resolves.toBeUndefined();;
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw error if credit to address cannot be created", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }); 

      expect(LedgerModal.creditAddress(
        normalTransactionBlockFixtures.transactions[0].outputs[0].address,
        normalTransactionBlockFixtures.transactions[0].outputs[0].value,
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        0,
        mockClient
      )).rejects.toThrowError();
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw an error if the query fails", async () => {
      const ERROR_MESSAGE = "Query failed";
      mockClient.query.mockRejectedValueOnce(new Error(ERROR_MESSAGE));
    
      expect(LedgerModal.creditAddress(
        normalTransactionBlockFixtures.transactions[0].outputs[0].address,
        normalTransactionBlockFixtures.transactions[0].outputs[0].value,
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        0,
        mockClient
      )).rejects.toThrow(ERROR_MESSAGE);
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
    });

  });

  //
  describe("debitAddress", () => {
    //
    it("should create debit to address successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 }); 

      expect(LedgerModal.debitAddress(
        normalTransactionBlockFixtures.transactions[0].inputs[0].txId,
        normalTransactionBlockFixtures.transactions[0].inputs[0].index,
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        0,
        mockClient
      )).resolves.toBeUndefined();;
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw error if debit to address cannot be created", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }); 

      expect(LedgerModal.debitAddress(
        normalTransactionBlockFixtures.transactions[0].inputs[0].txId,
        normalTransactionBlockFixtures.transactions[0].inputs[0].index,
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        0,
        mockClient
      )).rejects.toThrowError();
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });
  });

  //
  describe("getBalanceByAddress", () => {
    //
    it("should get balance by address successfully", async () => {
      //
      const address = normalTransactionBlockFixtures.transactions[0].outputs[0].address;
      const expectedBalance = 10;

      spy.get.mockReturnValue(mockClient as unknown as Pool);
      mockClient.query
        .mockResolvedValueOnce({ 
          rowCount: 1,
          rows: [
            { balance: expectedBalance }
          ]
       });

      const result = await LedgerModal.getBalanceByAddress(address);

      expect(result).toEqual(expectedBalance);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should return null if no balance found", async () => {
      //
      const address = normalTransactionBlockFixtures.transactions[0].outputs[0].address;
      spy.get.mockReturnValue(mockClient as unknown as Pool);
      mockClient.query
        .mockResolvedValueOnce({ 
          rowCount: 0,
          rows: []
       });

      const result = await LedgerModal.getBalanceByAddress(address);

      expect(result).toBeNull();
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });
  });

  //
  describe("deleteByHeight", () => {
    //
    it("should delete ledgers by height successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 }); 

      expect(LedgerModal.deleteByHeight(
        normalTransactionBlockFixtures.height,
        mockClient
      )).resolves.toBeUndefined();;
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw error if delete ledgers by height cannot be updated", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }); 

      expect(LedgerModal.deleteByHeight(
        normalTransactionBlockFixtures.height,
        mockClient
      )).rejects.toThrowError();
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });
  });

});
import { describe, it, expect, mock, afterEach, beforeAll, beforeEach, spyOn } from "bun:test";
import type { PoolClient, Pool } from "pg";

import DBClient from "../../../src/utilities/database/client";
import OutputModal from "../../../src/modals/output.modal";
import { genesisBlockFixtures, normalTransactionBlockFixtures } from "../../fixtures/block.fixture";

type MockPoolClient = PoolClient & {
  query: ReturnType<typeof mock>;
  release: ReturnType<typeof mock>;
  connect: ReturnType<typeof mock>;
};

//
describe("OutputModal", () => {
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
  describe("getUnspentOutputsByTransactionInput", () => {
    //
    it("should get the utxo by txn id and index", async () => {
      const data ={
        address: "address1",
        value: 10,
      }
      spy.get.mockReturnValue(mockClient as unknown as Pool);
      mockClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [data],
      });
    
      const result = await OutputModal.getUnspentOutputsByTransactionInput({
        txId: normalTransactionBlockFixtures.transactions[0].id,
        index: 0,
      });
    
      expect(result).toEqual(data); 
      expect(spy.get).toHaveBeenCalledTimes(1); 
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
    });

    //
    it("should throw an error if no utxo is found", async () => {
      spy.get.mockReturnValue(mockClient as unknown as Pool);
      mockClient.query.mockResolvedValueOnce({
        rowCount: 0,
        rows: [],
      });
    
      expect(OutputModal.getUnspentOutputsByTransactionInput({
        txId: normalTransactionBlockFixtures.transactions[0].id,
        index: 0,
      })).rejects.toThrow();
    
      expect(spy.get).toHaveBeenCalledTimes(1); 
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
    });

    //
    it("should throw an error if the query fails", async () => {
      const ERROR_MESSAGE = "Query failed";
      spy.get.mockReturnValue(mockClient as unknown as Pool);
      mockClient.query.mockRejectedValueOnce(new Error(ERROR_MESSAGE));
    
      expect(OutputModal.getUnspentOutputsByTransactionInput({
        txId: normalTransactionBlockFixtures.transactions[0].id,
        index: 0,
      })).rejects.toThrow(ERROR_MESSAGE);
    
      expect(spy.get).toHaveBeenCalledTimes(1); 
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
    });

  });

  //
  describe("createUnspentOutput", () => {
    //
    it("should create an unspent output", async () => {

      const output = {
        address: "address1",
        value: 10,
      };
    
      mockClient.query.mockResolvedValueOnce({
        rowCount: 1,
      });
    
      await OutputModal.createUnspentOutput(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        0,
        output,
        mockClient
      );

      //
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
    });

    //
    it("should throw an error if cannot create unspent output", async () => {
      mockClient.query.mockRejectedValueOnce({
        rowCount: 0,
      });

      const output = {
        address: "address1",
        value: 10,
      };
    
      expect(OutputModal.createUnspentOutput(
          normalTransactionBlockFixtures.id,
          normalTransactionBlockFixtures.height,
          normalTransactionBlockFixtures.transactions[0].id,
          0,
          output,
          mockClient
        )
      ).rejects.toThrow();
    
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
    });
  });

  //
  describe("updateUnSpentOutput", () => {
    //
    it("should update an unspent output", async () => {
      const input = {
        txId: normalTransactionBlockFixtures.transactions[0].id,
        index: 0,
      };
      const output = {
        address: "address1",
        value: 10,
      }
    
      mockClient.query
        .mockResolvedValueOnce({
          rowCount: 1,
          rows: [output],
        })
        .mockResolvedValueOnce({
          rowCount: 1
        });
    
      const result = await OutputModal.updateUnSpentOutput(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        input,
        normalTransactionBlockFixtures.transactions[0].id,
        mockClient
      );

      expect(result).toEqual(output);
      expect(mockClient.query).toHaveBeenCalledTimes(2); 
    });
    
    //
    it("should throw an error if lock output fails", async () => {
      const input = {
        txId: normalTransactionBlockFixtures.transactions[0].id,
        index: 0,
      };
    
      mockClient.query
        .mockResolvedValueOnce({
          rowCount: 0,
        })
        .mockResolvedValueOnce({
          rowCount: 1
        });
    
      expect(OutputModal.updateUnSpentOutput(
          normalTransactionBlockFixtures.id,
          normalTransactionBlockFixtures.height,
          input,
          normalTransactionBlockFixtures.transactions[0].id,
          mockClient
        )
      ).rejects.toThrow();
    
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
    });

    //
    it("should throw an error if update output fails", async () => {
      const input = {
        txId: normalTransactionBlockFixtures.transactions[0].id,
        index: 0,
      };
    
      mockClient.query
        .mockResolvedValueOnce({
          rowCount: 1,
        })
        .mockResolvedValueOnce({
          rowCount: 0
        });
    
      expect(OutputModal.updateUnSpentOutput(
          normalTransactionBlockFixtures.id,
          normalTransactionBlockFixtures.height,
          input,
          normalTransactionBlockFixtures.transactions[0].id,
          mockClient
        )
      ).rejects.toThrow();
    
      expect(mockClient.query).toHaveBeenCalledTimes(2); 
    });
  });

  //
  describe("deleteOutputs", () => {
    //
    it("should delete outputs with height greater than the given height", async () => {
      const height = 1;
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 1 });
    
      expect(OutputModal.deleteOutputs(height, mockClient)).resolves.toBeUndefined();
      expect(mockClient.query).toHaveBeenCalledTimes(2); 
    });

    //
    it("should throw an error if delete query fails", async () => {
      const height = 1;
      mockClient.query
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rowCount: 1 });
    
      expect(OutputModal.deleteOutputs(height, mockClient)).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
    });

    //
    it("should throw an error if update spent information fails", async () => {
      const height = 1;
      mockClient.query
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 });
    
      expect(OutputModal.deleteOutputs(height, mockClient)).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledTimes(2); 
    });


  });

});
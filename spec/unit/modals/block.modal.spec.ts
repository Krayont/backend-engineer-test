import { describe, it, expect, mock, afterEach, beforeAll, beforeEach, spyOn } from "bun:test";
import type { PoolClient, Pool } from "pg";

import DBClient from "../../../src/utilities/database/client";
import BlockModal from "../../../src/modals/block.modal";

//
import { normalTransactionBlockFixtures } from "../../fixtures/block.fixture";

type MockPoolClient = PoolClient & {
  query: ReturnType<typeof mock>;
  release: ReturnType<typeof mock>;
  connect: ReturnType<typeof mock>;
};

//
describe("BlockModal", () => {
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
  describe("createBlock", () => {
    //
    it("should update existing blocks and insert a new block", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 }) 
        .mockResolvedValueOnce({ rowCount: 1 }); 

      expect(BlockModal.createBlock(normalTransactionBlockFixtures, mockClient)).resolves.toBeUndefined();
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    //
    it("should throw an error if the update query fails", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }) 
        .mockResolvedValueOnce({ rowCount: 1 });

      expect(BlockModal.createBlock(normalTransactionBlockFixtures, mockClient)).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });
    
    //
    it("should throw an error if the block already exists", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 0 }); 

      expect(BlockModal.createBlock(normalTransactionBlockFixtures, mockClient)).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    //
    it("should throw an error if the database query fails", async () => {
      const ERROR_MESSAGE = "Database query failed";
      mockClient.query.mockRejectedValueOnce(new Error("Database query failed"));
    
      expect(BlockModal.createBlock(normalTransactionBlockFixtures, mockClient)).rejects.toThrow(ERROR_MESSAGE);
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

  });

  //
  describe("getCurrentHeight", () => {
    //
    it("should return the current height", async () => {
      spy.get.mockReturnValue(mockClient as unknown as Pool);

      const mockHeight = 100;
      mockClient.query.mockResolvedValueOnce({
        rowCount: 1,
        rows: [{ height: mockHeight }],
      });
    
      const result = await BlockModal.getCurrentHeight();
    
      expect(result).toEqual(mockHeight); 
      expect(spy.get).toHaveBeenCalledTimes(1); 
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
    });

    //
    it("should return null if height not found and isGenesis", async () => {
      spy.get.mockReturnValue(mockClient as unknown as Pool);
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });

      expect(BlockModal.getCurrentHeight(true)).resolves.toBeNull();
      expect(spy.get).toHaveBeenCalledTimes(1); 
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw an error if no height is found", async () => {
      spy.get.mockReturnValue(mockClient as unknown as Pool);
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });

      expect(BlockModal.getCurrentHeight()).rejects.toThrow();
      expect(spy.get).toHaveBeenCalledTimes(1); 
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });
  });

  //
  describe("deleteBlock", () => {
    //
    it("should delete the block with the given height", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 }) 
        .mockResolvedValueOnce({ rowCount: 1 }); 

      expect(BlockModal.deleteBlock(1, mockClient)).resolves.toBeUndefined();
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    //
    it("should throw an error if cannot set new tip", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 }) 
        .mockResolvedValueOnce({ rowCount: 0 }); 

      expect(BlockModal.deleteBlock(1, mockClient)).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledTimes(2);
    });

    it("should throw an error if cannot updated delete records", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }) 
        .mockResolvedValueOnce({ rowCount: 1 }); 

      expect(BlockModal.deleteBlock(1, mockClient)).rejects.toThrow();
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });
  });


});
import { describe, it, expect, mock, afterEach, beforeAll, beforeEach, spyOn } from "bun:test";
import type { PoolClient, Pool } from "pg";

import DBClient from "../../../src/utilities/database/client";
import InputModal from "../../../src/modals/input.modal";
import { genesisBlockFixtures, normalTransactionBlockFixtures } from "../../fixtures/block.fixture";

type MockPoolClient = PoolClient & {
  query: ReturnType<typeof mock>;
  release: ReturnType<typeof mock>;
  connect: ReturnType<typeof mock>;
};

//
describe("InputModal", () => {
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
  describe("createInput", () => {
    //
    it("should create input successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 }); 

      expect(InputModal.createInput(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        normalTransactionBlockFixtures.transactions[0].inputs[0],
        mockClient)
      ).resolves.toBeUndefined();;
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw an error if not able to insert input", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }); 

      expect(InputModal.createInput(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        normalTransactionBlockFixtures.transactions[0].inputs[0],
        mockClient)
      ).rejects.toThrow("Unable to create Input");
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw an error if the database query fails", async () => {
      const ERROR_MESSAGE = "Database query failed";
      mockClient.query.mockRejectedValueOnce(new Error("Database query failed"));
    
      expect(InputModal.createInput(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        normalTransactionBlockFixtures.transactions[0].inputs[0],
        mockClient)
      ).rejects.toThrow(ERROR_MESSAGE);
    
      expect(mockClient.query).toHaveBeenCalledTimes(1);

    });
  });

  //
  describe("deleteInputs", () => {
    //
    it("should delete inputs successfully", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 }); 

      expect(InputModal.deleteInputs(
        normalTransactionBlockFixtures.height,
        mockClient)
      ).resolves.toBeUndefined();
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

    //
    it("should throw an error if not able to delete inputs", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rowCount: 0 }); 

      expect(InputModal.deleteInputs(
        normalTransactionBlockFixtures.height,
        mockClient)
      ).rejects.toThrow("Unable to delete Inputs");
      expect(mockClient.query).toHaveBeenCalledTimes(1);
    });

  });


});
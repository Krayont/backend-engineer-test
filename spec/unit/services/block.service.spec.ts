import { describe, it, expect, mock, afterEach, beforeAll, beforeEach, spyOn } from "bun:test";
import type { PoolClient, Pool } from "pg";

//
import BlockService from "../../../src/services/block.service";
import TransactionService from  "../../../src/services/transaction.service";
import Helper from "../../../src/utilities/helper";
import BlockModal from "../../../src/modals/block.modal";
import Logger from "../../../src/utilities/logger";
import DBClient from "../../../src/utilities/database/client";

//
import { 
  genesisBlockFixtures,
  normalTransactionBlockFixtures
} from "../../fixtures/block.fixture";

type MockPoolClient = PoolClient & {
  query: ReturnType<typeof mock>;
  release: ReturnType<typeof mock>;
  connect: ReturnType<typeof mock>;
};

describe("BlockService", () => {
  let mockClient: MockPoolClient;

  let mockBlockModal: { 
    createBlock: ReturnType<typeof mock>,
    getCurrentHeight: ReturnType<typeof mock>,
    deleteBlock : ReturnType<typeof mock>,
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
    mockBlockModal = {
      createBlock: mock(
        (block: any, client: PoolClient) => Promise.resolve(undefined)
      ),
      getCurrentHeight: mock(
        (isGenesis: boolean) => Promise.resolve<number | null>(null)
      ),
      deleteBlock: mock(
        (height: number, client: PoolClient) => Promise.resolve()
      )
    };
    BlockModal.createBlock = mockBlockModal.createBlock;
    BlockModal.getCurrentHeight = mockBlockModal.getCurrentHeight;
    BlockModal.deleteBlock = mockBlockModal.deleteBlock;
  });

  //
  afterEach(() => {    
    (Logger.error as any).mockClear();
    mockBlockModal.createBlock.mockClear();
    mockBlockModal.getCurrentHeight.mockClear();
    mockBlockModal.deleteBlock.mockClear();
  });

  //
  describe("validateBlockInformation", () => {
    //
    let spy = {} as any;
    beforeEach(() => {
      spy = {
        isCoinbaseTransaction: spyOn(TransactionService, "isCoinbaseTransaction"),
        validateTransactionBalance: spyOn(TransactionService, "validateTransactionBalance"),
        isGenesisBlock: spyOn(Helper, "isGenesisBlock"),
        validateBlockHeight: spyOn(Helper, "validateBlockHeight"),
        hash: spyOn(Helper, "hash")
      };
    });

    //
    afterEach(() => {
      spy.isCoinbaseTransaction.mockRestore();
      spy.validateTransactionBalance.mockRestore();
      spy.isGenesisBlock.mockRestore();
      spy.validateBlockHeight.mockRestore();
      spy.hash.mockRestore();
    });

    //
    it("should return success if block is genesis and height is 0", async () => {
      //
      spy.isGenesisBlock.mockReturnValueOnce(true);
      mockBlockModal.getCurrentHeight.mockReturnValueOnce(null);
      spy.validateBlockHeight.mockReturnValueOnce(true);
      spy.isCoinbaseTransaction.mockReturnValueOnce(true);
      spy.validateTransactionBalance.mockReturnValueOnce({
        success: true,
        response: "success"
      });
      spy.hash.mockReturnValueOnce(genesisBlockFixtures.id);

      const result = await BlockService.validateBlockInformation(genesisBlockFixtures);

      expect(result.success).toBeTrue();
      expect(spy.isGenesisBlock).toBeCalled();
      expect(mockBlockModal.getCurrentHeight).toBeCalled();
      expect(spy.validateBlockHeight).toBeCalled();
      expect(spy.isCoinbaseTransaction).toBeCalled();
      expect(spy.validateTransactionBalance).not.toBeCalled();
      expect(spy.hash).toBeCalled();
    });

    //
    it("should return success if block is not genesis and height is valid", async () => {
      //
      spy.isGenesisBlock.mockReturnValueOnce(false);
      mockBlockModal.getCurrentHeight.mockReturnValueOnce(0);
      spy.validateBlockHeight.mockReturnValueOnce(true);
      spy.isCoinbaseTransaction.mockReturnValueOnce(false);
      spy.validateTransactionBalance.mockReturnValueOnce({
        success: true,
        response: ""
      });
      spy.hash.mockReturnValueOnce(normalTransactionBlockFixtures.id);

      const result = await BlockService.validateBlockInformation(normalTransactionBlockFixtures);

      expect(result.success).toBeTrue();
      expect(spy.isGenesisBlock).toBeCalled();
      expect(mockBlockModal.getCurrentHeight).toBeCalled();
      expect(spy.validateBlockHeight).toBeCalled();
      expect(spy.isCoinbaseTransaction).toBeCalled();
      expect(spy.validateTransactionBalance).toBeCalled();
      expect(spy.hash).toBeCalled();
    });

    //
    it("should return failure if getCurrentHeight throw error", async () => {
      //
      const ERROR_MESSAGE = "Error getting current height";
      mockBlockModal.getCurrentHeight.mockRejectedValueOnce(new Error(ERROR_MESSAGE));

      const result = await BlockService.validateBlockInformation(normalTransactionBlockFixtures);

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
    });

    //
    it("should return failure if block height is invalid", async () => {
      //
      spy.isGenesisBlock.mockReturnValueOnce(false);
      mockBlockModal.getCurrentHeight.mockReturnValueOnce(null);
      spy.validateBlockHeight.mockReturnValueOnce(false);

      const result = await BlockService.validateBlockInformation(normalTransactionBlockFixtures);

      expect(result.success).toBeFalse();
      expect(spy.isGenesisBlock).toBeCalledTimes(1);
      expect(mockBlockModal.getCurrentHeight).toBeCalledTimes(1);
      expect(spy.validateBlockHeight).toBeCalledTimes(1);
    });

    //
    it("should return failure if transaction balance is invalid", async () => {
      const ERROR_MESSAGE = "Invalid transaction balance";
      //
      spy.isGenesisBlock.mockReturnValueOnce(false);
      mockBlockModal.getCurrentHeight.mockReturnValueOnce(0);
      spy.validateBlockHeight.mockReturnValueOnce(true);
      spy.isCoinbaseTransaction.mockReturnValueOnce(false);
      spy.validateTransactionBalance.mockReturnValueOnce({
        success: false,
        response: ERROR_MESSAGE
      });

      const result = await BlockService.validateBlockInformation(normalTransactionBlockFixtures);

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(spy.isGenesisBlock).toBeCalled();
      expect(mockBlockModal.getCurrentHeight).toBeCalled();
      expect(spy.validateBlockHeight).toBeCalled();
    });

    //
    it("should return failure if transaction service throws error", async () => {
      //
      const ERROR_MESSAGE = "Error validating transaction balance";
      spy.isGenesisBlock.mockReturnValueOnce(false);
      mockBlockModal.getCurrentHeight.mockReturnValueOnce(0);
      spy.validateBlockHeight.mockReturnValueOnce(true);
      spy.isCoinbaseTransaction.mockReturnValueOnce(false);
      spy.validateTransactionBalance.mockRejectedValueOnce(new Error(ERROR_MESSAGE));

      const result = await BlockService.validateBlockInformation(normalTransactionBlockFixtures);

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
    });

    //
    it("should return failure if block id is invalid", async () => {
      //
      spy.isGenesisBlock.mockReturnValueOnce(false);
      mockBlockModal.getCurrentHeight.mockReturnValueOnce(0);
      spy.validateBlockHeight.mockReturnValueOnce(true);
      spy.isCoinbaseTransaction.mockReturnValueOnce(false);
      spy.validateTransactionBalance.mockReturnValueOnce({
        success: true,
        response: ""
      });
      spy.hash.mockReturnValueOnce("invalid_hash");

      const result = await BlockService.validateBlockInformation(normalTransactionBlockFixtures);

      expect(result.success).toBeFalse();
      expect(result.response).toBe("Invalid block Id");
    });
  });

  //
  describe("getCurrentHeight", () => {
    //
    it("should return success with the current height", async () => {
      //
      const mockHeight = 5;
      mockBlockModal.getCurrentHeight.mockResolvedValueOnce(mockHeight);

      const result = await BlockService.getCurrentHeight();

      expect(result.success).toBeTrue();
      expect(result.response).toBe(mockHeight);
    });

    //
    it("should return failure when current height is null", async () => {
      //
      mockBlockModal.getCurrentHeight.mockResolvedValueOnce(null);

      const result = await BlockService.getCurrentHeight();

      expect(result.success).toBeFalse();
    });

    //
    it("should return failure when an error occurs", async () => {
      //
      const ERROR_MESSAGE = "Error getting current height";
      mockBlockModal.getCurrentHeight.mockRejectedValueOnce(new Error(ERROR_MESSAGE));

      const result = await BlockService.getCurrentHeight();

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
    });
  });

  //
  describe("createBlock", () => {

    let spy = {} as any;

    //
    beforeEach(() => {
      spy = {
        createTransaction: spyOn(TransactionService, "createTransaction"),
        get: spyOn(DBClient, "get").mockReturnValue(mockClient as unknown as Pool)
      };

      //
      mockClient = {
        query: mock(async (query: string, params?: any[]) => {
          if (query === "BEGIN") return;
          if (query === "COMMIT") return;
          if (query === "ROLLBACK") return;
          if (query.startsWith("SELECT pg_advisory_xact_lock")) {
            return { rowCount: 1 };
          }
          throw new Error(`Unexpected query: ${query}`);
        }),
        release: mock(() => undefined),
        connect: mock(() => Promise.resolve(mockClient)),
      } as unknown as MockPoolClient;
    });

    //
    afterEach(() => {
      spy.createTransaction.mockRestore();
      spy.get.mockRestore();

      mockClient.query.mockClear();
      mockClient.release.mockClear();
      mockClient.connect.mockClear();
    });

    //
    it("should return success when creating a block", async () => {
      //
      spy.get.mockReturnValueOnce(mockClient);
      mockClient.connect.mockResolvedValueOnce(mockClient);
      spy.createTransaction.mockReturnValueOnce({
        success: true,
        response: ""
      });
      mockBlockModal.createBlock.mockResolvedValueOnce(undefined);
      
      //
      const result = await BlockService.createBlock(normalTransactionBlockFixtures);

      expect(result.success).toBeTrue();
      expect(spy.get).toHaveBeenCalledTimes(1);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("SELECT pg_advisory_xact_lock($1)", [parseInt(process.env.LOCK_KEY ?? "12345")]);
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toBeCalled();
    });

    //
    it("should return failure when failed to create transaction", async () => {
      //
      const ERROR_MESSAGE = "Error creating transaction";
      spy.get.mockReturnValueOnce(mockClient);
      mockClient.connect.mockResolvedValueOnce(mockClient);
      spy.createTransaction.mockReturnValueOnce({
        success: false,
        response: ERROR_MESSAGE
      });
      mockBlockModal.createBlock.mockResolvedValueOnce(undefined);

      const result = await BlockService.createBlock(normalTransactionBlockFixtures);

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
      expect(spy.get).toHaveBeenCalledTimes(1);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("SELECT pg_advisory_xact_lock($1)", [parseInt(process.env.LOCK_KEY ?? "12345")]);
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toBeCalled();

    });

    //
    it("should return failure when failed to create block", async () => {
      //
      const ERROR_MESSAGE = "Error creating block";
      spy.get.mockReturnValueOnce(mockClient);
      mockClient.connect.mockResolvedValueOnce(mockClient);
      spy.createTransaction.mockReturnValueOnce({
        success: true,
        response: ""
      });
      mockBlockModal.createBlock.mockRejectedValueOnce(new Error(ERROR_MESSAGE));

      const result = await BlockService.createBlock(normalTransactionBlockFixtures);

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
      expect(spy.get).toHaveBeenCalledTimes(1);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("SELECT pg_advisory_xact_lock($1)", [parseInt(process.env.LOCK_KEY ?? "12345")]);
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toBeCalled();
    });

    //
    it("should return failure when unable to acquire lock", async () => {
      const ERROR_MESSAGE = "Failed to acquire lock";
      spy.get.mockReturnValueOnce(mockClient);
      mockClient.connect.mockResolvedValueOnce(mockClient);
      //
      mockClient.query.mockImplementationOnce(async (query: string) => {
        if (query === "BEGIN") return;
      });
      mockClient.query.mockImplementationOnce(async (query: string) => {
        if (query.startsWith("SELECT pg_advisory_xact_lock")) {
          throw new Error(ERROR_MESSAGE); 
        }
      });
    
      const result = await BlockService.createBlock(normalTransactionBlockFixtures);
    
      // Assertions
      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
      expect(spy.get).toHaveBeenCalledTimes(1);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("SELECT pg_advisory_xact_lock($1)", [parseInt(process.env.LOCK_KEY ?? "12345")]);
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK"); // Ensure rollback is called
      expect(mockClient.release).toBeCalled();
    });
  });

  //
  describe("rollback", () => {
    let spy = {} as any;

    //
    beforeEach(() => {
      spy = {
        deleteTransactions: spyOn(TransactionService, "deleteTransactions"),
        get: spyOn(DBClient, "get").mockReturnValue(mockClient as unknown as Pool)
      };

      //
      mockClient = {
        query: mock(async (query: string, params?: any[]) => {
          if (query === "BEGIN") return;
          if (query === "COMMIT") return;
          if (query === "ROLLBACK") return;
          if (query.startsWith("SELECT pg_advisory_xact_lock")) {
            console.log("Executing query:", query, "with params:", params); // Debugging
            return { rowCount: 1 };
          }
          throw new Error(`Unexpected query: ${query}`);
        }),
        release: mock(() => undefined),
        connect: mock(() => Promise.resolve(mockClient)),
      } as unknown as MockPoolClient;
    });

    //
    afterEach(() => {
      spy.deleteTransactions.mockRestore();
      spy.get.mockRestore();

      mockClient.query.mockClear();
      mockClient.release.mockClear();
      mockClient.connect.mockClear();
    });

    //
    it("should return success when rolling back success", async () => {
      //
      const mockHeight = 5;
      spy.get.mockReturnValueOnce(mockClient);
      mockClient.connect.mockResolvedValueOnce(mockClient);
      spy.deleteTransactions.mockReturnValueOnce({
        success: true,
        response: ""
      });
      mockBlockModal.deleteBlock.mockResolvedValueOnce(undefined);

      //
      const result = await BlockService.rollback(mockHeight);

      expect(result.success).toBeTrue();
      expect(spy.get).toHaveBeenCalledTimes(1);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("SELECT pg_advisory_xact_lock($1)", [parseInt(process.env.LOCK_KEY ?? "12345")]);
      expect(mockClient.query).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toBeCalled();
    });

    //
    it("should return failure when failed to rollback due to unable to delete transactions", async () => {
      //
      const ERROR_MESSAGE = "Error deleting transactions";
      const mockHeight = 5;
      spy.get.mockReturnValueOnce(mockClient);
      mockClient.connect.mockResolvedValueOnce(mockClient);
      spy.deleteTransactions.mockReturnValueOnce({
        success: false,
        response: ERROR_MESSAGE
      });
      mockBlockModal.deleteBlock.mockResolvedValueOnce(undefined);

      const result = await BlockService.rollback(mockHeight);

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
      expect(spy.get).toHaveBeenCalledTimes(1);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("SELECT pg_advisory_xact_lock($1)", [parseInt(process.env.LOCK_KEY ?? "12345")]);
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toBeCalled();
    });

    //
    it("should return failure when failed to rollback due to unable to delete block", async () => {
      //
      const ERROR_MESSAGE = "Error deleting block";
      const mockHeight = 5;
      spy.get.mockReturnValueOnce(mockClient);
      mockClient.connect.mockResolvedValueOnce(mockClient);
      spy.deleteTransactions.mockReturnValueOnce({
        success: true,
        response: ""
      });
      mockBlockModal.deleteBlock.mockRejectedValueOnce(new Error(ERROR_MESSAGE));

      const result = await BlockService.rollback(mockHeight);

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
      expect(spy.get).toHaveBeenCalledTimes(1);
      expect(mockClient.connect).toHaveBeenCalledTimes(1);
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.query).toHaveBeenCalledWith("BEGIN");
      expect(mockClient.query).toHaveBeenCalledWith("SELECT pg_advisory_xact_lock($1)", [parseInt(process.env.LOCK_KEY ?? "12345")]);
      expect(mockClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toBeCalled();
    });

  });
});
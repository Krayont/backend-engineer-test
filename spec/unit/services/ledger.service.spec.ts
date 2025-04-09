import { describe, it, expect, mock, afterEach, beforeAll, beforeEach } from "bun:test";
import type { PoolClient } from "pg";

//
import LedgerService from "../../../src/services/ledger.service";
import LedgerModal from "../../../src/modals/ledger.modal";
import Logger from "../../../src/utilities/logger";

//
import { ledgerFixtures as fixtures } from "../../fixtures/ledger.fixture";

//
describe("LedgerService", () => {
  const mockClient = {} as PoolClient;

  let mockLedgerModal: { 
    creditAddress: ReturnType<typeof mock>,
    debitAddress: ReturnType<typeof mock> ,
    getBalanceByAddress: ReturnType<typeof mock>,
    deleteByHeight: ReturnType<typeof mock> 
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
    mockLedgerModal = {
      creditAddress: mock(
        (
          address: string, value: number, blockId: string, height: number, 
          txId: string, txIndex: number, client: PoolClient
        ) => Promise.resolve(undefined),
      ),
      debitAddress: mock(
        (
          address: string, value: number, blockId: string, height: number, 
          txId: string, txIndex: number, client: PoolClient
        ) => Promise.resolve(undefined)
      ),
      getBalanceByAddress: mock(
        (address: string) => Promise.resolve<number | null>(null)
      ),
      deleteByHeight:  mock(
        (height: number, client: PoolClient) => Promise.resolve()
      )
    };

    //
    LedgerModal.creditAddress = mockLedgerModal.creditAddress;
    LedgerModal.debitAddress = mockLedgerModal.debitAddress;
    LedgerModal.getBalanceByAddress = mockLedgerModal.getBalanceByAddress;
    LedgerModal.deleteByHeight = mockLedgerModal.deleteByHeight;
  })

  //
  afterEach(() => {
    (Logger.error as any).mockClear();
    mockLedgerModal.creditAddress.mockClear();
    mockLedgerModal.debitAddress.mockClear();
    mockLedgerModal.getBalanceByAddress.mockClear();
    mockLedgerModal.deleteByHeight.mockClear();
  });

  //
  describe("creditAddress", () => {
    //
    it("should return success when crediting an address succeeds", async () => {
      mockLedgerModal.creditAddress.mockResolvedValueOnce(undefined);

      const result = await LedgerService.creditAddress(
        fixtures.mockOutput,
        fixtures.blockId,
        fixtures.height,
        fixtures.txId,
        fixtures.txIndex,
        fixtures.mockClient
      );

      expect(result.success).toBeTrue();
      expect(mockLedgerModal.creditAddress).toHaveBeenCalledWith(
        fixtures.mockOutput.address,
        fixtures.mockOutput.value,
        fixtures.blockId,
        fixtures.height,
        fixtures.txId,
        fixtures.txIndex,
        fixtures.mockClient
      );
    });

    it("should return failure when crediting an address fails", async () => {
      const ERROR_MESSAGE = "Credit failed";
      mockLedgerModal.creditAddress.mockRejectedValueOnce(new Error(ERROR_MESSAGE));

      const result = await LedgerService.creditAddress(
        fixtures.mockOutput,
        fixtures.blockId,
        fixtures.height,
        fixtures.txId,
        fixtures.txIndex,
        fixtures.mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
    });
  });

  //
  describe("debitAddress", () => {
    //
    it("should return success when debiting an address succeeds", async () => {
      mockLedgerModal.debitAddress.mockResolvedValueOnce(undefined);
      const result = await LedgerService.debitAddress(
        fixtures.mockOutput,
        fixtures.blockId,
        fixtures.height,
        fixtures.txId,
        fixtures.txIndex,
        fixtures.mockClient
      );

      expect(result.success).toBeTrue();
      expect(mockLedgerModal.debitAddress).toHaveBeenCalledWith(
        fixtures.mockOutput.address,
        fixtures.mockOutput.value,
        fixtures.blockId,
        fixtures.height,
        fixtures.txId,
        fixtures.txIndex,
        fixtures.mockClient
      );
    });

    it("should return failure when debiting an address fails", async () => {
      const ERROR_MESSAGE = "Debit failed";
      mockLedgerModal.debitAddress.mockRejectedValueOnce(new Error(ERROR_MESSAGE));

      const result = await LedgerService.debitAddress(
        fixtures.mockOutput,
        fixtures.blockId,
        fixtures.height,
        fixtures.txId,
        fixtures.txIndex,
        fixtures.mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
    });
  });

  //
  describe("getBalanceByAddress", () => {
    //
    it("should return success with the balance when the address exists", async () => {
      mockLedgerModal.getBalanceByAddress.mockResolvedValueOnce(1000);
      const result = await LedgerService.getBalanceByAddress("testAddress");

      expect(result.success).toBeTrue();
      expect(result.response).toBe(1000);
      expect(mockLedgerModal.getBalanceByAddress).toHaveBeenCalledWith("testAddress");
    });

    it("should return failure when the address does not exist", async () => {
      mockLedgerModal.getBalanceByAddress.mockResolvedValueOnce(null);
      const result = await LedgerService.getBalanceByAddress("testAddress");

      expect(result.success).toBeFalse();
      expect(mockLedgerModal.getBalanceByAddress).toHaveBeenCalledWith("testAddress");
    });

    it("should return failure when an error occurs", async () => {
      const ERROR_MESSAGE = 'Balance fetch failed';
      mockLedgerModal.getBalanceByAddress.mockRejectedValueOnce(new Error(ERROR_MESSAGE));
      const result = await LedgerService.getBalanceByAddress("testAddress");

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
      expect(mockLedgerModal.getBalanceByAddress).toHaveBeenCalledWith("testAddress");
    });
  });

  //
  describe("deleteByHeight", () => {

    it("should return success when deleting by height succeeds", async () => {
      //
      mockLedgerModal.deleteByHeight.mockResolvedValueOnce(undefined);

      const result = await LedgerService.deleteByHeight(1, mockClient);

      expect(result.success).toBeTrue();
      expect(mockLedgerModal.deleteByHeight).toHaveBeenCalledWith(1, mockClient);
    });

    it("should return failure when deleting by height fails", async () => {
      //
      const ERROR_MESSAGE = 'Delete failed';
      mockLedgerModal.deleteByHeight.mockRejectedValueOnce(new Error(ERROR_MESSAGE));

      const result = await LedgerService.deleteByHeight(1, mockClient);

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(Logger.error).toHaveBeenCalledWith(ERROR_MESSAGE, expect.any(Error));
    });
  });

});
import { describe, it, expect, beforeAll, beforeEach, afterEach, mock, spyOn } from "bun:test";

//
import Logger from "../../../src/utilities/logger";
import BlockService from "../../../src/services/block.service";
import LedgerService from "../../../src/services/ledger.service";
import MainController from "../../../src/controllers/main.controller";
import { normalTransactionBlockFixtures } from "../../fixtures/block.fixture";

const { createBlock, getBalanceByAddress, rollback } = MainController;

describe("MainController", () => {
  let mockRequest: any;
  let mockReply: any;

  //
  beforeAll(() => {
    Logger.error = mock((message: string, error: Error) => {
      //
    });
  })
  
  beforeEach(() => {
    mockRequest = {};
    mockReply = {
      status: mock().mockReturnThis(),
      send: mock(),
    };
  });

  afterEach(() => {
    (Logger.error as any).mockClear();
    mockReply.status?.mockClear();
    mockReply.send?.mockClear();
  })

  //
  describe("createBlock", () => {
    let spy = {} as any;
    beforeEach(() => {
      spy = {
        validateBlockInformation: spyOn(BlockService, "validateBlockInformation"),
        createBlock: spyOn(BlockService, "createBlock"),
      }
    });
    afterEach(() => {
      spy.validateBlockInformation.mockRestore();
      spy.createBlock.mockRestore();
    });

    //
    it("should return 200 if block is created successfully", async () => {
			mockRequest.body = normalTransactionBlockFixtures;

      const CREATE_BLOCK_SUCCESS = "Block created";

			spy.validateBlockInformation.mockResolvedValueOnce({
				success: true,
			});
			spy.createBlock.mockResolvedValueOnce({
				success: true,
        response: CREATE_BLOCK_SUCCESS,
			});

			await MainController.createBlock(mockRequest, mockReply);

			expect(mockReply.status).toHaveBeenCalledWith(200);
			expect(mockReply.send).toHaveBeenCalledWith({
				message: CREATE_BLOCK_SUCCESS
			});
      expect(spy.validateBlockInformation).toHaveBeenCalledTimes(1);
      expect(spy.createBlock).toHaveBeenCalledTimes(1);
		});

    //
    it("should return 400 if block validation fails", async () => {
      mockRequest.body = normalTransactionBlockFixtures;

      const VALIDATION_ERROR = "Block validation failed";

      spy.validateBlockInformation.mockResolvedValueOnce({
        success: false,
        response: VALIDATION_ERROR,
      });

      await createBlock(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: VALIDATION_ERROR,
      });
      expect(spy.validateBlockInformation).toHaveBeenCalledTimes(1);
      expect(spy.createBlock).not.toHaveBeenCalled();
    });

    //
    it("should return 400 if block creation fails", async () => {
      mockRequest.body = normalTransactionBlockFixtures;

      const BLOCK_CREATION_ERROR = "Block creation failed";

      spy.validateBlockInformation.mockResolvedValueOnce({
        success: true,
      });
      spy.createBlock.mockResolvedValueOnce({
        success: false,
        response: BLOCK_CREATION_ERROR,
      });

      await createBlock(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: BLOCK_CREATION_ERROR,
      });
      expect(spy.validateBlockInformation).toHaveBeenCalledTimes(1);
      expect(spy.createBlock).toHaveBeenCalledTimes(1);
    });

    //
    it("should return 500 if an unexpected error occurs", async () => {
      mockRequest.body = normalTransactionBlockFixtures;

      const UNEXPECTED_ERROR = new Error("Unexpected error");

      spy.validateBlockInformation.mockResolvedValueOnce({
        success: true,
      });
      spy.createBlock.mockRejectedValueOnce(UNEXPECTED_ERROR);

      await createBlock(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(mockReply.send).toHaveBeenCalledWith({
        message: UNEXPECTED_ERROR.message,
      });
      expect(spy.validateBlockInformation).toHaveBeenCalledTimes(1);
      expect(spy.createBlock).toHaveBeenCalledTimes(1);
    });
  });


  describe('getBalanceByAddress', () => {
    let spy = {} as any;
    beforeEach(() => {
      spy = {
        getBalanceByAddress: spyOn(LedgerService, "getBalanceByAddress"),
      }
    });
    afterEach(() => {
      spy.getBalanceByAddress.mockRestore();
    });

    //
    it('should return 200 if balance is retrieved successfully', async () => {
      const address = 'address1';
      mockRequest.params = { address };
      const balance = 100;

      spy.getBalanceByAddress.mockResolvedValueOnce({
        success: true,
        response: balance,
      });

      await getBalanceByAddress(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(mockReply.send).toHaveBeenCalledWith({
        balance,
      });
      expect(spy.getBalanceByAddress).toHaveBeenCalledWith(address);
      expect(spy.getBalanceByAddress).toHaveBeenCalledTimes(1);
    });

    //
    it('should return 400 if address is missing', async () => {
      mockRequest.params = {};

      await getBalanceByAddress(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(spy.getBalanceByAddress).not.toHaveBeenCalled();
    });

    //
    it('should return 400 if address is not found', async () => {
      const address = 'address1';
      mockRequest.params = { address };
      const ERROR_MESSAGE = "Address not found";

      spy.getBalanceByAddress.mockResolvedValueOnce({
        success: false,
        response: ERROR_MESSAGE,
      });

      await getBalanceByAddress(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(spy.getBalanceByAddress).toHaveBeenCalledTimes(1);
    });

    //
    it('should return 500 if an unexpected error occurs', async () => {
      const address = 'address1';
      mockRequest.params = { address };
      const UNEXPECTED_ERROR = new Error("Unexpected error");

      spy.getBalanceByAddress.mockRejectedValueOnce(UNEXPECTED_ERROR);

      await getBalanceByAddress(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(spy.getBalanceByAddress).toHaveBeenCalledTimes(1);
    });
  });

  //
  describe('rollback', () => {
    let spy = {} as any;
    beforeEach(() => {
      spy = {
        rollback: spyOn(BlockService, "rollback"),
      }
    });
    afterEach(() => {
      spy.rollback.mockRestore();
    });

    //
    it('should return 200 if rollback is successful', async () => {
      const BLOCK_HEIGHT = 1;
      mockRequest.query = { height: BLOCK_HEIGHT };
      const ROLLBACK_SUCCESS = "Rollback successful";

      spy.rollback.mockResolvedValueOnce({
        success: true,
        response: ROLLBACK_SUCCESS,
      });

      await rollback(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(200);
      expect(spy.rollback).toHaveBeenCalledTimes(1);
    });

    //
    it('should return 400 if height is not provided', async () => {
      mockRequest.query = {};

      await rollback(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(spy.rollback).not.toHaveBeenCalled();
    });    

    //
    it('should return 400 if rollback fails', async () => {
      const BLOCK_HEIGHT = 1;
      mockRequest.query = { height: BLOCK_HEIGHT };
      const ROLLBACK_ERROR = "Rollback failed";

      spy.rollback.mockResolvedValueOnce({
        success: false,
        response: ROLLBACK_ERROR,
      });

      await rollback(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(400);
      expect(Logger.error).toHaveBeenCalledWith(ROLLBACK_ERROR);
      expect(spy.rollback).toHaveBeenCalledTimes(1);
    });

    //
    it('should return 500 if an unexpected error occurs', async () => {
      const BLOCK_HEIGHT = 1;
      mockRequest.query = { height: BLOCK_HEIGHT };
      const UNEXPECTED_ERROR = new Error("Unexpected error");

      spy.rollback.mockRejectedValueOnce(UNEXPECTED_ERROR);

      await rollback(mockRequest, mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(500);
      expect(Logger.error).toHaveBeenCalledWith('', UNEXPECTED_ERROR);
      expect(spy.rollback).toHaveBeenCalledTimes(1);
    });

  });
});
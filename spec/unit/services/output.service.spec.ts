import { describe, it, expect, mock, afterEach, beforeAll, beforeEach, spyOn } from "bun:test";
import type { PoolClient } from "pg";

import OutputService from "../../../src/services/output.service";
import LedgerService from "../../../src/services/ledger.service";
import OutputModal from "../../../src/modals/output.modal";
import InputModal from "../../../src/modals/input.modal";
import Logger from "../../../src/utilities/logger";

import type { IInput } from "../../../src/interfaces/input.interface";
import type { IOutput } from "../../../src/interfaces/output.interface";

//
import { 
  genesisBlockFixtures,
  normalTransactionBlockFixtures,
  coinbaseTransactionBlockFixtures 
} from "../../fixtures/block.fixture";

//
describe("OutputService", () => {
  const mockClient = {} as PoolClient;

  let mockInputModal: {
    createInput: ReturnType<typeof mock>,
    deleteInputs: ReturnType<typeof mock>
  };

  let mockOutputModal: { 
    getUnspentOutputsByTransactionInput: ReturnType<typeof mock>,
    createUnspentOutput: ReturnType<typeof mock>,
    updateUnSpentOutput: ReturnType<typeof mock>,
    deleteOutputs: ReturnType<typeof mock>
  };

  beforeAll(() => {
    Logger.error = mock((message: string, error: Error) => {
      //
    });
  });

  beforeEach(() => {
    mockInputModal = {
      createInput: mock(
        (
          blockId: string, 
          height: number, 
          txId: string, 
          input: IInput, 
          client: PoolClient
        ) => Promise.resolve(undefined),
      ),
      deleteInputs: mock(
        (
          height: number, client: PoolClient
        ) => Promise.resolve(undefined)
      ),
    };

    mockOutputModal = {
      getUnspentOutputsByTransactionInput: mock(
        (
          input: IInput
        ) => Promise.resolve(undefined)
      ),
      createUnspentOutput: mock(
        (
          blockId: string,
          height: number,
          txId: string,
          index: number,
          output: IOutput,
          client: PoolClient
        ) => Promise.resolve(undefined)
      ),
      updateUnSpentOutput: mock(
        (
          blockId: string,
          height: number,
          txId: string,
          index: number,
          output: IOutput,
          client: PoolClient
        ) => Promise.resolve(undefined)
      ),
      deleteOutputs: mock(
        (
          height: number, client: PoolClient
        ) => Promise.resolve(undefined)
      )   
    };

    InputModal.createInput = mockInputModal.createInput;
    InputModal.deleteInputs = mockInputModal.deleteInputs;

    OutputModal.getUnspentOutputsByTransactionInput = mockOutputModal.getUnspentOutputsByTransactionInput;
    OutputModal.createUnspentOutput = mockOutputModal.createUnspentOutput;
    OutputModal.updateUnSpentOutput = mockOutputModal.updateUnSpentOutput;
    OutputModal.deleteOutputs = mockOutputModal.deleteOutputs;

  });

  afterEach(() => {
    (Logger.error as any).mockClear();
    mockInputModal.createInput.mockClear();
    mockInputModal.deleteInputs.mockClear();

    mockOutputModal.getUnspentOutputsByTransactionInput.mockClear();
    mockOutputModal.createUnspentOutput.mockClear();
    mockOutputModal.updateUnSpentOutput.mockClear();
    mockOutputModal.deleteOutputs.mockClear();
  });

  //
  describe("UpdateUnspentOutputs", () => {
    //
    let spy = {} as any;
    beforeEach(() => {
      spy = {
        debitAddress: spyOn(LedgerService, "debitAddress")
      }
    });
    afterEach(() => {
      spy.debitAddress.mockRestore();
    });
    
    //
    it("should return success with correct parameters", async () => {
      mockOutputModal.updateUnSpentOutput.mockResolvedValue({
        address: "address",
        value: 100,
      });
      mockInputModal.createInput.mockResolvedValue(undefined);
      spy.debitAddress.mockResolvedValue({
        success: true,
        response: "success",  
      });

      const result = await OutputService.updateSpentOutputs(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        normalTransactionBlockFixtures.transactions[0].inputs,
        mockClient
      );
      expect(result.success).toBeTrue();
      expect(mockOutputModal.updateUnSpentOutput).toHaveBeenCalledTimes(normalTransactionBlockFixtures.transactions[0].inputs.length);
      expect(mockInputModal.createInput).toHaveBeenCalledTimes(normalTransactionBlockFixtures.transactions[0].inputs.length);
      expect(spy.debitAddress).toHaveBeenCalledTimes(normalTransactionBlockFixtures.transactions[0].inputs.length);
    });

    //
    it("should return error when updateUnSpentOutput fails", async () => {
      const ERROR_MESSAGE = "error";
      mockOutputModal.updateUnSpentOutput.mockRejectedValue(new Error(ERROR_MESSAGE));
      mockInputModal.createInput.mockResolvedValue(undefined);
      spy.debitAddress.mockResolvedValue({
        success: true,
        response: "success",  
      });

      const result = await OutputService.updateSpentOutputs(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        normalTransactionBlockFixtures.transactions[0].inputs,
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
    });

    //
    it("should return error when createInput fails", async () => {
      const ERROR_MESSAGE = "error";
      mockOutputModal.updateUnSpentOutput.mockResolvedValue({
        address: "address",
        value: 100,
      });
      mockInputModal.createInput.mockRejectedValue(new Error(ERROR_MESSAGE));
      spy.debitAddress.mockResolvedValue({
        success: true,
        response: "success",  
      });

      const result = await OutputService.updateSpentOutputs(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        normalTransactionBlockFixtures.transactions[0].inputs,
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
    });

    //
    it("should return error when debitAddress fails", async () => {
      const ERROR_MESSAGE = "error";
      mockOutputModal.updateUnSpentOutput.mockResolvedValue({
        address: "address",
        value: 100,
      });
      mockInputModal.createInput.mockResolvedValue(undefined);
      spy.debitAddress.mockResolvedValue({
        success: false,
        response: ERROR_MESSAGE,  
      });

      const result = await OutputService.updateSpentOutputs(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        normalTransactionBlockFixtures.transactions[0].inputs,
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
    });

  });

  //
  describe("createUnspentOutputs", () => {
    let spy = {} as any;
    beforeEach(() => {
      spy = {
        creditAddress: spyOn(LedgerService, "creditAddress")
      }
    });
    afterEach(() => {
      spy.creditAddress.mockRestore();
    });

    //
    it("should return success with correct parameters", async () => {
      mockOutputModal.createUnspentOutput.mockResolvedValue(undefined);
      spy.creditAddress.mockResolvedValue({
        success: true,
        response: "success",  
      });

      const result = await OutputService.createUnspentOutputs(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        normalTransactionBlockFixtures.transactions[0].outputs,
        mockClient
      );

      expect(result.success).toBeTrue();
      expect(mockOutputModal.createUnspentOutput).toHaveBeenCalledTimes(normalTransactionBlockFixtures.transactions[0].outputs.length);
      expect(spy.creditAddress).toHaveBeenCalledTimes(normalTransactionBlockFixtures.transactions[0].outputs.length);
    });

    //
    it("should return error when createUnspentOutput fails", async () => {
      const ERROR_MESSAGE = "error";
      mockOutputModal.createUnspentOutput.mockRejectedValue(new Error(ERROR_MESSAGE));
      spy.creditAddress.mockResolvedValue({
        success: true,
        response: "success",  
      });

      const result = await OutputService.createUnspentOutputs(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        normalTransactionBlockFixtures.transactions[0].outputs,
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
    });

    //
    it("should return error when creditAddress fails", async () => {
      const ERROR_MESSAGE = "error";
      mockOutputModal.createUnspentOutput.mockResolvedValue(undefined);
      spy.creditAddress.mockResolvedValue({
        success: false,
        response: ERROR_MESSAGE,  
      });

      const result = await OutputService.createUnspentOutputs(
        normalTransactionBlockFixtures.id,
        normalTransactionBlockFixtures.height,
        normalTransactionBlockFixtures.transactions[0].id,
        normalTransactionBlockFixtures.transactions[0].outputs,
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
    });
  });

  //
  describe("getUnspentOutputsByTransactionInput", () => {
    //
    it("should return success with correct parameters", async () => {
      const output = {
        address: "address",
        value: 100,
      }
      mockOutputModal.getUnspentOutputsByTransactionInput.mockResolvedValue(output);

      const result = await OutputService.getUnspentOutputsByTransactionInput(
        normalTransactionBlockFixtures.transactions[0].inputs[0]
      );

      expect(result.success).toBeTrue();
      expect(result.response).toEqual(output);
      expect(mockOutputModal.getUnspentOutputsByTransactionInput).toHaveBeenCalledWith(
        normalTransactionBlockFixtures.transactions[0].inputs[0]
      );
    });

    //
    it("should return error when getUnspentOutputsByTransactionInput fails", async () => {
      const ERROR_MESSAGE = "error";
      mockOutputModal.getUnspentOutputsByTransactionInput.mockRejectedValue(new Error(ERROR_MESSAGE));

      const result = await OutputService.getUnspentOutputsByTransactionInput(
        normalTransactionBlockFixtures.transactions[0].inputs[0]
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
    });
  });

  //
  describe("deleteOutputs", () => {
    let spy = {} as any;
    beforeEach(() => {
      spy = {
        deleteByHeight: spyOn(LedgerService, "deleteByHeight")
      }
    });

    afterEach(() => {
      spy.deleteByHeight.mockRestore();
    });

    //
    it("should return success with correct parameters", async () => {
      mockInputModal.deleteInputs.mockResolvedValue(undefined);
      mockOutputModal.deleteOutputs.mockResolvedValue(undefined);
      spy.deleteByHeight.mockResolvedValue({
        success: true,
        response: "success",
      });

      const result = await OutputService.deleteOutputs(
        normalTransactionBlockFixtures.height,
        mockClient
      );

      expect(result.success).toBeTrue();
      expect(mockInputModal.deleteInputs).toHaveBeenCalled();
      expect(mockOutputModal.deleteOutputs).toHaveBeenCalled
      expect(spy.deleteByHeight).toHaveBeenCalled();
    });

    //
    it("should return error when deleteInputs fails", async () => {
      const ERROR_MESSAGE = "error";
      mockInputModal.deleteInputs.mockRejectedValue(new Error(ERROR_MESSAGE));

      const result = await OutputService.deleteOutputs(
        normalTransactionBlockFixtures.height,
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(mockInputModal.deleteInputs).toHaveBeenCalled();
      expect(mockOutputModal.deleteOutputs).not.toHaveBeenCalled();
      expect(spy.deleteByHeight).not.toHaveBeenCalled();
    });

    //
    it("should return error when deleteOutputs fails", async () => {
      const ERROR_MESSAGE = "error";
      mockInputModal.deleteInputs.mockResolvedValue(undefined);
      mockOutputModal.deleteOutputs.mockRejectedValue(new Error(ERROR_MESSAGE));

      const result = await OutputService.deleteOutputs(
        normalTransactionBlockFixtures.height,
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(mockInputModal.deleteInputs).toHaveBeenCalled();
      expect(mockOutputModal.deleteOutputs).toHaveBeenCalled();
      expect(spy.deleteByHeight).not.toHaveBeenCalled();
    });

    //
    it("should return error when deleteByHeight fails", async () => {
      const ERROR_MESSAGE = "error";
      mockInputModal.deleteInputs.mockResolvedValue(undefined);
      mockOutputModal.deleteOutputs.mockResolvedValue(undefined);
      spy.deleteByHeight.mockResolvedValue({
        success: false,
        response: ERROR_MESSAGE,
      });

      const result = await OutputService.deleteOutputs(
        normalTransactionBlockFixtures.height,
        mockClient
      );

      expect(result.success).toBeFalse();
      expect(result.response).toBe(ERROR_MESSAGE);
      expect(mockInputModal.deleteInputs).toHaveBeenCalled();
      expect(mockOutputModal.deleteOutputs).toHaveBeenCalled();
      expect(spy.deleteByHeight).toHaveBeenCalled();
    });

    //

  });
});
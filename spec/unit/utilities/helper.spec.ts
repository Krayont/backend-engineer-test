import { describe, it, expect, mock, afterEach, beforeAll, beforeEach, spyOn } from "bun:test";
import type { PoolClient, Pool } from "pg";

//
import Helper from "../../../src/utilities/helper";
import { genesisBlockFixtures } from "../../fixtures/block.fixture";

//
describe("Helper", () => {
  //
  describe("hash", () => {
    //
    it("should return a valid hash for a given string and default algorithm", () => {
      const result = Helper.hash("test-string");
      expect(result).toBe("ffe65f1d98fafedea3514adc956c8ada5980c6c5d2552fd61f48401aefd5c00e");
    });

    //
    it("should return a valid hash for a given string and specified algorithm", () => {
      const result = Helper.hash("test-string", "sha-1");
      expect(result).toBe("4f49d69613b186e71104c7ca1b26c1e5b78c9193"); // sha-1 hash of "test-string"
    });

    //
    it("should throw an error for an unsupported algorithm", () => {
      expect(() => Helper.hash("test-string", "unsupported-algo")).toThrow();
    });
  });

  //
  describe("isGenesisBlock", () => {
    //
    it("should return true for a valid genesis block", () => {
      const result = Helper.isGenesisBlock(genesisBlockFixtures);
      expect(result).toBeTrue();
    });

    //
    it("should return false if block height is not 0", () => {

      const result = Helper.isGenesisBlock({
        ...genesisBlockFixtures,
        height: 1
      });
      expect(result).toBeFalse();
    });

    //
    it("should return false if transactions length is not 1", () => {
      const result = Helper.isGenesisBlock({
        ...genesisBlockFixtures,
        transactions: [
          ...genesisBlockFixtures.transactions,
          {
            id: "sample",
            inputs: [],
            outputs: []
          }
        ]
      });
      expect(result).toBeFalse();
    });

    //
    it("should return false if inputs length is not 0", () => {
      const result = Helper.isGenesisBlock({
        ...genesisBlockFixtures,
        transactions: [
          {
            ...genesisBlockFixtures.transactions[0],
            inputs: [
              {
                txId: "sample",
                index: 0
              }
            ],
            outputs: []
          }
        ]
      });
      expect(result).toBeFalse();
    });

    //
    it("should return false if outputs length is not 1", () => {
      const result = Helper.isGenesisBlock({
        ...genesisBlockFixtures,
        transactions: [
          {
            ...genesisBlockFixtures.transactions[0],
            inputs: [],
            outputs: []
          }
        ]
      });
      expect(result).toBeFalse();
    });
  });

  //
  describe("validateBlockHeight", () => {
    //
    it("should return true for a valid genesis block", async () => {
      const result = await Helper.validateBlockHeight(genesisBlockFixtures, null, true);
      expect(result).toBeTrue();
    });

    //
    it("should return false for a block with negative height", async () => {
      const result = await Helper.validateBlockHeight(
        {
          ...genesisBlockFixtures,
          height: -1
        }, 
        null, 
        false
      );
      expect(result).toBeFalse();
    });

    //
    it("should return true if block height is 1 greater than current height", async () => {
      const result = await Helper.validateBlockHeight(
        {
          ...genesisBlockFixtures,
          height: 2
        }, 
        1, 
        false
      );
      expect(result).toBeTrue();
    });

    //
    it("should return false if block height is not 1 greater than current height", async () => {
      const result = await Helper.validateBlockHeight(
        {
          ...genesisBlockFixtures,
          height: 5
        }, 
        1, 
        false
      );
      expect(result).toBeFalse();
    });

    //
    it("should return false if current height is null and isGenesis is false", async () => {
      const result = await Helper.validateBlockHeight(
        {
          ...genesisBlockFixtures,
          height: 1
        }, 
        null, 
        false
      );
      expect(result).toBeFalse();
    });
  });
});
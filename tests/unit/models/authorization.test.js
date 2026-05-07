import { InternalServerError } from "infra/errors";
import authorization from "models/authorization";

describe("models/authorization.js", () => {
  describe(".can()", () => {
    test("without 'user'", () => {
      expect(() => {
        authorization.can();
      }).toThrow(InternalServerError);
    });
    test("without 'user.features'", () => {
      const createdUser = {
        username: "userWithoutFeatures",
      };
      expect(() => {
        authorization.can(createdUser);
      }).toThrow(InternalServerError);
    });
    test("with unknow feature", () => {
      const createdUser = {
        features: [],
      };
      expect(() => {
        authorization.can(createdUser, "unknow:feature");
      }).toThrow(InternalServerError);
    });
    test("with valid user and know feature", () => {
      const createdUser = {
        features: ["create:user"],
      };
      expect(authorization.can(createdUser, "create:user")).toBe(true);
    });
  });
  describe(".filterOutput()", () => {
    test("without 'user'", () => {
      expect(() => {
        authorization.filterOutput();
      }).toThrow(InternalServerError);
    });
    test("without 'user.features'", () => {
      const createdUser = {
        username: "userWithoutFeatures",
      };
      expect(() => {
        authorization.filterOutput(createdUser);
      }).toThrow(InternalServerError);
    });
    test("with unknow feature", () => {
      const createdUser = {
        features: [],
      };
      expect(() => {
        authorization.filterOutput(createdUser, "unknow:feature");
      }).toThrow(InternalServerError);
    });
    test("with valid user, know feature and missing unfilteredOutput", () => {
      const createdUser = {
        features: ["read:user"],
      };
      expect(() => {
        authorization.filterOutput(createdUser, "unknow:feature");
      }).toThrow(InternalServerError);
    });
    test("with valid user, know feature and unfilteredOutput", () => {
      const createdUser = {
        features: ["read:user"],
      };

      expect(() => {
        authorization.filterOutput(createdUser, "read:user");
      }).toThrow(InternalServerError);
    });
  });
});

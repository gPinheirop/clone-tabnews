import { InternalServerError } from "infra/errors";

const AVAILABLE_FEATURES = [
  // USER
  "create:user",
  "read:user",
  "read:user:self",
  "update:user",
  "update:user:others",
  // SESSION
  "create:session",
  "read:session",
  // ACTIVATION_TOKEN
  "read:activation_token",
  // MIGRATION
  "create:migration",
  "read:migration",
  // STATUS
  "read:status",
  "read:status:all",
];

function can(user, feature, resource) {
  validateUser(user);
  validateFeature(feature);
  let authorized = false;

  if (user.features.includes(feature)) {
    authorized = true;
  }

  if (feature === "update:user" && resource) {
    authorized = false;
    if (user.id === resource.id || can(user, "update:user:others")) {
      authorized = true;
    }
  }
  return authorized;
}

function filterOutput(user, feature, unfilteredOutput) {
  validateUser(user);
  validateFeature(feature);
  validateUnfilteredOutput(unfilteredOutput);
  if (feature === "read:user:self") {
    if (user.id === unfilteredOutput.id) {
      return {
        id: unfilteredOutput.id,
        username: unfilteredOutput.username,
        features: unfilteredOutput.features,
        email: unfilteredOutput.email,
        created_at: unfilteredOutput.created_at,
        updated_at: unfilteredOutput.updated_at,
      };
    }
  }
  if (feature === "read:user") {
    if (user.id === unfilteredOutput.id) {
      return {
        id: unfilteredOutput.id,
        username: unfilteredOutput.username,
        email: unfilteredOutput.email,
        features: unfilteredOutput.features,
        created_at: unfilteredOutput.created_at,
        updated_at: unfilteredOutput.updated_at,
      };
    }
    return {
      id: unfilteredOutput.id,
      username: unfilteredOutput.username,
      features: unfilteredOutput.features,
      created_at: unfilteredOutput.created_at,
      updated_at: unfilteredOutput.updated_at,
    };
  }
  if (feature === "read:session") {
    if (user.id === unfilteredOutput.user_id) {
      return {
        id: unfilteredOutput.id,
        token: unfilteredOutput.token,
        user_id: unfilteredOutput.user_id,
        created_at: unfilteredOutput.created_at,
        updated_at: unfilteredOutput.updated_at,
        expires_at: unfilteredOutput.expires_at,
      };
    }
  }
  if (feature === "read:activation_token") {
    return {
      id: unfilteredOutput.id,
      used_at: unfilteredOutput.used_at,
      user_id: unfilteredOutput.user_id,
      expires_at: unfilteredOutput.expires_at.toISOString(),
      created_at: unfilteredOutput.created_at.toISOString(),
      updated_at: unfilteredOutput.updated_at,
    };
  }
  if (feature === "read:migration") {
    return unfilteredOutput.map((migration) => {
      return {
        path: migration.path,
        name: migration.name,
        timestamp: migration.timestamp,
      };
    });
  }
  if (feature === "read:status") {
    const output = {
      updated_at: unfilteredOutput.updated_at,
      dependencies: {
        database: {
          opened_connections:
            unfilteredOutput.dependencies.database.opened_connections,
          max_connections:
            unfilteredOutput.dependencies.database.max_connections,
        },
      },
    };
    if (can(user, "read:status:all")) {
      output.dependencies.database.version =
        unfilteredOutput.dependencies.database.version;
    }
    return output;
  }
}

function validateUser(user) {
  if (!user || !user.features) {
    throw new InternalServerError({
      cause: "É necessário fornecer 'user' no 'authorization.can'",
    });
  }
}

function validateFeature(feature) {
  if (!feature || !AVAILABLE_FEATURES.includes(feature)) {
    throw new InternalServerError({
      cause:
        "Não foi possível encontrar a 'feature' solicitada no 'authorization.can'",
    });
  }
}

function validateUnfilteredOutput(unfilteredOutput) {
  if (!unfilteredOutput) {
    throw new InternalServerError({
      cause:
        "Não foi possível 'output' a ser filtrado pelo 'authorization.filterOutput'",
    });
  }
}

const authorization = {
  can,
  filterOutput,
};

export default authorization;

import * as cookie from "cookie";
import {
  ForbiddenError,
  InternalServerError,
  MethodNotAllowedError,
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "infra/errors";
import authorization from "models/authorization";
import session from "models/session";
import user from "models/users";

function onNoMatchHandler(_, response) {
  const publicErrorObject = new MethodNotAllowedError();
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function onErrorHandler(error, _, response) {
  if (
    error instanceof ValidationError ||
    error instanceof NotFoundError ||
    error instanceof ForbiddenError
  ) {
    return response.status(error.statusCode).json(error);
  }

  if (error instanceof UnauthorizedError) {
    clearSessionCookie(response);
    return response.status(error.statusCode).json(error);
  }

  const publicErrorObject = new InternalServerError({
    cause: error,
  });
  console.error(publicErrorObject);
  response.status(publicErrorObject.statusCode).json(publicErrorObject);
}

function setSessionCookie(token, response) {
  const setCookie = cookie.serialize("session_id", token, {
    path: "/",
    maxAge: session.EXPIRATION_IN_MILLISSECONDS / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  response.setHeader("Set-Cookie", setCookie);
}

function clearSessionCookie(response) {
  const setCookie = cookie.serialize("session_id", "invalid", {
    path: "/",
    maxAge: -1,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
  });

  response.setHeader("Set-Cookie", setCookie);
}

async function injectAnonymousOrUser(request, _, next) {
  if (request.cookies?.session_id) {
    await injectAuthenticatedUser(request);
    return next();
  }

  injectAnonymousUser(request);
  return next();
}

async function injectAuthenticatedUser(request) {
  const sessionToken = request.cookies.session_id;
  const sessionObject = await session.findOneValidByToken(sessionToken);
  const userObject = await user.findUserById(sessionObject.user_id);

  request.context = {
    ...request.context,
    user: userObject,
  };
}

function injectAnonymousUser(request) {
  request.context = {
    ...request.context,
    user: {
      features: ["read:activation_token", "create:session", "create:user"],
    },
  };
}

function canRequest(feature) {
  return function canRequestMiddleware(request, _, next) {
    const userTryingToRequest = request.context.user;

    if (authorization.can(userTryingToRequest, feature)) return next();

    throw new ForbiddenError({
      message: "Você não possui permissão para acessar esse recurso",
      action: `Verifique se seu usuário possui a feature: ${feature}`,
    });
  };
}

const controller = {
  errorHandlers: {
    onNoMatch: onNoMatchHandler,
    onError: onErrorHandler,
  },
  setSessionCookie,
  clearSessionCookie,
  injectAnonymousOrUser,
  canRequest,
};

export default controller;

export class InternalServerError extends Error {
  constructor({ cause, statusCode }) {
    super("Um erro interno não esperado aconteceu.", {
      cause,
    });

    this.name = "InternalServerError";
    this.action = "Entre em contato com o suporte";
    this.statusCode = statusCode || 500;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ServiceError extends Error {
  constructor({ cause, message, action, context }) {
    super(message || "Serviço indisponível no momento.", {
      cause,
    });

    this.name = "ServiceError";
    this.action = action || "Verifique se o serviço está disponível.";
    this.context = context;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: 503,
    };
  }
}

export class MethodNotAllowedError extends Error {
  constructor() {
    super("Método não suportado.");
    this.name = "MethodNotAllowedError";
    this.action =
      "Verifique a documentação e se certifique de que o método HTTP é válido para este endpoint.";
    this.statusCode = 405;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ValidationError extends Error {
  constructor({ cause, message, action }) {
    super(message || "Serviço indisponível no momento.", {
      cause,
    });

    this.name = "ValidationError";
    this.action = action || "Verifique se os campos estão corretos";
    this.statusCode = 400;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: 400,
    };
  }
}
export class NotFoundError extends Error {
  constructor({ message, action }) {
    super(message || "Recurso não encontrado.");

    this.name = "NotFoundError";
    this.action = action || "Verifique o termo pesquisado e tente novamente";
    this.statusCode = 404;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class UnauthorizedError extends Error {
  constructor({ message, action }) {
    super(message || "Usuário não autenticado.");

    this.name = "UnauthorizedError";
    this.action = action || "Faça o login e tente novamente";
    this.statusCode = 401;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
    };
  }
}

export class ForbiddenError extends Error {
  constructor({ message, action }) {
    super(message || "Acesso negado.");

    this.name = "ForbiddenError";
    this.action = action || "Verifique suas features antes de continuar";
    this.statusCode = 403;
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      action: this.action,
      status_code: this.statusCode,
      context: this.context,
    };
  }
}

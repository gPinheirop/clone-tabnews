function getOriginAPI() {
  if (["test", "development"].includes(process.env.NODE_ENV)) {
    return "http://localhost:3000/api/v1";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://gabrpinheiro.com.br";
}

function getOrigin() {
  if (["test", "development"].includes(process.env.NODE_ENV)) {
    return "http://localhost:3000";
  }

  if (process.env.VERCEL_ENV === "preview") {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "https://gabrpinheiro.com.br";
}

const webserver = {
  originAPI: getOriginAPI(),
  origin: getOrigin(),
};

export default webserver;

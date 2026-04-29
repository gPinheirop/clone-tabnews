import bcrypt from "bcryptjs";

async function hash(value) {
  const ROUNDS = process.env.NODE_ENV === "production" ? 14 : 1;
  return bcrypt.hash(value, ROUNDS);
}

async function compare(originalValue, hashValue) {
  return await bcrypt.compare(originalValue, hashValue);
}

const password = {
  hash,
  compare,
};

export default password;

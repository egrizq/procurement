import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return await bcrypt.hash(password, salt);
}

export async function comparePassword(password, hashedPassword) {
  return await bcrypt.compare(password, hashedPassword);
}

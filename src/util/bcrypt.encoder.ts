import * as bcrypt from 'bcrypt';

export const hash = async (plainText: string): Promise<string> => {
  const saltOrRounds = 10;
  return await bcrypt.hash(plainText, saltOrRounds);
};

export const isHashValid = async (password, hashPassword): Promise<boolean> => {
  return await bcrypt.compare(password, hashPassword);
};

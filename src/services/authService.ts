import bcrypt from 'bcryptjs';
import {prisma} from '../config/prismaClient';
import {signJwt} from '../utils/jwt';

export const registerUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const existingUser = await prisma.user.findUnique({where: {email}});
  if (existingUser) {
    throw new Error('User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.create({
    data: {
      email,
      passwordHash,
    },
  });
};

export const authenticateUser = async (email: string, password: string) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const user = await prisma.user.findUnique({where: {email}});
  if (!user) {
    throw new Error('Invalid credentials');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new Error('Invalid credentials');
  }

  return signJwt({sub: user.id, email: user.email, role: user.role});
};

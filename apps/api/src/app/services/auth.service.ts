import bcrypt from 'bcrypt';
import { LoginInput, RegisterInput } from '@itp-home-garden/shared-api-contracts';
import { UserRepository } from '../database/repositories/user.repository';
import { User } from '../database/types';
import { ConflictError, UnauthorizedError } from '../shared/errors';

const SALT_ROUNDS = 10;

export class AuthService {
  private readonly userRepository: UserRepository;

  constructor(opts: { userRepository: UserRepository }) {
    this.userRepository = opts.userRepository;
  }

  /**
   * Register a new user
   * @throws ConflictError if a user with this email already exists
   */
  async register(data: RegisterInput): Promise<User> {
    const existingUser = await this.userRepository.findByEmail(data.emailAddress);
    if (existingUser) {
      throw new ConflictError(`User with email ${data.emailAddress} already exists`);
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    return await this.userRepository.create({
      firstName: data.firstName,
      lastName: data.lastName,
      age: data.age,
      emailAddress: data.emailAddress,
      passwordHash,
    });
  }

  /**
   * Verify a user's credentials
   * @throws UnauthorizedError if the email is unknown or the password doesn't match
   */
  async login(data: LoginInput): Promise<User> {
    const user = await this.userRepository.findByEmail(data.emailAddress);
    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password');
    }

    return user;
  }
}

import { GardenRepository } from '../database/repositories/garden.repository';
import { Garden } from '../database/types';
import {
  createGardenSchema,
  updateGardenSchema,
  CreateGardenInput,
  UpdateGardenInput,
} from '@itp-home-garden/shared-api-contracts';
import { NotFoundError } from '../shared/errors';

export class GardenService {
  private readonly gardenRepository: GardenRepository;

  constructor(opts: { gardenRepository: GardenRepository }) {
    this.gardenRepository = opts.gardenRepository;
  }

  /**
   * Get all gardens belonging to a user
   */
  async getAllGardens(userId: number): Promise<Garden[]> {
    return await this.gardenRepository.findAllByUserId(userId);
  }

  /**
   * Get a garden by ID, scoped to its owner
   * @throws Error if garden not found or not owned by userId
   */
  async getGardenById(gardenId: number, userId: number): Promise<Garden> {
    const garden = await this.gardenRepository.findById(gardenId);
    if (!garden || garden.userId !== userId) {
      throw new NotFoundError(`Garden with ID ${gardenId} not found`);
    }
    return garden;
  }

  /**
   * Create a new garden, owned by userId
   * @throws Error if validation fails
   */
  async createGarden(data: CreateGardenInput, userId: number): Promise<Garden> {
    // Validate with Zod schema
    const validatedData = createGardenSchema.parse(data);

    return await this.gardenRepository.create({ ...validatedData, userId });
  }

  /**
   * Update a garden, scoped to its owner
   * @throws Error if garden not found, not owned by userId, or validation fails
   */
  async updateGarden(gardenId: number, data: UpdateGardenInput, userId: number): Promise<Garden> {
    // Verify garden exists and is owned by userId
    const existingGarden = await this.gardenRepository.findById(gardenId);
    if (!existingGarden || existingGarden.userId !== userId) {
      throw new NotFoundError(`Garden with ID ${gardenId} not found`);
    }

    // Validate with Zod schema
    const validatedData = updateGardenSchema.parse(data);

    return await this.gardenRepository.update(gardenId, validatedData);
  }

  /**
   * Delete a garden, scoped to its owner
   * @throws Error if garden not found or not owned by userId
   */
  async deleteGarden(gardenId: number, userId: number): Promise<void> {
    const garden = await this.gardenRepository.findById(gardenId);
    if (!garden || garden.userId !== userId) {
      throw new NotFoundError(`Garden with ID ${gardenId} not found`);
    }

    const deleted = await this.gardenRepository.delete(gardenId);
    if (!deleted) {
      throw new Error(`Failed to delete garden with ID ${gardenId}`);
    }
  }
}

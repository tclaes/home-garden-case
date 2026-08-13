import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GardenService } from './garden.service';
import { NotFoundError } from '../shared/errors';
import { Garden } from '../database/types';

function makeGarden(overrides: Partial<Garden> = {}): Garden {
  return {
    gardenId: 1,
    userId: 1,
    gardenName: 'Backyard',
    totalSurfaceArea: 10,
    locationDescription: null,
    latitude: null,
    longitude: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('GardenService', () => {
  const gardenRepository = {
    findAllByUserId: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const gardenService = new GardenService({
    gardenRepository: gardenRepository as never,
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllGardens', () => {
    it('fetches gardens scoped to the requesting user', async () => {
      const gardens = [makeGarden()];
      gardenRepository.findAllByUserId.mockResolvedValue(gardens);

      const result = await gardenService.getAllGardens(1);

      expect(result).toBe(gardens);
      expect(gardenRepository.findAllByUserId).toHaveBeenCalledWith(1);
    });
  });

  describe('getGardenById', () => {
    it('returns the garden when owned by the requesting user', async () => {
      const garden = makeGarden({ userId: 1 });
      gardenRepository.findById.mockResolvedValue(garden);

      const result = await gardenService.getGardenById(1, 1);

      expect(result).toBe(garden);
    });

    it('throws NotFoundError when the garden belongs to another user', async () => {
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 2 }));

      await expect(gardenService.getGardenById(1, 1)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when the garden does not exist', async () => {
      gardenRepository.findById.mockResolvedValue(undefined);

      await expect(gardenService.getGardenById(1, 1)).rejects.toThrow(NotFoundError);
    });
  });

  describe('createGarden', () => {
    it('creates the garden owned by the requesting user, ignoring any client-supplied userId', async () => {
      const created = makeGarden({ userId: 1 });
      gardenRepository.create.mockResolvedValue(created);

      const result = await gardenService.createGarden(
        { gardenName: 'Backyard', totalSurfaceArea: 10 },
        1,
      );

      expect(result).toBe(created);
      expect(gardenRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ gardenName: 'Backyard', totalSurfaceArea: 10, userId: 1 }),
      );
    });
  });

  describe('updateGarden', () => {
    it('updates the garden when owned by the requesting user', async () => {
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 1 }));
      const updated = makeGarden({ userId: 1, gardenName: 'Front yard' });
      gardenRepository.update.mockResolvedValue(updated);

      const result = await gardenService.updateGarden(
        1,
        { gardenName: 'Front yard', totalSurfaceArea: 10 },
        1,
      );

      expect(result).toBe(updated);
    });

    it('throws NotFoundError when the garden belongs to another user', async () => {
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 2 }));

      await expect(
        gardenService.updateGarden(1, { gardenName: 'Front yard', totalSurfaceArea: 10 }, 1),
      ).rejects.toThrow(NotFoundError);
      expect(gardenRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteGarden', () => {
    it('deletes the garden when owned by the requesting user', async () => {
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 1 }));
      gardenRepository.delete.mockResolvedValue(true);

      await gardenService.deleteGarden(1, 1);

      expect(gardenRepository.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundError when the garden belongs to another user', async () => {
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 2 }));

      await expect(gardenService.deleteGarden(1, 1)).rejects.toThrow(NotFoundError);
      expect(gardenRepository.delete).not.toHaveBeenCalled();
    });
  });
});

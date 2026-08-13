import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlantService } from './plant.service';
import { NotFoundError } from '../shared/errors';
import { Garden, Plant } from '../database/types';

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

function makePlant(overrides: Partial<Plant> = {}): Plant {
  return {
    plantId: 1,
    plantName: 'Tomato',
    species: 'Solanum lycopersicum',
    plantType: 'vegetable',
    plantationDate: new Date('2026-01-01T00:00:00.000Z'),
    surfaceAreaRequired: 2,
    idealHumidityLevel: 60,
    gardenId: 1,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('PlantService', () => {
  const plantRepository = {
    findById: vi.fn(),
    findByGardenId: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const gardenRepository = {
    findById: vi.fn(),
  };
  const plantService = new PlantService({
    plantRepository: plantRepository as never,
    gardenRepository: gardenRepository as never,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    plantRepository.findByGardenId.mockResolvedValue([]);
  });

  describe('getPlantById', () => {
    it('returns the plant when its garden is owned by the requesting user', async () => {
      const plant = makePlant();
      plantRepository.findById.mockResolvedValue(plant);
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 1 }));

      const result = await plantService.getPlantById(1, 1);

      expect(result).toBe(plant);
    });

    it("throws NotFoundError when the plant's garden belongs to another user", async () => {
      plantRepository.findById.mockResolvedValue(makePlant());
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 2 }));

      await expect(plantService.getPlantById(1, 1)).rejects.toThrow(NotFoundError);
    });

    it('throws NotFoundError when the plant does not exist', async () => {
      plantRepository.findById.mockResolvedValue(undefined);

      await expect(plantService.getPlantById(1, 1)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getPlantsByGardenId', () => {
    it('throws NotFoundError when the garden belongs to another user', async () => {
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 2 }));

      await expect(plantService.getPlantsByGardenId(1, 1)).rejects.toThrow(NotFoundError);
    });

    it('returns the plants when the garden is owned by the requesting user', async () => {
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 1 }));
      const plants = [makePlant()];
      plantRepository.findByGardenId.mockResolvedValue(plants);

      const result = await plantService.getPlantsByGardenId(1, 1);

      expect(result).toBe(plants);
    });
  });

  describe('createPlant', () => {
    it('throws NotFoundError when the target garden belongs to another user', async () => {
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 2 }));

      await expect(
        plantService.createPlant(
          {
            plantName: 'Tomato',
            species: 'Solanum lycopersicum',
            plantType: 'vegetable',
            plantationDate: '2026-01-01T00:00:00.000Z',
            surfaceAreaRequired: 2,
            idealHumidityLevel: 60,
            gardenId: 1,
          },
          1,
        ),
      ).rejects.toThrow(NotFoundError);
      expect(plantRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('updatePlant', () => {
    const fullUpdateData = {
      plantName: 'Cherry Tomato',
      species: 'Solanum lycopersicum',
      plantType: 'vegetable' as const,
      plantationDate: '2026-01-01T00:00:00.000Z',
      surfaceAreaRequired: 2,
      idealHumidityLevel: 60,
    };

    it("throws NotFoundError when the plant's current garden belongs to another user", async () => {
      plantRepository.findById.mockResolvedValue(makePlant({ gardenId: 1 }));
      gardenRepository.findById.mockResolvedValue(makeGarden({ gardenId: 1, userId: 2 }));

      await expect(plantService.updatePlant(1, { ...fullUpdateData }, 1)).rejects.toThrow(
        NotFoundError,
      );
      expect(plantRepository.update).not.toHaveBeenCalled();
    });

    it('blocks moving a plant into a garden the requesting user does not own', async () => {
      plantRepository.findById.mockResolvedValue(makePlant({ gardenId: 1 }));
      gardenRepository.findById.mockImplementation((gardenId: number) =>
        Promise.resolve(
          gardenId === 1
            ? makeGarden({ gardenId: 1, userId: 1 })
            : makeGarden({ gardenId: 2, userId: 2 }),
        ),
      );

      await expect(
        plantService.updatePlant(1, { ...fullUpdateData, gardenId: 2 }, 1),
      ).rejects.toThrow(NotFoundError);
      expect(plantRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deletePlant', () => {
    it("throws NotFoundError when the plant's garden belongs to another user", async () => {
      plantRepository.findById.mockResolvedValue(makePlant());
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 2 }));

      await expect(plantService.deletePlant(1, 1)).rejects.toThrow(NotFoundError);
      expect(plantRepository.delete).not.toHaveBeenCalled();
    });

    it('deletes the plant when its garden is owned by the requesting user', async () => {
      plantRepository.findById.mockResolvedValue(makePlant());
      gardenRepository.findById.mockResolvedValue(makeGarden({ userId: 1 }));
      plantRepository.delete.mockResolvedValue(true);

      await plantService.deletePlant(1, 1);

      expect(plantRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});

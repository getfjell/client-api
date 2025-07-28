import LibLogger from './logger';
import {
  Registry as BaseRegistry,
  createRegistry as createBaseRegistry,
  RegistryFactory,
  RegistryHub
} from '@fjell/registry';

const logger = LibLogger.get("Registry");

/**
 * Extended Registry interface for client-api-specific functionality
 */
export interface Registry extends BaseRegistry {
  type: 'client-api';
}

/**
 * Factory function for creating client-api registries
 */
export const createRegistryFactory = (): RegistryFactory => {
  return (type: string, registryHub?: RegistryHub): BaseRegistry => {
    if (type !== 'client-api') {
      throw new Error(`Client API registry factory can only create 'client-api' type registries, got: ${type}`);
    }

    logger.debug("Creating client-api registry", { type, registryHub });

    const baseRegistry = createBaseRegistry(type, registryHub);

    // Cast to Registry for type safety
    return baseRegistry as Registry;
  };
};

/**
 * Creates a new client-api registry instance
 */
export const createRegistry = (registryHub?: RegistryHub): Registry => {
  const baseRegistry = createBaseRegistry('client-api', registryHub);

  return {
    ...baseRegistry,
  } as Registry;
};

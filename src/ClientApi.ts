import {
  AffectedKeys,
  Operations as CoreOperations,
  CreateOptions,
  Item,
  OperationParams
} from "@fjell/core";

// Re-export core types for convenience
export type { OperationParams, AffectedKeys, CreateOptions };

/**
 * ClientApi interface - HTTP transport layer for Operations.
 * This is a direct mapping of the core Operations interface to HTTP calls.
 *
 * @example
 * ```typescript
 * const api: ClientApi<User, 'user'> = createClientApi(httpApi, 'user', ['user']);
 * const users = await api.all({});
 * ```
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ClientApi<
  V extends Item<S, L1, L2, L3, L4, L5>,
  S extends string,
  L1 extends string = never,
  L2 extends string = never,
  L3 extends string = never,
  L4 extends string = never,
  L5 extends string = never
> extends CoreOperations<V, S, L1, L2, L3, L4, L5> {
  // ClientApi is a pure implementation of Operations over HTTP
  // No additional methods needed
}
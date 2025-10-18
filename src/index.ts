export type { CItemApi } from "./CItemAPI";
export type { PItemApi } from "./PItemAPI";
export type { ClientApi } from "./ClientApi";
export type { ClientApiOptions } from "./ClientApiOptions";

export { createCItemApi } from "./CItemAPI";
export { createPItemApi } from "./PItemAPI";

// Registry components
export * from './Instance';
export * from './InstanceFactory';
export * from './Registry';

// Error handling
export * from './errors/index';
export * from './ops/errorHandling';

// Re-export FjellHttpError from http-api for convenience
export { FjellHttpError, isFjellHttpError, extractErrorInfo, type ErrorInfo } from '@fjell/http-api';

// HTTP wrapper
export * from './http/HttpWrapper';

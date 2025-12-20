import { Item } from "@fjell/types";
import { ClientApi } from "./ClientApi";
import { DeleteMethodOptions, GetMethodOptions, PostMethodOptions, PutMethodOptions } from "@fjell/http-api";
import { RetryConfig } from "./http/HttpWrapper";

export interface ClientApiOptions {
  readAuthenticated?: boolean;
  allAuthenticated?: boolean;
  writeAuthenticated?: boolean;
  parentApi?: ClientApi<
    Item<string, string | never, string | never, string | never, string | never, string | never>,
    string,
    string | never,
    string | never,
    string | never,
    string | never,
    string | never
  >;
  getOptions?: Partial<GetMethodOptions>;
  postOptions?: Partial<PostMethodOptions>;
  putOptions?: Partial<PutMethodOptions>;
  deleteOptions?: Partial<DeleteMethodOptions>;

  /** Configuration for HTTP request retry behavior */
  retryConfig?: RetryConfig;

  /** Whether to enable comprehensive error handling and logging (default: true) */
  enableErrorHandling?: boolean;

  /** Custom error handler for additional error processing */
  errorHandler?: (error: any, context?: Record<string, any>) => void;
}

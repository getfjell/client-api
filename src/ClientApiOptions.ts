import { Item } from "@fjell/core";
import { ClientApi } from "./ClientApi";
import { DeleteMethodOptions, GetMethodOptions, PostMethodOptions, PutMethodOptions } from "@fjell/http-api";

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
}
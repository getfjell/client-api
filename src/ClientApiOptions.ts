import { Item } from "@fjell/core";
import { ClientApi } from "./ClientApi";

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
}
import { z } from "zod";

/**
 * Extracts query parameters from a GET request URL and converts them to a plain object.
 * Automatically handles duplicate keys by converting them into arrays (e.g., ?id=1&id=2 -> { id: ["1", "2"] }).
 * 
 * @param req The incoming Next.js Request object
 * @returns A plain JavaScript object representing the query parameters
 */
export function getQueryParams(req: Request): Record<string, any> {
  const url = new URL(req.url);
  const query: Record<string, any> = {};

  url.searchParams.forEach((value, key) => {
    if (query[key]) {
      if (Array.isArray(query[key])) {
        query[key].push(value);
      } else {
        query[key] = [query[key], value];
      }
    } else {
      query[key] = value;
    }
  });

  return query;
}

/**
 * Extracts query parameters from a GET request and strictly validates them against a Zod schema.
 * 
 * IMPORTANT: Because URL query parameters are always parsed as strings initially, 
 * your Zod schema MUST use `z.coerce.number()` or `z.coerce.boolean()` if you expect non-string types.
 * 
 * @param req The incoming Request object
 * @param schema The Zod schema to validate against
 * @returns The strictly typed and parsed data
 * @throws ZodError if validation fails (which will be automatically caught by `withErrorHandler`!)
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  req: Request,
  schema: T
): z.infer<T> {
  const query = getQueryParams(req);
  return schema.parse(query);
}

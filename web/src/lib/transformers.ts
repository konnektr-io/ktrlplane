/**
 * Transform API response dates from ISO 8601 strings to Date objects
 * @param data - The API response data
 * @returns The data with created_at and updated_at converted to Date objects
 */
export function transformDates<
  T extends { created_at: unknown; updated_at: unknown }
>(data: T): T {
  return {
    ...data,
    created_at: new Date(data.created_at as string),
    updated_at: new Date(data.updated_at as string),
  };
}

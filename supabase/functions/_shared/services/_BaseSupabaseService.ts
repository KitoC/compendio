import { ServiceError } from "locals/error-types";
import Logger from "locals/utils/Logger";
// @ts-expect-error - Supabase client is not typed
import { SupabaseClient } from "supabase-js";

export interface BaseRequiredContext {
  supabase: SupabaseClient;
  supabase_AS_SUPER_ADMIN: SupabaseClient;
  RUN_AS_SUPER_ADMIN?: boolean;
}

type GetArgs = {
  filter?: Record<
    string,
    | string
    | number
    | boolean
    | null
    | Record<string, string | number | boolean | null>
  >;
  sort?: { column: string; ascending?: boolean } | null;
  limit?: number | null;
  offset?: number | null;
  or?: string | null;
  textSearch?: { column: string; query: string } | null;
  range?: [number, number] | null;
  columns?: string;
};

const ACCEPTABLE_OPERATORS = [
  "eq",
  "gt",
  "gte",
  "lt",
  "lte",
  "neq",
  "like",
  "ilike",
  "is",
  "in",
  "not",
];

export class BaseSupabaseService {
  public logger: Logger;
  public isAdmin: boolean;
  public tableName: string;
  public primaryKey: string;
  public defaultColumns: string;

  constructor(public context: BaseRequiredContext) {
    this.logger = new Logger({ name: this.constructor.name });
    this.isAdmin = context.RUN_AS_SUPER_ADMIN ?? false;
    this.tableName = this.constructor.name;
    this.primaryKey = "id";
    this.defaultColumns = "*";
  }

  setRunAsSuperAdmin(value: boolean) {
    this.isAdmin = value;
  }

  get supabase() {
    if (this.isAdmin) {
      this.logger.warn("WARNING: RUNNING AS SUPER ADMIN");

      return this.context.supabase_AS_SUPER_ADMIN;
    }

    this.logger.debug("DEBUG: RUNNING AS USER");

    return this.context.supabase;
  }

  get supabase_AS_SUPER_ADMIN() {
    return this.context.supabase_AS_SUPER_ADMIN;
  }

  throwError(
    message: string,
    errorOrStatus: object | number,
    status: number = 401
  ) {
    const name = this.constructor.name;
    if (typeof errorOrStatus === "object") {
      this.logger.throwAndLog(
        new ServiceError(name, message, status, errorOrStatus)
      );
    } else {
      this.logger.throwAndLog(new ServiceError(name, message, errorOrStatus));
    }
  }

  async get({
    filter = {},
    sort = null,
    limit = null,
    offset = null,
    or = null,
    textSearch = null,
    range = null,
    columns = this.defaultColumns,
  }: GetArgs = {}) {
    let query = this.supabase.from(this.tableName).select(columns);

    Object.entries(filter).forEach(([key, value]) => {
      if (typeof value === "object" && value !== null) {
        Object.entries(value).forEach(([operator, val]) => {
          if (ACCEPTABLE_OPERATORS.includes(operator)) {
            query = query[operator](key, val);
          }
        });
      } else {
        query = query.eq(key, value);
      }
    });

    if (or) {
      query = query.or(or);
    }

    if (textSearch && textSearch.column && textSearch.query) {
      query = query.textSearch(textSearch.column, textSearch.query);
    }

    if (sort) {
      const { column, ascending = true } = sort;
      query = query.order(column, { ascending });
    }

    if (limit !== null) {
      query = query.limit(limit);
    }

    if (offset !== null) {
      query = query.range(offset, offset + (limit || 10) - 1);
    }

    if (range && Array.isArray(range) && range.length === 2) {
      query = query.range(range[0], range[1]);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  }

  async getById(id: string, columns: string = this.defaultColumns) {
    this.logger.debug("getById", id);

    const { data, error } = await this.supabase
      .from(this.tableName)
      .select(columns)
      .eq(this.primaryKey, id)
      .single();

    if (error) {
      this.throwError(`Error fetching ${this.tableName} by id:`, error);
    }

    return data;
  }

  // TODO: Type this
  async create(payload: unknown) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(payload)
      .select();

    if (error) {
      this.throwError(`Error creating ${this.tableName}:`, error);
    }

    return data;
  }

  // TODO: Type this
  async update(id: string, updates: unknown) {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq(this.primaryKey, id)
      .select();

    if (error) {
      this.throwError(`Error updating ${this.tableName}:`, error);
    }

    return data;
  }

  async delete(id: string) {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq(this.primaryKey, id);

    if (error) {
      this.throwError(`Error deleting ${this.tableName}:`, error);
    }

    return { success: true };
  }
}

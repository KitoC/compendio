import { supabase } from "@/integrations/supabase/client";

export type ServiceQueryFilter = {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | Record<string, string | number | boolean | null>;
};

export type ServiceQuerySort = {
  column: string;
  ascending?: boolean;
};

export type ServiceQueryTextSearch = {
  column: string;
  query: string;
};

export type ServiceQueryPagination = {
  page: number;
  pageSize: number;
};

export type ServiceQuery = {
  filter?: ServiceQueryFilter;
  sort?: ServiceQuerySort | null;
  limit?: number | null;
  offset?: number | null;
  or?: string | null;
  textSearch?: ServiceQueryTextSearch | null;
  search?: string | null;
  pagination?: ServiceQueryPagination | null;
  columns?: string;
  options?: {
    count: "exact" | "planned" | "estimated";
    head?: boolean;
  };
};

type GetResponse = {
  data: Record<string, unknown>[];
  count: number;
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

export class BaseService {
  public tableName: string;
  public primaryKey: string;
  public defaultColumns: string;

  constructor() {
    this.tableName = "replace";
    this.primaryKey = "id";
    this.defaultColumns = "*";
  }

  async get({
    filter = {},
    sort = null,
    limit = null,
    offset = null,
    or = null,
    textSearch = null,
    pagination = null,
    columns = this.defaultColumns,
    options = { count: "exact" },
  }: ServiceQuery = {}): Promise<GetResponse> {
    console.log("get");
    let query = supabase.from(this.tableName).select(columns, options);

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

    if (pagination && pagination.page && pagination.pageSize) {
      query = query.range(
        pagination.page * pagination.pageSize,
        (pagination.page + 1) * pagination.pageSize - 1
      );
    }

    const { data, error, count } = await query;

    if (error) throw error;

    console.log({ data, count });
    return {
      data: (data || []) as unknown as Record<string, unknown>[],
      count: count || 0,
    };
  }

  async getById(id: string, columns: string = this.defaultColumns) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select(columns)
      .eq(this.primaryKey, id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  // TODO: Type this
  async create(payload: unknown) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(payload)
      .select();

    if (error) {
      throw error;
    }

    return data;
  }

  // TODO: Type this
  async update(id: string, updates: unknown) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq(this.primaryKey, id)
      .select();

    if (error) {
      throw error;
    }

    return data;
  }

  async delete(id: string) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq(this.primaryKey, id);

    if (error) {
      throw error;
    }

    return { success: true };
  }
}

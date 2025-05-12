import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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

type GetResponse<RecordType> = {
  data: RecordType[];
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

export class BaseService<RecordType> {
  public tableName: string;
  public primaryKey: string;
  public defaultColumns: string;

  constructor() {
    this.tableName = "replace";
    this.primaryKey = "id";
    this.defaultColumns = "*";
  }

  async get(queryOptions: ServiceQuery = {}): Promise<GetResponse<RecordType>> {
    try {
      const {
        filter,
        sort,
        limit,
        offset,
        or,
        textSearch,
        pagination,
        columns,
        options,
      } = queryOptions;
      let query = supabase.from(this.tableName).select(columns, options);
      console.log("queryOptions", queryOptions.pagination);

      if (filter) {
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
      }

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

      if (pagination) {
        console.log("pagination --> ", pagination);
        query = query.range(
          pagination.page * pagination.pageSize - pagination.pageSize,
          pagination.page * pagination.pageSize
        );
      }

      const { data, error, count } = await query;

      if (error) {
        console.error("error", error);
        throw error;
      }

      return {
        data: (data || []) as unknown as RecordType[],
        count: count || 0,
      };
    } catch (error) {
      console.error("error", error);
      toast.error("Error fetching data ");
      throw error;
    }
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

    return data as unknown as RecordType;
  }

  // TODO: Type this
  async create(payload: RecordType) {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(payload)
      .select();

    if (error) {
      throw error;
    }

    return data as unknown as RecordType;
  }

  // TODO: Type this
  async update(id: string, updates: RecordType) {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq(this.primaryKey, id)
      .select();

    if (error) {
      throw error;
    }

    return data as unknown as RecordType;
  }

  async upsert(record: RecordType) {
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(record)
      .select();

    if (error) {
      throw error;
    }

    return data as unknown as RecordType;
  }

  async delete(record: RecordType) {
    const { error } = await supabase
      .from(this.tableName)
      .delete()
      .eq(this.primaryKey, record[this.primaryKey]);

    if (error) {
      throw error;
    }

    return record;
  }
}

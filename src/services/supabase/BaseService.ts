import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import type { PostgrestFilterBuilder } from "@supabase/postgrest-js";
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
  "search",
];

type GenericTable =
  Database["public"]["Tables"][keyof Database["public"]["Tables"]];

type FilterBuilder<Table extends GenericTable> = PostgrestFilterBuilder<
  Database["public"],
  Table["Row"],
  unknown,
  unknown
>;

export class BaseService<Table extends GenericTable> {
  public tableName: string & keyof Database["public"]["Tables"];
  public primaryKey: string;
  public defaultColumns: string;
  public searchColumns: string[];

  constructor() {
    this.primaryKey = "id";
    this.defaultColumns = "*";
    this.searchColumns = ["title", "description"];
  }

  searchFunction(query: FilterBuilder<Table>, search: string) {
    return query.or(
      this.searchColumns
        .map((column) => `${column}.ilike.%${search}%`)
        .join(",")
    );
  }

  async get(
    queryOptions: ServiceQuery = {}
  ): Promise<GetResponse<Table["Row"]>> {
    try {
      const {
        filter,
        sort,
        limit = 10,
        offset = 0,
        or,
        textSearch,
        search,
        pagination,
        columns,
        options,
      } = queryOptions;
      let query = supabase.from(this.tableName).select(columns, options);

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

      if (search && this.searchFunction) {
        // TODO: Fix this
        // @ts-expect-error This is meant to be infinite
        query = this.searchFunction(query, search);
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
        data: (data || []) as unknown as Table["Row"][],
        count: count || 0,
      };
    } catch (error) {
      console.error("error", error);
      toast.error("Error fetching data ");
      throw error;
    }
  }

  async getById(id: string, columns: string = this.defaultColumns) {
    // TODO: Fix this
    // @ts-expect-error This is meant to be infinite
    const { data, error } = await supabase
      .from(this.tableName)
      .select(columns)
      .eq(this.primaryKey, id)
      .single();

    if (error) {
      throw error;
    }

    return data as unknown as Table["Row"];
  }

  // TODO: Type this
  async create(payload: Table["Insert"]): Promise<Table["Row"]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .insert(payload)
      .select();

    if (error) {
      throw error;
    }

    return data as unknown as Table["Row"];
  }

  // TODO: Type this
  async update(id: string, updates: Table["Update"]): Promise<Table["Row"]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .update(updates)
      .eq(this.primaryKey, id)
      .select();

    if (error) {
      throw error;
    }

    return data as unknown as Table["Row"];
  }

  async upsert(record: Table["Insert"]): Promise<Table["Row"]> {
    const { data, error } = await supabase
      .from(this.tableName)
      .upsert(record)
      .select();

    if (error) {
      throw error;
    }

    return data as unknown as Table["Row"];
  }

  async delete(record: Table["Row"]): Promise<Table["Row"]> {
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

import { ServiceQuery } from "@/services/supabase/BaseService";

export interface KanbanGroup {
  label: string;
  color: string;
  fieldKey: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  [key: string]: unknown;
}

export interface KanbanViewProps<T extends KanbanCard> {
  data: T[];
  count: number;
  isLoading: boolean;
  isFetching: boolean;
  query: ServiceQuery;
  setQuery: (query: ServiceQuery) => void;
  groups: KanbanGroup[];
  groupKey: string;
  titleField: string;
  descriptionField?: string;
  onCardClick?: (card: T) => void;
  onCardMove?: (
    card: T,
    sourceGroup: string,
    destinationGroup: string
  ) => Promise<void>;
  emptyMessage?: string;
  permissions?: {
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
  };
}

export interface KanbanColumnProps<T extends KanbanCard> {
  group: KanbanGroup;
  cards: T[];
  isLoading: boolean;
  onCardClick?: (card: T) => void;
  titleField: string;
  descriptionField?: string;
}

export interface KanbanCardProps<T extends KanbanCard> {
  card: T;
  index: number;
  onCardClick?: (card: T) => void;
  titleField: string;
  descriptionField?: string;
}

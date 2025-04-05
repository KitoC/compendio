alter table "public"."conversations" drop constraint "conversations_tenant_alias_unique";

drop index if exists "public"."conversations_tenant_alias_unique";

alter table "public"."tenants" add column "created_at" timestamp with time zone default now();

CREATE UNIQUE INDEX conversations_alias_unique ON public.conversations USING btree (alias) WHERE (alias IS NOT NULL);

CREATE INDEX messages_metadata_priority_idx ON public.messages USING btree ((((metadata ->> 'priority'::text))::integer));

CREATE INDEX messages_metadata_status_idx ON public.messages USING btree (lower((metadata ->> 'status'::text)));

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_conversation_messages(_conversation_id uuid, _decryption_key text DEFAULT NULL::text, _search text DEFAULT NULL::text, _metadata_search text DEFAULT NULL::text, _role text DEFAULT NULL::text, _limit integer DEFAULT 50, _offset integer DEFAULT 0, _order text DEFAULT 'created_at'::text, _sort_direction text DEFAULT 'asc'::text, _include_deleted boolean DEFAULT false, _content_filter jsonb DEFAULT NULL::jsonb, _priority_sort_direction text DEFAULT NULL::text)
 RETURNS paginated_messages
 LANGUAGE plpgsql
AS $function$
DECLARE
  sql TEXT;
  count_sql TEXT;
  dynamic_filter TEXT := '';
  sort_column TEXT;
  key TEXT;
  path TEXT[];
  val TEXT;
  result paginated_messages;
BEGIN
  -- Filter on metadata.status
  IF _content_filter ? 'status' AND _content_filter->>'status' IS NOT NULL THEN
    dynamic_filter := dynamic_filter || format(
      ' AND LOWER(m.metadata->>''status'') = LOWER(%L)',
      _content_filter->>'status'
    );
  END IF;

  -- Filter on metadata.priority (exact match)
  IF _content_filter ? 'priority' AND _content_filter->>'priority' IS NOT NULL THEN
    dynamic_filter := dynamic_filter || format(
      ' AND m.metadata->>''priority'' = %L',
      _content_filter->>'priority'
    );
  END IF;

  -- Filter on content.tags (match ANY tag)
  IF _content_filter ? 'tags' AND jsonb_typeof(_content_filter->'tags') = 'array' THEN
    dynamic_filter := dynamic_filter || ' AND (m.content->''tags'') ?| array[';
    dynamic_filter := dynamic_filter || (
      SELECT string_agg(quote_literal(value::text), ', ')
      FROM jsonb_array_elements_text(_content_filter->'tags') AS value
    ) || ']';
  END IF;

  -- Generic support for nested content fields via dotted keys
  IF jsonb_typeof(_content_filter) = 'object' THEN
    FOR key IN SELECT * FROM jsonb_object_keys(_content_filter) LOOP
      IF position('.' IN key) > 0 THEN
        path := string_to_array(key, '.');
        val := _content_filter->>key;

        IF val IS NOT NULL THEN
          dynamic_filter := dynamic_filter || format(
            ' AND m.content#>>%L = %L',
            path, val
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Build sorting logic
  IF _priority_sort_direction IS NOT NULL THEN
    sort_column := format(
      'CAST(m.metadata->>''priority'' AS INTEGER) %s NULLS LAST, %I %s, created_at ASC',
      _priority_sort_direction,
      _order,
      _sort_direction
    );
  ELSE
    sort_column := format('%I %s, created_at ASC', _order, _sort_direction);
  END IF;

  -- Compose SQL for fetching paginated results
  sql := format(
    'SELECT row FROM (
      SELECT %s
      FROM conversation_messages cm
      JOIN messages m ON cm.message_id = m.id
      LEFT JOIN profiles u ON m.user_id = u.id
      WHERE cm.conversation_id = $1
        AND ($2::BOOLEAN OR m.deleted_at IS NULL)
        AND ($3 IS NULL OR m.role = $3)
        AND (
          $4 IS NULL OR
          u.username ILIKE ''%%'' || $4 || ''%%'' OR
          u.display_name ILIKE ''%%'' || $4 || ''%%'' OR
          (
            m.encrypted_content IS NOT NULL AND 
            pgp_sym_decrypt(m.encrypted_content, $9)::TEXT ILIKE ''%%'' || $4 || ''%%''
          ) OR
          (
            m.encrypted_content IS NULL AND 
            m.content::TEXT ILIKE ''%%'' || $4 || ''%%''
          )
        )
        AND ($5 IS NULL OR m.metadata::TEXT ILIKE ''%%'' || $5 || ''%%'')
        %s
      ORDER BY %s
      LIMIT $6 OFFSET $7
    ) row',
    shared_message_columns(_decryption_key),
    dynamic_filter,
    sort_column
  );

  -- Compose SQL for counting total results
  count_sql := format(
    'SELECT count(*)
     FROM conversation_messages cm
     JOIN messages m ON cm.message_id = m.id
     LEFT JOIN profiles u ON m.user_id = u.id
     WHERE cm.conversation_id = $1
       AND ($2::BOOLEAN OR m.deleted_at IS NULL)
       AND ($3 IS NULL OR m.role = $3)
       AND (
         $4 IS NULL OR
         u.username ILIKE ''%%'' || $4 || ''%%'' OR
         u.display_name ILIKE ''%%'' || $4 || ''%%'' OR
         (
           m.encrypted_content IS NOT NULL AND 
           pgp_sym_decrypt(m.encrypted_content, $6)::TEXT ILIKE ''%%'' || $4 || ''%%''
         ) OR
         (
           m.encrypted_content IS NULL AND 
           m.content::TEXT ILIKE ''%%'' || $4 || ''%%''
         )
       )
       AND ($5 IS NULL OR m.metadata::TEXT ILIKE ''%%'' || $5 || ''%%'')
       %s',
    dynamic_filter
  );

  -- Run both queries
  EXECUTE format('SELECT ARRAY(SELECT row FROM (%s) AS row)', sql)
    USING _conversation_id, _include_deleted, _role, _search, _metadata_search, _limit, _offset, _decryption_key, _decryption_key
    INTO result.messages;

  EXECUTE count_sql
    USING _conversation_id, _include_deleted, _role, _search, _metadata_search, _decryption_key
    INTO result.total_count;

  result.has_more := result.total_count > (_offset + _limit);

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_conversation_messages_v2(_conversation_id uuid, _decryption_key text DEFAULT NULL::text, _search text DEFAULT NULL::text, _metadata_search text DEFAULT NULL::text, _role text DEFAULT NULL::text, _limit integer DEFAULT 50, _offset integer DEFAULT 0, _order text DEFAULT 'created_at'::text, _sort_direction text DEFAULT 'asc'::text, _include_deleted boolean DEFAULT false, _content_filter jsonb DEFAULT NULL::jsonb)
 RETURNS paginated_messages
 LANGUAGE plpgsql
AS $function$
DECLARE
  sql TEXT;
  count_sql TEXT;
  dynamic_filter TEXT := '';
  result paginated_messages;
  key TEXT;
  path TEXT[];
  val TEXT;
BEGIN
  -- Filter on content.status
  IF _content_filter ? 'status' AND _content_filter->>'status' IS NOT NULL THEN
    dynamic_filter := dynamic_filter || format(
      ' AND m.content->>''status'' = %L',
      _content_filter->>'status'
    );
  END IF;

  -- Filter on content.tags (match ANY tag)
  IF _content_filter ? 'tags' AND jsonb_typeof(_content_filter->'tags') = 'array' THEN
    dynamic_filter := dynamic_filter || ' AND (m.content->''tags'') ?| array[';
    dynamic_filter := dynamic_filter || (
      SELECT string_agg(quote_literal(value::text), ', ')
      FROM jsonb_array_elements_text(_content_filter->'tags') AS value
    ) || ']';
  END IF;

  -- Generic support for nested fields via dotted keys
  FOR key IN SELECT * FROM jsonb_object_keys(_content_filter) LOOP
    IF position('.' IN key) > 0 THEN
      path := string_to_array(key, '.');
      val := _content_filter->>key;

      IF val IS NOT NULL THEN
        dynamic_filter := dynamic_filter || format(
          ' AND m.content#>>%L = %L',
          path, val
        );
      END IF;
    END IF;
  END LOOP;

  -- Compose SQL for fetching paginated results
  sql := format($f$
    SELECT %s
    FROM conversation_messages cm
    JOIN messages m ON cm.message_id = m.id
    LEFT JOIN profiles u ON m.user_id = u.id
    WHERE cm.conversation_id = $1
      AND ($2::BOOLEAN OR m.deleted_at IS NULL)
      AND ($3 IS NULL OR m.role = $3)
      AND (
        $4 IS NULL OR
        u.username ILIKE '%%' || $4 || '%%' OR
        u.display_name ILIKE '%%' || $4 || '%%' OR
        (
          m.encrypted_content IS NOT NULL AND 
          pgp_sym_decrypt(m.encrypted_content, $8)::TEXT ILIKE '%%' || $4 || '%%'
        ) OR
        (
          m.encrypted_content IS NULL AND 
          m.content::TEXT ILIKE '%%' || $4 || '%%'
        )
      )
      AND ($5 IS NULL OR m.metadata::TEXT ILIKE '%%' || $5 || '%%')
      %s
    ORDER BY %I %s
    LIMIT $6 OFFSET $7
  $f$, shared_message_columns(_decryption_key), dynamic_filter, _order, _sort_direction);

  -- Compose SQL for counting total results
  count_sql := format($f$
    SELECT count(*)
    FROM conversation_messages cm
    JOIN messages m ON cm.message_id = m.id
    LEFT JOIN profiles u ON m.user_id = u.id
    WHERE cm.conversation_id = $1
      AND ($2::BOOLEAN OR m.deleted_at IS NULL)
      AND ($3 IS NULL OR m.role = $3)
      AND (
        $4 IS NULL OR
        u.username ILIKE '%%' || $4 || '%%' OR
        u.display_name ILIKE '%%' || $4 || '%%' OR
        (
          m.encrypted_content IS NOT NULL AND 
          pgp_sym_decrypt(m.encrypted_content, $6)::TEXT ILIKE '%%' || $4 || '%%'
        ) OR
        (
          m.encrypted_content IS NULL AND 
          m.content::TEXT ILIKE '%%' || $4 || '%%'
        )
      )
      AND ($5 IS NULL OR m.metadata::TEXT ILIKE '%%' || $5 || '%%')
      %s
  $f$, dynamic_filter);

  EXECUTE sql USING _conversation_id, _include_deleted, _role, _search, _metadata_search, _limit, _offset, _decryption_key
  INTO result.data;

  EXECUTE count_sql USING _conversation_id, _include_deleted, _role, _search, _metadata_search, _decryption_key
  INTO result.count;

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_conversation_messages_v3(_conversation_id uuid, _decryption_key text DEFAULT NULL::text, _search text DEFAULT NULL::text, _metadata_search text DEFAULT NULL::text, _role text DEFAULT NULL::text, _limit integer DEFAULT 50, _offset integer DEFAULT 0, _order text DEFAULT 'created_at'::text, _sort_direction text DEFAULT 'asc'::text, _include_deleted boolean DEFAULT false, _content_filter jsonb DEFAULT NULL::jsonb, _priority_sort_direction text DEFAULT NULL::text)
 RETURNS paginated_messages
 LANGUAGE plpgsql
AS $function$
DECLARE
  sql TEXT;
  count_sql TEXT;
  dynamic_filter TEXT := '';
  sort_column TEXT;
  key TEXT;
  path TEXT[];
  val TEXT;
  result paginated_messages;
BEGIN
  -- Filter on content.status
  IF _content_filter ? 'status' AND _content_filter->>'status' IS NOT NULL THEN
    dynamic_filter := dynamic_filter || format(
      ' AND LOWER(m.content->>''status'') = LOWER(%L)',
      _content_filter->>'status'
    );
  END IF;

  -- Filter on content.tags (match ANY tag)
  IF _content_filter ? 'tags' AND jsonb_typeof(_content_filter->'tags') = 'array' THEN
    dynamic_filter := dynamic_filter || ' AND (m.content->''tags'') ?| array[';
    dynamic_filter := dynamic_filter || (
      SELECT string_agg(quote_literal(value::text), ', ')
      FROM jsonb_array_elements_text(_content_filter->'tags') AS value
    ) || ']';
    RAISE NOTICE 'status filter: %', _content_filter->>'status';
  END IF;

  -- Generic support for nested fields via dotted keys
  FOR key IN SELECT * FROM jsonb_object_keys(_content_filter) LOOP
    IF position('.' IN key) > 0 THEN
      path := string_to_array(key, '.');
      val := _content_filter->>key;

      IF val IS NOT NULL THEN
        dynamic_filter := dynamic_filter || format(
          ' AND m.content#>>%L = %L',
          path, val
        );
      END IF;
    END IF;
  END LOOP;

  -- Build sorting logic
  IF _priority_sort_direction IS NOT NULL THEN
    sort_column := format(
      'CAST(m.content->>''priority'' AS INTEGER) %s NULLS LAST, %I %s, created_at ASC',
      _priority_sort_direction,
      _order,
      _sort_direction
    );
  ELSE
    sort_column := format('%I %s, created_at ASC', _order, _sort_direction);
  END IF;

  -- Compose SQL for fetching paginated results
  sql := format(
    'SELECT row FROM (
      SELECT %s
      FROM conversation_messages cm
      JOIN messages m ON cm.message_id = m.id
      LEFT JOIN profiles u ON m.user_id = u.id
      WHERE cm.conversation_id = $1
        AND ($2::BOOLEAN OR m.deleted_at IS NULL)
        AND ($3 IS NULL OR m.role = $3)
        AND (
          $4 IS NULL OR
          u.username ILIKE ''%%'' || $4 || ''%%'' OR
          u.display_name ILIKE ''%%'' || $4 || ''%%'' OR
          (
            m.encrypted_content IS NOT NULL AND 
            pgp_sym_decrypt(m.encrypted_content, $9)::TEXT ILIKE ''%%'' || $4 || ''%%''
          ) OR
          (
            m.encrypted_content IS NULL AND 
            m.content::TEXT ILIKE ''%%'' || $4 || ''%%''
          )
        )
        AND ($5 IS NULL OR m.metadata::TEXT ILIKE ''%%'' || $5 || ''%%'')
        %s
      ORDER BY %s
      LIMIT $6 OFFSET $7
    ) row',
    shared_message_columns(_decryption_key),
    dynamic_filter,
    sort_column
  );

  -- Compose SQL for counting total results
  count_sql := format(
    'SELECT count(*)
     FROM conversation_messages cm
     JOIN messages m ON cm.message_id = m.id
     LEFT JOIN profiles u ON m.user_id = u.id
     WHERE cm.conversation_id = $1
       AND ($2::BOOLEAN OR m.deleted_at IS NULL)
       AND ($3 IS NULL OR m.role = $3)
       AND (
         $4 IS NULL OR
         u.username ILIKE ''%%'' || $4 || ''%%'' OR
         u.display_name ILIKE ''%%'' || $4 || ''%%'' OR
         (
           m.encrypted_content IS NOT NULL AND 
           pgp_sym_decrypt(m.encrypted_content, $6)::TEXT ILIKE ''%%'' || $4 || ''%%''
         ) OR
         (
           m.encrypted_content IS NULL AND 
           m.content::TEXT ILIKE ''%%'' || $4 || ''%%''
         )
       )
       AND ($5 IS NULL OR m.metadata::TEXT ILIKE ''%%'' || $5 || ''%%'')
       %s',
    dynamic_filter
  );

  -- Run both queries
  EXECUTE format('SELECT ARRAY(SELECT row FROM (%s) AS row)', sql)
    USING _conversation_id, _include_deleted, _role, _search, _metadata_search, _limit, _offset, _decryption_key, _decryption_key
    INTO result.messages;

  EXECUTE count_sql
    USING _conversation_id, _include_deleted, _role, _search, _metadata_search, _decryption_key
    INTO result.total_count;

  result.has_more := result.total_count > (_offset + _limit);

  RETURN result;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_conversation_messages_v4(_conversation_id uuid, _decryption_key text DEFAULT NULL::text, _search text DEFAULT NULL::text, _metadata_search text DEFAULT NULL::text, _role text DEFAULT NULL::text, _limit integer DEFAULT 50, _offset integer DEFAULT 0, _order text DEFAULT 'created_at'::text, _sort_direction text DEFAULT 'asc'::text, _include_deleted boolean DEFAULT false, filter jsonb DEFAULT NULL::jsonb, _priority_sort_direction text DEFAULT NULL::text)
 RETURNS paginated_messages
 LANGUAGE plpgsql
AS $function$
DECLARE
  sql TEXT;
  count_sql TEXT;
  dynamic_filter TEXT := '';
  sort_column TEXT;
  key TEXT;
  path TEXT[];
  val TEXT;
  result paginated_messages;
BEGIN
  -- Filter on metadata.status
  IF filter ? 'metadata.status' AND filter->>'metadata.status' IS NOT NULL THEN
    dynamic_filter := dynamic_filter || format(
      ' AND LOWER(m.metadata->>''status'') = LOWER(%L)',
      filter->>'metadata.status'
    );
  END IF;

  -- Filter on metadata.priority (exact match)
  -- IF filter ? 'priority' AND filter->>'priority' IS NOT NULL THEN
  --   dynamic_filter := dynamic_filter || format(
  --     ' AND m.metadata->>''priority'' = %L',
  --     filter->>'priority'
  --   );
  -- END IF;

  -- Filter on content.tags (match ANY tag)
  IF filter ? 'tags' AND jsonb_typeof(filter->'tags') = 'array' THEN
    dynamic_filter := dynamic_filter || ' AND (m.content->''tags'') ?| array[';
    dynamic_filter := dynamic_filter || (
      SELECT string_agg(quote_literal(value::text), ', ')
      FROM jsonb_array_elements_text(filter->'tags') AS value
    ) || ']';
  END IF;

  -- Generic support for nested content fields via dotted keys
  IF jsonb_typeof(filter) = 'object' THEN
    FOR key IN SELECT * FROM jsonb_object_keys(filter) LOOP
      IF position('.' IN key) > 0 AND key NOT IN ('metadata.status') THEN
        path := string_to_array(key, '.');
        val := filter->>key;

        IF val IS NOT NULL THEN
          dynamic_filter := dynamic_filter || format(
            ' AND m.content#>>%L = %L',
            path, val
          );
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Build sorting logic
  IF _priority_sort_direction IS NOT NULL THEN
    sort_column := format(
      'CAST(m.metadata->>''priority'' AS INTEGER) %s NULLS LAST, %I %s, created_at ASC',
      _priority_sort_direction,
      _order,
      _sort_direction
    );
  ELSE
    sort_column := format('%I %s, created_at ASC', _order, _sort_direction);
  END IF;

  -- Compose SQL for fetching paginated results
  sql := format(
    'SELECT row FROM (
      SELECT %s
      FROM conversation_messages cm
      JOIN messages m ON cm.message_id = m.id
      LEFT JOIN profiles u ON m.user_id = u.id
      WHERE cm.conversation_id = $1
        AND ($2::BOOLEAN OR m.deleted_at IS NULL)
        AND ($3 IS NULL OR m.role = $3)
        AND (
          $4 IS NULL OR
          u.username ILIKE ''%%'' || $4 || ''%%'' OR
          u.display_name ILIKE ''%%'' || $4 || ''%%'' OR
          (
            m.encrypted_content IS NOT NULL AND 
            pgp_sym_decrypt(m.encrypted_content, $9)::TEXT ILIKE ''%%'' || $4 || ''%%''
          ) OR
          (
            m.encrypted_content IS NULL AND 
            m.content::TEXT ILIKE ''%%'' || $4 || ''%%''
          )
        )
        AND ($5 IS NULL OR m.metadata::TEXT ILIKE ''%%'' || $5 || ''%%'')
        %s
      ORDER BY %s
      LIMIT $6 OFFSET $7
    ) row',
    shared_message_columns(_decryption_key),
    dynamic_filter,
    sort_column
  );

  -- Compose SQL for counting total results
  count_sql := format(
    'SELECT count(*)
     FROM conversation_messages cm
     JOIN messages m ON cm.message_id = m.id
     LEFT JOIN profiles u ON m.user_id = u.id
     WHERE cm.conversation_id = $1
       AND ($2::BOOLEAN OR m.deleted_at IS NULL)
       AND ($3 IS NULL OR m.role = $3)
       AND (
         $4 IS NULL OR
         u.username ILIKE ''%%'' || $4 || ''%%'' OR
         u.display_name ILIKE ''%%'' || $4 || ''%%'' OR
         (
           m.encrypted_content IS NOT NULL AND 
           pgp_sym_decrypt(m.encrypted_content, $6)::TEXT ILIKE ''%%'' || $4 || ''%%''
         ) OR
         (
           m.encrypted_content IS NULL AND 
           m.content::TEXT ILIKE ''%%'' || $4 || ''%%''
         )
       )
       AND ($5 IS NULL OR m.metadata::TEXT ILIKE ''%%'' || $5 || ''%%'')
       %s',
    dynamic_filter
  );

  -- Run both queries
  EXECUTE format('SELECT ARRAY(SELECT row FROM (%s) AS row)', sql)
    USING _conversation_id, _include_deleted, _role, _search, _metadata_search, _limit, _offset, _decryption_key, _decryption_key
    INTO result.messages;

  EXECUTE count_sql
    USING _conversation_id, _include_deleted, _role, _search, _metadata_search, _decryption_key
    INTO result.total_count;

  result.has_more := result.total_count > (_offset + _limit);

  RETURN result;
END;
$function$
;

create or replace view "public"."user_agents_with_conversations" as  SELECT a.name,
    a.human_name,
    a.responsibility,
    a.enabled,
    a.prompt,
    a.domain,
    a.model,
    a.id,
    a.created_at,
    a.updated_at,
    a.deleted_at,
    a.tenant_id,
    a.avatar_url,
    a.provider,
    json_agg(jsonb_build_object('id', c.id, 'alias', c.alias)) AS conversations
   FROM ((ai_agents a
     JOIN conversation_participants cp ON ((cp.agent_id = a.id)))
     JOIN conversations c ON ((c.id = cp.conversation_id)))
  WHERE (cp.user_id = auth.uid())
  GROUP BY a.id, a.name, a.tenant_id;




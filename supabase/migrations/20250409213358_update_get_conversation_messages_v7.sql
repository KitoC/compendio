CREATE OR REPLACE FUNCTION public.get_conversation_messages_v7(
  _conversation_id uuid,
  _decryption_key text DEFAULT NULL::text,
  _search text DEFAULT NULL::text,
  _metadata_search text DEFAULT NULL::text,
  _role text DEFAULT NULL::text,
  _limit integer DEFAULT 50,
  _offset integer DEFAULT 0,
  _order text DEFAULT 'created_at'::text,
  _sort_direction text DEFAULT 'asc'::text,
  _include_deleted boolean DEFAULT false,
  filter jsonb DEFAULT NULL::jsonb,
  _priority_sort_direction text DEFAULT NULL::text
) RETURNS paginated_messages
LANGUAGE plpgsql
AS $function$
DECLARE
  sql TEXT;
  count_sql TEXT;
  dynamic_filter TEXT := '';
  sort_target_col TEXT;
  key TEXT;
  parts TEXT[];
  target_col TEXT;
  json_path TEXT[];
  val TEXT;
  op TEXT;
  result paginated_messages;
BEGIN
  -- Filter on metadata.status
    -- Filter on metadata.tags (match ANY tag)
  
  -- Generic support for nested jsonb fields via dotted keys and operator objects
  IF jsonb_typeof(filter) = 'object' THEN
    FOR key IN SELECT * FROM jsonb_object_keys(filter) LOOP
      IF position('.' IN key) > 0 THEN
        parts := string_to_array(key, '.');
        target_col := parts[1];
        json_path := parts[2:array_length(parts, 1)];

        IF target_col IN ('metadata', 'content') THEN
          IF jsonb_typeof(filter->key) = 'object' THEN
            -- Operator syntax: { "operator": "ILIKE", "value": "something" }
            op := COALESCE(filter->key->>'operator', '=');
            val := filter->key->>'value';
          ELSIF jsonb_typeof(filter->key) = 'array' THEN
            -- Array of OR values: [3, 4, 5]
            dynamic_filter := dynamic_filter || format(
              ' AND LOWER(%s#>>%L) = ANY (ARRAY[%s])',
              'm.' || target_col,
              json_path,
              (
                SELECT string_agg('LOWER(' || quote_literal(value::text) || ')', ', ')
                FROM jsonb_array_elements_text(filter->key) AS value
              )
            );
            CONTINUE;
          ELSE
            op := '=';
            val := filter->>key;
          END IF;

          IF val IS NOT NULL THEN
            IF UPPER(op) = 'ILIKE' THEN
              dynamic_filter := dynamic_filter || format(
                ' AND %s#>>%L ILIKE %L',
                'm.' || target_col, json_path, '%' || val || '%'
              );
            ELSIF UPPER(op) = '!=' THEN
              dynamic_filter := dynamic_filter || format(
                ' AND %s#>>%L != %L',
                'm.' || target_col, json_path, val
              );
            ELSE
              dynamic_filter := dynamic_filter || format(
                ' AND %s#>>%L = %L',
                'm.' || target_col, json_path, val
              );
            END IF;
          END IF;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- Build sorting logic
  IF _priority_sort_direction IS NOT NULL THEN
    sort_target_col := format(
      'CAST(m.metadata->>''priority'' AS INTEGER) %s NULLS LAST, %I %s, created_at ASC',
      _priority_sort_direction,
      _order,
      _sort_direction
    );
  ELSE
    sort_target_col := format('%I %s, created_at ASC', _order, _sort_direction);
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
    sort_target_col
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
$function$;

--
-- Filter syntax documentation:
-- You can pass nested filters using dotted keys, e.g.:
-- {
--   "metadata.status": "active",
--   "content.type": { "operator": "ILIKE", "value": "summary" },
--   "metadata.priority": { "operator": "!=", "value": "high" },
--   "metadata.priority": [3, 4],
--   "tags": ["urgent", "internal"]
-- }
--
-- Supported operators: = (default), !=, ILIKE
-- Arrays are supported for equality OR matching: ["val1", "val2"]

import {
  useCustomTableSchemaQuery,
  useCustomRecordsQuery,
} from "@/hooks/useCustomTableQuery";
import { useCalendarContext } from "./CalendarContext";

const CreateEventsFromResource = ({ tableId }: { tableId: string }) => {
  const { setDraggingEvent } = useCalendarContext();
  const { data: table } = useCustomTableSchemaQuery(tableId);
  const { records } = useCustomRecordsQuery({
    tableId,
    queryString: "",
  });

  const primaryField = table?.fields.find((field) => field.is_primary);

  console.log("table", table);
  return (
    <div>
      <div>
        <h2 className="text-md font-bold bg-gray-100 p-2 border-b border-gray-200">
          {table?.name}
        </h2>
        {records?.map((record) => (
          <div
            className="p-2 border-b border-gray-200"
            key={record[primaryField.name] as string}
            draggable={true}
            onDragStart={() => {
              setDraggingEvent({
                event: {
                  id: record.id as string,
                  title: record[primaryField.name] as string,
                  resource: record,
                  resourceId: record.id as string,
                },
              });
            }}
          >
            {record[primaryField.name] as string}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreateEventsFromResource;

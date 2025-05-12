import EntitySelect from "../EntitySelect/EntitySelect";
import { ClientService, Client } from "@/services/supabase/ClientService";
import { CustomFieldComponentProps } from "../FormBuilder/types";

const clientService = new ClientService();

interface ClientSelectProps extends CustomFieldComponentProps {
  isMulti: boolean;
}

const ClientSelect = (props: ClientSelectProps) => {
  return (
    <EntitySelect
      {...props}
      renderLabel={(record: Client) =>
        `${record.first_name} ${record.last_name}`
      }
      isMulti={props.isMulti}
      tableName={clientService.tableName}
      uniqueKey={clientService.primaryKey}
      id="client-select"
      onFetch={(query) => {
        return clientService.get(query);
      }}
      placeholder={"Search for clients"}
    />
  );
};

export default ClientSelect;

import EntitySelect from "../EntitySelect/EntitySelect";
import { StaffService, StaffMember } from "@/services/supabase/StaffService";
import { CustomFieldComponentProps } from "../FormBuilder/types";

const staffService = new StaffService();

interface StaffMemberSelectProps extends CustomFieldComponentProps {
  isMulti: boolean;
}

const StaffMemberSelect = (props: StaffMemberSelectProps) => {
  return (
    <EntitySelect
      {...props}
      renderLabel={(record: StaffMember) =>
        `${record.first_name} ${record.last_name}`
      }
      isMulti={props.isMulti}
      tableName={staffService.tableName}
      uniqueKey={staffService.primaryKey}
      id="staff-member-select"
      onFetch={(query) => {
        return staffService.get(query);
      }}
      placeholder={"Search for employees"}
    />
  );
};

export default StaffMemberSelect;

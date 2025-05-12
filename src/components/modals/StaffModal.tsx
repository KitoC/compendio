import { StaffMember, StaffService } from "@/services/supabase/StaffService";
import ServiceRecordModal, { ServiceRecordModalProps } from "./FormModal";
import { staffMemberFormConfig } from "@/forms/staffMemberForm";

const StaffModal = (
  props: Omit<ServiceRecordModalProps<StaffMember>, "formConfig">
) => {
  return <ServiceRecordModal {...props} formConfig={staffMemberFormConfig} />;
};

export default StaffModal;

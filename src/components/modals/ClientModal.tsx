import { Client } from "@/services/supabase/ClientService";
import ServiceRecordModal, { ServiceRecordModalProps } from "./FormModal";
import { clientFormConfig } from "@/forms/clientForm";

const ClientModal = (
  props: Omit<ServiceRecordModalProps<Client>, "formConfig">
) => {
  return <ServiceRecordModal {...props} formConfig={clientFormConfig} />;
};

export default ClientModal;

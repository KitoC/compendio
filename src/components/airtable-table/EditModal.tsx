import { EditModalProps } from "./types";
import AirtableModal from "../airtable-modal";

const EditModal = ({
  isOpen,
  onClose,
  record,
  table,
  onSave,
  idField,
  isCreating = false,
  getFormConfig,
}: EditModalProps) => {
  return (
    <AirtableModal
      providedTable={table}
      providedRecord={record}
      tableId={table?.id}
      recordId={record?.id}
      isCreating={isCreating}
      getFormConfig={getFormConfig}
      onSave={onSave}
      onClose={onClose}
      isOpen={isOpen}
    />
  );
};

export default EditModal;

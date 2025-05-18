import { AddressType } from "@/services/supabase/AddressService";

const Address = ({ address }: { address?: Partial<AddressType> }) => {
  if (!address) return null;

  return (
    <div>
      <p className="text-sm text-gray-500">{address.address_line_1}</p>
      {address.address_line_2 && (
        <p className="text-sm text-gray-500">{address.address_line_2}</p>
      )}
      <p className="text-sm text-gray-500">
        {address.city}, {address.state} {address.zip}
      </p>
    </div>
  );
};

export default Address;

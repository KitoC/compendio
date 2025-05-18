import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTenant } from "@/contexts/TenantContext";
import { accountSettingsFormConfig } from "@/forms/accountSettingsForm";
import FormBuilder from "@/components/FormBuilder";
import { CompanyService } from "@/services/supabase/CompanyService";
import { AddressService } from "@/services/supabase/AddressService";
import Page from "@/components/Page";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const companyService = new CompanyService();
const addressService = new AddressService();

const AccountSettings = () => {
  const { user } = useAuth();
  const { tenantId } = useTenant();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [initialValues, setInitialValues] = useState<Record<string, unknown>>(
    {}
  );
  const [addressId, setAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !tenantId) return;
      setLoading(true);
      try {
        // Fetch user role
        const { data: roles, error: rolesError } = await supabase
          .from("user_roles")
          .select("*")
          .eq("user_id", user.id)
          .or(`tenant_id.eq.${tenantId},tenant_id.is.null`);
        if (rolesError) throw rolesError;
        const role = roles?.[0]?.role_type || null;
        setUserRole(role);

        if (role === "tenant-owner") {
          // Fetch company and address for tenant
          const { data: company } = await companyService.get({
            filter: { tenant_id: tenantId },
          });
          const companyRecord = company?.[0];
          let addressRecord = {};
          let addrId = null;
          if (companyRecord?.address_id) {
            const address = await addressService.getById(
              companyRecord.address_id
            );
            addressRecord = address || {};
            addrId = address?.id || null;
          }
          setAddressId(addrId);
          setInitialValues({
            company_name: companyRecord?.name || "",
            ...addressRecord,
          });
        } else {
          // Staff: fetch user profile and address
          const { data: profile } = await supabase
            .from("contacts")
            .select("*")
            .eq("user_id", user.id)
            .eq("tenant_id", tenantId)
            .single();
          let addressRecord = {};
          let addrId = null;
          if (profile?.id) {
            const { data: addresses } = await addressService.get({
              filter: { user_id: profile.id },
            });
            if (addresses && addresses.length > 0) {
              addressRecord = addresses[0];
              addrId = addresses[0].id;
            }
          }
          setAddressId(addrId);
          setInitialValues({
            email: profile?.email || user.email,
            phone: profile?.phone || "",
            ...addressRecord,
          });
        }
      } catch (error) {
        toast.error("Failed to load account settings");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, tenantId]);

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      if (userRole === "tenant-owner") {
        // Update company and address
        const { company_name, ...addressFields } = values;
        // Upsert address
        let newAddressId = addressId;
        const addressPayload = {
          address_line_1: String(addressFields.address_line_1 ?? ""),
          address_line_2: String(addressFields.address_line_2 ?? ""),
          city: String(addressFields.city ?? ""),
          state: String(addressFields.state ?? ""),
          zip: String(addressFields.zip ?? ""),
          country: String(addressFields.country ?? ""),
          tenant_id: tenantId,
        };
        if (addressId) {
          const updated = await addressService.update(
            addressId,
            addressPayload
          );
          newAddressId = updated.id;
        } else {
          const created = await addressService.create(addressPayload);
          newAddressId = created.id;
        }
        // Upsert company
        const { data: company } = await companyService.get({
          filter: { tenant_id: tenantId },
        });
        if (company?.[0]) {
          await companyService.update(company[0].id, {
            name: String(company_name ?? ""),
            address_id: newAddressId,
          });
        } else {
          await companyService.create({
            name: String(company_name ?? ""),
            tenant_id: tenantId,
            address_id: newAddressId,
          });
        }
        toast.success("Company settings updated");
      } else {
        // Staff: update contact and address
        const { email, phone, ...addressFields } = values;
        // Upsert contact
        const { data: profile } = await supabase
          .from("contacts")
          .select("*")
          .eq("user_id", user.id)
          .eq("tenant_id", tenantId)
          .single();
        let contactId = profile?.id;
        if (contactId) {
          await supabase
            .from("contacts")
            .update({ email: String(email ?? ""), phone: String(phone ?? "") })
            .eq("id", String(contactId ?? ""));
        } else {
          const { data: newContact } = await supabase
            .from("contacts")
            .insert([
              {
                email: String(email ?? ""),
                phone: String(phone ?? ""),
                name: String(email ?? ""),
                user_id: user.id,
                tenant_id: tenantId,
              },
            ])
            .select()
            .single();
          contactId = newContact?.id;
        }
        // Upsert address
        const addressPayload = {
          address_line_1: String(addressFields.address_line_1 ?? ""),
          address_line_2: String(addressFields.address_line_2 ?? ""),
          city: String(addressFields.city ?? ""),
          state: String(addressFields.state ?? ""),
          zip: String(addressFields.zip ?? ""),
          country: String(addressFields.country ?? ""),
          user_id: String(contactId ?? ""),
          tenant_id: tenantId,
        };
        if (addressId) {
          await addressService.update(addressId, addressPayload);
        } else {
          await addressService.create(addressPayload);
        }
        toast.success("Account settings updated");
      }
    } catch (error) {
      toast.error("Failed to update settings");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Page>
      <FormBuilder
        config={{
          ...accountSettingsFormConfig,
          initialValues: { ...initialValues, userRole },
        }}
        onSubmit={handleSubmit}
      />
    </Page>
  );
};

export default AccountSettings;

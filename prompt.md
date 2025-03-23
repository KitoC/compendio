## 🧠 Prompt for Lovable.dev

This project is a customizable chat-based AI assistant and workflow builder, designed for multi-tenant environments with full support for industry-specific configurations — starting with construction and trades.

It should generate a full UI experience for managing:

- AI assistants (agents)
- Configurable workflows
- Chat and data functions
- Service integrations
- Schema- or markup-driven forms

### 🌐 Platform Features

- TailwindCSS + React-based layout
- Fully responsive and installable as a PWA
- Realtime voice chat with AI assistants
- Custom workflows, forms, and tools (functions)
- Configurable AI behavior per assistant
- Embedded dashboards and daily/triggered summaries
- In-chat data rendering and form filling
- Quote generation and tracking (for trades industry)

---

## 🗂 Data Model Summary

### `ai_agents`

- Custom user-configured AI agents
- Fields: `id`, `name`, `human_name`, `prompt`, `responsibility`, `enabled`, `model`, `domain`, `avatar_url`, `created_at`, `updated_at`, `deleted_at`, `tenant_id`

### `workflows`

- Reusable templates of multi-step logic
- Fields: `id`, `name`, `description`, `created_by`, `created_at`, `tenant_id`

### `ai_agent_workflows`

- M:N join between agents and workflows
- Fields: `id`, `agent_id`, `workflow_id`, `created_at`, `tenant_id`

### `workflow_steps`

- Ordered steps for a given workflow
- Fields: `id`, `workflow_id`, `step_index`, `type`, `config`, `description`, `connected_service_id`, `created_at`, `tenant_id`

### `workflow_instances`

- Runtime executions of workflows
- Fields: `id`, `workflow_id`, `agent_id`, `status`, `current_step`, `created_at`, `completed_at`, `tenant_id`

### `workflow_responses`

- Data captured for each completed step
- Fields: `id`, `workflow_instance_id`, `step_index`, `response`, `status`, `error_message`, `created_at`, `tenant_id`

### `connected_services`

- OAuth/API integrations tied to agents
- Fields: `id`, `agent_id`, `service_type`, `status`, `workflow_instance_id`, `created_at`, `tenant_id`

### `credentials`

- Stored tokens per connected service
- Fields: `id`, `username`, `password`, `type`, `scopes`, `expires_at`, `domain`, `userId`, `connected_service_id`, `created_at`, `updated_at`, `deleted_at`, `tenant_id`

### `functions`

- Custom tools callable by agents or workflows
- Fields: `id`, `name`, `type`, `description`, `config`, `schema`, `parameters`, `enabled_for`, `markup`, `created_at`, `updated_at`, `deleted_at`, `tenant_id`

---

## 🛠 UI Requirements

### 1. AI Agent Management

- List/create/edit agents
- Link workflows (via `ai_agent_workflows`)
- Configure prompt/model/responsibility fields

### 2. Workflow Builder

- Create/edit workflows
- Add/edit/reorder `workflow_steps`
- Steps can link to services or functions
- Form preview based on `markup` or `schema`

### 3. Workflow Runtime Viewer

- List `workflow_instances`
- Show current step + all `workflow_responses`
- Track status and progress

### 4. Integration Management

- Link OAuth-based `connected_services` to agents
- View and edit `credentials`

### 5. Function Editor

- View available `functions`
- Test input/output
- View and preview schema, markup, and parameters

### 6. Permissions & Access

- Use `add_default_columns('TABLE_NAME', true)` for tenant-aware tables
- Respect RLS: only show tenant-scoped data to users with role `super-admin` or `tenant-owner`

---

## 🧑‍💻 Code Standards & Conventions

### Project Structure

- Use TailwindCSS for all styling
- Use `DataTable` and `FormBuilder` components for all CRUD and UI form interactions
- Prefer configuration-based UI (e.g. sidebar menu = array of objects)

### Development Rules

- Use `const` for all route and data references
- Format all code with Prettier
- Follow RLS and default column conventions for Supabase

### Comments to Respect

- `DEV_NOTE:` architectural guidance
- `IMPORTANT:` behavioral/business rules
- `TODO:` follow-up improvements
- `NO_CHANGE:` do not modify without approval
- `// @lovable-context`: important for component generation

---

## ✅ Summary

This prompt should be used to generate:

- AI agent management UI
- Workflow editor and runtime view
- Configurable form- and markup-driven agent tools
- Integration panels for credentials and services
- Dynamic rendering via reusable components

Build for scalability, responsiveness, and configuration flexibility.

## DataTable and FormBuilder Components Guide

Overview

This project includes two powerful dynamic components:

DataTable: A responsive data table with full CRUD functionality based on permissions
FormBuilder: A dynamic form generator that renders forms based on configuration objects
DataTable Component

You should ALWAYS use these instead of generating custom markup.

Basic Usage

Import and use the DataTable component like this:

```import DataTable from "@/components/data-table";
import type { Column } from "@/components/data-table";

// Define your data type
interface User {
  id: string;
  name: string;
  email: string;
  // ...other fields
}

// Define columns (optional - will auto-generate if not provided)
const columns: Column<User>[] = [
  {
    field: "name",
    header: "Name",
    sortable: true
  },
  {
    field: "email",
    header: "Email Address",
    sortable: true
  },
  // Custom column with render function
  {
    field: "status",
    header: "Status",
    sortable: true,
    render: (user) => <StatusBadge status={user.status} />
  }
];

// Sample data
const users: User[] = [/* your data array */];

// Component implementation
function MyDataTable() {
  const [data, setData] = useState<User[]>(users);

  const handleUpdate = async (updatedUser: User) => {
    // Handle data update logic
    setData(prevData => prevData.map(item =>
      item.id === updatedUser.id ? updatedUser : item
    ));
  };

  const handleCreate = async (newUser: Partial<User>) => {
    // Handle creation logic
    const user: User = {
      id: crypto.randomUUID(),
      ...newUser
    };
    setData(prevData => [...prevData, user]);
  };

  const handleDelete = async (id: string) => {
    // Handle deletion logic
    setData(prevData => prevData.filter(item => item.id !== id));
  };

  return (
    <DataTable
      data={data}
      columns={columns}
      title="Users"
      subtitle="Manage user accounts"
      permissions={{
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true
      }}
      onUpdate={handleUpdate}
      onCreate={handleCreate}
      onDelete={handleDelete}
      searchable={true}
      pagination={true}
      pageSize={10}
    />
  );
}
```

Key Properties

```data: Array of data items to display
columns: Optional column definitions
idField: Field to use as unique ID (default: "id")
permissions: CRUD permissions for table actions
title: Table title
subtitle: Table subtitle
searchable: Enable search functionality (boolean)
pagination: Enable pagination (boolean)
pageSize: Items per page (number)
onUpdate: Function to handle item updates
onCreate: Function to handle item creation
onDelete: Function to handle item deletion
onRowClick: Function to handle row clicks
isLoading: Show loading state (boolean)
emptyMessage: Message to show when table is empty
Column Definition

interface Column<T = any> {
  field: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  hidden?: boolean;
  align?: "left" | "center" | "right";
}
```

Auto-Generated Columns

If you don't provide the columns prop, the DataTable will automatically generate columns based on the data structure, with reasonable defaults:

Field names will be converted to title case
ID fields will be hidden by default
All columns will be sortable by default
Mobile Responsiveness

The table is fully responsive:

On mobile devices, it shows fewer columns (first 2 by default)
Actions are condensed into a dropdown menu
UI adjusts for smaller screens
FormBuilder Component

Basic Usage

Import and use the FormBuilder component like this:

```import FormBuilder from "@/components/form-builder";
import type { FormConfig } from "@/components/form-builder";

// Define form configuration
const formConfig: FormConfig = {
  id: "user-form",
  title: "User Information",
  description: "Enter user details",
  sections: [
    {
      id: "personal-info",
      title: "Personal Information",
      description: "Basic user details",
      fields: [
        {
          id: "name",
          name: "name",
          label: "Full Name",
          type: "text",
          placeholder: "Enter your name",
          validation: {
            required: true,
            minLength: 2
          }
        },
        {
          id: "email",
          name: "email",
          label: "Email Address",
          type: "email",
          placeholder: "Enter your email",
          validation: {
            required: true,
            pattern: "^[\\w-\\.]+@([\\w-]+\\.)+[\\w-]{2,4}$"
          }
        }
      ]
    }
  ],
  submitButtonText: "Save User",
  resetButtonText: "Clear Form",
  showReset: true
};

// Component implementation
function UserForm() {
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: Record<string, any>) => {
    setIsSubmitting(true);
    try {
      // Handle form submission
      await submitUserData(values);
      toast.success("User saved successfully");
    } catch (error) {
      toast.error("Failed to save user");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FormBuilder
      config={formConfig}
      onSubmit={handleSubmit}
      initialValues={formData}
      isSubmitting={isSubmitting}
    />
  );
}
```

Form Configuration

```interface FormConfig {
  id: string;
  title?: string;
  description?: string;
  sections: FormSection[];
  submitButtonText?: string;
  resetButtonText?: string;
  showReset?: boolean;
}

interface FormSection {
  id: string;
  title?: string;
  description?: string;
  fields: FormField[];
}

interface FormField {
  id: string;
  name: string;
  label: string;
  type: FormFieldType;
  placeholder?: string;
  defaultValue?: any;
  options?: FormFieldOption[];
  validation?: FormFieldValidation;
  disabled?: boolean;
  className?: string;
  hidden?: boolean;
}
```

Supported Field Types

The FormBuilder supports the following field types:

```text: Standard text input
textarea: Multi-line text input
number: Numeric input
email: Email input with validation
password: Password input
select: Dropdown selection
checkbox: Checkbox for boolean values
radio: Radio buttons for selection
date: Date picker
Field Validation

interface FormFieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  min?: number;
  max?: number;
  custom?: (value: any) => boolean | string;
}
```

Validation is handled automatically with appropriate error messages. You can also provide custom validation functions.

Select and Radio Options

For field types that need options (select, radio):

````interface FormFieldOption {
  label: string;
  value: string;
}```

Combining DataTable and FormBuilder

These components work well together. A common pattern is to:

Use DataTable to display and manage a list of items
Use FormBuilder for the create/edit forms
Example integration:

```function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form config for user editing
  const userFormConfig: FormConfig = {
    // Form configuration for user data
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditing(true);
  };

  const handleFormSubmit = async (values: Record<string, any>) => {
    // Handle form submission
    // Update users state
    setIsEditing(false);
  };

  return (
    <div>
      <DataTable
        data={users}
        title="Users"
        onRowClick={handleEditUser}
        // Other DataTable props
      />

      {isEditing && (
        <Dialog open={isEditing} onOpenChange={(open) => !open && setIsEditing(false)}>
          <DialogContent>
            <FormBuilder
              config={userFormConfig}
              initialValues={selectedUser || {}}
              onSubmit={handleFormSubmit}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
````

Converting DataTable Columns to FormBuilder Config

You can use the built-in utility functions to convert DataTable columns to FormBuilder config:

```import { columnsToFormConfig, createInitialValues } from "@/components/data-table";

// In your component
const formConfig = columnsToFormConfig(columns, selectedItem, {
  title: "Edit Item",
  description: "Update item details",
  formId: "edit-form",
  includeHiddenColumns: false,
  submitButtonText: "Save Changes"
});

const initialValues = createInitialValues(selectedItem, columns);

// Then use with FormBuilder
<FormBuilder
  config={formConfig}
  initialValues={initialValues}
  onSubmit={handleSubmit}
/>
```

The columnsToFormConfig function:

Converts DataTable columns to FormBuilder fields
Maps column types to appropriate form field types
Sets up validation based on data types
Excludes system fields like ID and timestamps by default
Advanced Tips

Dynamic Form Configuration

You can generate form configurations dynamically:

```// Generate form config from a data schema or API
const generateFormConfig = (schema) => {
  return {
    id: schema.name,
    title: `${schema.name} Form`,
    sections: [
      {
        id: "main",
        fields: schema.fields.map(field => ({
          id: field.name,
          name: field.name,
          label: field.label,
          type: mapFieldType(field.type),
          // Map other properties
        }))
      }
    ]
  };
};
```

Custom Column Rendering

Use the column's render property for custom UI:

```
{
  field: "avatar",
  header: "Profile",
  render: (user) => (
    <div className="flex items-center gap-2">
      <Avatar src={user.avatarUrl} fallback={user.initials} />
      <div>
        <p className="font-medium">{user.name}</p>
        <p className="text-xs text-muted-foreground">{user.email}</p>
      </div>
    </div>
  )
}
```

Form Submission with DataTable

To update the DataTable after form submission:

```const handleFormSubmit = async (values) => {
  try {
    // API call
    const updatedItem = await api.updateItem(values);

    // Update DataTable data
    setData(prevData =>
      prevData.map(item => item.id === updatedItem.id ? updatedItem : item)
    );

    toast.success("Item updated successfully");
  } catch (error) {
    toast.error("Failed to update item");
  }
};
```

Troubleshooting

Common Issues

DataTable doesn't show all columns

Check if columns have hidden: true property
On mobile, only the first 2 columns are shown by default
FormBuilder validation not working

Ensure validation rules are correctly defined
Check for correct pattern syntax in regex validations
CRUD operations not persisting

The component handlers only update local state
Implement proper API calls in your handlers
Performance Optimization

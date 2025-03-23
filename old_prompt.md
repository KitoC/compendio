## PRD

This app is a customizable chat based AI assistant and workflow builder. It is adjustable to different industries but the first industry we focus on will be the construction and trades industry.

It will be browser based but also responsive for mobile and installed as a PWA.

### Features

- Ability to chat to different AI assistants that can interact with each other
- Ability to retrieve customer & quote information
- Ability to configure each assistant
- Automated (with approval confirmation) email response agents
- Quote generation and quote tracking
- Custom form builder
- Custom workflows
- Custom tools/ai functions
- In chat data display and form rendering
- Dashboard and analytics
- In chat dashboard summary (daily and triggered)
- Realtime Voice chat with AI assistants

### Tech-stack

- TailwindCSS
- React
- Supabase

## Code standards

Always use consts, especially for routes.
Always use prettier to format files.
Always attempt to use the latest versions for dependencies

PREFER a configuration based approach. For example, if you have a sidebar, I want it to be configurable by a JS object like this.

If you need to create new pages, confirm them with me before you do so.

```
const sideMenuItems = [
  {
    label: "Conversations",
    children: [{ label: "Assistant chat", url: ROUTES.ASSISTANT_CHAT }],
  },
  { label: "Assistant chat", url: ROUTES.ASSISTANT_CHAT },
  ....etc
];
```

## Supabase rules

When creating new tables, always use this function, pass the boolean in as true to add tenant_id:

`add_default_columns("TABLE_NAME", TRUE)`

add_default_columns adds the following columns ADN RLS for tenanted tables:

- id UUID DEFAULT gen_random_uuid() PRIMARY KEY
- created_at TIMESTAMP DEFAULT NOW()
- updated_at TIMESTAMP DEFAULT NOW()
- deleted_at TIMESTAMP NULL
- tenant_id UUID NOT NULL (with FOREIGN KEY constraint)

## Code Comments Guidelines

When reading code, pay special attention to comments prefixed with "DEV_NOTE:", "IMPORTANT:", or "TODO:". These are intentional guidance notes and should be prioritized in understanding how to approach the code.

Comment types to watch for:

- "DEV_NOTE:" - Contains architectural decisions, design patterns, or implementation approaches that should be followed
- "IMPORTANT:" - Critical information about business rules, behavior requirements, or limitations
- "TODO:" - Future improvements or known issues to address in future iterations
- "// @lovable-context" - Specific instructions for the AI on how to handle this component/file
- "NO_CHANGE:" - Means you must not change any logic in this file under any circumstances. If you need to update something within it you must get my explicit permission.

# Code Modification Rules

1. ONLY modify files directly related to the requested changes. Never touch unrelated files.

2. Before modifying ANY file, explicitly confirm it's necessary for the requested change.

3. Never "fix" or "improve" code that wasn't mentioned in the request.

4. If you think additional changes would be beneficial:

   - First complete only what was explicitly requested
   - Then ASK if I want to make those additional changes
   - Never make them without permission

5. For each file you modify, briefly explain WHY it needs to be changed.

6. When fixing errors, only modify the minimum code necessary to resolve the specific error.

## DataTable and FormBuilder Components Guide

Overview

This project includes two powerful dynamic components:

DataTable: A responsive data table with full CRUD functionality based on permissions
FormBuilder: A dynamic form generator that renders forms based on configuration objects
DataTable Component

You should ALWAYS use these instead of generating custom markup.

Basic Usage

Import and use the DataTable component like this:

import DataTable from "@/components/data-table";
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
Key Properties

data: Array of data items to display
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

import FormBuilder from "@/components/form-builder";
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
Form Configuration

interface FormConfig {
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
Supported Field Types

The FormBuilder supports the following field types:

text: Standard text input
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
Validation is handled automatically with appropriate error messages. You can also provide custom validation functions.

Select and Radio Options

For field types that need options (select, radio):

interface FormFieldOption {
label: string;
value: string;
}
Combining DataTable and FormBuilder

These components work well together. A common pattern is to:

Use DataTable to display and manage a list of items
Use FormBuilder for the create/edit forms
Example integration:

function UserManagement() {
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
Converting DataTable Columns to FormBuilder Config

You can use the built-in utility functions to convert DataTable columns to FormBuilder config:

import { columnsToFormConfig, createInitialValues } from "@/components/data-table";

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
The columnsToFormConfig function:

Converts DataTable columns to FormBuilder fields
Maps column types to appropriate form field types
Sets up validation based on data types
Excludes system fields like ID and timestamps by default
Advanced Tips

Dynamic Form Configuration

You can generate form configurations dynamically:

// Generate form config from a data schema or API
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
Custom Column Rendering

Use the column's render property for custom UI:

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
Form Submission with DataTable

To update the DataTable after form submission:

const handleFormSubmit = async (values) => {
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

# Common Reusable Components

This directory contains standardized, reusable UI components used across the entire application to reduce code duplication and maintain consistency.

## Components

### 1. SectionHeader
Standardized section header with title, description, and optional action button.

```jsx
import { SectionHeader } from '../common'
import { Add as AddIcon } from '@mui/icons-material'

<SectionHeader
  title="User Management"
  description="Manage user access and permissions"
  actionLabel="Add User"
  actionIcon={<AddIcon />}
  onAction={handleAdd}
>
  {/* Additional header actions */}
  <SearchBar value={search} onChange={setSearch} />
</SectionHeader>
```

### 2. LoadingState
Standardized loading spinner with message.

```jsx
import { LoadingState } from '../common'

<LoadingState message="Loading users..." />
```

### 3. EmptyState
Standardized empty state with icon, title, and optional message/action.

```jsx
import { EmptyState } from '../common'
import { Inbox as InboxIcon } from '@mui/icons-material'

<EmptyState
  icon={<InboxIcon />}
  title="No users found"
  message="Try adjusting your search criteria"
  action={<Button onClick={handleAdd}>Add User</Button>}
/>
```

### 4. SearchBar
Standardized search input with icon.

```jsx
import { SearchBar } from '../common'

<SearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Search users..."
  fullWidth={true}
/>
```

### 5. FilterSelect
Standardized filter dropdown.

```jsx
import { FilterSelect } from '../common'

<FilterSelect
  label="Status"
  value={statusFilter}
  onChange={setStatusFilter}
  options={[
    { value: 'All', label: 'All' },
    { value: 'Active', label: 'Active' },
    { value: 'Disabled', label: 'Disabled' }
  ]}
/>
```

### 6. ViewToggle
Toggle between table and grid views.

```jsx
import { ViewToggle } from '../common'

<ViewToggle
  view={viewType}
  onChange={setViewType}
  showLabels={false}
/>
```

### 7. StatusBadge
Standardized status badge with color coding.

```jsx
import { StatusBadge } from '../common'

<StatusBadge status="In Stock" size="small" />
```

Supported statuses:
- `In Stock` (green)
- `On Modification` (orange)
- `Sold` (blue)
- `Reserved` (purple)
- `Active` (green)
- `Disabled` (red)
- `Pending` (orange)

### 8. DataTable
Reusable data table with column configuration.

```jsx
import { DataTable } from '../common'
import { StatusBadge } from '../common'
import { ActionButton } from '../forms'

<DataTable
  columns={[
    { key: 'name', label: 'Name' },
    { 
      key: 'status', 
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'center',
      render: (row) => (
        <ActionButton
          icon={<EditIcon />}
          onClick={() => handleEdit(row)}
          title="Edit"
          color="primary"
        />
      )
    }
  ]}
  data={users}
  loading={loading}
  emptyMessage="No users found"
  onRowClick={(row) => handleViewDetails(row)}
/>
```

## Usage Example

```jsx
import {
  SectionHeader,
  SearchBar,
  FilterSelect,
  DataTable,
  LoadingState,
  EmptyState,
  StatusBadge,
  ViewToggle
} from '../common'
import { ActionButton } from '../forms'

const UsersList = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [viewType, setViewType] = useState('table')

  return (
    <div>
      <SectionHeader
        title="Users"
        description="Manage all users"
        actionLabel="Add User"
        onAction={handleAdd}
      >
        <SearchBar value={searchTerm} onChange={setSearchTerm} />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={statusOptions}
        />
        <ViewToggle view={viewType} onChange={setViewType} />
      </SectionHeader>

      <DataTable
        columns={columns}
        data={filteredUsers}
        loading={loading}
        emptyMessage="No users found"
      />
    </div>
  )
}
```

## Benefits

- **Consistency**: All sections use the same UI patterns
- **Maintainability**: Update styling in one place affects all components
- **Reduced Code**: Eliminates ~60% of repetitive UI code
- **Type Safety**: Consistent prop interfaces
- **Reusability**: Components work across the entire application

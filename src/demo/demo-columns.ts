import { stringColumn, numberColumn, selectColumn, multiValueColumn, booleanColumn, codeColumn, dateColumn } from '../columns'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'obsolete', label: 'Obsolete' },
  { value: 'review', label: 'Review' },
]

export const demoBomColumns = [
  stringColumn({ accessorKey: 'partNumber', header: 'Part Number', copyable: true }),
  stringColumn({ accessorKey: 'description', header: 'Description', width: 280, editable: true }),
  numberColumn({ accessorKey: 'quantity', header: 'Qty', editable: true }),
  numberColumn({ accessorKey: 'unitPrice', header: 'Unit Price', format: 'currency', editable: true }),
  selectColumn({ accessorKey: 'status', header: 'Status', options: STATUS_OPTIONS, editable: true }),
  multiValueColumn({ accessorKey: 'tags', header: 'Tags', editable: true }),
  booleanColumn({ accessorKey: 'isActive', header: 'Active', renderAs: 'badge', editable: true }),
  codeColumn({ accessorKey: 'internalCode', header: 'Code', copyable: true, editable: true }),
  dateColumn({ accessorKey: 'createdAt', header: 'Created', editable: true }),
]

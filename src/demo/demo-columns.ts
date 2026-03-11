import { stringColumn, numberColumn, selectColumn, multiValueColumn, booleanColumn, codeColumn, dateColumn } from '../columns'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'obsolete', label: 'Obsolete' },
  { value: 'review', label: 'Review' },
]

export const demoBomColumns = [
  stringColumn({ accessorKey: 'partNumber', header: 'Part Number', copyable: true }),
  stringColumn({ accessorKey: 'description', header: 'Description', width: 280 }),
  numberColumn({ accessorKey: 'quantity', header: 'Qty' }),
  numberColumn({ accessorKey: 'unitPrice', header: 'Unit Price', format: 'currency' }),
  selectColumn({ accessorKey: 'status', header: 'Status', options: STATUS_OPTIONS }),
  multiValueColumn({ accessorKey: 'tags', header: 'Tags' }),
  booleanColumn({ accessorKey: 'isActive', header: 'Active', renderAs: 'badge' }),
  codeColumn({ accessorKey: 'internalCode', header: 'Code', copyable: true }),
  dateColumn({ accessorKey: 'createdAt', header: 'Created' }),
]

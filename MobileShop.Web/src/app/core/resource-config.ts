import {
  AddressType,
  CustomerDto,
  productTypeOptions,
  ProductDto,
  PromoCodeDto,
  roleOptions,
  RoleName,
  TaxRuleDto,
  UserRole
} from './api.models';
import { dateTime, enumLabel, fromLocalInputValue, money, toLocalInputValue } from './formatters';

export type FieldType = 'text' | 'email' | 'password' | 'tel' | 'number' | 'textarea' | 'select' | 'checkbox' | 'date' | 'datetime-local';
export type FormMode = 'create' | 'update';
export type ResourceRecord = Record<string, unknown>;

export interface LookupSource {
  endpoint: string;
  labelKey: string;
  valueKey: string;
}

export interface ResourceField {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  step?: string;
  placeholder?: string;
  options?: { label: string; value: string | number | boolean }[];
  source?: LookupSource;
  createOnly?: boolean;
  updateOnly?: boolean;
  hint?: string;
}

export interface ResourceColumn<T extends ResourceRecord = ResourceRecord> {
  key: keyof T & string;
  label: string;
  format?: (value: unknown, row: T) => string;
}

export interface ResourceConfig<T extends ResourceRecord = ResourceRecord> {
  key: string;
  title: string;
  description: string;
  endpoint: string;
  listRoles: RoleName[];
  createRoles: RoleName[];
  updateRoles: RoleName[];
  deleteRoles: RoleName[];
  readOnly?: boolean;
  columns: ResourceColumn<T>[];
  fields: ResourceField[];
  defaultForm?: () => ResourceRecord;
  toForm?: (item: T) => ResourceRecord;
  toPayload?: (form: ResourceRecord, mode: FormMode) => ResourceRecord;
}

export const resourceConfigs: Record<string, ResourceConfig> = {
  products: {
    key: 'products',
    title: 'Products',
    description: 'Maintain the sellable catalog backed by /api/products.',
    endpoint: '/api/products',
    listRoles: ['SuperAdmin', 'Admin'],
    createRoles: ['SuperAdmin', 'Admin'],
    updateRoles: ['SuperAdmin', 'Admin'],
    deleteRoles: ['SuperAdmin', 'Admin'],
    columns: [
      { key: 'sku', label: 'SKU' },
      { key: 'name', label: 'Product' },
      { key: 'categoryName', label: 'Category' },
      { key: 'brandName', label: 'Brand' },
      { key: 'price', label: 'Price', format: (value) => money(Number(value)) },
      { key: 'quantityOnHand', label: 'Stock' }
    ],
    fields: [
      { key: 'sku', label: 'SKU', type: 'text', required: true },
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'productType', label: 'Product type', type: 'select', required: true, options: productTypeOptions },
      { key: 'categoryId', label: 'Category', type: 'select', required: true, source: { endpoint: '/api/categories', labelKey: 'name', valueKey: 'id' } },
      { key: 'brandId', label: 'Brand', type: 'select', required: true, source: { endpoint: '/api/brands', labelKey: 'name', valueKey: 'id' } },
      { key: 'price', label: 'Price', type: 'number', min: 0, step: '0.01', required: true },
      { key: 'costPrice', label: 'Cost price', type: 'number', min: 0, step: '0.01', required: true },
      { key: 'taxPercentage', label: 'Tax %', type: 'number', min: 0, step: '0.01', required: true },
      { key: 'discountAmount', label: 'Discount', type: 'number', min: 0, step: '0.01' },
      { key: 'promoCode', label: 'Promo code', type: 'text' },
      { key: 'quantityOnHand', label: 'Opening stock', type: 'number', min: 0, required: true },
      { key: 'reorderLevel', label: 'Reorder level', type: 'number', min: 0, required: true }
    ],
    defaultForm: () => ({ productType: 1, taxPercentage: 18, discountAmount: 0, quantityOnHand: 0, reorderLevel: 0 })
  },
  categories: lookupConfig('categories', 'Categories', '/api/categories'),
  brands: lookupConfig('brands', 'Brands', '/api/brands'),
  customers: {
    key: 'customers',
    title: 'Customers',
    description: 'Create and update customer profiles for checkout, service, and support.',
    endpoint: '/api/customers',
    listRoles: ['SuperAdmin', 'Admin', 'Operator'],
    createRoles: ['SuperAdmin', 'Admin', 'Operator'],
    updateRoles: ['SuperAdmin', 'Admin', 'Operator'],
    deleteRoles: [],
    columns: [
      { key: 'fullName', label: 'Customer' },
      { key: 'email', label: 'Email' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'id', label: 'Profile ID' }
    ],
    fields: [
      { key: 'firstName', label: 'First name', type: 'text', required: true },
      { key: 'lastName', label: 'Last name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phoneNumber', label: 'Phone', type: 'tel', required: true },
      { key: 'alternatePhoneNumber', label: 'Alternate phone', type: 'tel' },
      { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
      { key: 'gender', label: 'Gender', type: 'text' },
      { key: 'password', label: 'Password', type: 'password', createOnly: true, hint: 'Optional for walk-in customers.' },
      { key: 'billingLine1', label: 'Billing address', type: 'text', required: true },
      { key: 'shippingLine1', label: 'Shipping address', type: 'text', required: true },
      { key: 'city', label: 'City', type: 'text', required: true },
      { key: 'state', label: 'State', type: 'text', required: true },
      { key: 'country', label: 'Country', type: 'text', required: true },
      { key: 'postalCode', label: 'Postal code', type: 'text', required: true }
    ],
    defaultForm: () => ({ country: 'India' }),
    toForm: (item) => customerToForm(item as unknown as CustomerDto),
    toPayload: (form) => customerPayload(form)
  },
  suppliers: {
    key: 'suppliers',
    title: 'Suppliers',
    description: 'Supplier master data used by purchase orders and stock receipts.',
    endpoint: '/api/suppliers',
    listRoles: ['SuperAdmin', 'Admin', 'Operator'],
    createRoles: ['SuperAdmin', 'Admin'],
    updateRoles: ['SuperAdmin', 'Admin'],
    deleteRoles: ['SuperAdmin', 'Admin'],
    columns: [
      { key: 'name', label: 'Supplier' },
      { key: 'contactPerson', label: 'Contact' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'isActive', label: 'Active', format: (value) => value ? 'Yes' : 'No' }
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'contactPerson', label: 'Contact person', type: 'text' },
      { key: 'phoneNumber', label: 'Phone', type: 'tel', required: true },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'taxRegistrationNumber', label: 'Tax registration', type: 'text' },
      { key: 'isActive', label: 'Active', type: 'checkbox' }
    ],
    defaultForm: () => ({ isActive: true })
  },
  expenses: {
    key: 'expenses',
    title: 'Expenses',
    description: 'Record operating expenses used by daily cash and profit/loss reports.',
    endpoint: '/api/expenses',
    listRoles: ['SuperAdmin', 'Admin', 'Operator'],
    createRoles: ['SuperAdmin', 'Admin', 'Operator'],
    updateRoles: ['SuperAdmin', 'Admin', 'Operator'],
    deleteRoles: ['SuperAdmin', 'Admin'],
    columns: [
      { key: 'expenseDateUtc', label: 'Date', format: (value) => dateTime(String(value ?? '')) },
      { key: 'category', label: 'Category' },
      { key: 'amount', label: 'Amount', format: (value) => money(Number(value)) },
      { key: 'paymentMethod', label: 'Payment method' },
      { key: 'paidTo', label: 'Paid to' }
    ],
    fields: [
      { key: 'expenseDateUtc', label: 'Expense date', type: 'datetime-local', required: true },
      { key: 'category', label: 'Category', type: 'text', required: true },
      { key: 'amount', label: 'Amount', type: 'number', min: 0, step: '0.01', required: true },
      { key: 'paymentMethod', label: 'Payment method', type: 'text', required: true },
      { key: 'paidTo', label: 'Paid to', type: 'text' },
      { key: 'referenceNumber', label: 'Reference', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' }
    ],
    defaultForm: () => ({ expenseDateUtc: toLocalInputValue(new Date().toISOString()) }),
    toForm: (item) => ({ ...item, expenseDateUtc: toLocalInputValue(String(item['expenseDateUtc'] ?? '')) }),
    toPayload: (form) => ({ ...form, expenseDateUtc: fromLocalInputValue(String(form['expenseDateUtc'] ?? '')) })
  },
  taxes: {
    key: 'taxes',
    title: 'Tax rules',
    description: 'Pricing tax rules exposed by /api/taxes.',
    endpoint: '/api/taxes',
    listRoles: ['SuperAdmin', 'Admin'],
    createRoles: ['SuperAdmin', 'Admin'],
    updateRoles: ['SuperAdmin', 'Admin'],
    deleteRoles: ['SuperAdmin', 'Admin'],
    columns: [
      { key: 'name', label: 'Rule' },
      { key: 'percentage', label: 'Percentage', format: (value) => `${value}%` },
      { key: 'isDefault', label: 'Default', format: (value) => value ? 'Yes' : 'No' },
      { key: 'isActive', label: 'Active', format: (value) => value ? 'Yes' : 'No' }
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'percentage', label: 'Percentage', type: 'number', min: 0, max: 100, step: '0.01', required: true },
      { key: 'isDefault', label: 'Default', type: 'checkbox' },
      { key: 'isActive', label: 'Active', type: 'checkbox' }
    ],
    defaultForm: () => ({ percentage: 18, isDefault: false, isActive: true })
  },
  promocodes: {
    key: 'promocodes',
    title: 'Promo codes',
    description: 'Time-boxed discounts consumed by checkout/order creation.',
    endpoint: '/api/promocodes',
    listRoles: ['SuperAdmin', 'Admin'],
    createRoles: ['SuperAdmin', 'Admin'],
    updateRoles: ['SuperAdmin', 'Admin'],
    deleteRoles: ['SuperAdmin', 'Admin'],
    columns: [
      { key: 'code', label: 'Code' },
      { key: 'discountAmount', label: 'Amount', format: (value) => money(Number(value)) },
      { key: 'discountPercentage', label: 'Percent', format: (value) => value ? `${value}%` : '' },
      { key: 'validToUtc', label: 'Valid to', format: (value) => dateTime(String(value ?? '')) },
      { key: 'isActive', label: 'Active', format: (value) => value ? 'Yes' : 'No' }
    ],
    fields: [
      { key: 'code', label: 'Code', type: 'text', required: true },
      { key: 'discountAmount', label: 'Discount amount', type: 'number', min: 0, step: '0.01' },
      { key: 'discountPercentage', label: 'Discount %', type: 'number', min: 0, max: 100, step: '0.01' },
      { key: 'validFromUtc', label: 'Valid from', type: 'datetime-local', required: true },
      { key: 'validToUtc', label: 'Valid to', type: 'datetime-local', required: true },
      { key: 'isActive', label: 'Active', type: 'checkbox' }
    ],
    defaultForm: () => {
      const now = new Date();
      const later = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      return { discountAmount: 0, validFromUtc: toLocalInputValue(now.toISOString()), validToUtc: toLocalInputValue(later.toISOString()), isActive: true };
    },
    toForm: (item) => ({
      ...item,
      validFromUtc: toLocalInputValue(String(item['validFromUtc'] ?? '')),
      validToUtc: toLocalInputValue(String(item['validToUtc'] ?? ''))
    }),
    toPayload: (form) => ({
      ...form,
      validFromUtc: fromLocalInputValue(String(form['validFromUtc'] ?? '')),
      validToUtc: fromLocalInputValue(String(form['validToUtc'] ?? ''))
    })
  },
  users: {
    key: 'users',
    title: 'Users',
    description: 'Staff account administration backed by /api/users.',
    endpoint: '/api/users',
    listRoles: ['SuperAdmin', 'Admin'],
    createRoles: ['SuperAdmin', 'Admin'],
    updateRoles: ['SuperAdmin', 'Admin'],
    deleteRoles: ['SuperAdmin', 'Admin'],
    columns: [
      { key: 'fullName', label: 'User' },
      { key: 'email', label: 'Email' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'role', label: 'Role', format: (value) => enumLabel(roleOptions, value as UserRole) },
      { key: 'isActive', label: 'Active', format: (value) => value ? 'Yes' : 'No' }
    ],
    fields: [
      { key: 'firstName', label: 'First name', type: 'text', required: true },
      { key: 'lastName', label: 'Last name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true, createOnly: true },
      { key: 'phoneNumber', label: 'Phone', type: 'tel', required: true },
      { key: 'password', label: 'Password', type: 'password', required: true, createOnly: true },
      { key: 'role', label: 'Role', type: 'select', required: true, options: roleOptions },
      { key: 'isActive', label: 'Active', type: 'checkbox', updateOnly: true }
    ],
    defaultForm: () => ({ role: UserRole.Operator, isActive: true }),
    toForm: (item) => {
      const [firstName, ...rest] = String(item['fullName'] ?? '').split(' ');
      return { ...item, firstName, lastName: rest.join(' '), isActive: item['isActive'] ?? true };
    },
    toPayload: (form, mode) => {
      if (mode === 'create') {
        return {
          firstName: form['firstName'],
          lastName: form['lastName'],
          email: form['email'],
          phoneNumber: form['phoneNumber'],
          password: form['password'],
          role: form['role']
        };
      }

      return {
        firstName: form['firstName'],
        lastName: form['lastName'],
        phoneNumber: form['phoneNumber'],
        role: form['role'],
        isActive: Boolean(form['isActive'])
      };
    }
  },
  settings: {
    key: 'settings',
    title: 'Settings',
    description: 'Application settings exposed by /api/settings.',
    endpoint: '/api/settings',
    listRoles: ['SuperAdmin', 'Admin'],
    createRoles: ['SuperAdmin', 'Admin'],
    updateRoles: ['SuperAdmin', 'Admin'],
    deleteRoles: ['SuperAdmin', 'Admin'],
    columns: [
      { key: 'key', label: 'Key' },
      { key: 'value', label: 'Value' },
      { key: 'description', label: 'Description' }
    ],
    fields: [
      { key: 'key', label: 'Key', type: 'text', required: true },
      { key: 'value', label: 'Value', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' }
    ]
  },
  'audit-logs': {
    key: 'audit-logs',
    title: 'Audit logs',
    description: 'Read-only audit trail from /api/auditlogs.',
    endpoint: '/api/auditlogs',
    listRoles: ['SuperAdmin', 'Admin'],
    createRoles: [],
    updateRoles: [],
    deleteRoles: [],
    readOnly: true,
    columns: [
      { key: 'createdAtUtc', label: 'When', format: (value) => dateTime(String(value ?? '')) },
      { key: 'entityName', label: 'Entity' },
      { key: 'action', label: 'Action' },
      { key: 'performedBy', label: 'Performed by' },
      { key: 'payload', label: 'Payload' }
    ],
    fields: []
  }
};

function lookupConfig(key: string, title: string, endpoint: string): ResourceConfig {
  return {
    key,
    title,
    description: `${title} lookup data used by product classification.`,
    endpoint,
    listRoles: ['SuperAdmin', 'Admin', 'Operator'],
    createRoles: ['SuperAdmin', 'Admin'],
    updateRoles: ['SuperAdmin', 'Admin'],
    deleteRoles: ['SuperAdmin', 'Admin'],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' }
    ],
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'description', label: 'Description', type: 'textarea' }
    ]
  };
}

function customerToForm(item: CustomerDto): ResourceRecord {
  const [firstName, ...rest] = item.fullName.split(' ');
  const billing = item.addresses?.find((address) => address.type === AddressType.Billing) ?? item.addresses?.[0];
  const shipping = item.addresses?.find((address) => address.type === AddressType.Shipping) ?? billing;

  return {
    ...item,
    firstName,
    lastName: rest.join(' '),
    dateOfBirth: item.dateOfBirth ?? '',
    billingLine1: billing?.line1 ?? '',
    shippingLine1: shipping?.line1 ?? '',
    city: billing?.city ?? shipping?.city ?? '',
    state: billing?.state ?? shipping?.state ?? '',
    country: billing?.country ?? shipping?.country ?? 'India',
    postalCode: billing?.postalCode ?? shipping?.postalCode ?? ''
  };
}

function customerPayload(form: ResourceRecord): ResourceRecord {
  const baseAddress = {
    city: String(form['city'] ?? ''),
    state: String(form['state'] ?? ''),
    country: String(form['country'] ?? ''),
    postalCode: String(form['postalCode'] ?? '')
  };

  return {
    firstName: form['firstName'],
    lastName: form['lastName'],
    email: form['email'],
    phoneNumber: form['phoneNumber'],
    alternatePhoneNumber: form['alternatePhoneNumber'] || null,
    dateOfBirth: form['dateOfBirth'] || null,
    gender: form['gender'] || null,
    password: form['password'] || null,
    addresses: [
      {
        type: AddressType.Billing,
        line1: String(form['billingLine1'] ?? ''),
        ...baseAddress
      },
      {
        type: AddressType.Shipping,
        line1: String(form['shippingLine1'] ?? ''),
        ...baseAddress
      }
    ]
  };
}

export function coerceResourcePayload(config: ResourceConfig, form: ResourceRecord, mode: FormMode): ResourceRecord {
  if (config.toPayload) {
    return config.toPayload(form, mode);
  }

  const fields = config.fields.filter((field) => mode === 'create' ? !field.updateOnly : !field.createOnly);
  return fields.reduce<ResourceRecord>((payload, field) => {
    const value = form[field.key];
    if (field.type === 'number') {
      payload[field.key] = value === '' || value === null || value === undefined ? 0 : Number(value);
    } else if (field.type === 'checkbox') {
      payload[field.key] = Boolean(value);
    } else if (field.type === 'datetime-local') {
      payload[field.key] = fromLocalInputValue(String(value ?? ''));
    } else {
      payload[field.key] = value === '' ? null : value;
    }
    return payload;
  }, {});
}

export function productFormDefaultsFromItem(item: ProductDto): ResourceRecord {
  return { ...item };
}

export function promoFormDefaultsFromItem(item: PromoCodeDto): ResourceRecord {
  return {
    ...item,
    validFromUtc: toLocalInputValue(item.validFromUtc),
    validToUtc: toLocalInputValue(item.validToUtc)
  };
}

export function taxFormDefaultsFromItem(item: TaxRuleDto): ResourceRecord {
  return { ...item };
}

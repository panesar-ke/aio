import {
  pgTable,
  foreignKey,
  serial,
  date,
  integer,
  uuid,
  boolean,
  varchar,
  text,
  numeric,
  bigserial,
  timestamp,
  uniqueIndex,
  index,
  unique,
  bigint,
  primaryKey,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { stores } from '../schema';

export const aalLevel = pgEnum('aal_level', ['aal3', 'aal2', 'aal1']);
export const accountStateEnum = pgEnum('accountStateEnum', ['lead', 'account']);
export const appraisalDetailTypeEnum = pgEnum('appraisalDetailTypeEnum', [
  'OBJECTIVE',
  'FINAL',
]);
export const appraisalStatusEnum = pgEnum('appraisalStatusEnum', [
  'NOT SET',
  'PENDING',
  'STAFF FILLED',
  'CONDUCTED',
  'COMPLETED',
  'FILLED',
]);
export const bloodTypeEnum = pgEnum('bloodTypeEnum', ['A', 'B', 'AB', 'O']);
export const codeChallengeMethod = pgEnum('code_challenge_method', [
  'plain',
  's256',
]);
export const disciplinaryCaseActionEnum = pgEnum('disciplinaryCaseActionEnum', [
  'VERBAL-WARNING',
  'WRITTEN-WARNING',
  'SURCHARGE',
  'SUSPENSION',
  'TERMINATION',
  'OTHER',
]);
export const disciplinaryCaseStatusEnum = pgEnum('disciplinaryCaseStatusEnum', [
  'REPORTED',
  'UNDER-INVESTIGATION',
  'RESOLVED',
  'CLOSED',
]);
export const discountTypeEnum = pgEnum('discountTypeEnum', [
  'NONE',
  'PERCENTAGE',
  'AMOUNT',
]);
export const educationLevelEnum = pgEnum('educationLevelEnum', [
  'PHD',
  'MASTERS-DEGREE',
  'BACHELORS-DEGREE',
  'HIGHER-DIPLOMA',
  'DIPLOMA',
  'CERTIFICATE',
  'SECONDARY',
  'PRIMARY',
  'NONE',
]);
export const educationTypeEnum = pgEnum('educationTypeEnum', [
  'academic',
  'professional',
  'training',
]);
export const employeeCategory = pgEnum('employeeCategory', [
  'UNIONISABLE',
  'MANAGEMENT',
  'NON-UNIONISABLE',
  'WORKFLOOR',
  'CONTRACTOR',
]);
export const employeeStatus = pgEnum('employeeStatus', [
  'ACTIVE',
  'TERMINATED',
  'RESIGNED',
  'RETIRED',
  'DECEASED',
]);
export const employmentType = pgEnum('employmentType', [
  'PERMANENT',
  'CONTRACT',
  'CASUAL',
  'INTERN',
  'NO CONTRACT',
]);
export const factorStatus = pgEnum('factor_status', ['verified', 'unverified']);
export const factorType = pgEnum('factor_type', ['webauthn', 'totp']);
export const genderEnum = pgEnum('genderEnum', ['MALE', 'FEMALE']);
export const healthSafetyInjuryEnum = pgEnum('healthSafetyInjuryEnum', [
  'NOT-FILED',
  'PENDING',
  'REJECTED',
  'CLOSED',
  'MINOR',
  'MAJOR',
]);
export const healthSafetyStatusEnum = pgEnum('healthSafetyStatusEnum', [
  'NOT-FILED',
  'PENDING',
  'REJECTED',
  'CLOSED',
]);
export const keyStatus = pgEnum('key_status', [
  'expired',
  'invalid',
  'valid',
  'default',
]);
export const keyType = pgEnum('key_type', [
  'stream_xchacha20',
  'secretstream',
  'secretbox',
  'kdf',
  'generichash',
  'shorthash',
  'auth',
  'hmacsha256',
  'hmacsha512',
  'aead-det',
  'aead-ietf',
]);
export const leadStatusEnum = pgEnum('leadStatusEnum', [
  'new',
  'contacted',
  'nurturing',
  'qualified',
  'unqualified',
  'lost',
]);
export const leaveStatusEnum = pgEnum('leaveStatusEnum', [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'CANCELED',
]);
export const maritalStatusEnum = pgEnum('maritalStatusEnum', [
  'SINGLE',
  'MARRIED',
  'DIVORCED',
  'WIDOWED',
]);
export const opportunityStageEnum = pgEnum('opportunityStageEnum', [
  'prospecting',
  'qualification',
  'propasal',
  'negotiation',
  'won',
  'lost',
]);
export const priorityEnum = pgEnum('priorityEnum', ['low', 'medium', 'high']);
export const quotationStatusEnum = pgEnum('quotationStatusEnum', [
  'draft',
  'sent',
  'accepted',
  'declined',
  'expired',
]);
export const salutationEnum = pgEnum('salutationEnum', [
  'mr',
  'mrs',
  'ms',
  'dr',
  'sir',
  'prof',
  'other',
]);
export const stockMovementTypeEnum = pgEnum('stockMovementTypeEnum', [
  'GRN',
  'ISSUE',
  'TRANSFER',
  'CONVERSION',
  'CONVERSION_IN',
  'CONVERSION_OUT',
  'OPENING_BAL',
]);
export const supportTicketEnum = pgEnum('supportTicketEnum', [
  'open',
  'in progress',
  'escalated',
  'resolved',
  'closed',
]);
export const userRoleEnum = pgEnum('userRoleEnum', [
  'STANDARD USER',
  'ADMIN',
  'SUPER ADMIN',
]);
export const vatTypeEnum = pgEnum('vatTypeEnum', [
  'NONE',
  'EXCLUSIVE',
  'INCLUSIVE',
]);
export const vehicleStatusEnum = pgEnum('vehicleStatusEnum', [
  'ACTIVE',
  'GROUNDED',
  'SOLD',
]);
export const workfloorType = pgEnum('workfloorType', [
  'UNIONISABLE',
  'NON-UNIONISABLE',
]);

export const appraisalHeader = pgTable(
  'appraisal_header',
  {
    id: serial().primaryKey().notNull(),
    appraisalDate: date('appraisal_date').notNull(),
    staffId: integer('staff_id').notNull(),
    yearId: integer('year_id').notNull(),
    appraisalStatus: appraisalStatusEnum('appraisal_status')
      .default('PENDING')
      .notNull(),
    conductedOn: date('conducted_on'),
    createdOn: date('created_on').defaultNow().notNull(),
    createdBy: uuid('created_by').notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    startTime: varchar('start_time').notNull(),
    endTime: varchar('end_time').notNull(),
    remarks: text().notNull(),
    finalRatingStaff: numeric('final_rating_staff'),
    finalRemarkStaff: text('final_remark_staff'),
    finalRatingManagement: numeric('final_rating_management'),
    finalRemarkManagement: text('final_remark_management'),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'appraisal_header_created_by_users_id_fk',
    }),
    foreignKey({
      columns: [table.staffId],
      foreignColumns: [employees.id],
      name: 'appraisal_header_staff_id_employees_id_fk',
    }),
    foreignKey({
      columns: [table.yearId],
      foreignColumns: [calendarYears.id],
      name: 'appraisal_header_year_id_calendar_years_id_fk',
    }),
  ]
);

export const calendarYears = pgTable('calendar_years', {
  id: integer().primaryKey().notNull(),
  yearName: varchar('year_name', { length: 20 }).notNull(),
});

export const contractExtensions = pgTable(
  'contract_extensions',
  {
    id: text().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    oldExpiryDate: date('old_expiry_date').notNull(),
    extensionDuration: numeric('extension_duration').notNull(),
    newExpiryDate: date('new_expiry_date').notNull(),
    remarks: text(),
    createdBy: uuid('created_by').notNull(),
    createdDate: date('created_date').defaultNow().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'contract_extensions_created_by_users_id_fk',
    }),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'contract_extensions_employee_id_employees_id_fk',
    }),
  ]
);

export const attendances = pgTable('attendances', {
  id: bigserial({ mode: 'bigint' }).primaryKey().notNull(),
  attendanceDate: date('attendance_date').notNull(),
  employeeId: integer('employee_id').notNull(),
  timeIn: varchar('time_in', { length: 6 }),
  break: varchar({ length: 6 }),
  resume: varchar({ length: 6 }),
  timeOut: varchar('time_out', { length: 6 }),
  workHour: numeric('work_hour'),
  otHour: numeric('ot_hour'),
  shortHour: numeric('short_hour'),
});

export const conversions = pgTable(
  'conversions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    conversionDate: date('conversion_date').defaultNow().notNull(),
    convertingItem: uuid('converting_item'),
    convertingQuantity: numeric('converting_quantity'),
    convertedItem: uuid('converted_item').notNull(),
    convertedQuantity: numeric('converted_quantity').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.convertedItem],
      foreignColumns: [products.id],
      name: 'conversions_converted_item_products_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.convertingItem],
      foreignColumns: [products.id],
      name: 'conversions_converting_item_products_id_fk',
    }).onDelete('cascade'),
  ]
);

export const disciplinaryCases = pgTable('disciplinary_cases', {
  id: text().primaryKey().notNull(),
  caseDate: date('case_date').notNull(),
  incidenceDescription: text('incidence_description').notNull(),
  remarks: text().notNull(),
  caseStatus: disciplinaryCaseStatusEnum('case_status')
    .default('REPORTED')
    .notNull(),
  caseAction: disciplinaryCaseActionEnum('case_action').notNull(),
  otherAction: varchar('other_action'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
});

export const departments = pgTable('departments', {
  id: serial().primaryKey().notNull(),
  departmentName: varchar('department_name').notNull(),
  isProduction: boolean('is_production').default(true).notNull(),
  productionFlow: integer('production_flow'),
});

export const designations = pgTable('designations', {
  id: integer().primaryKey().notNull(),
  designationName: varchar('designation_name', { length: 150 }).notNull(),
  active: boolean().default(true).notNull(),
});

export const counties = pgTable('counties', {
  id: integer().primaryKey().notNull(),
  county: varchar().notNull(),
});

export const employeeQualifications = pgTable(
  'employee_qualifications',
  {
    id: text().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    qualificationType: educationTypeEnum('qualification_type').notNull(),
    from: varchar(),
    to: varchar(),
    school: varchar(),
    attainment: varchar(),
    specialization: varchar(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_qualifications_employee_id_employees_id_fk',
    }),
  ]
);

export const employeeSession = pgTable(
  'employee_session',
  {
    id: text().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [employeeUsers.id],
      name: 'employee_session_user_id_employee_users_id_fk',
    }).onDelete('cascade'),
  ]
);

export const employeeTerminations = pgTable(
  'employee_terminations',
  {
    id: text().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    terminationDate: date('termination_date').notNull(),
    reason: text().notNull(),
    remarks: text(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_terminations_employee_id_employees_id_fk',
    }),
  ]
);

export const employeeCertifications = pgTable(
  'employee_certifications',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    certification: varchar().notNull(),
    score: varchar().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employee_certifications_employee_id_employees_id_fk',
    }),
  ]
);

export const employeeUsers = pgTable(
  'employee_users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    contact: varchar({ length: 10 }).notNull(),
    password: text(),
    employeeType: employeeCategory('employee_type')
      .default('MANAGEMENT')
      .notNull(),
    email: text(),
    image: text(),
    active: boolean().default(true).notNull(),
    promptPasswordChange: boolean('prompt_password_change').default(false),
    resetToken: text('reset_token'),
    employeeRefId: integer('employee_ref_id').notNull(),
    idNumber: text('id_number'),
  },
  table => [
    uniqueIndex('employee_user_contact_idx').using(
      'btree',
      table.contact.asc().nullsLast().op('text_ops')
    ),
    uniqueIndex('employee_user_id_number_idx').using(
      'btree',
      table.idNumber.asc().nullsLast().op('text_ops')
    ),
    index('employee_user_name_idx').using(
      'btree',
      table.name.asc().nullsLast().op('text_ops')
    ),
    unique('employee_users_contact_unique').on(table.contact),
  ]
);

export const employees = pgTable(
  'employees',
  {
    id: integer().primaryKey().notNull(),
    reference: uuid().defaultRandom().notNull(),
    surname: varchar({ length: 255 }).notNull(),
    otherNames: varchar('other_names').notNull(),
    gender: genderEnum().notNull(),
    dob: date().notNull(),
    maritalStatus: maritalStatusEnum('marital_status'),
    idNo: varchar('id_no', { length: 15 }),
    payrollNo: varchar('payroll_no', { length: 6 }),
    department: integer().notNull(),
    designation: integer().notNull(),
    employmentType: employmentType('employment_type'),
    contractDate: date('contract_date').defaultNow(),
    joiningDate: date('joining_date').defaultNow(),
    contractDuration: integer('contract_duration').default(0).notNull(),
    expiryDate: date('expiry_date'),
    employeeCategory: employeeCategory('employee_category').notNull(),
    spouseName: varchar('spouse_name', { length: 255 }),
    spouseContact: varchar('spouse_contact', { length: 15 }),
    employeeStatus: employeeStatus('employee_status')
      .default('ACTIVE')
      .notNull(),
    imageUrl: text('image_url'),
    remarks: text(),
    isNew: boolean('is_new').default(true).notNull(),
    nationality: varchar({ length: 100 }),
    ethnicity: varchar({ length: 100 }),
    workfloorType: workfloorType('workfloor_type'),
    attendanceId: integer('attendance_id'),
    isDeleted: boolean('is_deleted').default(false).notNull(),
  },
  table => [
    index('employee_othernames_idx').using(
      'btree',
      table.otherNames.asc().nullsLast().op('text_ops')
    ),
    index('employee_surname_idx').using(
      'btree',
      table.surname.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.department],
      foreignColumns: [departments.id],
      name: 'employees_department_departments_id_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.designation],
      foreignColumns: [designations.id],
      name: 'employees_designation_designations_id_fk',
    }).onDelete('restrict'),
  ]
);

export const employeesNoks = pgTable(
  'employees_noks',
  {
    employeeId: integer('employee_id').notNull(),
    nameOne: varchar('name_one'),
    relationOne: varchar('relation_one'),
    contactOne: varchar('contact_one', { length: 15 }),
    nameTwo: varchar('name_two'),
    relationTwo: varchar('relation_two'),
    contactTwo: varchar('contact_two', { length: 15 }),
    incaseOfEmergency: varchar('incase_of_emergency'),
    incaseOfEmergenceyContact: varchar('incase_of_emergencey_contact'),
    incaseOfEmergenceyRelation: varchar('incase_of_emergencey_relation'),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employees_noks_employee_id_employees_id_fk',
    }).onDelete('cascade'),
  ]
);

export const employeesOtherdetails = pgTable(
  'employees_otherdetails',
  {
    employeeId: integer('employee_id').notNull(),
    nhif: varchar(),
    nssf: varchar(),
    kraPin: varchar('kra_pin'),
    allergies: boolean().default(false).notNull(),
    allegryDescription: varchar('allegry_description'),
    illness: boolean().default(false).notNull(),
    illnessDescription: varchar('illness_description'),
    conviction: boolean().default(false).notNull(),
    convictionDescription: varchar('conviction_description'),
    bloodType: bloodTypeEnum('blood_type'),
    educationLevel: educationLevelEnum('education_level'),
    terminated: boolean().default(false).notNull(),
    terminationDescription: varchar('termination_description'),
    effectiveDate: date('effective_date'),
    bankName: varchar('bank_name'),
    branchName: varchar('branch_name'),
    accountNo: varchar('account_no'),
    accountName: varchar('account_name'),
    shaNo: varchar('sha_no'),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employees_otherdetails_employee_id_employees_id_fk',
    }).onDelete('cascade'),
  ]
);

export const grnsHeader = pgTable(
  'grns_header',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().notNull(),
    receiptDate: date('receipt_date').defaultNow().notNull(),
    invoiceNo: varchar('invoice_no'),
    vendorId: uuid('vendor_id'),
    createdBy: uuid('created_by').notNull(),
    createdOn: date('created_on').defaultNow(),
    isDeleted: boolean('is_deleted').default(false),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    orderId: bigint('order_id', { mode: 'number' }),
    storeId: uuid('store_id').references(() => stores.id),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'grns_header_created_by_users_id_fk',
    }),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersHeader.id],
      name: 'grns_header_order_id_orders_header_id_fk',
    }),
    foreignKey({
      columns: [table.vendorId],
      foreignColumns: [vendors.id],
      name: 'grns_header_vendor_id_vendors_id_fk',
    }),
  ]
);

export const forms = pgTable('forms', {
  id: serial().primaryKey().notNull(),
  formName: varchar('form_name', { length: 100 }).notNull(),
  module: varchar().notNull(),
  moduleId: integer('module_id').notNull(),
  path: varchar().notNull(),
  menuOrder: integer('menu_order').notNull(),
  active: boolean('active').default(true),
});

export const healthSafety = pgTable(
  'health_safety',
  {
    id: text().primaryKey().notNull(),
    incidenceDate: date('incidence_date').notNull(),
    employeeId: integer('employee_id').notNull(),
    departmentId: integer('department_id').notNull(),
    incedenceDescription: text('incedence_description').notNull(),
    injurySeverity: healthSafetyInjuryEnum('injury_severity').notNull(),
    applicationStatus: healthSafetyStatusEnum('application_status')
      .default('NOT-FILED')
      .notNull(),
    applicationDate: date('application_date'),
    resolutionDate: date('resolution_date'),
    amountAwarded: numeric('amount_awarded'),
  },
  table => [
    foreignKey({
      columns: [table.departmentId],
      foreignColumns: [departments.id],
      name: 'health_safety_department_id_departments_id_fk',
    }),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'health_safety_employee_id_employees_id_fk',
    }),
  ]
);

export const jobcardStaffs = pgTable(
  'jobcard_staffs',
  {
    id: serial().primaryKey().notNull(),
    taskId: uuid('task_id').notNull(),
    staffId: integer('staff_id').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.staffId],
      foreignColumns: [employees.id],
      name: 'jobcard_staffs_staff_id_employees_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [jobcardTasks.id],
      name: 'jobcard_staffs_task_id_jobcard_tasks_id_fk',
    }).onDelete('cascade'),
  ]
);

export const employeesChildren = pgTable(
  'employees_children',
  {
    employeeId: integer('employee_id').notNull(),
    childname: varchar(),
    dob: date(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employees_children_employee_id_employees_id_fk',
    }).onDelete('cascade'),
  ]
);

export const employeesContacts = pgTable(
  'employees_contacts',
  {
    employeeId: integer('employee_id').notNull(),
    primaryContact: varchar('primary_contact', { length: 15 }),
    alternativeContact: varchar('alternative_contact'),
    address: varchar(),
    postalCode: varchar('postal_code', { length: 5 }),
    estate: varchar(),
    street: varchar(),
    countyId: integer('county_id'),
    district: varchar(),
    location: varchar(),
    village: varchar(),
    emailAddress: varchar('email_address', { length: 255 }),
    passport: varchar(),
    drivingLicense: varchar('driving_license'),
  },
  table => [
    foreignKey({
      columns: [table.countyId],
      foreignColumns: [counties.id],
      name: 'employees_contacts_county_id_counties_id_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'employees_contacts_employee_id_employees_id_fk',
    }).onDelete('cascade'),
  ]
);

export const kpis = pgTable(
  'kpis',
  {
    id: text().primaryKey().notNull(),
    kpi: text().notNull(),
    designationId: integer('designation_id'),
  },
  table => [
    foreignKey({
      columns: [table.designationId],
      foreignColumns: [designations.id],
      name: 'kpis_designation_id_designations_id_fk',
    }),
  ]
);

export const jobcardTimes = pgTable(
  'jobcard_times',
  {
    id: serial().primaryKey().notNull(),
    taskId: uuid('task_id').notNull(),
    pauseTime: timestamp('pause_time', { mode: 'string' }).notNull(),
    resumeTime: timestamp('resume_time', { mode: 'string' }).notNull(),
    remarks: text(),
    isStart: boolean('is_start').default(false).notNull(),
  },
  table => [
    foreignKey({
      columns: [table.taskId],
      foreignColumns: [jobcardTasks.id],
      name: 'jobcard_times_task_id_jobcard_tasks_id_fk',
    }).onDelete('cascade'),
  ]
);

export const leaveApplications = pgTable(
  'leave_applications',
  {
    leaveNo: integer('leave_no').primaryKey().notNull(),
    employeeCategory: employeeCategory('employee_category').notNull(),
    employeeId: integer('employee_id').notNull(),
    leaveTypeId: integer('leave_type_id').notNull(),
    applicationDate: date('application_date').defaultNow().notNull(),
    startDate: date('start_date').notNull(),
    endDate: date('end_date').notNull(),
    resumeDate: date('resume_date').notNull(),
    daysTaken: numeric('days_taken').notNull(),
    leaveStatus: leaveStatusEnum('leave_status').default('PENDING').notNull(),
    reason: text(),
    authorizedBy: uuid('authorized_by'),
    approvedBy: uuid('approved_by'),
    isUnpaid: boolean('is_unpaid').default(false),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    attachmentUrl: text('attachment_url'),
  },
  table => [
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [users.id],
      name: 'leave_applications_approved_by_users_id_fk',
    }),
    foreignKey({
      columns: [table.authorizedBy],
      foreignColumns: [users.id],
      name: 'leave_applications_authorized_by_users_id_fk',
    }),
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'leave_applications_employee_id_employees_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.leaveTypeId],
      foreignColumns: [leaveTypes.id],
      name: 'leave_applications_leave_type_id_leave_types_id_fk',
    }).onDelete('cascade'),
  ]
);

export const leaveTypes = pgTable('leave_types', {
  id: integer().primaryKey().notNull(),
  leaveTypeName: varchar('leave_type_name').notNull(),
  allocationManagement: numeric('allocation_management').notNull(),
  allocationWorkshop: numeric('allocation_workshop').notNull(),
  isPaidLeave: boolean('is_paid_leave').notNull(),
  requiresAttachment: boolean('requires_attachment').default(false).notNull(),
});

export const loanDeductions = pgTable(
  'loan_deductions',
  {
    id: serial().primaryKey().notNull(),
    loanId: integer('loan_id'),
    deductionAmount: numeric('deduction_amount').notNull(),
    deductionDate: date('deduction_date').notNull(),
    remarks: text(),
    createdBy: uuid('created_by').notNull(),
    createdDate: date('created_date').defaultNow().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'loan_deductions_created_by_users_id_fk',
    }),
    foreignKey({
      columns: [table.loanId],
      foreignColumns: [staffLoans.id],
      name: 'loan_deductions_loan_id_staff_loans_id_fk',
    }),
  ]
);

export const materialIssuesHeader = pgTable(
  'material_issues_header',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    issueNo: integer('issue_no').notNull(),
    issueDate: date('issue_date').defaultNow().notNull(),
    staffName: varchar('staff_name'),
    jobcardNo: varchar('jobcard_no', { length: 6 }),
    text: text(),
    issuedBy: uuid('issued_by').notNull(),
    createdOn: date('created_on').defaultNow().notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    storeId: uuid('store_id').references(() => stores.id),
  },
  table => [
    foreignKey({
      columns: [table.issuedBy],
      foreignColumns: [users.id],
      name: 'material_issues_header_issued_by_users_id_fk',
    }).onDelete('cascade'),
    unique('material_issues_header_issue_no_unique').on(table.issueNo),
  ]
);

export const motorVehicles = pgTable('motor_vehicles', {
  id: serial().primaryKey().notNull(),
  plateNumber: text('plate_number').notNull(),
  make: text(),
  model: text(),
  year: integer(),
  vehicleType: text('vehicle_type'),
  status: vehicleStatusEnum().default('ACTIVE'),
});

export const jobcardTasks = pgTable(
  'jobcard_tasks',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    jobcardNo: varchar('jobcard_no', { length: 10 }),
    departmentId: integer('department_id').notNull(),
    assignedHours: numeric('assigned_hours').default('0').notNull(),
    startTime: timestamp('start_time', { mode: 'string' }),
    endTime: timestamp('end_time', { mode: 'string' }),
    hoursStopped: numeric('hours_stopped').default('0').notNull(),
    isCompleted: boolean('is_completed').default(false).notNull(),
    remarks: text(),
    jobcardId: uuid('jobcard_id').notNull(),
  },
  table => [
    index('jobard_tasks_idx').using(
      'btree',
      table.jobcardNo.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.departmentId],
      foreignColumns: [departments.id],
      name: 'jobcard_tasks_department_id_departments_id_fk',
    }),
    foreignKey({
      columns: [table.jobcardId],
      foreignColumns: [jobcards.id],
      name: 'jobcard_tasks_jobcard_id_jobcards_id_fk',
    }),
  ]
);

export const jobcards = pgTable(
  'jobcards',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    jobcardNo: varchar('jobcard_no', { length: 7 }).notNull(),
    client: varchar().notNull(),
    description: text().notNull(),
    value: numeric().default('0').notNull(),
    closed: boolean().default(false).notNull(),
    jobcardDate: date('jobcard_date').defaultNow().notNull(),
    createdDate: date('created_date').defaultNow().notNull(),
    category: varchar(),
  },
  table => [unique('jobcards_jobcard_no_unique').on(table.jobcardNo)]
);

export const mrqDetails = pgTable(
  'mrq_details',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    headerId: integer('header_id').notNull(),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    requestId: bigint('request_id', { mode: 'number' }).notNull(),
    projectId: uuid('project_id').notNull(),
    itemId: uuid('item_id'),
    unitId: integer('unit_id').notNull(),
    qty: numeric().notNull(),
    remarks: varchar(),
    linked: boolean().default(false).notNull(),
    serviceId: uuid('service_id'),
  },
  table => [
    foreignKey({
      columns: [table.headerId],
      foreignColumns: [mrqHeaders.id],
      name: 'mrq_details_header_id_mrq_headers_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.itemId],
      foreignColumns: [products.id],
      name: 'mrq_details_item_id_products_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'mrq_details_project_id_projects_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.serviceId],
      foreignColumns: [services.id],
      name: 'mrq_details_service_id_services_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.unitId],
      foreignColumns: [uoms.id],
      name: 'mrq_details_unit_id_uoms_id_fk',
    }).onDelete('cascade'),
    unique('mrq_details_request_id_unique').on(table.requestId),
  ]
);

export const odometerReadings = pgTable(
  'odometer_readings',
  {
    id: serial().primaryKey().notNull(),
    readingDate: date('reading_date').defaultNow().notNull(),
    reading: integer().notNull(),
    vehicleId: integer('vehicle_id').notNull(),
    employeeId: integer('employee_id').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'odometer_readings_employee_id_employees_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [motorVehicles.id],
      name: 'odometer_readings_vehicle_id_motor_vehicles_id_fk',
    }).onDelete('cascade'),
  ]
);

export const opportunitiesFiles = pgTable(
  'opportunities_files',
  {
    id: varchar().primaryKey().notNull(),
    name: varchar().notNull(),
    fileUrl: varchar('file_url').notNull(),
    opportunityId: varchar('opportunity_id').notNull(),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'opportunities_files_created_by_users_id_fk',
    }),
    foreignKey({
      columns: [table.opportunityId],
      foreignColumns: [opportunities.id],
      name: 'opportunities_files_opportunity_id_opportunities_id_fk',
    }),
  ]
);

export const notifications = pgTable(
  'notifications',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    title: varchar({ length: 150 }).notNull(),
    message: text().notNull(),
    createdOn: timestamp('created_on', { mode: 'string' })
      .defaultNow()
      .notNull(),
    path: varchar().notNull(),
    addressedTo: uuid('addressed_to').notNull(),
    isRead: boolean('is_read').default(false).notNull(),
    notificationType: varchar('notification_type').notNull(),
    eventId: text('event_id'),
  },
  table => [
    foreignKey({
      columns: [table.addressedTo],
      foreignColumns: [users.id],
      name: 'notifications_addressed_to_users_id_fk',
    }).onDelete('cascade'),
  ]
);

export const opportunities = pgTable(
  'opportunities',
  {
    id: varchar().primaryKey().notNull(),
    name: varchar().notNull(),
    accountId: uuid('account_id').notNull(),
    description: varchar(),
    estimatedValue: numeric('estimated_value'),
    probability: numeric(),
    closeDate: date('close_date'),
    stage: opportunityStageEnum().default('prospecting').notNull(),
    salesRepId: uuid('sales_rep_id').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  table => [
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [saleAccounts.id],
      name: 'opportunities_account_id_sale_accounts_id_fk',
    }),
    foreignKey({
      columns: [table.salesRepId],
      foreignColumns: [users.id],
      name: 'opportunities_sales_rep_id_users_id_fk',
    }),
  ]
);

export const projects = pgTable(
  'projects',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    projectName: varchar('project_name').notNull(),
    active: boolean().default(true),
    createdAt: timestamp('created_at', { mode: 'string' }).defaultNow(),
  },
  table => [
    index('project_name_idx').using(
      'btree',
      table.projectName.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const productCategories = pgTable('product_categories', {
  id: serial().primaryKey().notNull(),
  categoryName: varchar('category_name').notNull(),
  active: boolean().default(true),
});

export const projectComments = pgTable(
  'project_comments',
  {
    id: serial().primaryKey().notNull(),
    projectId: varchar('project_id').notNull(),
    comment: varchar().notNull(),
    postedBy: varchar('posted_by').notNull(),
    postedDate: date('posted_date').defaultNow().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [siteProjects.id],
      name: 'project_comments_project_id_site_projects_id_fk',
    }),
  ]
);

export const projectComponents = pgTable(
  'project_components',
  {
    id: serial().primaryKey().notNull(),
    projectId: varchar('project_id').notNull(),
    description: varchar().notNull(),
    quantity: numeric().default('1').notNull(),
    remarks: varchar(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [siteProjects.id],
      name: 'project_components_project_id_site_projects_id_fk',
    }),
  ]
);

export const projectFinancials = pgTable(
  'project_financials',
  {
    id: serial().primaryKey().notNull(),
    projectId: varchar('project_id').notNull(),
    description: varchar().notNull(),
    rate: numeric().default('1').notNull(),
    quantity: numeric().default('1').notNull(),
    remarks: varchar(),
  },
  table => [
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [siteProjects.id],
      name: 'project_financials_project_id_site_projects_id_fk',
    }),
  ]
);

export const quotationsHeader = pgTable(
  'quotations_header',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    quotationDate: date('quotation_date').notNull(),
    quotationNo: varchar('quotation_no').notNull(),
    accountId: uuid('account_id').notNull(),
    salesRepId: uuid('sales_rep_id').notNull(),
    validityDays: integer('validity_days').default(30).notNull(),
    status: quotationStatusEnum().default('draft').notNull(),
    vatType: vatTypeEnum('vat_type').default('NONE').notNull(),
    vatRate: numeric('vat_rate').default('0').notNull(),
    subTotal: numeric('sub_total').notNull(),
    discounted: numeric().default('0').notNull(),
    vatAmount: numeric('vat_amount').notNull(),
    totalAmount: numeric('total_amount').notNull(),
    notes: varchar(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  table => [
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [saleAccounts.id],
      name: 'quotations_header_account_id_sale_accounts_id_fk',
    }).onDelete('restrict'),
    foreignKey({
      columns: [table.salesRepId],
      foreignColumns: [users.id],
      name: 'quotations_header_sales_rep_id_users_id_fk',
    }).onDelete('restrict'),
  ]
);

export const saleAccounts = pgTable(
  'sale_accounts',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    salutation: salutationEnum(),
    name: varchar().notNull(),
    company: varchar().notNull(),
    title: varchar(),
    email: varchar(),
    phone: varchar(),
    description: varchar(),
    status: leadStatusEnum().default('new').notNull(),
    leadSource: varchar('lead_source'),
    salesRepId: uuid('sales_rep_id').notNull(),
    state: accountStateEnum().default('account').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    kraPin: varchar('kra_pin', { length: 15 }),
  },
  table => [
    foreignKey({
      columns: [table.salesRepId],
      foreignColumns: [users.id],
      name: 'sale_accounts_sales_rep_id_users_id_fk',
    }).onDelete('restrict'),
  ]
);

export const quotationsItems = pgTable(
  'quotations_items',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    quotationId: uuid('quotation_id').notNull(),
    itemName: varchar('item_name').notNull(),
    description: varchar(),
    quantity: numeric().notNull(),
    unitPrice: numeric('unit_price').notNull(),
    discount: numeric().default('0').notNull(),
    totalPrice: numeric('total_price').notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  table => [
    foreignKey({
      columns: [table.quotationId],
      foreignColumns: [quotationsHeader.id],
      name: 'quotations_items_quotation_id_quotations_header_id_fk',
    }).onDelete('cascade'),
  ]
);

export const roles = pgTable('roles', {
  id: serial().primaryKey().notNull(),
  role: varchar().notNull(),
  menuName: varchar('menu_name').notNull(),
  defaultPagePath: varchar('default_page_path', { length: 255 })
    .default('/dashboard')
    .notNull(),
});

export const ordersHeader = pgTable(
  'orders_header',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().notNull(),
    reference: text().notNull(),
    documentDate: date('document_date').notNull(),
    vendorId: uuid('vendor_id').notNull(),
    billNo: varchar('bill_no'),
    mrqId: integer('mrq_id'),
    billDate: date('bill_date'),
    createdBy: uuid('created_by').notNull(),
    createdOn: timestamp('created_on', { mode: 'string' })
      .defaultNow()
      .notNull(),
    isDeleted: boolean('is_deleted').default(false),
    vatType: vatTypeEnum('vat_type').default('NONE').notNull(),
    vatId: integer('vat_id'),
    srnReceipt: boolean('srn_receipt').default(false),
    displayOdometerReadingsOnPrint: boolean(
      'display_odometer_readings_on_print'
    ).default(false),
    vehicleId: integer('vehicle_id'),
    grnReceipt: boolean('grn_receipt').default(false),
    fileUrl: text('file_url'),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'orders_header_created_by_users_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.mrqId],
      foreignColumns: [mrqHeaders.id],
      name: 'orders_header_mrq_id_mrq_headers_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.vatId],
      foreignColumns: [vats.id],
      name: 'orders_header_vat_id_vats_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.vehicleId],
      foreignColumns: [motorVehicles.id],
      name: 'orders_header_vehicle_id_motor_vehicles_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.vendorId],
      foreignColumns: [vendors.id],
      name: 'orders_header_vendor_id_vendors_id_fk',
    }).onDelete('cascade'),
    unique('orders_header_reference_unique').on(table.reference),
  ]
);

export const ordersDetails = pgTable(
  'orders_details',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    headerId: integer('header_id').notNull(),
    projectId: uuid('project_id').notNull(),
    itemId: uuid('item_id'),
    qty: numeric().notNull(),
    rate: numeric().notNull(),
    discountType: discountTypeEnum('discount_type').default('NONE').notNull(),
    discount: numeric().notNull(),
    discountedAmount: numeric('discounted_amount').notNull(),
    vatType: vatTypeEnum('vat_type'),
    vatId: integer('vat_id'),
    amountExclusive: numeric('amount_exclusive').notNull(),
    vat: numeric().notNull(),
    amountInclusive: numeric('amount_inclusive').notNull(),
    received: boolean().default(false),
    serviceId: uuid('service_id'),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    requestId: bigint('request_id', { mode: 'number' }),
  },
  table => [
    foreignKey({
      columns: [table.headerId],
      foreignColumns: [ordersHeader.id],
      name: 'orders_details_header_id_orders_header_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.itemId],
      foreignColumns: [products.id],
      name: 'orders_details_item_id_products_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.projectId],
      foreignColumns: [projects.id],
      name: 'orders_details_project_id_projects_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.serviceId],
      foreignColumns: [services.id],
      name: 'orders_details_service_id_services_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.vatId],
      foreignColumns: [vats.id],
      name: 'orders_details_vat_id_vats_id_fk',
    }).onDelete('cascade'),
  ]
);

export const products = pgTable(
  'products',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    productName: varchar('product_name').notNull(),
    categoryId: integer('category_id').notNull(),
    uomId: integer('uom_id'),
    buyingPrice: numeric('buying_price'),
    active: boolean().default(true),
    stockItem: boolean('stock_item').default(true),
    isPeace: boolean('is_peace').default(false).notNull(),
  },
  table => [
    index('product_name_idx').using(
      'btree',
      table.productName.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.categoryId],
      foreignColumns: [productCategories.id],
      name: 'products_category_id_product_categories_id_fk',
    }),
    foreignKey({
      columns: [table.uomId],
      foreignColumns: [uoms.id],
      name: 'products_uom_id_uoms_id_fk',
    }),
  ]
);

export const previousLostHours = pgTable(
  'previous_lost_hours',
  {
    id: serial().primaryKey().notNull(),
    employeeId: integer('employee_id').notNull(),
    lostHourMonth: integer('lost_hour_month').notNull(),
    lateness: numeric(),
    earlyExit: numeric('early_exit'),
    remarks: text(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'previous_lost_hours_employee_id_employees_id_fk',
    }),
  ]
);

export const salesSupportTickets = pgTable(
  'sales_support_tickets',
  {
    id: varchar().primaryKey().notNull(),
    subject: varchar().notNull(),
    accountId: uuid('account_id').notNull(),
    description: varchar().notNull(),
    caseDate: date('case_date').notNull(),
    status: supportTicketEnum().default('open').notNull(),
    priority: priorityEnum().default('low').notNull(),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  table => [
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [saleAccounts.id],
      name: 'sales_support_tickets_account_id_sale_accounts_id_fk',
    }),
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'sales_support_tickets_created_by_users_id_fk',
    }),
  ]
);

export const session = pgTable(
  'session',
  {
    id: text().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    expiresAt: timestamp('expires_at', {
      withTimezone: true,
      mode: 'string',
    }).notNull(),
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'session_user_id_users_id_fk',
    }).onDelete('cascade'),
  ]
);

export const uoms = pgTable('uoms', {
  id: serial().primaryKey().notNull(),
  uom: varchar().notNull(),
  abbreviation: varchar({ length: 50 }).notNull(),
});

export const srnsHeader = pgTable(
  'srns_header',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().notNull(),
    receiptDate: date('receipt_date').defaultNow().notNull(),
    orderId: integer('order_id'),
    createdBy: uuid('created_by').notNull(),
    createdOn: date('created_on').defaultNow(),
    isDeleted: boolean('is_deleted').default(false),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'srns_header_created_by_users_id_fk',
    }),
    foreignKey({
      columns: [table.orderId],
      foreignColumns: [ordersHeader.id],
      name: 'srns_header_order_id_orders_header_id_fk',
    }),
  ]
);

export const salesOrdersHeader = pgTable(
  'sales_orders_header',
  {
    id: integer().primaryKey().notNull(),
    saleOrderNo: integer('sale_order_no').notNull(),
    dateRaised: date('date_raised').notNull(),
    accountId: uuid('account_id'),
    opportunityId: uuid('opportunity_id'),
    expectedDate: date('expected_date'),
    vatType: vatTypeEnum('vat_type').default('NONE').notNull(),
    vatRate: numeric('vat_rate').default('0').notNull(),
    amountExclusive: numeric('amount_exclusive').notNull(),
    vatAmount: numeric('vat_amount').notNull(),
    amountInclusive: numeric('amount_inclusive').notNull(),
    salesRepId: uuid('sales_rep_id').notNull(),
    display: boolean().default(true).notNull(),
    importRefId: integer('import_ref_id'),
  },
  table => [
    foreignKey({
      columns: [table.accountId],
      foreignColumns: [saleAccounts.id],
      name: 'sales_orders_header_account_id_sale_accounts_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.salesRepId],
      foreignColumns: [users.id],
      name: 'sales_orders_header_sales_rep_id_users_id_fk',
    }).onDelete('restrict'),
  ]
);

export const staffObjectivesHeader = pgTable(
  'staff_objectives_header',
  {
    id: serial().primaryKey().notNull(),
    staffId: integer('staff_id').notNull(),
    yearId: integer('year_id').notNull(),
    approved: boolean().default(false).notNull(),
    approvedBy: uuid('approved_by'),
    approvedDate: date('approved_date'),
    createdOn: timestamp('created_on', { mode: 'string' })
      .defaultNow()
      .notNull(),
  },
  table => [
    foreignKey({
      columns: [table.approvedBy],
      foreignColumns: [users.id],
      name: 'staff_objectives_header_approved_by_users_id_fk',
    }),
    foreignKey({
      columns: [table.staffId],
      foreignColumns: [employees.id],
      name: 'staff_objectives_header_staff_id_employees_id_fk',
    }),
    foreignKey({
      columns: [table.yearId],
      foreignColumns: [calendarYears.id],
      name: 'staff_objectives_header_year_id_calendar_years_id_fk',
    }),
  ]
);

export const services = pgTable('services', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  serviceName: varchar('service_name').notNull(),
  active: boolean().default(true).notNull(),
  serviceFee: integer('service_fee').default(0).notNull(),
});

export const stockMovements = pgTable(
  'stock_movements',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    transactionDate: date('transaction_date').defaultNow().notNull(),
    itemId: uuid('item_id').notNull(),
    qty: numeric().notNull(),
    transactionType: stockMovementTypeEnum('transaction_type').notNull(),
    transactionId: text('transaction_id').notNull(),
    createdBy: uuid('created_by').notNull(),
    createdOn: date('created_on').defaultNow(),
    remarks: text(),
    isDeleted: boolean('is_deleted').default(false),
    storeId: uuid('store_id').references(() => stores.id),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'stock_movements_created_by_users_id_fk',
    }),
    foreignKey({
      columns: [table.itemId],
      foreignColumns: [products.id],
      name: 'stock_movements_item_id_products_id_fk',
    }),
  ]
);

export const tempDebtors = pgTable(
  'temp_debtors',
  {
    id: text().primaryKey().notNull(),
    debtorsName: varchar('debtors_name', { length: 150 }).notNull(),
    email: varchar().notNull(),
    contact: varchar(),
    debtAmount: numeric('debt_amount').notNull(),
  },
  table => [
    unique('temp_debtors_email_unique').on(table.email),
    unique('temp_debtors_contact_unique').on(table.contact),
  ]
);

export const siteProjects = pgTable('site_projects', {
  id: varchar().primaryKey().notNull(),
  client: varchar().notNull(),
  location: varchar().notNull(),
  subject: varchar().notNull(),
  revenueAllocated: numeric('revenue_allocated').default('1').notNull(),
  installationDate: date('installation_date').notNull(),
  timelineAllocated: numeric('timeline_allocated').default('0').notNull(),
});

export const staffLoans = pgTable(
  'staff_loans',
  {
    id: serial().primaryKey().notNull(),
    loanDate: date('loan_date').notNull(),
    employeeId: integer('employee_id'),
    loanAmount: numeric('loan_amount').notNull(),
    loanDuration: integer('loan_duration').notNull(),
    deductableAmount: numeric('deductable_amount').default('0').notNull(),
    reason: text(),
    attachment: text(),
    completed: boolean().default(false).notNull(),
    approvedAmount: numeric('approved_amount').default('0').notNull(),
    approvalDate: date('approval_date'),
    monthySalary: numeric('monthy_salary'),
    loanType: varchar('loan_type').default('existing'),
    loanStatus: leaveStatusEnum('loan_status').default('PENDING').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.employeeId],
      foreignColumns: [employees.id],
      name: 'staff_loans_employee_id_employees_id_fk',
    }),
  ]
);

export const srnsDetails = pgTable(
  'srns_details',
  {
    id: uuid().defaultRandom().notNull(),
    headerId: integer('header_id').notNull(),
    serviceId: uuid('service_id').notNull(),
    qtyOrdered: numeric('qty_ordered').notNull(),
    qtyReceived: numeric('qty_received').notNull(),
    remarks: text(),
  },
  table => [
    foreignKey({
      columns: [table.headerId],
      foreignColumns: [srnsHeader.id],
      name: 'srns_details_header_id_srns_header_id_fk',
    }),
    foreignKey({
      columns: [table.serviceId],
      foreignColumns: [services.id],
      name: 'srns_details_service_id_services_id_fk',
    }),
  ]
);

export const staffObjectivesDetails = pgTable(
  'staff_objectives_details',
  {
    id: text().primaryKey().notNull(),
    headerId: integer('header_id').notNull(),
    kpiId: text('kpi_id').notNull(),
    objective: text().notNull(),
  },
  table => [
    foreignKey({
      columns: [table.headerId],
      foreignColumns: [staffObjectivesHeader.id],
      name: 'staff_objectives_details_header_id_staff_objectives_header_id_f',
    }),
    foreignKey({
      columns: [table.kpiId],
      foreignColumns: [kpis.id],
      name: 'staff_objectives_details_kpi_id_kpis_id_fk',
    }),
  ]
);

export const vats = pgTable('vats', {
  id: serial().primaryKey().notNull(),
  value: integer().notNull(),
  vatName: varchar('vat_name', { length: 20 }).notNull(),
});

export const vendors = pgTable(
  'vendors',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    vendorName: text('vendor_name').notNull(),
    contact: varchar({ length: 20 }),
    kraPin: varchar('kra_pin', { length: 50 }),
    address: text(),
    email: varchar(),
    contactPerson: varchar('contact_person'),
    active: boolean().default(true),
  },
  table => [
    index('vendor_name_idx').using(
      'btree',
      table.vendorName.asc().nullsLast().op('text_ops')
    ),
  ]
);

export const users = pgTable(
  'users',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    name: text().notNull(),
    contact: varchar({ length: 10 }).notNull(),
    password: text().notNull(),
    userType: userRoleEnum('user_type').default('STANDARD USER').notNull(),
    contactVerified: timestamp('contact_verified', { mode: 'string' }),
    email: text(),
    image: text(),
    defaultMenu: varchar('default_menu'),
    active: boolean().default(true).notNull(),
    role: integer(),
    promptPasswordChange: boolean('prompt_password_change').default(false),
    resetToken: text('reset_token'),
    hasAdminPriviledges: boolean('has_admin_priviledges')
      .default(false)
      .notNull(),
  },
  table => [
    uniqueIndex('contact_idx').using(
      'btree',
      table.contact.asc().nullsLast().op('text_ops')
    ),
    index('user_name_idx').using(
      'btree',
      table.name.asc().nullsLast().op('text_ops')
    ),
    foreignKey({
      columns: [table.role],
      foreignColumns: [roles.id],
      name: 'users_role_roles_id_fk',
    }).onDelete('cascade'),
    unique('users_contact_unique').on(table.contact),
    unique('users_email_unique').on(table.email),
  ]
);

export const appraisalDetails = pgTable(
  'appraisal_details',
  {
    id: serial().primaryKey().notNull(),
    headerId: integer('header_id').notNull(),
    kpi: varchar().notNull(),
    objective: text().notNull(),
    staffRating: numeric('staff_rating').notNull(),
    staffRemarks: text('staff_remarks').notNull(),
    supervisorRemarks: text('supervisor_remarks'),
    finalRemarks: text('final_remarks'),
    finalRating: numeric('final_rating'),
    detailType: appraisalDetailTypeEnum('detail_type'),
  },
  table => [
    foreignKey({
      columns: [table.headerId],
      foreignColumns: [appraisalHeader.id],
      name: 'appraisal_details_header_id_appraisal_header_id_fk',
    }),
  ]
);

export const grnsDetails = pgTable(
  'grns_details',
  {
    id: uuid().defaultRandom().notNull(),
    headerId: integer('header_id').notNull(),
    itemId: uuid('item_id').notNull(),
    qty: numeric().notNull(),
    rate: numeric().notNull(),
    remarks: text(),
    orderedQty: numeric('ordered_qty'),
  },
  table => [
    foreignKey({
      columns: [table.headerId],
      foreignColumns: [grnsHeader.id],
      name: 'grns_details_header_id_grns_header_id_fk',
    }),
    foreignKey({
      columns: [table.itemId],
      foreignColumns: [products.id],
      name: 'grns_details_item_id_products_id_fk',
    }),
  ]
);

export const salesOrdersDetails = pgTable(
  'sales_orders_details',
  {
    id: serial().primaryKey().notNull(),
    headerId: integer('header_id').notNull(),
    item: varchar().notNull(),
    qty: numeric().notNull(),
    rate: numeric().notNull(),
    amount: numeric().notNull(),
    category: varchar(),
  },
  table => [
    foreignKey({
      columns: [table.headerId],
      foreignColumns: [salesOrdersHeader.id],
      name: 'sales_orders_details_header_id_sales_orders_header_id_fk',
    }).onDelete('cascade'),
  ]
);

export const mrqHeaders = pgTable(
  'mrq_headers',
  {
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    id: bigint({ mode: 'number' }).primaryKey().notNull(),
    reference: text().notNull(),
    documentDate: timestamp('document_date', { mode: 'string' }).notNull(),
    linked: boolean().default(false).notNull(),
    createdBy: uuid('created_by').notNull(),
    createdOn: timestamp('created_on', { mode: 'string' })
      .defaultNow()
      .notNull(),
    isDeleted: boolean('is_deleted').default(false).notNull(),
    fileUrl: text('file_url'),
  },
  table => [
    foreignKey({
      columns: [table.createdBy],
      foreignColumns: [users.id],
      name: 'mrq_headers_created_by_users_id_fk',
    }).onDelete('cascade'),
  ]
);

export const loginAttempts = pgTable('login_attempts', {
  id: uuid().defaultRandom().primaryKey().notNull(),
  userName: text('user_name').notNull(),
  timestamp: timestamp({ mode: 'string' }).defaultNow().notNull(),
  success: text().notNull(),
  ipAddress: text('ip_address').notNull(),
});

export const sessions = pgTable(
  'sessions',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    userId: uuid('user_id').notNull(),
    expiresAt: timestamp('expires_at', { mode: 'string' }).notNull(),
    createdAt: timestamp('created_at', { mode: 'string' })
      .defaultNow()
      .notNull(),
    userAgent: text('user_agent'),
    ipAddress: text('ip_address'),
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'sessions_user_id_users_id_fk',
    }),
  ]
);

export const disciplinaryCasesDocuments = pgTable(
  'disciplinary_cases_documents',
  {
    caseId: text('case_id').notNull(),
    uploadedUrl: text('uploaded_url').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.caseId],
      foreignColumns: [disciplinaryCases.id],
      name: 'disciplinary_cases_documents_case_id_disciplinary_cases_id_fk',
    }),
    primaryKey({
      columns: [table.caseId, table.uploadedUrl],
      name: 'disciplinary_cases_documents_case_id_uploaded_url_pk',
    }),
  ]
);

export const disciplinaryCasesPersonnel = pgTable(
  'disciplinary_cases_personnel',
  {
    staffId: integer('staff_id').notNull(),
    caseId: text('case_id').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.caseId],
      foreignColumns: [disciplinaryCases.id],
      name: 'disciplinary_cases_personnel_case_id_disciplinary_cases_id_fk',
    }),
    foreignKey({
      columns: [table.staffId],
      foreignColumns: [employees.id],
      name: 'disciplinary_cases_personnel_staff_id_employees_id_fk',
    }),
    primaryKey({
      columns: [table.staffId, table.caseId],
      name: 'disciplinary_cases_personnel_case_id_staff_id_pk',
    }),
  ]
);

export const healthSafetyDocuments = pgTable(
  'health_safety_documents',
  {
    caseId: text('case_id').notNull(),
    uploadedUrl: text('uploaded_url').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.caseId],
      foreignColumns: [healthSafety.id],
      name: 'health_safety_documents_case_id_health_safety_id_fk',
    }),
    primaryKey({
      columns: [table.caseId, table.uploadedUrl],
      name: 'health_safety_documents_case_id_uploaded_url_pk',
    }),
  ]
);

export const userRoles = pgTable(
  'user_roles',
  {
    userId: uuid('user_id').notNull(),
    roleId: integer('role_id').notNull(),
  },
  table => [
    foreignKey({
      columns: [table.roleId],
      foreignColumns: [roles.id],
      name: 'user_roles_role_id_roles_id_fk',
    }).onDelete('cascade'),
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'user_roles_user_id_users_id_fk',
    }).onDelete('cascade'),
    primaryKey({
      columns: [table.userId, table.roleId],
      name: 'user_roles_role_id_user_id_pk',
    }),
  ]
);

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text().notNull(),
    token: text().notNull(),
    expires: timestamp({ mode: 'string' }).notNull(),
  },
  table => [
    primaryKey({
      columns: [table.identifier, table.token],
      name: 'verification_tokens_identifier_token_pk',
    }),
  ]
);

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id').notNull(),
    type: text().notNull(),
    provider: text().notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text(),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  table => [
    foreignKey({
      columns: [table.userId],
      foreignColumns: [users.id],
      name: 'accounts_user_id_users_id_fk',
    }).onDelete('cascade'),
    primaryKey({
      columns: [table.provider, table.providerAccountId],
      name: 'accounts_provider_provider_account_id_pk',
    }),
  ]
);

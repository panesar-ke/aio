import { relations } from 'drizzle-orm/relations';
import {
  users,
  appraisalHeader,
  employees,
  calendarYears,
  contractExtensions,
  products,
  conversions,
  employeeQualifications,
  employeeUsers,
  employeeSession,
  employeeTerminations,
  employeeCertifications,
  departments,
  designations,
  employeesNoks,
  employeesOtherdetails,
  grnsHeader,
  ordersHeader,
  vendors,
  healthSafety,
  jobcardStaffs,
  jobcardTasks,
  employeesChildren,
  counties,
  employeesContacts,
  kpis,
  jobcardTimes,
  leaveApplications,
  leaveTypes,
  loanDeductions,
  staffLoans,
  materialIssuesHeader,
  jobcards,
  mrqHeaders,
  mrqDetails,
  projects,
  services,
  uoms,
  odometerReadings,
  motorVehicles,
  opportunitiesFiles,
  opportunities,
  notifications,
  saleAccounts,
  siteProjects,
  projectComments,
  projectComponents,
  projectFinancials,
  quotationsHeader,
  quotationsItems,
  vats,
  ordersDetails,
  productCategories,
  previousLostHours,
  salesSupportTickets,
  session,
  srnsHeader,
  salesOrdersHeader,
  staffObjectivesHeader,
  stockMovements,
  srnsDetails,
  staffObjectivesDetails,
  roles,
  appraisalDetails,
  grnsDetails,
  salesOrdersDetails,
  sessions,
  disciplinaryCases,
  disciplinaryCasesDocuments,
  disciplinaryCasesPersonnel,
  healthSafetyDocuments,
  userRoles,
  accounts,
} from './schema';

export const appraisalHeaderRelations = relations(
  appraisalHeader,
  ({ one, many }) => ({
    user: one(users, {
      fields: [appraisalHeader.createdBy],
      references: [users.id],
    }),
    employee: one(employees, {
      fields: [appraisalHeader.staffId],
      references: [employees.id],
    }),
    calendarYear: one(calendarYears, {
      fields: [appraisalHeader.yearId],
      references: [calendarYears.id],
    }),
    appraisalDetails: many(appraisalDetails),
  })
);

export const usersRelations = relations(users, ({ one, many }) => ({
  appraisalHeaders: many(appraisalHeader),
  contractExtensions: many(contractExtensions),
  grnsHeaders: many(grnsHeader),
  leaveApplications_approvedBy: many(leaveApplications, {
    relationName: 'leaveApplications_approvedBy_users_id',
  }),
  leaveApplications_authorizedBy: many(leaveApplications, {
    relationName: 'leaveApplications_authorizedBy_users_id',
  }),
  loanDeductions: many(loanDeductions),
  materialIssuesHeaders: many(materialIssuesHeader),
  opportunitiesFiles: many(opportunitiesFiles),
  notifications: many(notifications),
  opportunities: many(opportunities),
  quotationsHeaders: many(quotationsHeader),
  saleAccounts: many(saleAccounts),
  ordersHeaders: many(ordersHeader),
  salesSupportTickets: many(salesSupportTickets),
  sessions_userId: many(session),
  srnsHeaders: many(srnsHeader),
  salesOrdersHeaders: many(salesOrdersHeader),
  staffObjectivesHeaders: many(staffObjectivesHeader),
  stockMovements: many(stockMovements),
  role: one(roles, {
    fields: [users.role],
    references: [roles.id],
  }),
  mrqHeaders: many(mrqHeaders),
  sessionsUserId: many(sessions),
  userRoles: many(userRoles),
  accounts: many(accounts),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  appraisalHeaders: many(appraisalHeader),
  contractExtensions: many(contractExtensions),
  employeeQualifications: many(employeeQualifications),
  employeeTerminations: many(employeeTerminations),
  employeeCertifications: many(employeeCertifications),
  department: one(departments, {
    fields: [employees.department],
    references: [departments.id],
  }),
  designation: one(designations, {
    fields: [employees.designation],
    references: [designations.id],
  }),
  employeesNoks: many(employeesNoks),
  employeesOtherdetails: many(employeesOtherdetails),
  healthSafeties: many(healthSafety),
  jobcardStaffs: many(jobcardStaffs),
  employeesChildren: many(employeesChildren),
  employeesContacts: many(employeesContacts),
  leaveApplications: many(leaveApplications),
  odometerReadings: many(odometerReadings),
  previousLostHours: many(previousLostHours),
  staffObjectivesHeaders: many(staffObjectivesHeader),
  staffLoans: many(staffLoans),
  disciplinaryCasesPersonnels: many(disciplinaryCasesPersonnel),
}));

export const calendarYearsRelations = relations(calendarYears, ({ many }) => ({
  appraisalHeaders: many(appraisalHeader),
  staffObjectivesHeaders: many(staffObjectivesHeader),
}));

export const contractExtensionsRelations = relations(
  contractExtensions,
  ({ one }) => ({
    user: one(users, {
      fields: [contractExtensions.createdBy],
      references: [users.id],
    }),
    employee: one(employees, {
      fields: [contractExtensions.employeeId],
      references: [employees.id],
    }),
  })
);

export const conversionsRelations = relations(conversions, ({ one }) => ({
  product_convertedItem: one(products, {
    fields: [conversions.convertedItem],
    references: [products.id],
    relationName: 'conversions_convertedItem_products_id',
  }),
  product_convertingItem: one(products, {
    fields: [conversions.convertingItem],
    references: [products.id],
    relationName: 'conversions_convertingItem_products_id',
  }),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  conversions_convertedItem: many(conversions, {
    relationName: 'conversions_convertedItem_products_id',
  }),
  conversions_convertingItem: many(conversions, {
    relationName: 'conversions_convertingItem_products_id',
  }),
  mrqDetails: many(mrqDetails),
  ordersDetails: many(ordersDetails),
  productCategory: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  uom: one(uoms, {
    fields: [products.uomId],
    references: [uoms.id],
  }),
  stockMovements: many(stockMovements),
  grnsDetails: many(grnsDetails),
}));

export const employeeQualificationsRelations = relations(
  employeeQualifications,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeQualifications.employeeId],
      references: [employees.id],
    }),
  })
);

export const employeeSessionRelations = relations(
  employeeSession,
  ({ one }) => ({
    employeeUser: one(employeeUsers, {
      fields: [employeeSession.userId],
      references: [employeeUsers.id],
    }),
  })
);

export const employeeUsersRelations = relations(employeeUsers, ({ many }) => ({
  employeeSessions: many(employeeSession),
}));

export const employeeTerminationsRelations = relations(
  employeeTerminations,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeTerminations.employeeId],
      references: [employees.id],
    }),
  })
);

export const employeeCertificationsRelations = relations(
  employeeCertifications,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeeCertifications.employeeId],
      references: [employees.id],
    }),
  })
);

export const departmentsRelations = relations(departments, ({ many }) => ({
  employees: many(employees),
  healthSafeties: many(healthSafety),
  jobcardTasks: many(jobcardTasks),
}));

export const designationsRelations = relations(designations, ({ many }) => ({
  employees: many(employees),
  kpis: many(kpis),
}));

export const employeesNoksRelations = relations(employeesNoks, ({ one }) => ({
  employee: one(employees, {
    fields: [employeesNoks.employeeId],
    references: [employees.id],
  }),
}));

export const employeesOtherdetailsRelations = relations(
  employeesOtherdetails,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeesOtherdetails.employeeId],
      references: [employees.id],
    }),
  })
);

export const grnsHeaderRelations = relations(grnsHeader, ({ one, many }) => ({
  user: one(users, {
    fields: [grnsHeader.createdBy],
    references: [users.id],
  }),
  ordersHeader: one(ordersHeader, {
    fields: [grnsHeader.orderId],
    references: [ordersHeader.id],
  }),
  vendor: one(vendors, {
    fields: [grnsHeader.vendorId],
    references: [vendors.id],
  }),
  grnsDetails: many(grnsDetails),
}));

export const ordersHeaderRelations = relations(
  ordersHeader,
  ({ one, many }) => ({
    grnsHeaders: many(grnsHeader),
    user: one(users, {
      fields: [ordersHeader.createdBy],
      references: [users.id],
    }),
    mrqHeader: one(mrqHeaders, {
      fields: [ordersHeader.mrqId],
      references: [mrqHeaders.id],
    }),
    vat: one(vats, {
      fields: [ordersHeader.vatId],
      references: [vats.id],
    }),
    motorVehicle: one(motorVehicles, {
      fields: [ordersHeader.vehicleId],
      references: [motorVehicles.id],
    }),
    vendor: one(vendors, {
      fields: [ordersHeader.vendorId],
      references: [vendors.id],
    }),
    ordersDetails: many(ordersDetails),
    srnsHeaders: many(srnsHeader),
  })
);

export const vendorsRelations = relations(vendors, ({ many }) => ({
  grnsHeaders: many(grnsHeader),
  ordersHeaders: many(ordersHeader),
}));

export const healthSafetyRelations = relations(
  healthSafety,
  ({ one, many }) => ({
    department: one(departments, {
      fields: [healthSafety.departmentId],
      references: [departments.id],
    }),
    employee: one(employees, {
      fields: [healthSafety.employeeId],
      references: [employees.id],
    }),
    healthSafetyDocuments: many(healthSafetyDocuments),
  })
);

export const jobcardStaffsRelations = relations(jobcardStaffs, ({ one }) => ({
  employee: one(employees, {
    fields: [jobcardStaffs.staffId],
    references: [employees.id],
  }),
  jobcardTask: one(jobcardTasks, {
    fields: [jobcardStaffs.taskId],
    references: [jobcardTasks.id],
  }),
}));

export const jobcardTasksRelations = relations(
  jobcardTasks,
  ({ one, many }) => ({
    jobcardStaffs: many(jobcardStaffs),
    jobcardTimes: many(jobcardTimes),
    department: one(departments, {
      fields: [jobcardTasks.departmentId],
      references: [departments.id],
    }),
    jobcard: one(jobcards, {
      fields: [jobcardTasks.jobcardId],
      references: [jobcards.id],
    }),
  })
);

export const employeesChildrenRelations = relations(
  employeesChildren,
  ({ one }) => ({
    employee: one(employees, {
      fields: [employeesChildren.employeeId],
      references: [employees.id],
    }),
  })
);

export const employeesContactsRelations = relations(
  employeesContacts,
  ({ one }) => ({
    county: one(counties, {
      fields: [employeesContacts.countyId],
      references: [counties.id],
    }),
    employee: one(employees, {
      fields: [employeesContacts.employeeId],
      references: [employees.id],
    }),
  })
);

export const countiesRelations = relations(counties, ({ many }) => ({
  employeesContacts: many(employeesContacts),
}));

export const kpisRelations = relations(kpis, ({ one, many }) => ({
  designation: one(designations, {
    fields: [kpis.designationId],
    references: [designations.id],
  }),
  staffObjectivesDetails: many(staffObjectivesDetails),
}));

export const jobcardTimesRelations = relations(jobcardTimes, ({ one }) => ({
  jobcardTask: one(jobcardTasks, {
    fields: [jobcardTimes.taskId],
    references: [jobcardTasks.id],
  }),
}));

export const leaveApplicationsRelations = relations(
  leaveApplications,
  ({ one }) => ({
    user_approvedBy: one(users, {
      fields: [leaveApplications.approvedBy],
      references: [users.id],
      relationName: 'leaveApplications_approvedBy_users_id',
    }),
    user_authorizedBy: one(users, {
      fields: [leaveApplications.authorizedBy],
      references: [users.id],
      relationName: 'leaveApplications_authorizedBy_users_id',
    }),
    employee: one(employees, {
      fields: [leaveApplications.employeeId],
      references: [employees.id],
    }),
    leaveType: one(leaveTypes, {
      fields: [leaveApplications.leaveTypeId],
      references: [leaveTypes.id],
    }),
  })
);

export const leaveTypesRelations = relations(leaveTypes, ({ many }) => ({
  leaveApplications: many(leaveApplications),
}));

export const loanDeductionsRelations = relations(loanDeductions, ({ one }) => ({
  user: one(users, {
    fields: [loanDeductions.createdBy],
    references: [users.id],
  }),
  staffLoan: one(staffLoans, {
    fields: [loanDeductions.loanId],
    references: [staffLoans.id],
  }),
}));

export const staffLoansRelations = relations(staffLoans, ({ one, many }) => ({
  loanDeductions: many(loanDeductions),
  employee: one(employees, {
    fields: [staffLoans.employeeId],
    references: [employees.id],
  }),
}));

export const materialIssuesHeaderRelations = relations(
  materialIssuesHeader,
  ({ one }) => ({
    user: one(users, {
      fields: [materialIssuesHeader.issuedBy],
      references: [users.id],
    }),
  })
);

export const jobcardsRelations = relations(jobcards, ({ many }) => ({
  jobcardTasks: many(jobcardTasks),
}));

export const mrqDetailsRelations = relations(mrqDetails, ({ one }) => ({
  mrqHeader: one(mrqHeaders, {
    fields: [mrqDetails.headerId],
    references: [mrqHeaders.id],
  }),
  product: one(products, {
    fields: [mrqDetails.itemId],
    references: [products.id],
  }),
  project: one(projects, {
    fields: [mrqDetails.projectId],
    references: [projects.id],
  }),
  service: one(services, {
    fields: [mrqDetails.serviceId],
    references: [services.id],
  }),
  uom: one(uoms, {
    fields: [mrqDetails.unitId],
    references: [uoms.id],
  }),
}));

export const mrqHeadersRelations = relations(mrqHeaders, ({ one, many }) => ({
  mrqDetails: many(mrqDetails),
  ordersHeaders: many(ordersHeader),
  user: one(users, {
    fields: [mrqHeaders.createdBy],
    references: [users.id],
  }),
}));

export const projectsRelations = relations(projects, ({ many }) => ({
  mrqDetails: many(mrqDetails),
  ordersDetails: many(ordersDetails),
}));

export const servicesRelations = relations(services, ({ many }) => ({
  mrqDetails: many(mrqDetails),
  ordersDetails: many(ordersDetails),
  srnsDetails: many(srnsDetails),
}));

export const uomsRelations = relations(uoms, ({ many }) => ({
  mrqDetails: many(mrqDetails),
  products: many(products),
}));

export const odometerReadingsRelations = relations(
  odometerReadings,
  ({ one }) => ({
    employee: one(employees, {
      fields: [odometerReadings.employeeId],
      references: [employees.id],
    }),
    motorVehicle: one(motorVehicles, {
      fields: [odometerReadings.vehicleId],
      references: [motorVehicles.id],
    }),
  })
);

export const motorVehiclesRelations = relations(motorVehicles, ({ many }) => ({
  odometerReadings: many(odometerReadings),
  ordersHeaders: many(ordersHeader),
}));

export const opportunitiesFilesRelations = relations(
  opportunitiesFiles,
  ({ one }) => ({
    user: one(users, {
      fields: [opportunitiesFiles.createdBy],
      references: [users.id],
    }),
    opportunity: one(opportunities, {
      fields: [opportunitiesFiles.opportunityId],
      references: [opportunities.id],
    }),
  })
);

export const opportunitiesRelations = relations(
  opportunities,
  ({ one, many }) => ({
    opportunitiesFiles: many(opportunitiesFiles),
    saleAccount: one(saleAccounts, {
      fields: [opportunities.accountId],
      references: [saleAccounts.id],
    }),
    user: one(users, {
      fields: [opportunities.salesRepId],
      references: [users.id],
    }),
  })
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.addressedTo],
    references: [users.id],
  }),
}));

export const saleAccountsRelations = relations(
  saleAccounts,
  ({ one, many }) => ({
    opportunities: many(opportunities),
    quotationsHeaders: many(quotationsHeader),
    user: one(users, {
      fields: [saleAccounts.salesRepId],
      references: [users.id],
    }),
    salesSupportTickets: many(salesSupportTickets),
    salesOrdersHeaders: many(salesOrdersHeader),
  })
);

export const projectCommentsRelations = relations(
  projectComments,
  ({ one }) => ({
    siteProject: one(siteProjects, {
      fields: [projectComments.projectId],
      references: [siteProjects.id],
    }),
  })
);

export const siteProjectsRelations = relations(siteProjects, ({ many }) => ({
  projectComments: many(projectComments),
  projectComponents: many(projectComponents),
  projectFinancials: many(projectFinancials),
}));

export const projectComponentsRelations = relations(
  projectComponents,
  ({ one }) => ({
    siteProject: one(siteProjects, {
      fields: [projectComponents.projectId],
      references: [siteProjects.id],
    }),
  })
);

export const projectFinancialsRelations = relations(
  projectFinancials,
  ({ one }) => ({
    siteProject: one(siteProjects, {
      fields: [projectFinancials.projectId],
      references: [siteProjects.id],
    }),
  })
);

export const quotationsHeaderRelations = relations(
  quotationsHeader,
  ({ one, many }) => ({
    saleAccount: one(saleAccounts, {
      fields: [quotationsHeader.accountId],
      references: [saleAccounts.id],
    }),
    user: one(users, {
      fields: [quotationsHeader.salesRepId],
      references: [users.id],
    }),
    quotationsItems: many(quotationsItems),
  })
);

export const quotationsItemsRelations = relations(
  quotationsItems,
  ({ one }) => ({
    quotationsHeader: one(quotationsHeader, {
      fields: [quotationsItems.quotationId],
      references: [quotationsHeader.id],
    }),
  })
);

export const vatsRelations = relations(vats, ({ many }) => ({
  ordersHeaders: many(ordersHeader),
  ordersDetails: many(ordersDetails),
}));

export const ordersDetailsRelations = relations(ordersDetails, ({ one }) => ({
  ordersHeader: one(ordersHeader, {
    fields: [ordersDetails.headerId],
    references: [ordersHeader.id],
  }),
  product: one(products, {
    fields: [ordersDetails.itemId],
    references: [products.id],
  }),
  project: one(projects, {
    fields: [ordersDetails.projectId],
    references: [projects.id],
  }),
  service: one(services, {
    fields: [ordersDetails.serviceId],
    references: [services.id],
  }),
  vat: one(vats, {
    fields: [ordersDetails.vatId],
    references: [vats.id],
  }),
}));

export const productCategoriesRelations = relations(
  productCategories,
  ({ many }) => ({
    products: many(products),
  })
);

export const previousLostHoursRelations = relations(
  previousLostHours,
  ({ one }) => ({
    employee: one(employees, {
      fields: [previousLostHours.employeeId],
      references: [employees.id],
    }),
  })
);

export const salesSupportTicketsRelations = relations(
  salesSupportTickets,
  ({ one }) => ({
    saleAccount: one(saleAccounts, {
      fields: [salesSupportTickets.accountId],
      references: [saleAccounts.id],
    }),
    user: one(users, {
      fields: [salesSupportTickets.createdBy],
      references: [users.id],
    }),
  })
);

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(users, {
    fields: [session.userId],
    references: [users.id],
  }),
}));

export const srnsHeaderRelations = relations(srnsHeader, ({ one, many }) => ({
  user: one(users, {
    fields: [srnsHeader.createdBy],
    references: [users.id],
  }),
  ordersHeader: one(ordersHeader, {
    fields: [srnsHeader.orderId],
    references: [ordersHeader.id],
  }),
  srnsDetails: many(srnsDetails),
}));

export const salesOrdersHeaderRelations = relations(
  salesOrdersHeader,
  ({ one, many }) => ({
    saleAccount: one(saleAccounts, {
      fields: [salesOrdersHeader.accountId],
      references: [saleAccounts.id],
    }),
    user: one(users, {
      fields: [salesOrdersHeader.salesRepId],
      references: [users.id],
    }),
    salesOrdersDetails: many(salesOrdersDetails),
  })
);

export const staffObjectivesHeaderRelations = relations(
  staffObjectivesHeader,
  ({ one, many }) => ({
    user: one(users, {
      fields: [staffObjectivesHeader.approvedBy],
      references: [users.id],
    }),
    employee: one(employees, {
      fields: [staffObjectivesHeader.staffId],
      references: [employees.id],
    }),
    calendarYear: one(calendarYears, {
      fields: [staffObjectivesHeader.yearId],
      references: [calendarYears.id],
    }),
    staffObjectivesDetails: many(staffObjectivesDetails),
  })
);

export const stockMovementsRelations = relations(stockMovements, ({ one }) => ({
  user: one(users, {
    fields: [stockMovements.createdBy],
    references: [users.id],
  }),
  product: one(products, {
    fields: [stockMovements.itemId],
    references: [products.id],
  }),
}));

export const srnsDetailsRelations = relations(srnsDetails, ({ one }) => ({
  srnsHeader: one(srnsHeader, {
    fields: [srnsDetails.headerId],
    references: [srnsHeader.id],
  }),
  service: one(services, {
    fields: [srnsDetails.serviceId],
    references: [services.id],
  }),
}));

export const staffObjectivesDetailsRelations = relations(
  staffObjectivesDetails,
  ({ one }) => ({
    staffObjectivesHeader: one(staffObjectivesHeader, {
      fields: [staffObjectivesDetails.headerId],
      references: [staffObjectivesHeader.id],
    }),
    kpi: one(kpis, {
      fields: [staffObjectivesDetails.kpiId],
      references: [kpis.id],
    }),
  })
);

export const rolesRelations = relations(roles, ({ many }) => ({
  users: many(users),
  userRoles: many(userRoles),
}));

export const appraisalDetailsRelations = relations(
  appraisalDetails,
  ({ one }) => ({
    appraisalHeader: one(appraisalHeader, {
      fields: [appraisalDetails.headerId],
      references: [appraisalHeader.id],
    }),
  })
);

export const grnsDetailsRelations = relations(grnsDetails, ({ one }) => ({
  grnsHeader: one(grnsHeader, {
    fields: [grnsDetails.headerId],
    references: [grnsHeader.id],
  }),
  product: one(products, {
    fields: [grnsDetails.itemId],
    references: [products.id],
  }),
}));

export const salesOrdersDetailsRelations = relations(
  salesOrdersDetails,
  ({ one }) => ({
    salesOrdersHeader: one(salesOrdersHeader, {
      fields: [salesOrdersDetails.headerId],
      references: [salesOrdersHeader.id],
    }),
  })
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const disciplinaryCasesDocumentsRelations = relations(
  disciplinaryCasesDocuments,
  ({ one }) => ({
    disciplinaryCase: one(disciplinaryCases, {
      fields: [disciplinaryCasesDocuments.caseId],
      references: [disciplinaryCases.id],
    }),
  })
);

export const disciplinaryCasesRelations = relations(
  disciplinaryCases,
  ({ many }) => ({
    disciplinaryCasesDocuments: many(disciplinaryCasesDocuments),
    disciplinaryCasesPersonnels: many(disciplinaryCasesPersonnel),
  })
);

export const disciplinaryCasesPersonnelRelations = relations(
  disciplinaryCasesPersonnel,
  ({ one }) => ({
    disciplinaryCase: one(disciplinaryCases, {
      fields: [disciplinaryCasesPersonnel.caseId],
      references: [disciplinaryCases.id],
    }),
    employee: one(employees, {
      fields: [disciplinaryCasesPersonnel.staffId],
      references: [employees.id],
    }),
  })
);

export const healthSafetyDocumentsRelations = relations(
  healthSafetyDocuments,
  ({ one }) => ({
    healthSafety: one(healthSafety, {
      fields: [healthSafetyDocuments.caseId],
      references: [healthSafety.id],
    }),
  })
);

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
  user: one(users, {
    fields: [userRoles.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

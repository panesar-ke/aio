import { addDays, subDays } from 'date-fns';
import { and, asc, count, desc, eq, gte, lte, ne, sql } from 'drizzle-orm';

import db from '@/drizzle/db';
import {
  departments,
  itAssetAssignments,
  itAssetCategories,
  itAssets,
  users,
} from '@/drizzle/schema';
import { dateFormat } from '@/lib/helpers/formatters';
import { requireAnyPermission } from '@/lib/permissions/guards';

export interface ITAssetsDashboardStats {
  kpis: {
    totalAssets: number;
    assignedAssets: number;
    unassignedAssets: number;
    inRepairAssets: number;
    retiredOrDisposedAssets: number;
    utilizationRate: number;
    portfolioCost: number;
    averageAssetCost: number;
    uncostedAssets: number;
  };
  breakdowns: {
    status: Array<{ label: string; count: number }>;
    condition: Array<{ label: string; count: number }>;
    costByCategory: Array<{ label: string; totalCost: number; assetCount: number }>;
    costByDepartment: Array<{
      label: string;
      totalCost: number;
      assetCount: number;
    }>;
  };
  trends: {
    assignmentActivity: Array<{
      date: string;
      assigned: number;
      returned: number;
    }>;
  };
  attentionItems: {
    warrantyExpiringSoon: Array<{
      id: string;
      name: string;
      category: string;
      department: string;
      warrantyExpiryDate: string;
      daysRemaining: number;
      status: string;
    }>;
    recentAssignments: Array<{
      id: string;
      assetName: string;
      userName: string;
      assignedDate: string;
      returnedDate: string | null;
    }>;
  };
  lastUpdated: string;
}

export async function getITAssetsDashboardStats(): Promise<ITAssetsDashboardStats> {
  await requireAnyPermission(['it:admin', 'it:standard'], { mode: 'page' });

  const today = new Date();
  const todayStr = dateFormat(today);
  const inSixtyDaysStr = dateFormat(addDays(today, 60));
  const trendStartDate = subDays(today, 29);
  const trendStartDateStr = dateFormat(trendStartDate);

  const [
    kpiRows,
    statusRows,
    conditionRows,
    costByCategoryRows,
    costByDepartmentRows,
    assignedTrendRows,
    returnedTrendRows,
    warrantyRows,
    recentAssignmentRows,
  ] = await Promise.all([
    db
      .select({
        totalAssets: count(itAssets.id),
        assignedAssets:
          sql<number>`sum(case when ${itAssets.status} = 'assigned' then 1 else 0 end)`,
        inRepairAssets:
          sql<number>`sum(case when ${itAssets.status} = 'in_repair' then 1 else 0 end)`,
        retiredOrDisposedAssets:
          sql<number>`sum(case when ${itAssets.status} in ('retired', 'disposed') then 1 else 0 end)`,
        portfolioCost:
          sql<number>`coalesce(sum(case when ${itAssets.purchaseCost} is not null then ${itAssets.purchaseCost} else 0 end), 0)`,
        averageAssetCost:
          sql<number>`coalesce(avg(case when ${itAssets.purchaseCost} is not null then ${itAssets.purchaseCost} end), 0)`,
        uncostedAssets:
          sql<number>`sum(case when ${itAssets.purchaseCost} is null then 1 else 0 end)`,
      })
      .from(itAssets),
    db
      .select({
        label: sql<string>`${itAssets.status}::text`,
        count: count(itAssets.id),
      })
      .from(itAssets)
      .groupBy(itAssets.status),
    db
      .select({
        label: sql<string>`${itAssets.condition}::text`,
        count: count(itAssets.id),
      })
      .from(itAssets)
      .groupBy(itAssets.condition),
    db
      .select({
        label: sql<string>`coalesce(${itAssetCategories.name}, 'UNKNOWN')`,
        totalCost: sql<number>`coalesce(sum(${itAssets.purchaseCost}), 0)`,
        assetCount: count(itAssets.id),
      })
      .from(itAssets)
      .leftJoin(itAssetCategories, eq(itAssetCategories.id, itAssets.categoryId))
      .groupBy(itAssetCategories.name)
      .orderBy(desc(sql`coalesce(sum(${itAssets.purchaseCost}), 0)`)),
    db
      .select({
        label: sql<string>`coalesce(${departments.departmentName}, 'UNASSIGNED')`,
        totalCost: sql<number>`coalesce(sum(${itAssets.purchaseCost}), 0)`,
        assetCount: count(itAssets.id),
      })
      .from(itAssets)
      .leftJoin(departments, eq(departments.id, itAssets.departmentId))
      .groupBy(departments.departmentName)
      .orderBy(desc(sql`coalesce(sum(${itAssets.purchaseCost}), 0)`)),
    db
      .select({
        date: itAssetAssignments.assignedDate,
        count: count(itAssetAssignments.id),
      })
      .from(itAssetAssignments)
      .where(
        and(
          gte(itAssetAssignments.assignedDate, trendStartDateStr),
          lte(itAssetAssignments.assignedDate, todayStr),
        ),
      )
      .groupBy(itAssetAssignments.assignedDate),
    db
      .select({
        date: itAssetAssignments.returnedDate,
        count: count(itAssetAssignments.id),
      })
      .from(itAssetAssignments)
      .where(
        and(
          gte(itAssetAssignments.returnedDate, trendStartDateStr),
          lte(itAssetAssignments.returnedDate, todayStr),
        ),
      )
      .groupBy(itAssetAssignments.returnedDate),
    db
      .select({
        id: itAssets.id,
        name: itAssets.name,
        category: sql<string>`coalesce(${itAssetCategories.name}, 'UNKNOWN')`,
        department: sql<string>`coalesce(${departments.departmentName}, 'UNASSIGNED')`,
        warrantyExpiryDate: itAssets.warrantyExpiryDate,
        status: sql<string>`${itAssets.status}::text`,
      })
      .from(itAssets)
      .leftJoin(itAssetCategories, eq(itAssetCategories.id, itAssets.categoryId))
      .leftJoin(departments, eq(departments.id, itAssets.departmentId))
      .where(
        and(
          gte(itAssets.warrantyExpiryDate, todayStr),
          lte(itAssets.warrantyExpiryDate, inSixtyDaysStr),
          ne(itAssets.status, 'retired'),
          ne(itAssets.status, 'disposed'),
        ),
      )
      .orderBy(asc(itAssets.warrantyExpiryDate))
      .limit(10),
    db
      .select({
        id: itAssetAssignments.id,
        assetName: itAssets.name,
        userName: sql<string>`coalesce(${users.name}, 'UNASSIGNED')`,
        assignedDate: itAssetAssignments.assignedDate,
        returnedDate: itAssetAssignments.returnedDate,
      })
      .from(itAssetAssignments)
      .innerJoin(itAssets, eq(itAssets.id, itAssetAssignments.assetId))
      .leftJoin(users, eq(users.id, itAssetAssignments.userId))
      .orderBy(desc(itAssetAssignments.assignedDate))
      .limit(10),
  ]);

  const kpi = kpiRows[0];
  const totalAssets = Number(kpi?.totalAssets) || 0;
  const assignedAssets = Number(kpi?.assignedAssets) || 0;
  const utilizationRate =
    totalAssets > 0 ? (assignedAssets / totalAssets) * 100 : 0;

  const assignedByDate = new Map(
    assignedTrendRows.map(row => [row.date, Number(row.count) || 0]),
  );
  const returnedByDate = new Map(
    returnedTrendRows.map(row => [row.date, Number(row.count) || 0]),
  );

  const assignmentActivity = Array.from({ length: 30 }, (_, index) => {
    const date = dateFormat(addDays(trendStartDate, index));
    return {
      date,
      assigned: assignedByDate.get(date) ?? 0,
      returned: returnedByDate.get(date) ?? 0,
    };
  });

  return {
    kpis: {
      totalAssets,
      assignedAssets,
      unassignedAssets: Math.max(totalAssets - assignedAssets, 0),
      inRepairAssets: Number(kpi?.inRepairAssets) || 0,
      retiredOrDisposedAssets: Number(kpi?.retiredOrDisposedAssets) || 0,
      utilizationRate: Number(utilizationRate.toFixed(2)),
      portfolioCost: Number(kpi?.portfolioCost) || 0,
      averageAssetCost: Number(kpi?.averageAssetCost) || 0,
      uncostedAssets: Number(kpi?.uncostedAssets) || 0,
    },
    breakdowns: {
      status: statusRows.map(row => ({
        label: row.label,
        count: Number(row.count) || 0,
      })),
      condition: conditionRows.map(row => ({
        label: row.label,
        count: Number(row.count) || 0,
      })),
      costByCategory: costByCategoryRows.map(row => ({
        label: row.label,
        totalCost: Number(row.totalCost) || 0,
        assetCount: Number(row.assetCount) || 0,
      })),
      costByDepartment: costByDepartmentRows.map(row => ({
        label: row.label,
        totalCost: Number(row.totalCost) || 0,
        assetCount: Number(row.assetCount) || 0,
      })),
    },
    trends: {
      assignmentActivity,
    },
    attentionItems: {
      warrantyExpiringSoon: warrantyRows.map(row => {
        const warrantyDate = new Date(row.warrantyExpiryDate as string);
        const msPerDay = 1000 * 60 * 60 * 24;
        const daysRemaining = Math.max(
          Math.ceil((warrantyDate.getTime() - today.getTime()) / msPerDay),
          0,
        );

        return {
          id: row.id,
          name: row.name,
          category: row.category,
          department: row.department,
          warrantyExpiryDate: row.warrantyExpiryDate as string,
          daysRemaining,
          status: row.status,
        };
      }),
      recentAssignments: recentAssignmentRows.map(row => ({
        id: row.id,
        assetName: row.assetName,
        userName: row.userName,
        assignedDate: row.assignedDate,
        returnedDate: row.returnedDate,
      })),
    },
    lastUpdated: new Date().toISOString(),
  };
}

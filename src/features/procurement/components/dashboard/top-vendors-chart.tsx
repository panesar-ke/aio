'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getTopVendorsDetails } from '@/features/procurement/services/dashboard/data';
import { numberFormat, titleCase } from '@/lib/helpers/formatters';

interface TopVendorsChartProps {
  totalOrders: number;
  topVendors: Awaited<ReturnType<typeof getTopVendorsDetails>>;
}

export function TopVendorsChart({
  totalOrders,
  topVendors,
}: TopVendorsChartProps) {
  const vendorFormattedData = topVendors.map(
    ({ vendorName, totalAmount, totalOrders }) => ({
      name: vendorName,
      spend: totalAmount ?? '0',
      orders: totalOrders,
    })
  );

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">
          Top Vendors
        </CardTitle>
        <CardDescription>Top vendors by spending</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {vendorFormattedData.map((vendor, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  {titleCase(vendor.name)}
                </span>
                <span className="text-sm text-gray-600">
                  Ksh {numberFormat(vendor.spend)}
                </span>
              </div>
              <Progress
                value={(+vendor.spend / totalOrders) * 100}
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{vendor.orders} orders</span>
                <span>
                  {Math.round((+vendor.spend / totalOrders) * 100)}% of total
                  spend
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function TopVendorsChartLoading() {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-800">
          Top Vendors
        </CardTitle>
        <CardDescription>Top vendors by spending</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-2 w-24" />
            <Skeleton className="h-2 w-24" />
          </div>
          <Skeleton className="h-4 w-full" />
          <div className="flex justify-between items-center">
            <Skeleton className="h-2 w-24" />
            <Skeleton className="h-2 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export interface ProductUsageEligibilityInput {
  lastUsedDate: Date | null;
  createdOn: Date | null;
}

function isOlderThanThreshold(
  date: Date,
  thresholdDays: number,
  asOf: Date,
): boolean {
  const cutoff = new Date(asOf);
  cutoff.setUTCDate(cutoff.getUTCDate() - thresholdDays);
  return date.getTime() < cutoff.getTime();
}

export function isEligibleForDeactivation(
  usage: ProductUsageEligibilityInput,
  thresholdDays: number,
  asOf: Date,
): boolean {
  if (usage.lastUsedDate !== null) {
    return isOlderThanThreshold(usage.lastUsedDate, thresholdDays, asOf);
  }

  if (usage.createdOn === null) {
    return true;
  }

  return isOlderThanThreshold(usage.createdOn, thresholdDays, asOf);
}

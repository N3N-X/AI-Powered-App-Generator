/**
 * Simple filter matching for JSON documents
 * Supports exact match and basic operators
 */
export function matchesFilter(
  data: Record<string, unknown>,
  filter?: Record<string, unknown>,
): boolean {
  if (!filter || Object.keys(filter).length === 0) {
    return true;
  }

  for (const [key, value] of Object.entries(filter)) {
    // Handle special operators
    if (key === "id") {
      // ID is handled separately - skip in data matching
      continue;
    }

    const dataValue = data[key];

    // Handle operator objects like { $gt: 5 }
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const ops = value as Record<string, unknown>;

      if ("$eq" in ops && dataValue !== ops.$eq) return false;
      if ("$ne" in ops && dataValue === ops.$ne) return false;
      if (
        "$gt" in ops &&
        !(typeof dataValue === "number" && dataValue > (ops.$gt as number))
      )
        return false;
      if (
        "$gte" in ops &&
        !(typeof dataValue === "number" && dataValue >= (ops.$gte as number))
      )
        return false;
      if (
        "$lt" in ops &&
        !(typeof dataValue === "number" && dataValue < (ops.$lt as number))
      )
        return false;
      if (
        "$lte" in ops &&
        !(typeof dataValue === "number" && dataValue <= (ops.$lte as number))
      )
        return false;
      if (
        "$in" in ops &&
        !(Array.isArray(ops.$in) && ops.$in.includes(dataValue))
      )
        return false;
      if (
        "$nin" in ops &&
        Array.isArray(ops.$nin) &&
        ops.$nin.includes(dataValue)
      )
        return false;
      if ("$exists" in ops) {
        const exists = dataValue !== undefined && dataValue !== null;
        if (ops.$exists !== exists) return false;
      }
      if (
        "$contains" in ops &&
        typeof dataValue === "string" &&
        typeof ops.$contains === "string"
      ) {
        if (!dataValue.toLowerCase().includes(ops.$contains.toLowerCase()))
          return false;
      }
    } else {
      // Simple equality match
      if (dataValue !== value) return false;
    }
  }

  return true;
}

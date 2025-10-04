// Utility functions for exhibit number formatting

export const getLabSequence = (labNumber?: string | null): string => {
  if (!labNumber) return "0000";
  const match = labNumber.match(/LAB\/(\d{4})$/);
  return match ? match[1] : "0000";
};

export const normalizeExhibitNumber = (exhibitNumber: string, labNumber?: string | null): string => {
  // Extract the numeric sequence (####) from lab number
  const seq = getLabSequence(labNumber);

  // Detect suffix from existing exhibit number: "/A" or "/A<digit>"
  let suffix = "A";
  const matchSuffix = exhibitNumber.match(/\/A(\d+)?$/);
  if (matchSuffix) {
    suffix = matchSuffix[1] ? `A${matchSuffix[1]}` : "A";
  }

  return `CYB/LAB/${seq}/${suffix}`;
};

export const formatExhibitNumber = (
  labNumber: string | null | undefined,
  index: number,
  totalExhibits: number
): string => {
  const seq = getLabSequence(labNumber || undefined);
  const suffix = totalExhibits === 1 ? "A" : `A${index + 1}`;
  return `CYB/LAB/${seq}/${suffix}`;
};

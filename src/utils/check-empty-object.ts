export const isEmpty = (value: any) => {
  if (Array.isArray(value)) {
    return value.length === 0; // For arrays
  } else if (typeof value === 'object' && value !== null) {
    return Object.keys(value).length === 0; // For objects
  }
  return false; // For other data types
};

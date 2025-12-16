/**
 * Utility functions to ensure boolean values are actual booleans
 * This prevents "String cannot be cast to Boolean" errors on Android
 */

/**
 * Convert any value to a proper boolean
 * Handles: true, false, "true", "false", 1, 0, null, undefined
 */
export const toBoolean = (value) => {
  if (value === true || value === 'true' || value === 1 || value === '1') {
    return true;
  }
  if (value === false || value === 'false' || value === 0 || value === '0') {
    return false;
  }
  return Boolean(value);
};

/**
 * Normalize an object's boolean properties
 */
export const normalizeBooleans = (obj, booleanFields = []) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const normalized = { ...obj };
  
  // If booleanFields specified, only normalize those
  if (booleanFields.length > 0) {
    booleanFields.forEach(field => {
      if (field in normalized) {
        normalized[field] = toBoolean(normalized[field]);
      }
    });
  } else {
    // Normalize all fields that look like booleans
    Object.keys(normalized).forEach(key => {
      const value = normalized[key];
      if (value === 'true' || value === 'false' || value === '1' || value === '0') {
        normalized[key] = toBoolean(value);
      } else if (Array.isArray(value)) {
        normalized[key] = value.map(item => 
          typeof item === 'object' ? normalizeBooleans(item) : item
        );
      } else if (typeof value === 'object' && value !== null) {
        normalized[key] = normalizeBooleans(value);
      }
    });
  }
  
  return normalized;
};

/**
 * Normalize photo object booleans
 */
export const normalizePhoto = (photo) => {
  return normalizeBooleans(photo, ['likedByMe', 'savedByMe']);
};

/**
 * Normalize seat object booleans
 */
export const normalizeSeat = (seat) => {
  return normalizeBooleans(seat, ['occupied', 'isMySeat']);
};

/**
 * Normalize comment object booleans
 */
export const normalizeComment = (comment) => {
  return normalizeBooleans(comment, ['likedByMe']);
};

/**
 * Normalize array of objects
 */
export const normalizeArray = (array, normalizer) => {
  if (!Array.isArray(array)) return array;
  return array.map(item => normalizer ? normalizer(item) : normalizeBooleans(item));
};


/**
 * Formatters and validation utilities for form inputs
 */

/**
 * Formats a phone number to the Russian format: +7 (XXX) XXX-XX-XX
 * 
 * @param value The input value to format
 * @returns The formatted phone number
 */
export const formatPhoneNumber = (value: string): string => {
  // Remove all non-digit characters
  const phoneNumber = value.replace(/\D/g, '');
  
  // Check if the phone number is empty
  if (!phoneNumber) return '';
  
  // Format the phone number as +7 (XXX) XXX-XX-XX
  if (phoneNumber.length <= 1) {
    return `+${phoneNumber}`;
  } else if (phoneNumber.length <= 4) {
    return `+7 (${phoneNumber.slice(1)}`;
  } else if (phoneNumber.length <= 7) {
    return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4)}`;
  } else if (phoneNumber.length <= 9) {
    return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7)}`;
  } else {
    return `+7 (${phoneNumber.slice(1, 4)}) ${phoneNumber.slice(4, 7)}-${phoneNumber.slice(7, 9)}-${phoneNumber.slice(9, 11)}`;
  }
};

/**
 * Validates a phone number to ensure it matches the expected Russian format
 * 
 * @param phoneNumber The phone number to validate
 * @returns True if the phone number is valid, false otherwise
 */
export const isValidPhoneNumber = (phoneNumber: string): boolean => {
  // Check if the phone number is in the correct format
  const regex = /^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/;
  return regex.test(phoneNumber);
};

/**
 * Normalizes a phone number to just digits for sending to the API
 * 
 * @param phoneNumber The formatted phone number
 * @returns The normalized phone number (just digits)
 */
export const normalizePhoneNumber = (phoneNumber: string): string => {
  // Remove all non-digit characters
  return phoneNumber.replace(/\D/g, '');
}; 
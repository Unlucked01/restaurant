// Validation utility functions for Pure Heart restaurant app

// Regex pattern for name/surname validation (letters only, spaces and hyphens allowed)
export const NAME_REGEX = /^[А-Яа-яA-Za-zёЁ\s\-]+$/;

// Validation helpers
export const isValidName = (name: string): boolean => {
  return NAME_REGEX.test(name);
};

// Error messages
export const VALIDATION_ERRORS = {
  INVALID_NAME: "Допустимы только буквы",
  RESERVATION_TOO_EARLY: "Бронирование возможно только минимум за 2 часа"
}; 
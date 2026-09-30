export type PersonnummerValidation = {
  isValid: boolean;
  normalized: string;
  digits: string;
  message?: string;
};

function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

function luhnIsValid(tenDigits: string) {
  const sum = tenDigits
    .split('')
    .map(Number)
    .reduce((total, digit, index) => {
      const value = index % 2 === 0 ? digit * 2 : digit;
      return total + (value > 9 ? value - 9 : value);
    }, 0);

  return sum % 10 === 0;
}

function hasValidDateParts(year: number, month: number, day: number) {
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day;
}

function resolveDateParts(digits: string) {
  const hasCentury = digits.length === 12;
  const datePart = hasCentury ? digits.slice(0, 8) : digits.slice(0, 6);
  const year = hasCentury ? Number(datePart.slice(0, 4)) : Number(datePart.slice(0, 2));
  const month = Number(hasCentury ? datePart.slice(4, 6) : datePart.slice(2, 4));
  const rawDay = Number(hasCentury ? datePart.slice(6, 8) : datePart.slice(4, 6));
  const isCoordinationNumber = rawDay > 60;
  const day = isCoordinationNumber ? rawDay - 60 : rawDay;

  return { year, month, day };
}

export function formatPersonnummer(value: string) {
  const digits = onlyDigits(value);
  if (digits.length === 12) return `${digits.slice(0, 8)}-${digits.slice(8)}`;
  if (digits.length === 10) return `${digits.slice(0, 6)}-${digits.slice(6)}`;
  return value.trim();
}

export function validatePersonnummer(value: string): PersonnummerValidation {
  const digits = onlyDigits(value);

  if (!digits) {
    return { isValid: false, normalized: '', digits, message: 'Ange personnummer.' };
  }

  if (digits.length !== 10 && digits.length !== 12) {
    return {
      isValid: false,
      normalized: value.trim(),
      digits,
      message: 'Personnummer ska ha 10 eller 12 siffror.',
    };
  }

  const { year, month, day } = resolveDateParts(digits);
  const fullYear = digits.length === 12 ? year : year >= 30 ? 1900 + year : 2000 + year;

  if (!hasValidDateParts(fullYear, month, day)) {
    return {
      isValid: false,
      normalized: formatPersonnummer(value),
      digits,
      message: 'Personnumret har inte ett giltigt datum.',
    };
  }

  const luhnDigits = digits.slice(-10);
  if (!luhnIsValid(luhnDigits)) {
    return {
      isValid: false,
      normalized: formatPersonnummer(value),
      digits,
      message: 'Personnumret har fel kontrollsiffra.',
    };
  }

  return { isValid: true, normalized: formatPersonnummer(value), digits };
}

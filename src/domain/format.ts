const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const number = new Intl.NumberFormat('es-CL', {
  maximumFractionDigits: 0,
});

export function formatCLP(value: number): string {
  return clp.format(Math.round(value));
}

export function formatNumber(value: number): string {
  return number.format(Math.round(value));
}

export function formatPercent(value: number, digits = 0): string {
  return `${value.toLocaleString('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}%`;
}

export function formatRatio(value: number): string {
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  });
}

export function formatDecimal(value: number, digits = 2): string {
  return value.toLocaleString('es-CL', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

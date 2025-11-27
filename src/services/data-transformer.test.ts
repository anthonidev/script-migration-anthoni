import { describe, it, expect } from 'vitest';

// Mock interface for Doctor data
interface Doctor {
  name: string;
  specialty: string;
  price: number;
}

// Mock transformation function
const transformDoctorData = (rawName: string, rawPrice: string): Doctor => {
  return {
    name: rawName.trim(),
    specialty: 'General',
    price: parseFloat(rawPrice.replace('$', '')),
  };
};

describe('Data Transformation Logic', () => {
  it('should clean doctor name', () => {
    const rawName = '  Dr. House  ';
    const result = transformDoctorData(rawName, '100');
    expect(result.name).toBe('Dr. House');
  });

  it('should parse price string to number', () => {
    const rawPrice = '$150.00';
    const result = transformDoctorData('Dr. House', rawPrice);
    expect(result.price).toBe(150.0);
  });
});

import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

interface FeeValidationObject {
  feeAmount?: number;
  feeType?: string;
}

/**
 * Validates that fee amount and fee type are provided together or both omitted
 */
export function IsFeeConsistent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isFeeConsistent',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          const obj = args.object as FeeValidationObject;
          const hasFeeAmount = obj.feeAmount != null && obj.feeAmount > 0;
          const hasFeeType = obj.feeType != null;

          // Both must be provided together or both omitted
          return hasFeeAmount === hasFeeType;
        },
        defaultMessage() {
          return 'Fee amount and fee type must be provided together or both omitted';
        },
      },
    });
  };
}

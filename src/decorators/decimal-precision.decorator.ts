import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Valida se um número não possui mais casas decimais do que o permitido
 * @param scale Número máximo de casas decimais
 * @param validationOptions Opções de validação do class-validator
 */
export function DecimalPrecision(
  scale: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'decimalPrecision',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [scale],
      validator: {
        validate(value: unknown, args: ValidationArguments) {
          if (value === null || value === undefined) {
            return true;
          }

          // Se não for um número, falha na validação
          if (typeof value !== 'number') {
            return false;
          }

          const maxScale: number = args.constraints[0] as number;

          // Converte para string, remove sinal negativo, e divide em parte inteira e decimal
          const strVal: string = Math.abs(value).toString();
          const decimalStr: string = strVal.includes('.')
            ? strVal.split('.')[1]
            : '';

          // Verifica se o número de casas decimais é menor ou igual ao permitido
          return decimalStr.length <= maxScale;
        },
        defaultMessage(args: ValidationArguments) {
          const maxScale: number = args.constraints[0] as number;
          return `${args.property} cannot have more than ${maxScale} decimal places`;
        },
      },
    });
  };
}

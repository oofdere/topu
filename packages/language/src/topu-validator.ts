import type { ValidationAcceptor, ValidationChecks } from 'langium';
import type { TopuAstType, Person } from './generated/ast.js';
import type { TopuServices } from './topu-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: TopuServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.TopuValidator;
    const checks: ValidationChecks<TopuAstType> = {
        Person: validator.checkPersonStartsWithCapital
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class TopuValidator {

    checkPersonStartsWithCapital(person: Person, accept: ValidationAcceptor): void {
        if (person.name) {
            const firstChar = person.name.substring(0, 1);
            if (firstChar.toUpperCase() !== firstChar) {
                accept('warning', 'Person name should start with a capital.', { node: person, property: 'name' });
            }
        }
    }

}

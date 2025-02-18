import { groupBy } from 'lodash';
import { objectValues } from '../../utils/utils';
import { FieldConfig, ObjectTypeConfig } from '../config';
import { ValidationContext, ValidationMessage } from '../validation';
import { Field, SystemFieldConfig } from './field';
import { Model } from './model';
import { ObjectType } from './type';
import { TypeBase } from './type-base';

export abstract class ObjectTypeBase extends TypeBase {
    readonly fields: ReadonlyArray<Field>;
    private readonly fieldMap: ReadonlyMap<string, Field>;

    protected constructor(
        input: ObjectTypeConfig,
        model: Model,
        systemFieldInputs: ReadonlyArray<SystemFieldConfig> = [],
    ) {
        super(input, model);
        const thisAsObjectType: ObjectType = this as any;
        const customFields = (input.fields || []).map(
            (field) => new Field(field, thisAsObjectType),
        );
        const systemFields = (systemFieldInputs || []).map(
            (input) => new Field({ ...input, isSystemField: true }, thisAsObjectType),
        );
        this.fields = [...systemFields, ...customFields];
        this.fieldMap = new Map(this.fields.map((field): [string, Field] => [field.name, field]));
    }

    validate(context: ValidationContext) {
        super.validate(context);

        if (!this.fields.filter((f) => !f.isSystemField).length) {
            context.addMessage(
                ValidationMessage.error(
                    `Object type "${this.name}" does not declare any fields.`,
                    this.nameASTNode,
                ),
            );
        }

        this.validateDuplicateFields(context);

        for (const field of this.fields) {
            field.validate(context);
        }
    }

    private validateDuplicateFields(context: ValidationContext) {
        const duplicateFields = objectValues(groupBy(this.fields, (field) => field.name)).filter(
            (fields) => fields.length > 1,
        );
        for (const fields of duplicateFields) {
            const isSystemFieldCollision = fields.some((field) => field.isSystemField);
            for (const field of fields) {
                if (field.isSystemField) {
                    // don't report errors for system fields the user didn't even write
                    continue;
                }

                if (isSystemFieldCollision) {
                    // user does not see duplicate field, so provide better message
                    context.addMessage(
                        ValidationMessage.error(
                            `Field name "${field.name}" is reserved by a system field.`,
                            field.astNode,
                        ),
                    );
                } else {
                    context.addMessage(
                        ValidationMessage.error(
                            `Duplicate field name: "${field.name}".`,
                            field.astNode,
                        ),
                    );
                }
            }
        }
    }

    getField(name: string): Field | undefined {
        return this.fieldMap.get(name);
    }

    getFieldOrThrow(name: string): Field {
        const field = this.getField(name);
        if (field == undefined) {
            throw new Error(`Field "${this.name}.${name}" is not declared`);
        }
        return field;
    }

    readonly isObjectType: true = true;
    readonly isScalarType: false = false;
    readonly isEnumType: false = false;
}

import { ObjectTypeBase } from './object-type-base';
import { ChildEntityTypeInput, FieldInput, TypeKind } from '../input';
import { Model } from './model';

export class ChildEntityType extends ObjectTypeBase {
    constructor(input: ChildEntityTypeInput, model: Model) {
        super(input, model, systemFieldInputs);
    }

    readonly kind: TypeKind.CHILD_ENTITY = TypeKind.CHILD_ENTITY;
    readonly isChildEntityType: true = true;
    readonly isRootEntityType: false = false;
    readonly isEntityExtensionType: false = false;
    readonly isValueObjectType: false = false;
}

const systemFieldInputs: FieldInput[] = [
    {
        name: 'id',
        typeName: 'ID'
    }, {
        name: 'createdAt',
        typeName: 'DateTime'
    }, {
        name: 'updatedAt',
        typeName: 'DateTime'
    }
];

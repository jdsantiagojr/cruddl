import { expect } from 'chai';
import { DocumentNode, graphql, print } from 'graphql';
import gql from 'graphql-tag';
import { getMetaSchema } from '../../src/meta-schema/meta-schema';
import { Model, TypeKind } from '../../src/model';
import { stopMetaServer } from '../dev/server';

describe('Meta schema API', () => {

    const introQuery = gql`
        query {
            __schema {
                types {
                    name
                    kind
                }
            }
        }
    `;
    const typeQuery = gql`
        {
            types {
                ... on ScalarType {name kind}
                ... on RootEntityType {name kind keyField { name } fields { name isList isReference isRelation type { __typename }}}
                ... on ValueObjectType {name kind fields { name isList isReference isRelation type { __typename }}}
                ... on ChildEntityType {name kind fields { name isList isReference isRelation type { __typename }}}
                ... on EntityExtensionType {name kind fields { name isList isReference isRelation type { __typename }}}
                ... on EnumType { name values { value } }
            }
        }
    `;

    const queryPerTypeQuery = gql`
        {
            rootEntityTypes {name}
            childEntityTypes {name}
            entityExtensionTypes {name}
            valueObjectTypes {name}
            scalarTypes {name}
            enumTypes {name}
        }
    `;

    const relationQuery = gql`
        {
            rootEntityType(name:"Delivery") {
                name
                relations {
                    fromField {name}
                    fromType {name}
                    toField {name}
                    toType {name}
                }
            }
        }
    `;

    const enumQuery = gql`
        {
            enumType(name: "TransportKind") {
                name
                values {
                    value
                }
            }
        }
    `;

    const model = new Model({
        types: [
            {
                name: 'Address',
                kind: TypeKind.VALUE_OBJECT,
                fields: [
                    {
                        name: 'name',
                        typeName: 'String'
                    }
                ]
            }, {
                name: 'Country',
                kind: TypeKind.ROOT_ENTITY,
                keyFieldName: 'isoCode',
                fields: [
                    {
                        name: 'isoCode',
                        typeName: 'String'
                    }
                ],
                namespacePath: ['generic']
            }, {
                name: 'Shipment',
                kind: TypeKind.ROOT_ENTITY,
                fields: [
                    {
                        name: 'deliveries',
                        typeName: 'Delivery',
                        isList: true,
                        isRelation: true
                    }, {
                        name: 'delivery',
                        typeName: 'Delivery',
                        isRelation: true
                    }, {
                        name: 'deliveryNonRelation',
                        typeName: 'Delivery'
                    }, {
                        name: 'deliveryWithInverseOf',
                        typeName: 'Delivery',
                        isRelation: true,
                        inverseOfFieldName: 'shipment'
                    }, {
                        name: 'handlingUnits',
                        typeName: 'HandlingUnit',
                        isRelation: true,
                        isList: true
                    }, {
                        name: 'transportKind',
                        typeName: 'TransportKind'
                    }
                ],
                namespacePath: ['logistics', 'shipments']
            }, {
                name: 'Delivery',
                kind: TypeKind.ROOT_ENTITY,
                fields: [
                    {
                        name: 'shipment',
                        typeName: 'Shipment',
                        isRelation: true
                    }
                ],
                namespacePath: ['logistics']
            }, {
                name: 'HandlingUnit',
                kind: TypeKind.ROOT_ENTITY,
                fields: []
            }, {
                name: 'Item',
                kind: TypeKind.CHILD_ENTITY,
                fields: []
            }, {
                name: 'DangerousGoodsInfo',
                kind: TypeKind.ENTITY_EXTENSION,
                fields: []
            }, {
                name: 'TransportKind',
                kind: TypeKind.ENUM,
                values: [{value: 'AIR'}, {value: 'ROAD'}, {value: 'SEA'}]
            }
        ],
        permissionProfiles: {
            default: {
                permissions: [
                    {
                        roles: ['accounting'],
                        access: 'readWrite'
                    }
                ]
            },
            accounting: {
                permissions: [
                    {
                        roles: ['accounting'],
                        access: 'readWrite'
                    }
                ]
            }
        }
    });

    const metaSchema = getMetaSchema(model);

    async function execute(doc: DocumentNode) {
        const {data, errors} = await graphql(metaSchema, print(doc));
        if (errors) {
            throw new Error(JSON.stringify(errors));
        }
        return data;
    }

    it('can query over all types', async () => {
        const result = await execute(typeQuery);
        expect(result).to.deep.equal({
            'types': [
                {'name': 'ID', 'kind': 'SCALAR'},
                {'name': 'String', 'kind': 'SCALAR'},
                {'name': 'Boolean', 'kind': 'SCALAR'},
                {'name': 'Int', 'kind': 'SCALAR'},
                {'name': 'Float', 'kind': 'SCALAR'},
                {'name': 'JSON', 'kind': 'SCALAR'},
                {'name': 'DateTime', 'kind': 'SCALAR'},
                {
                    'name': 'Address', 'kind': 'VALUE_OBJECT',  'fields': [
                        {
                            'name': 'name',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        }
                    ]
                },
                {
                    'name': 'Country', 'kind': 'ROOT_ENTITY', 'keyField': {'name': 'isoCode'}, 'fields': [
                        {
                            'name': 'id',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'createdAt',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'updatedAt',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'isoCode',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        }
                    ]
                }, {
                    'name': 'Shipment', 'kind': 'ROOT_ENTITY', 'keyField': null, 'fields': [
                        {
                            'name': 'id',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'createdAt',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'updatedAt',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'deliveries',  'isList': true, 'isReference': false,
                            'isRelation': true, 'type': {'__typename': 'RootEntityType'}
                        },
                        {
                            'name': 'delivery',  'isList': false, 'isReference': false,
                            'isRelation': true, 'type': {'__typename': 'RootEntityType'}
                        },
                        {
                            'name': 'deliveryNonRelation',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'RootEntityType'}
                        },
                        {
                            'name': 'deliveryWithInverseOf',  'isList': false, 'isReference': false,
                            'isRelation': true, 'type': {'__typename': 'RootEntityType'}
                        },
                        {
                            'name': 'handlingUnits',  'isList': true, 'isReference': false,
                            'isRelation': true, 'type': {'__typename': 'RootEntityType'}
                        },
                        {
                             'isList': false, 'isReference': false, 'isRelation': false,
                            'name': 'transportKind', 'type': {'__typename': 'EnumType'}
                        }
                    ]
                }, {
                    'name': 'Delivery', 'kind': 'ROOT_ENTITY', 'keyField': null, 'fields': [
                        {
                            'name': 'id',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'createdAt',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'updatedAt',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'shipment',  'isList': false, 'isReference': false,
                            'isRelation': true, 'type': {'__typename': 'RootEntityType'}
                        }
                    ]
                }, {
                    'name': 'HandlingUnit', 'kind': 'ROOT_ENTITY', 'keyField': null, 'fields': [
                        {
                            'name': 'id',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'createdAt',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'updatedAt',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        }
                    ]
                }, {
                    'name': 'Item', 'kind': 'CHILD_ENTITY',  'fields': [
                        {
                            'name': 'id',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'createdAt',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        },
                        {
                            'name': 'updatedAt',  'isList': false, 'isReference': false,
                            'isRelation': false, 'type': {'__typename': 'ScalarType'}
                        }
                    ]
                },
                {'name': 'DangerousGoodsInfo', 'kind': 'ENTITY_EXTENSION',  'fields': []},
                {
                    'name': 'TransportKind',
                    
                    'values': [
                        { 'value': 'AIR'},
                        { 'value': 'ROAD'},
                        { 'value': 'SEA'}
                    ]
                }
            ]
        });
    });

    it('can query single types', async () => {
        const result = await execute(queryPerTypeQuery);
        expect(result).to.deep.equal({
            'rootEntityTypes': [
                {'name': 'Country'}, {'name': 'Shipment'}, {'name': 'Delivery'}, {'name': 'HandlingUnit'}
            ],
            'childEntityTypes': [{'name': 'Item'}],
            'entityExtensionTypes': [{'name': 'DangerousGoodsInfo'}],
            'valueObjectTypes': [{'name': 'Address'}],
            'scalarTypes': [
                {'name': 'ID'}, {'name': 'String'}, {'name': 'Boolean'}, {'name': 'Int'}, {'name': 'Float'},
                {'name': 'JSON'}, {'name': 'DateTime'}
            ],
            'enumTypes': [
                {'name': 'TransportKind'}
            ]
        });
    });

    it('can query relations', async () => {
        const result = await execute(relationQuery);
        expect(result).to.deep.equal({
            'rootEntityType': {
                'name': 'Delivery', 'relations': [
                    {
                        'fromField': {'name': 'deliveries'},
                        'fromType': {'name': 'Shipment'},
                        'toField': null,
                        'toType': {'name': 'Delivery'}
                    },
                    {
                        'fromField': {'name': 'delivery'},
                        'fromType': {'name': 'Shipment'},
                        'toField': null,
                        'toType': {'name': 'Delivery'}
                    },
                    {
                        'fromField': {'name': 'shipment'},
                        'fromType': {'name': 'Delivery'},
                        'toField': {'name': 'deliveryWithInverseOf'},
                        'toType': {'name': 'Shipment'}
                    }
                ]
            }
        });
    });

    it('can query namespaces', async () => {
        const result = await execute(gql`{namespaces{name path isRoot}}`);
        expect(result).to.deep.equal({
            'namespaces': [
                {'name': null, 'path': [], 'isRoot': true},
                {'name': 'generic', 'path': ['generic'], 'isRoot': false},
                {'name': 'logistics', 'path': ['logistics'], 'isRoot': false},
                {'name': 'shipments', 'path': ['logistics', 'shipments'], 'isRoot': false}
            ]
        });
    });

    it('can query namespace by path', async () => {
        const result = await execute(gql`{logistics: namespace(path: ["logistics"]) { name path } root: namespace(path: []) { name path } }`);
        expect(result).to.deep.equal({
            'logistics': {'name': 'logistics', 'path': ['logistics']},
            'root': {'name': null, 'path': []}
        });
    });

    it('can query enum values', async () => {
        const result = await execute(enumQuery);
        expect(result).to.deep.equal({
            'enumType': {
                'name': 'TransportKind',
                'values': [
                    {
                        'value': 'AIR'
                    },
                    {
                        'value': 'ROAD'
                    },
                    {
                        'value': 'SEA'
                    }
                ]
            }
        });
    });

    after(function () {
        return stopMetaServer();
    });
});

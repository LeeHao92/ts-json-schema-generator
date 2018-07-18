import * as ts from "typescript";
import { NoRootTypeError } from "./Error/NoRootTypeError";
import { Context, NodeParser } from "./NodeParser";
import { Definition } from "./Schema/Definition";
import { Schema } from "./Schema/Schema";
import { BaseType } from "./Type/BaseType";
import { DefinitionType } from "./Type/DefinitionType";
import { TypeFormatter } from "./TypeFormatter";
import { StringMap } from "./Utils/StringMap";
import { localSymbolAtNode, symbolAtNode } from "./Utils/symbolAtNode";

export class SchemaGenerator {
    private allTypes: Map<string, ts.Node>;

    public constructor(
        private program: ts.Program,
        private nodeParser: NodeParser,
        private typeFormatter: TypeFormatter,
    ) {
    }

    public createSchema(fullName: string, $id: string, externalRefList:string[]): Schema {
        const rootNode = this.findRootNode(fullName);
        const rootType = this.nodeParser.createType(rootNode, new Context());

        const data = {
            $id,
            definitions: this.getRootChildDefinitions(rootType,externalRefList),
            ...this.getRootTypeDefinition(rootType),
        }

        this.removeUselessDefinitions(data)

        return data
    }

    private removeUselessDefinitions(data:any){
        const refList = this.getRefList(data)

        Object.keys(data.definitions).forEach((key:string)=>{
            if(refList.indexOf(key) < 0){
                delete data.definitions[key]
                this.removeUselessDefinitions(data)
            }
        })
    }

    private getRefList(jsonSchema: Schema) {
        const list:string[] = []

        function getJsonSchemaRefs(data: any) {
            Object.keys(data).forEach((key: string) => {
                if (typeof data[key] === "object") {
                    getJsonSchemaRefs(data[key])
                }
                if (key === "$ref") {
                    const refName = data[key].replace('#/definitions/', '')
                    if(list.indexOf(refName) < 0) {
                        list.push(refName)
                    }
                }
            })
        }

        getJsonSchemaRefs(jsonSchema)

        return list
    }

    private findRootNode(fullName: string): ts.Node {
        const typeChecker = this.program.getTypeChecker();

        if (!this.allTypes) {
            this.allTypes = new Map<string, ts.Node>();

            this.program.getSourceFiles().forEach(
                (sourceFile) => this.inspectNode(sourceFile, typeChecker, this.allTypes),
            );
        }

        if (!this.allTypes.has(fullName)) {
            throw new NoRootTypeError(fullName);
        }

        return this.allTypes.get(fullName)!;
    }
    private inspectNode(node: ts.Node, typeChecker: ts.TypeChecker, allTypes: Map<string, ts.Node>): void {
        if (
            node.kind === ts.SyntaxKind.InterfaceDeclaration ||
            node.kind === ts.SyntaxKind.EnumDeclaration ||
            node.kind === ts.SyntaxKind.TypeAliasDeclaration
        ) {
            if (!this.isExportType(node)) {
                return;
            } else if (this.isGenericType(node as ts.TypeAliasDeclaration)) {
                return;
            }

            allTypes.set(this.getFullName(node, typeChecker), node);
        } else {
            ts.forEachChild(node, (subnode) => this.inspectNode(subnode, typeChecker, allTypes));
        }
    }

    private isExportType(node: ts.Node): boolean {
        const localSymbol = localSymbolAtNode(node);
        return localSymbol ? "exportSymbol" in localSymbol : false;
    }
    private isGenericType(node: ts.TypeAliasDeclaration): boolean {
        return !!(
            node.typeParameters &&
            node.typeParameters.length > 0
        );
    }
    private getFullName(node: ts.Node, typeChecker: ts.TypeChecker): string {
        const symbol = symbolAtNode(node)!;
        return typeChecker.getFullyQualifiedName(symbol).replace(/".*"\./, "");
    }

    private getRootTypeDefinition(rootType: BaseType): Definition {
        return this.typeFormatter.getDefinition(rootType);
    }
    private getRootChildDefinitions(rootType: BaseType,externalRefList:string[]): StringMap<Definition> {
        return this.typeFormatter.getChildren(rootType)
            .filter((child) => {
                return child instanceof DefinitionType && externalRefList.indexOf(child.getId()) < 0
            })
            .reduce((result: StringMap<Definition>, child: DefinitionType) => ({
                ...result,
                [child.getId()]: this.typeFormatter.getDefinition(child.getType()),
            }), {});
    }
}

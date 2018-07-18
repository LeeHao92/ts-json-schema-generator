import { Definition } from "../Schema/Definition";
import { SubTypeFormatter } from "../SubTypeFormatter";
import { BaseType } from "../Type/BaseType";
import { DefinitionType } from "../Type/DefinitionType";
import { ReferenceType } from "../Type/ReferenceType";
import { TypeFormatter } from "../TypeFormatter";

export class ReferenceTypeFormatter implements SubTypeFormatter {
    public constructor(
        private childTypeFormatter: TypeFormatter,
        private externalRefList: string[],
    ) {
    }

    private getDefinitionRefName(id:string) {
        const isExternalRef = this.externalRefList.some((item:string)=>{
            return item === id
        })
        return isExternalRef ? `${id}.json` : `#/definitions/${id}`
    }

    public supportsType(type: ReferenceType): boolean {
        return type instanceof ReferenceType;
    }
    public getDefinition(type: ReferenceType): Definition {
        return {$ref: this.getDefinitionRefName(type.getId())};
    }
    public getChildren(type: ReferenceType): BaseType[] {
        if (type.getType() instanceof DefinitionType) {
            return [];
        }

        // this means that the referred interface is private
        // so we have to expose it in the schema definitions
        return this.childTypeFormatter.getChildren(new DefinitionType(type.getId(), type.getType()));
    }
}

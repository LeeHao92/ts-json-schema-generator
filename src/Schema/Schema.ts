import { StringMap } from "../Utils/StringMap";
import { Definition } from "./Definition";

export interface Schema extends Definition {
    $id: string;
    definitions: StringMap<Definition>;
}

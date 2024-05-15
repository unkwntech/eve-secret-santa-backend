import { ObjectId } from "mongodb";
import { Factory } from "./factory.model";
import { Identifiable } from "./identifiable.model";
import { Utilities } from "../utilities/utilities";
import { Auditable, RecordUpdates } from "./auditable.model";

export default class Santa implements Identifiable, Auditable {
    public _id: ObjectId;
    public CharacterID: number;
    public CharacterName: string;
    public CorporationID: number;
    public CorporationName: string;
    public AllianceID?: number;
    public AllianceName?: string;

    public updates: RecordUpdates[];

    public constructor(input: any) {
        if(!input._id) throw new Error("Santa requires an _id");
        else this._id = input._id;

        if(!input.CharacterID) throw new Error("Santa requires a CharacterID")
        else this.CharacterID = input.CharacterID;

        if(!input.CharacterName) throw new Error("Santa requires a CharacterName")
        else this.CharacterName = input.CharacterName;

        if(!input.CorporationID) throw new Error("Santa requires a CorporationID")
        else this.CorporationID = input.CorporationID;

        if(!input.CorporationName) throw new Error("Santa requires a CorporationName")
        else this.CorporationName = input.CorporationName;

        if(input.AllianceID) this.AllianceID = input.AllianceID;

        if(input.AllianceName) this.AllianceName = input.AllianceName;

        if(!input.updates) {
            this.updates = [];
        } else {
            this.updates = input.updates;
        }

    }

    static make(createdBy: string, actorIP: string): Santa {
        return new Santa({
            _id: Utilities.newGuid(),
            deleted: false,
            updates: [
                new RecordUpdates({
                    timestamp: new Date(),
                    actor: createdBy,
                    sourceIP: actorIP,
                    action: "CREATE Santa",
                }),
            ],
        });
    }

    static getFactory(): Factory<Santa> {
        return new (class implements Factory<Santa> {
            make(json: any): Santa {
                return new Santa(json);
            }

            getCollectionName(): string {
                return "Santa";
            }

            getUrl(id?: string): string {
                return Santa.getUrl();
            }
        })();
    }

    static getUrl(ID?: string): string {
        return "/santa" + (ID ? `/${ID}` : "");
    }
}
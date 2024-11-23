import { ObjectId } from "mongodb";
import { Utilities } from "../utilities/utilities";
import { Auditable, RecordUpdates } from "./auditable.model";
import { Factory } from "./factory.model";
import { Identifiable } from "./identifiable.model";

export default class Santa implements Identifiable, Auditable {
    public _id: ObjectId;
    public id: number;
    public CharacterName: string;
    public CorporationID: number;
    public CorporationName: string;
    public AllianceID?: number;
    public AllianceName?: string;

    public CSPACharges: number = 0.0;
    public CSPACredit: number = 0.0;

    public Donations: number = 0.0;

    public updates: RecordUpdates[];
    public isDeleted: boolean = false;

    public constructor(input: any) {
        if (!input._id) throw new Error("Santa requires an _id");
        else this._id = input._id;

        if (!input.id) throw new Error("Santa requires an id");
        else this.id = input.id;

        if (!input.CharacterName)
            throw new Error("Santa requires a CharacterName");
        else this.CharacterName = input.CharacterName;

        if (!input.CorporationID)
            throw new Error("Santa requires a CorporationID");
        else this.CorporationID = input.CorporationID;

        if (!input.CorporationName)
            throw new Error("Santa requires a CorporationName");
        else this.CorporationName = input.CorporationName;

        if (input.AllianceID) this.AllianceID = input.AllianceID;

        if (input.AllianceName) this.AllianceName = input.AllianceName;

        this.isDeleted = input.isDeleted;
        this.CSPACharges = input.CSPACharges;
        this.CSPACredit = input.CSPACredit;
        this.Donations = input.Donations;

        if (!input.updates) {
            this.updates = [];
        } else {
            this.updates = input.updates;
        }
    }

    static make(
        id: number,
        CharacterName: string,
        CorporationID: number,
        CorporationName: string,
        createdBy: string,
        actorIP: string,
        AllianceID?: number,
        AllianceName?: string
    ): Santa {
        return new Santa({
            _id: Utilities.newGuid(),
            id,
            CharacterName,
            CorporationID,
            CorporationName,
            AllianceID,
            AllianceName,
            isDeleted: false,
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
            make = (json: any) => new Santa(json);
            CollectionName = "Santa";
            getUrl = (ID?: string) => Santa.getUrl(ID);
        })();
    }

    static getUrl(ID?: string): string {
        return "/santa" + (ID ? `/${ID}` : "");
    }
}

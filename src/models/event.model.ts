import { ObjectId } from "mongodb";
import { Utilities } from "../utilities/utilities";
import { Auditable, RecordUpdates } from "./auditable.model";
import { Factory } from "./factory.model";
import { Identifiable } from "./identifiable.model";

export default class Event implements Identifiable, Auditable {
    public _id: ObjectId;
    public id: string;
    public OwnerID: number;
    public EventName: string;
    public SignupStartDate: Date;
    public SignupEndDate: Date;
    public DeliveryDeadline: Date;
    public Participants: string[] = [];
    public Assignments: { santa: number; recip: number }[] = [];

    public isPublished: boolean = false;
    public isOpen: boolean;

    public updates: RecordUpdates[] = [];
    public isDeleted: boolean = false;

    public constructor(input: any) {
        if (!input._id) throw new Error("Event requires an _id");
        else this._id = input._id;

        if (!input.id && !input._id)
            throw new Error("Event requires an id or _id");
        else this.id = input.id || this._id;

        if (!input.OwnerID) throw new Error("Event requires a OwnerID");
        else this.OwnerID = input.OwnerID;

        if (!input.EventName) throw new Error("Event requires a EventName");
        else this.EventName = input.EventName;

        if (!input.SignupStartDate)
            throw new Error("Event requires a SignupStartDate");
        else this.SignupStartDate = input.SignupStartDate;

        if (!input.SignupEndDate)
            throw new Error("Event requires a SignupEndDate");
        else this.SignupEndDate = input.SignupEndDate;

        if (!input.DeliveryDeadline)
            throw new Error("Event requires a DeliveryDeadline");
        else this.DeliveryDeadline = input.DeliveryDeadline;

        if (input.isOpen === undefined) this.isOpen = false;
        else this.isOpen = input.isOpen;

        this.Participants = input.Participants ?? [];
        this.updates = input.updates;
        this.isDeleted = input.isDeleted;
        this.isPublished = input.isPublished ?? false;
        this.Assignments = input.Assignments;
    }

    static make(
        EventName: string,
        SignupStartDate: Date,
        SignupEndDate: Date,
        DeliveryDeadline: Date,
        createdBy: string,
        actorIP: string
    ): Event {
        let newGUID = Utilities.newGuid();
        return new Event({
            _id: newGUID,
            id: newGUID,
            OwnerID: createdBy,
            EventName,
            SignupStartDate,
            SignupEndDate,
            DeliveryDeadline,
            isDeleted: false,
            updates: [
                new RecordUpdates({
                    timestamp: new Date(),
                    actor: createdBy,
                    sourceIP: actorIP,
                    action: "CREATE Event",
                }),
            ],
        });
    }

    static getFactory(): Factory<Event> {
        return new (class implements Factory<Event> {
            make = (json: any) => new Event(json);
            CollectionName = "Event";
            getUrl = (id?: string) => Event.getUrl(id);
        })();
    }

    static getUrl(ID?: string): string {
        return "/events" + (ID ? `/${ID}` : "");
    }
}

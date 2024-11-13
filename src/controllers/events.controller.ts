import { Request, Response } from "express";
import routable from "../decorators/routable.decorator";
import { RecordUpdates } from "../models/auditable.model";
import Event from "../models/event.model";
import { JWTPayload } from "../models/jwtpayload.model";
import { DbUtilities as DB } from "../utilities/db-utilities";
import { Utilities } from "../utilities/utilities";

export default class EventsController {
    @routable({
        path: "/events/:id",
        method: "get",
        swagger: {
            tags: ["events"],
            summary: "Get a single event.",
        },
        auth: true,
    })
    public GetEvent(req: Request, res: Response, jwt: JWTPayload) {
        //todo permissions & fields

        /*
        Intent:
            Select single record by id
            Exclude Deleted
            Include only if
                User is the owner
                User is a participant and the event is published

        this is the below query in pseudo code

        (id == req.params.id && !isDeleted &&
            (ownerid == jwt.sub || (isPublished && participants.contains(jwt.sub)))
        */
        DB.Query(
            {
                $and: [
                    { _id: req.params.id },
                    { isDeleted: false },
                    {
                        $or: [
                            { OwnerID: jwt.sub },
                            {
                                $and: [
                                    { isPublished: true },
                                    { Participants: [jwt.sub] },
                                ],
                            },
                        ],
                    },
                ],
            },
            Event.getFactory(),
            {
                id: 1,
                OwnerID: 1,
                EventName: 1,
                SignupStartDate: 1,
                SignupEndDate: 1,
                DeliveryDeadline: 1,
                Participants: 1,
            }
        )
            .then((data: Event[]) => {
                res.status(200).send(JSON.stringify(data[0]));
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/events",
        method: "get",
        swagger: {
            tags: ["events"],
            summary: "Get a list of all visible events.",
        },
        auth: true,
    })
    public GetEvents(req: Request, res: Response, jwt: JWTPayload) {
        //todo permissions & fields
        let query = {
            $and: [
                { isDeleted: false },
                {
                    $or: [{ OwnerID: jwt.sub }, { Participants: [jwt.sub] }],
                },
            ],
        };

        console.log(JSON.stringify(query));

        DB.Query(query, Event.getFactory())
            .then((data: any) => {
                res.setHeader("Content-Range", `${data.length}/${data.length}`)
                    .status(200)
                    .send(JSON.stringify(data));
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/events",
        method: "post",
        swagger: {
            tags: ["events"],
            summary: "Create a new event.",
        },
        auth: true,
    })
    public CreateEvent(req: Request, res: Response, jwt: JWTPayload) {
        let event = Event.make(
            req.body.EventName,
            new Date(req.body.SignupStartDate),
            new Date(req.body.SignupEndDate),
            new Date(req.body.DeliveryDeadline),
            jwt.sub,
            req.ip ?? ""
        );
        DB.Insert(event, Event.getFactory())
            .then((data) => {
                res.status(201).send(event);
                return;
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/events/:id",
        method: "put",
        swagger: {
            tags: ["events"],
            summary: "Update an event.",
        },
    })
    public UpdateEvent(req: Request, res: Response, jwt: JWTPayload) {
        DB.Query(
            {
                $and: {
                    _id: req.params.id,
                    isDeleted: false,
                    ownerID: jwt.sub,
                },
            },
            Event.getFactory()
        )
            .then(async (data: Event[]) => {
                let existingEvent = data[0];
                let newEvent = new Event(req.body);

                existingEvent.EventName = newEvent.EventName;
                existingEvent.SignupStartDate = newEvent.SignupStartDate;
                existingEvent.SignupEndDate = newEvent.SignupEndDate;
                existingEvent.DeliveryDeadline = newEvent.DeliveryDeadline;

                existingEvent.updates.push(
                    new RecordUpdates({
                        timestamp: Date.now(),
                        actor: jwt.sub,
                        sourceIP:
                            req.headers["x-forwarded-for"] ||
                            req.socket.remoteAddress,
                        action: "UPDATE DETAILS",
                    })
                );

                //save to database
                console.log("missing dp update");
                //await DB.Update(existingEvent, Event.getFactory());
                res.status(202).send(existingEvent);
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/events/:id",
        method: "delete",
        swagger: {
            tags: ["events"],
            summary: "Delete an event",
        },
        auth: true,
    })
    public DeleteEvent(req: Request, res: Response, jwt: JWTPayload) {
        DB.Query(
            {
                $and: {
                    _id: req.params.id,
                    isDeleted: false,
                    ownerID: jwt.sub,
                },
            },
            Event.getFactory()
        )
            .then((data: Event[]) => {
                let event = data[0];
                event.isDeleted = true;
                DB.Update(event, Event.getFactory());
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/events/:id/join",
        method: "put",
        swagger: {
            tags: ["events"],
            summary: "Delete an event",
        },
        auth: true,
    })
    public JoinEvent(req: Request, res: Response, jwt: JWTPayload) {
        DB.Query(
            {
                $and: [
                    { _id: req.params.id },
                    { isDeleted: false },
                    { isPublished: true },
                    { isOpen: true },
                ],
            },
            Event.getFactory(),
            {
                _id: 1,
                id: 1,
                Participants: 1,
            },
            1
        )
            .then(async (data: Event[]) => {
                let event = data[0];
                console.log(event);
                if (event.Participants.includes(jwt.sub)) {
                    res.status(409).send("Already Joined");
                    return;
                } else {
                    event.Participants.push(jwt.sub);

                    await DB.Update(event, Event.getFactory());

                    res.status(202).send("Joined");
                    return;
                }
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/events/:id/generate",
        method: "put",
        swagger: {
            tags: ["events"],
            summary: "Trigger the generation of gift assignments.",
        },
        auth: true,
    })
    public GenerateEvent(req: Request, res: Response, jwt: JWTPayload) {
        //todo permissions & fields
        DB.Query(
            {
                $and: [
                    { _id: req.params.id },
                    { isDeleted: false },
                    { isPublished: true },
                    { isOpen: true },
                    { OwnerID: jwt.sub },
                ],
            },
            Event.getFactory()
        )
            .then((data: Event[]) => {
                let event = data[0];
                let santas = Utilities.arrayShuffle(event.Participants);

                event.Assignments = [];

                let santa;
                let firstSanta = santas[santas.length - 1];
                let recip = santas.pop();

                while (santas.length > 0) {
                    santa = recip;
                    recip = santas.pop();
                    event.Assignments.push({ santa, recip });
                }

                //last person on list get assigned to gift to the first
                event.Assignments.push({ santa: recip, recip: firstSanta });

                event.isOpen = false;

                DB.Upsert(event, Event.getFactory()).then(() => {
                    res.status(201).send(JSON.stringify(event));
                });
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }
}

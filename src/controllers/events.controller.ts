import { Request, Response } from "express";
import routable from "../decorators/routable.decorator";
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
    })
    public GetEvent(req: Request, res: Response, jwt: JWTPayload) {
        //todo permissions & fields
        DB.Query(
            {
                $and: {
                    _id: req.params.id,
                    isDeleted: false,
                    $or: { ownerID: jwt.sub, participants: [jwt.sub] },
                },
            },
            Event.getFactory()
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
    })
    public GetEvents(req: Request, res: Response, jwt: JWTPayload) {
        //todo permissions & fields
        DB.Query(
            {
                $and: {
                    isDeleted: false,
                    $or: { ownerID: jwt.sub, participants: [jwt.sub] },
                },
            },
            Event.getFactory()
        )
            .then((data: Event[]) => {
                res.status(200).send(JSON.stringify(data));
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
    })
    public CreateEvent(req: Request, res: Response, jwt: JWTPayload) {
        let event = Event.make(
            req.params.EventName,
            new Date(req.params.SignupStartDate),
            new Date(req.params.SignupEndDate),
            new Date(req.params.DeliveryDeadline),
            jwt.sub,
            req.ip ?? ""
        );
        DB.Insert(event, Event.getFactory())
            .then((data) => {
                //
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
            .then((data: Event[]) => {
                let event = data[0];
                //update data object
                //save to database
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
        path: "/events/:id/generate",
        method: "put",
        swagger: {
            tags: ["events"],
            summary: "Trigger the generation of gift assignments.",
        },
    })
    public GenerateEvent(req: Request, res: Response, jwt: JWTPayload) {
        //todo permissions & fields
        DB.Query(
            {
                $and: {
                    _id: req.params.id,
                    isDeleted: false,
                    $or: { ownerID: jwt.sub, participants: [jwt.sub] },
                },
            },
            Event.getFactory()
        )
            .then((data: Event[]) => {
                let event = data[0];
                let santas = event.Participants;
                let santasCopy = Utilities.arrayShuffle([...santas]);

                for (let santa in santas) {
                    //pull next participant off the list
                    let recip = santasCopy.pop();
                    if (santa === recip) {
                        //if this would assign one to themselves, pull next and put the first one back on the list
                        event.Assignments.push([santa, santasCopy.pop()]);
                        santasCopy.push(recip);
                    } else {
                        event.Assignments.push([santa, recip]);
                    }
                }

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

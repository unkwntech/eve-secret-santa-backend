import { JWTPayload } from "../models/jwtpayload.model";
import { Request, Response } from "express";
import routable from "../decorators/routable.decorator";
import {DbUtilities as DB} from '../utilities/db-utilities'
import Event from "../models/event.model";

export default class EventsController {

    @routable({
        path: '/events/:id',
        method: 'get'
    })
    public GetEvent(req: Request, res: Response, jwt: JWTPayload) {
        //todo permissions & fields
        DB.Query({$and: {_id: req.params.id, isDeleted: false, $or: {ownerID: jwt.sub, participants: [jwt.sub]}}}, Event.getFactory()).then((data: Event[]) => {
            res.sendStatus(200).send(JSON.stringify(data[0]));
        }).catch((error) => {
            console.error(error);
            res.sendStatus(500);
        });
    }

    @routable({
        path: '/events',
        method: 'get'
    })
    public GetEvents(req: Request, res: Response, jwt: JWTPayload) {
        //todo permissions & fields
        DB.Query({$and: {isDeleted: false, $or: {ownerID: jwt.sub, participants: [jwt.sub]}}}, Event.getFactory()).then((data: Event[]) => {
            res.sendStatus(200).send(JSON.stringify(data));
        }).catch((error) => {
            console.error(error);
            res.sendStatus(500);
        });
    }

    @routable({
        path: '/events',
        method: 'post'
    })
    public CreateEvent(req: Request, res: Response, jwt: JWTPayload) {
        let event = Event.make(req.params.EventName, new Date(req.params.SignupStartDate), new Date(req.params.SignupEndDate), new Date(req.params.DeliveryDeadline), jwt.sub, req.ip??"")
        DB.Insert(event, Event.getFactory()).then((data) => {
            //
        }).catch((error) => {
            console.error(error);
            res.sendStatus(500);
        });
    }

    @routable({
        path: '/events/:id',
        method: 'put'
    })
    public UpdateEvent(req: Request, res: Response, jwt: JWTPayload) {
        DB.Query({$and: {_id: req.params.id, isDeleted: false, ownerID: jwt.sub}}, Event.getFactory()).then((data: Event[]) => {
            let event = data[0];
            //update data object
            //save to database
        }).catch((error) => {
            console.error(error);
            res.sendStatus(500);
        });
    }

    @routable({
        path: '/events/:id',
        method: 'delete'
    })
    public DeleteEvent(req: Request, res: Response, jwt: JWTPayload) {
        DB.Query({$and: {_id: req.params.id, isDeleted: false, ownerID: jwt.sub}}, Event.getFactory()).then((data: Event[]) => {
            let event = data[0];
            event.isDeleted = true;
            DB.Update(event, Event.getFactory());
        }).catch((error) => {
            console.error(error);
            res.sendStatus(500);
        });
    }
}
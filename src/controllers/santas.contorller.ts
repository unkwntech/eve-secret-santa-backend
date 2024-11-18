import { Request, Response } from "express";
import routable from "../decorators/routable.decorator";
import { JWTPayload } from "../models/jwtpayload.model";
import Santa from "../models/santa.model";
import { DbUtilities as DB } from "../utilities/db-utilities";

export default class SantasController {
    @routable({
        path: "/santas/:id",
        method: "get",
        swagger: {
            tags: ["santas"],
            summary: "Get a specific Santa.",
        },
        auth: true,
    })
    public GetSanta(req: Request, res: Response, jwt: JWTPayload) {
        //todo permissions & fields
        DB.Query(
            {
                $and: [
                    { CharacterID: parseInt(req.params.id) },
                    { isDeleted: false },
                ],
            },
            Santa.getFactory()
        )
            .then((data: Santa[]) => {
                res.setHeader("Content-Range", `${data.length}/${data.length}`)
                    .status(200)
                    .send(
                        JSON.stringify({ id: data[0].CharacterID, ...data[0] })
                    );
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/santas",
        method: "get",
        swagger: {
            tags: ["santas"],
            summary: "Get a list of all visible santas.",
        },
        auth: true,
    })
    public GetSantas(req: Request, res: Response, jwt: JWTPayload) {
        //todo permissions & fields
        DB.Query(
            {
                $and: [
                    { isDeleted: false },
                    {
                        $or: [
                            { ownerID: jwt.sub },
                            { participants: [jwt.sub] },
                        ],
                    },
                ],
            },
            Santa.getFactory()
        )
            .then((data: Santa[]) => {
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
        path: "/santas",
        method: "post",
        swagger: {
            tags: ["santas"],
            summary: "Update a santa.",
        },
    })
    public CreateSanta(req: Request, res: Response, jwt: JWTPayload) {
        //Posting new santas is no permitted.
        res.sendStatus(405);
        return;
        let santa = Santa.make(
            parseInt(req.params.CharacterID),
            req.params.CharacterName,
            parseInt(req.params.CorporationID),
            req.params.CorporationName,
            jwt.sub,
            req.ip ?? "",
            parseInt(req.params.AllianceID),
            req.params.AllianceName
        );
        DB.Insert(santa, Santa.getFactory())
            .then((data) => {
                //
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/santas/:id",
        method: "put",
        swagger: {
            tags: ["santas"],
            summary: "Update a santa.",
        },
    })
    public UpdateSanta(req: Request, res: Response, jwt: JWTPayload) {
        DB.Query(
            {
                $and: {
                    _id: req.params.id,
                    isDeleted: false,
                    ownerID: jwt.sub,
                },
            },
            Santa.getFactory()
        )
            .then((data: Santa[]) => {
                let santa = data[0];
                //update data object
                //save to database
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }

    @routable({
        path: "/santas/:id",
        method: "delete",
        swagger: {
            tags: ["santas"],
            summary: "Delete a santa.",
        },
    })
    public DeleteSanta(req: Request, res: Response, jwt: JWTPayload) {
        res.sendStatus(405);
        return;
        DB.Query(
            {
                $and: {
                    _id: req.params.id,
                    isDeleted: false,
                    ownerID: jwt.sub,
                },
            },
            Santa.getFactory()
        )
            .then((data: Santa[]) => {
                let santa = data[0];
                santa.isDeleted = true;
                DB.Update(santa, Santa.getFactory());
            })
            .catch((error) => {
                console.error(error);
                res.sendStatus(500);
            });
    }
}

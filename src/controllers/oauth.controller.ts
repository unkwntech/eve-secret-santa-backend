import axios from "axios";
import { Request, Response } from "express";
import Jwt, { JwtPayload } from "jsonwebtoken";
import routable from "../decorators/routable.decorator";
import { JWTPayload } from "../models/jwtpayload.model";
import { Utilities } from "../utilities/utilities";

export default class OAuthController {
    @routable({
        path: "/oauth/login",
        method: "get",
        swagger: {
            tags: ["oauth"],
            summary: "Redirects user to CCP's OAuth flow.",
        },
    })
    public oAuthLogin(req: Request, res: Response, jwt: JWTPayload) {
        //redirect to ccp
        res.redirect(
            `https://login.eveonline.com/v2/oauth/authorize/?response_type=code&client_id=${
                process.env.EVE_CLIENT_ID
            }&state=${Utilities.newGuid()}&redirect_uri=http://localhost:3333/api/oauth/callback`
        );
    }

    @routable({
        path: "/oauth/callback",
        method: "get",
        swagger: {
            tags: ["oauth"],
            summary: "EVE OAuth Callback",
            parameters: [
                {
                    description: "OAuth Code",
                    name: "code",
                    in: "query",
                },
            ],
            responses: {
                string: "JWT",
            },
        },
    })
    public async oAuthCallback(req: Request, res: Response, jwt: JWTPayload) {
        //get character

        const code = req.query.code;
        if (!code) res.status(400).send("code is a required attribute");

        console.log(code);

        let tokens = await axios
            .post(
                "https://login.eveonline.com/v2/oauth/token",
                `grant_type=authorization_code&code=${code}`,
                //{ grant_type: "authorization_code", code },
                {
                    headers: {
                        authorization: Utilities.generateAuthHeader(
                            process.env.EVE_CLIENT_ID,
                            process.env.EVE_SECRET
                        ),
                        "content-type": "application/x-www-form-urlencoded",
                    },
                }
            )
            .then((res) => {
                return Jwt.decode(res.data.access_token) as JwtPayload;
            })
            .catch((e: any) => {
                res.status(500).send(e);
                console.error("ERROR", e.response);
            });

        if (!tokens || !tokens.sub) {
            console.error("UNABLE TO PARSE ACCESSTOKEN JWT");
            return;
        }

        const characterID = parseInt(
            tokens.sub.replaceAll("CHARACTER:EVE:", "")
        );

        let affiliations = await axios
            .post("https://esi.evetech.net/latest/characters/affiliation/", [
                characterID,
            ])
            .then(async (afilliationResponse) => {
                return afilliationResponse.data[0];
                // [
                //     {
                //         "alliance_id": 99011978,
                //         "character_id": 1978535095,
                //         "corporation_id": 263585335,
                //         "faction_id": 500002
                //     }
                // ]

                console.log(affiliations);
            })
            .catch((e: any) => {
                res.status(500).send(e);
                console.error("ERROR", e);
            });

        let payload = {};
        Object.assign(
            payload,
            JWTPayload.make(
                affiliations.character_id,
                "EVE-SECRET-SANTA",
                Date.now() / 1000 + 60 * 60 //expires 1 hour from generation
            )
        );

        console.log(payload);

        //const santa = Santa.make(affiliations.character_id, )

        const newJWT = Jwt.sign(payload, process.env.JWT_SECRET);

        res.status(200).send(newJWT);
        // axios
        //     .post(
        //         `https://esi.evetech.net/latest/characters/1978535095/cspa/`,
        //         [affiliations.character_id],
        //         {
        //             headers: {
        //                 Authorization: `Bearer asdf`, //todo
        //             },
        //         }
        //     )
        //     .then(async (cspaResponse) => {
        //         if (parseInt(cspaResponse.data[0]) > 0) {
        //             //todo something
        //         }

        //         const payload = JWTPayload.make(
        //             affiliations.character_id,
        //             "EVE-SECRET-SANTA",
        //             Date.now() + 60 * 60 //expires 1 hour from generation
        //         );

        //         const jwt = Jwt.sign(payload, process.env.JWT_SECRET);

        //         res.status(200).send(jwt);
        //     })
        //     .catch((e: any) => {
        //         res.status(500).send(e);
        //         console.error("ERROR", e);
        //     });
    }
}

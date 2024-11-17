import axios from "axios";
import { Request, Response } from "express";
import Jwt, { JwtPayload } from "jsonwebtoken";
import routable from "../decorators/routable.decorator";
import { JWTPayload } from "../models/jwtpayload.model";
import Santa from "../models/santa.model";
import { DbUtilities as DB } from "../utilities/db-utilities";
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

        let tokens = await axios
            .post(
                "https://login.eveonline.com/v2/oauth/token",
                `grant_type=authorization_code&code=${code}`,
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
                Date.now() / 1000 + 60 * 60 * 24 * 3 //expires 3 days from generation
            )
        );

        //get corp data
        let corp = await axios
            .get(
                `https://esi.evetech.net/latest/corporations/${affiliations.corporation_id}`
            )
            .then(async (corpResponse) => {
                return corpResponse.data;
                // {
                //     "alliance_id": 99011978,
                //     "ceo_id": 1978535095,
                //     "creator_id": 155440850,
                //     "date_founded": "2003-07-04T11:02:00Z",
                //     "description": "u'<font size=\"14\" color=\"#bfffffff\"></font><font size=\"12\" color=\"#bfffffff\">Black \\u03a9mega Security:<br><br></font><font size=\"30\" color=\"#bfffffff\">\"I\\'m so confused\"<br><br></font><font size=\"12\" color=\"#bfffffff\">For Diplo contacts, please see </font><font size=\"12\" color=\"#ffd98d00\"><a href=\"showinfo:1373//1978535095\">Ibn Khatab</a></font><font size=\"12\" color=\"#bfffffff\"> (US) or </font><font size=\"12\" color=\"#ffd98d00\"><loc><a href=\"showinfo:1378//421269906\">Hibbie</a></loc></font><font size=\"12\" color=\"#bfffffff\"> (EU)<br><br>Recruitment is </font><font size=\"12\" color=\"#ff00ff00\">Open</font><font size=\"12\" color=\"#bfffffff\">;<br>US/EU TZ<br>Must have Fax or dread alt.</font>'",
                //     "faction_id": 500002,
                //     "home_station_id": 60013360,
                //     "member_count": 359,
                //     "name": "Black Omega Security",
                //     "shares": 100000,
                //     "tax_rate": 0.10000000149011612,
                //     "ticker": "OMEGA",
                //     "url": "",
                //     "war_eligible": true
                //   }
            })
            .catch((e: any) => {
                res.status(500).send(e);
                console.error("ERROR", e);
            });

        let allianceID: number = -1;
        let allianceName: string = "";

        if (corp.alliance_id) {
            await axios
                .get(
                    `https://esi.evetech.net/latest/alliances/${corp.alliance_id}`
                )
                .then((res) => res.data)
                .then(async (allianceResponse) => {
                    allianceID = corp.alliance_id;
                    allianceName = allianceResponse.name;
                    // {
                    //     "creator_corporation_id": 98726134,
                    //     "creator_id": 634915984,
                    //     "date_founded": "2023-01-01T23:21:34Z",
                    //     "executor_corporation_id": 98735318,
                    //     "faction_id": 500002,
                    //     "name": "Minmatar Fleet Alliance",
                    //     "ticker": "FL33T"
                    //   }
                })
                .catch((e: any) => {
                    res.status(500).send(e);
                    console.error("ERROR", e);
                });
        }

        const santa = Santa.make(
            affiliations.character_id,
            tokens.name,
            affiliations.corporation_id,
            corp.name,
            ((req.headers["x-forwarded-for"] as string) ||
                req.socket.remoteAddress) as string,
            ((req.headers["x-forwarded-for"] as string) ||
                req.socket.remoteAddress) as string,
            allianceID,
            allianceName
        );

        DB.Query({ CharacterID: santa.CharacterID }, Santa.getFactory()).then(
            async (res) => {
                if (res.length < 1) {
                    //todo setup token for Santa's Secretary
                    // let cspa = await axios
                    //     .post(
                    //         `https://esi.evetech.net/latest/characters/2122903368/cspa/`,
                    //         [affiliations.character_id],
                    //         {
                    //             headers: {
                    //                 Authorization: `Bearer asdf`, //todo
                    //             },
                    //         }
                    //     )
                    //     .then((res) => parseFloat(res.data));
                    // santa.CSPACharges = cspa;
                    await DB.Insert(santa, Santa.getFactory());
                    return;
                } else {
                    res[0].updates.push({
                        timestamp: new Date(),
                        actor: res[0].CharacterID.toString(),
                        sourceIP: ((req.headers["x-forwarded-for"] as string) ||
                            req.socket.remoteAddress) as string,
                        action: "LOGIN",
                    });
                    DB.Update(res[0], Santa.getFactory());
                }
            }
        );

        const newJWT = Jwt.sign(payload, process.env.JWT_SECRET);

        res.status(200).send({
            jwt: newJWT,
            user: {
                id: affiliations.character_id,
                fullName: tokens.name,
                avatar: `https://images.evetech.net/characters/${affiliations.character_id}/portrait?size=128`,
            },
        });
    }
}

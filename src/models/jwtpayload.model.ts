export class JWTPayload {
    //JWT Registered Claims See: https://datatracker.ietf.org/doc/html/rfc7519#section-4.1
    //issuer
    public iss: string;
    //audience
    public aud: string;
    //subject
    public sub: string;
    //expiration
    public exp: Date;
    //issued at
    public iat: Date;

    //Private Claims

    public constructor(json: any) {
        this.sub = json.sub;
        this.exp = json.exp;
        this.iss = json.iss;
        this.aud = json.aud;
        this.iat = json.iat;
    }

    public static make(
        subject: string,
        audience: string,
        expiration: number = 60
    ): JWTPayload {
        return new JWTPayload({
            iat: new Date().getTime(),
            iss: process.env.JWT_ISSUER,
            sub: subject,
            aud: audience,
            exp: new Date().getTime() + expiration * 60 * 1000 * 1000,
        });
    }

    public toJSON(): string {
        return JSON.stringify(this);
    }
}

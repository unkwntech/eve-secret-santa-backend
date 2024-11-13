export class Utilities {
    static newGuid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
            /[xy]/g,
            function (c) {
                var r = (Math.random() * 16) | 0,
                    v = c == "x" ? r : (r & 0x3) | 0x8;
                return v.toString(16);
            }
        );
    }
    static generateRandomString(length: number): string {
        let result = "";
        const pool =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 _-";
        for (var i = 0; i < length; i++) {
            result += pool[Math.floor(Math.random() * pool.length)];
        }

        return result;
    }

    static generateRandomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    static arrayShuffle(input: any[]) {
        let array: any[] = [];
        Object.assign(array, input);
        let currentIndex = array.length;

        // While there remain elements to shuffle...
        while (currentIndex != 0) {
            // Pick a remaining element...
            let randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex--;

            // And swap it with the current element.
            [array[currentIndex], array[randomIndex]] = [
                array[randomIndex],
                array[currentIndex],
            ];
        }
        return array;
    }

    static generateAuthHeader(clientID: string, secret: string): string {
        return `Basic ${Buffer.from(`${clientID}:${secret}`, "binary").toString(
            "base64"
        )}`;
    }
}

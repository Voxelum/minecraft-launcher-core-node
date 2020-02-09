export function writeUTF8(out: ByteBuffer, str: string) {
    const strlen = str.length;
    let utflen = 0;
    let c: number;
    let count: number = 0;

    /* use charAt instead of copying String to char array */
    for (let idx = 0; idx < strlen; idx++) {
        c = str.charCodeAt(idx);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            utflen++;
        } else if (c > 0x07FF) {
            utflen += 3;
        } else {
            utflen += 2;
        }
    }

    if (utflen > 65535) {
        throw new Error(
            "encoded string too long: " + utflen + " bytes");
    }

    const bytearr = new Uint8Array(utflen + 2);

    bytearr[count++] = ((utflen >>> 8) & 0xFF);
    bytearr[count++] = ((utflen >>> 0) & 0xFF);

    let i = 0;
    for (i = 0; i < strlen; i++) {
        c = str.charCodeAt(i);
        if (!((c >= 0x0001) && (c <= 0x007F))) { break; }
        bytearr[count++] = c;
    }

    for (; i < strlen; i++) {
        c = str.charCodeAt(i);
        if ((c >= 0x0001) && (c <= 0x007F)) {
            bytearr[count++] = c;

        } else if (c > 0x07FF) {
            bytearr[count++] = (0xE0 | ((c >> 12) & 0x0F));
            bytearr[count++] = (0x80 | ((c >> 6) & 0x3F));
            bytearr[count++] = (0x80 | ((c >> 0) & 0x3F));
        } else {
            bytearr[count++] = (0xC0 | ((c >> 6) & 0x1F));
            bytearr[count++] = (0x80 | ((c >> 0) & 0x3F));
        }
    }
    out.append(bytearr);
    // out.write(bytearr, 0, utflen + 2);
    return utflen + 2;
}

export function readUTF8(buff: ByteBuffer) {
    const utflen = buff.readUint16();
    const bytearr: number[] = new Array<number>(utflen);
    const chararr = new Array<number>(utflen);

    let c, char2, char3;
    let count = 0;
    let chararrCount = 0;

    for (let i = 0; i < utflen; i++) {
        bytearr[i] = (buff.readByte());
    }

    while (count < utflen) {
        c = bytearr[count] & 0xff;
        if (c > 127) { break; }
        count++;
        chararr[chararrCount++] = c;
    }

    while (count < utflen) {
        c = bytearr[count] & 0xff;
        switch (c >> 4) {
            case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
            /* 0xxxxxxx*/
                count++;
                chararr[chararrCount++] = c;
                break;
            case 12: case 13:
            /* 110x xxxx   10xx xxxx*/
                count += 2;
                if (count > utflen) {
                    throw new Error(
                        "malformed input: partial character at end");
                }
                char2 = bytearr[count - 1];
                if ((char2 & 0xC0) !== 0x80) {
                    throw new Error(
                        "malformed input around byte " + count);
                }
                chararr[chararrCount++] = (((c & 0x1F) << 6) |
                    (char2 & 0x3F));
                break;
            case 14:
            /* 1110 xxxx  10xx xxxx  10xx xxxx */
                count += 3;
                if (count > utflen) {
                    throw new Error(
                        "malformed input: partial character at end");
                }
                char2 = bytearr[count - 2];
                char3 = bytearr[count - 1];
                if (((char2 & 0xC0) !== 0x80) || ((char3 & 0xC0) !== 0x80)) {
                    throw new Error(
                        "malformed input around byte " + (count - 1));
                }
                chararr[chararrCount++] = (((c & 0x0F) << 12) |
                    ((char2 & 0x3F) << 6) |
                    ((char3 & 0x3F) << 0));
                break;
            default:
            /* 10xx xxxx,  1111 xxxx */
                throw new Error(
                    "malformed input around byte " + count);
        }
    }
    // The number of chars produced may be less than utflen
    return chararr.map((i) => String.fromCharCode(i)).join("");
}

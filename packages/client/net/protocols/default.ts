import * as Long from "long";
import { Server } from "../../server";
import Coders from "../coders";
import { Field, Packet } from "../packet";

@Packet("client", 0x00, "handshake")
export class Handshake {
    @Field(Coders.VarInt)
    protocolVersion!: number;
    @Field(Coders.String)
    serverAddress!: string;
    @Field(Coders.Short)
    serverPort!: number;
    @Field(Coders.VarInt)
    nextState!: number;
}

@Packet("client", 0x00, "status")
export class ServerQuery { }

@Packet("server", 0x00, "status")
export class ServerStatus { @Field(Coders.Json) status!: Server.StatusFrame; }

@Packet("client", 0x01, "status")
export class Ping { @Field(Coders.Long) time = Long.fromNumber(Date.now()); }

@Packet("server", 0x01, "status")
export class Pong { @Field(Coders.Long) ping!: Long; }




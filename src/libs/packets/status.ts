import { Server } from "../server";
import Coders from "../utils/coders";
import { Field, Packet } from "../utils/packet";

@Packet("client", 0x00, "status")
export class ServerQuery { }

@Packet("server", 0x00, "status")
export class ServerStatus { @Field(Coders.Json) status!: Server.StatusFrame; }

@Packet("client", 0x01, "status")
export class Ping { }

@Packet("server", 0x01, "status")
export class Pong { @Field(Coders.Long) ping!: Long; }

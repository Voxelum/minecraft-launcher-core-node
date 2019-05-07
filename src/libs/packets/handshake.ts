import Coders from "../utils/coders";
import { Field, Packet, PacketBase } from "../utils/packet";

@Packet(0x00, "handshake")
export class Handshake extends PacketBase {
    @Field(Coders.VarInt)
    protocolVersion!: number;
    @Field(Coders.String)
    serverAddress!: string;
    @Field(Coders.Short)
    serverPort!: number;
    @Field(Coders.VarInt)
    nextState!: number;
}

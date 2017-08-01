export default interface Packet {
    length: number,
    id: number,
    data: Buffer,
}
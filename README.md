# ts-minecraft(WIP)
All you need for minecraft in typescript.

# Usage
`import {NBT, ServerInfo, ...so on...} from 'ts-minecraft'`

!!!!!!!!!
Notice that this package is still WIP, no much tested yet.
Use with your own risk....
!!!!!!!!!

Supporting:
- NBT IO by `NBT` (not done)
- Yggdrasil auth
- Minecraft client Launching 
- TextComponent handling
- Ping server and fetch the ServerStatus including numbers of player, server icon.
- Other game concept model, like ForgeMod, Litloader Mod, WorldInfo.
- Mod parsing.
- Minecraft config model
- WorldInfo modify
- Minecraft client download
- Sha1 check for the downloaded files (not tested)

Will support in future:
- MinecraftForge/Liteloader client download
- TextComponent to html (render TextComponent)

Issue:
- Really need runtime check for parsed Forge/LiteMod data(Hopefully, more people write this correctly)
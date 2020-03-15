import * as FabricInstaller from "./fabric";
import * as LiteLoaderInstaller from "./liteloader";
import * as ForgeInstaller from "./forge";
import * as Installer from "./minecraft";
import * as CurseforgeInstaller from "./curseforge";
import * as OptifineInstaller from "./optifine";
import * as JavaInstaller from "./java";
import * as Diagnosis from "./diagnose";

export { DownloadOption, Downloader, DefaultDownloader, MultipleError, downloadFileTask, InstallOptions, DownloaderOptions } from "./util";

export { JavaInstaller, Installer, ForgeInstaller, LiteLoaderInstaller, FabricInstaller, Diagnosis, CurseforgeInstaller, OptifineInstaller };

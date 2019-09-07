# Forge Installer Module

## New Forge Installing process

The module have three stage for installing new forge *(mcversion >= 1.13)*

1. Deploy forge installer jar
   1. Download installer jar
   2. Extract forge universal jar files in installer jar into `.minecraft/libraries`
   3. Extract `version.json` into target version folder, `.minecraft/versions/<ver>/<ver>.json`
   4. Extract `installer_profile.json` into target version folder, `.minecraft/versions/<ver>/installer_profile.json`
2. Download Dependencies
   1. Merge libraires in `installer_profile.json` and `<ver>.json`
   2. Download them
3. Post processing forge jar
   1. Parse `installer_profile.json`
   2. Get the processors info and execute all of them.

The `ForgeInstaller.install` will do all of them.

The `ForgeInstaller.installByInstallerPartial` will do 2 and 3.

If you want to just do step 3, you can use `ForgeInstaller.diagnose` and find which libraries is break and use `ForgeInstaller.postProcess` to handle it.


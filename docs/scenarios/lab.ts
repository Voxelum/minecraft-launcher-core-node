// core packages

import { Installer } from '@xmcl/installer';
import { launch, Version } from '@xmcl/core';
import { login } from '@xmcl/user';

// additional packages

import { Forge } from '@xmcl/mod-parser';
import { ResourcePack } from '@xmcl/resourcepack';
import { ResourceManager } from '@xmcl/resource-manager';
import { parse } from '@xmcl/gamesetting';
import { TextComponent } from '@xmcl/text-component';
import { WorldReader } from '@xmcl/world';

// three shaking usage
// not all packages have this feature
import { readModMetaData } from '@xmcl/mod-parser/forge';

readModMetaData; // equal to Forge.readModMetaData
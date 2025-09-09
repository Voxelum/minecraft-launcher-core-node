import { Instance, InstanceSchema, createInstanceTemplate } from './instance';
import type { VersionMetadataProvider } from './internal_type';
import { assignShallow } from './edit';

/**
 * Load and assign instance data from options
 */
export function loadInstanceFromOptions(
  options: InstanceSchema,
  versionProvider: VersionMetadataProvider
): Instance {
  const instance = createInstanceTemplate();

  // Assign basic properties
  instance.author = options.author || '';
  assignShallow(instance, options);

  instance.name = instance.name.trim();
  // Handle runtime versions
  if (options.runtime) {
    assignShallow(instance.runtime, options.runtime);
  }

  // Assign specific properties with type safety
  instance.assignMemory = options.assignMemory ?? instance.assignMemory;
  instance.showLog = options.showLog ?? instance.showLog;
  instance.hideLauncher = options.hideLauncher ?? instance.hideLauncher;
  instance.fastLaunch = options.fastLaunch ?? instance.fastLaunch;
  instance.icon = options.icon ?? instance.icon;
  instance.maxMemory = options.maxMemory ?? instance.maxMemory;
  instance.minMemory = options.minMemory ?? instance.minMemory;
  instance.vmOptions = options.vmOptions ?? instance.vmOptions;
  instance.mcOptions = options.mcOptions ?? instance.mcOptions;
  instance.creationDate = options.creationDate ?? instance.creationDate;
  instance.lastAccessDate = options.lastAccessDate ?? instance.lastAccessDate;
  instance.disableAuthlibInjector = options.disableAuthlibInjector ?? instance.disableAuthlibInjector;
  instance.disableElybyAuthlib = options.disableElybyAuthlib ?? instance.disableElybyAuthlib;

  // Handle resolution
  if (options.resolution) {
    if (instance.resolution) {
      instance.resolution.width = options.resolution.width;
      instance.resolution.height = options.resolution.height;
      instance.resolution.fullscreen = options.resolution.fullscreen;
    } else {
      instance.resolution = options.resolution;
    }
  }

  // Set default minecraft version if not specified
  instance.runtime.minecraft = instance.runtime.minecraft || versionProvider.getLatestRelease();

  // Assign remaining properties
  instance.upstream = options.upstream;
  instance.playTime = options.playTime ?? instance.playTime;
  instance.lastPlayedDate = options.lastPlayedDate ?? instance.lastPlayedDate;
  instance.prependCommand = options.prependCommand ?? instance.prependCommand;

  if (options.server) {
    instance.server = options.server;
  }

  return instance;
}

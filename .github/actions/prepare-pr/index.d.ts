declare interface Package {
    name: string;
    content: PackageJSON;
    /**
     * Level of change
     */
    level?: Level
    /**
     * Release type
     */
    releaseType?: ReleaseType;
    passive?: boolean;
    newVersion?: string;

    reasons?: Commit[]
    feats?: Commit[]
    fixes?: Commit[]
    breakings?: Commit[]
}

interface PackageJSON {
    name: string;
    version: string;
    dependencies?: { [name: string]: string };
}

type Level = 0 | 1 | 2

type Commit = import('conventional-commits-parser').Commit
type Recomendation = import('conventional-recommended-bump').Callback.Recommendation
type ReleaseType = import('conventional-recommended-bump').Callback.Recommendation.ReleaseType

interface BumpSuggestion extends Recomendation {
    level: Level
    reasons: Commit[]
    feats: Commit[]
    fixes: Commit[]
    breakings: Commit[]
}
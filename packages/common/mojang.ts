
export interface MojangAccount {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly registerIp: string;
    readonly registeredAt: Long;
    readonly passwordChangedAt: Long;
    readonly dateOfBirth: Long;
    readonly deleted: boolean;
    readonly blocked: boolean;
    readonly secured: boolean;
    readonly migrated: boolean;
    readonly emailVerified: boolean;
    readonly legacyUser: boolean;
    readonly verifiedByParent: boolean;
    readonly fullName: string;
    readonly fromMigratedUser: boolean;
    readonly hashed: boolean;
}

export interface MojangChallenge {
    readonly answer: { id: number };
    readonly question: { id: number; question: string; };
}

export interface MojangChallengeResponse {
    id: number;
    answer: string;
}

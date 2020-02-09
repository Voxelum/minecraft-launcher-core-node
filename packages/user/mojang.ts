import { httpRequester as request } from "./util";

/**
 * Users defined question when they register this account
 *
 * The question id, content mapping is:
 *
 * 1. What is your favorite pet's name?
 * 2. What is your favorite movie?
 * 3. What is your favorite author's last name?
 * 4. What is your favorite artist's last name?
 * 5. What is your favorite actor's last name?
 * 6. What is your favorite activity?
 * 7. What is your favorite restaurant?
 * 8. What is the name of your favorite cartoon?
 * 9. What is the name of the first school you attended?
 * 10. What is the last name of your favorite teacher?
 * 11. What is your best friend's first name?
 * 12. What is your favorite cousin's name?
 * 13. What was the first name of your first girl/boyfriend?
 * 14. What was the name of your first stuffed animal?
 * 15. What is your mother's middle name?
 * 16. What is your father's middle name?
 * 17. What is your oldest sibling's middle name?
 * 18. In what city did your parents meet?
 * 19. In what hospital were you born?
 * 20. What is your favorite team?
 * 21. How old were you when you got your first computer?
 * 22. How old were you when you got your first gaming console?
 * 23. What was your first video game?
 * 24. What is your favorite card game?
 * 25. What is your favorite board game?
 * 26. What was your first gaming console?
 * 27. What was the first book you ever read?
 * 28. Where did you go on your first holiday?
 * 29. In what city does your grandmother live?
 * 30. In what city does your grandfather live?
 * 31. What is your grandmother's first name?
 * 32. What is your grandfather's first name?
 * 33. What is your least favorite food?
 * 34. What is your favorite ice cream flavor?
 * 35. What is your favorite ice cream flavor?
 * 36. What is your favorite place to visit?
 * 37. What is your dream job?
 * 38. What color was your first pet?
 * 39. What is your lucky number?s
 *
 */
export interface MojangChallenge {
    readonly answer: { id: number };
    readonly question: { id: number; question: string; };
}

export interface MojangChallengeResponse {
    id: number;
    answer: string;
}

// export enum Status {
//     GREEN, YELLOW, RED,
// }
// /**
//  * Get the all mojang server statuses
//  *
//  * @param provider
//  */
// export async function getServiceStatus(): Promise<{ [server: string]: Status }> {
//     const { body } = await request({
//         url: "https://status.mojang.com/check", method: "GET",
//         headers: {}
//     });
//     return JSON.parse(body).reduce((a: any, b: any) => Object.assign(a, b), {});
// }

/**
 * Check if user need to verify its identity. If this return false, should perform such operations:
 * 1. call `getChallenges` get all questions
 * 2. let user response questions
 * 3. call `responseChallenges` to send user responsed questions, if false, redo `2` step.
 *
 * If you don't let user response challenges when this return false. You won't be able to get/set user texture from Mojang server.
 *
 * *(This only work for Mojang account. Third party definitly doesn't have such thing)*
 * @param accessToken You user access token.
 */
export async function checkLocation(accessToken: string): Promise<boolean> {
    // "ForbiddenOperationException";
    // "Current IP is not secured";
    const { statusCode } = await request({
        url: "https://api.mojang.com/user/security/location",
        method: "GET",
        headers: { Authorization: `Bearer: ${accessToken}` },
    });
    return statusCode === 204;
}

/**
 * Get the user set challenge to response.
 *
 * @param accessToken The user access token
 * @returns User pre-defined questions
 */
export async function getChallenges(accessToken: string): Promise<MojangChallenge[]> {
    const { body, statusCode, statusMessage } = await request({
        url: "https://api.mojang.com/user/security/challenges",
        method: "GET",
        headers: { Authorization: `Bearer: ${accessToken}` },
    });
    if (statusCode < 200 || statusCode >= 300) {
        throw { error: "General", statusCode, statusMessage };
    }
    const challenges = JSON.parse(body);
    return challenges;
}

/**
 * Response the challeges from `getChallenges`.
 *
 * @param accessToken The access token
 * @param responses Your responses
 * @returns True for correctly responsed all questions
 */
export async function responseChallenges(accessToken: string, responses: MojangChallengeResponse[]): Promise<boolean> {
    const { statusCode } = await request({
        url: "https://api.mojang.com/user/security/location",
        method: "POST",
        body: responses,
        bodyType: "json",
        headers: { Authorization: `Bearer: ${accessToken}` },
    });
    return statusCode >= 200 && statusCode < 300;
}

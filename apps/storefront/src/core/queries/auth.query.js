import { gql } from './gql';

export class PosLoginCommand {
    async execute(username, password, loginRole) {
        const data = await gql(`
            mutation PosLogin($username: String!, $password: String!, $loginRole: String!) {
                posLogin(username: $username, password: $password, loginRole: $loginRole) {
                    token userId username role displayName
                }
            }
        `, { useAdmin: true, variables: { username, password, loginRole } });
        return data.posLogin;
    }
}

export class PosValidateTokenQuery {
    async execute(token) {
        const data = await gql(`
            query PosValidateToken($token: String!) {
                posValidateToken(token: $token) {
                    userId username role displayName
                }
            }
        `, { useAdmin: true, variables: { token } });
        return data.posValidateToken;
    }
}

export class PosListUsersQuery {
    async execute() {
        const data = await gql(`
            query PosUsers {
                posUsers { id username role displayName active createdAt }
            }
        `, { useAdmin: true });
        return data.posUsers;
    }
}

export class PosCreateUserCommand {
    async execute(input) {
        const data = await gql(`
            mutation PosCreateUser($input: CreatePosUserInput!) {
                posCreateUser(input: $input) { id username role displayName active }
            }
        `, { useAdmin: true, variables: { input } });
        return data.posCreateUser;
    }
}

export class PosUpdateUserCommand {
    async execute(id, input) {
        const data = await gql(`
            mutation PosUpdateUser($id: ID!, $input: UpdatePosUserInput!) {
                posUpdateUser(id: $id, input: $input) { id username role displayName active }
            }
        `, { useAdmin: true, variables: { id, input } });
        return data.posUpdateUser;
    }
}

export class PosDeleteUserCommand {
    async execute(id) {
        const data = await gql(`
            mutation PosDeleteUser($id: ID!) {
                posDeleteUser(id: $id)
            }
        `, { useAdmin: true, variables: { id } });
        return data.posDeleteUser;
    }
}

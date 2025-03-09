/**
 * @fileoverview Service for handling authentication operations with Azure AD B2C
 * @version 1.0.0
 */

import { UserRoleType } from '@/models/user.model';
import type { LoginCredentials, AuthToken, MfaChallenge } from '@/models/auth.model';
import type { IUser } from '@/models/user.model';
import axios from 'axios';

// Map UserRoleType to numeric role IDs
const ROLE_ID_MAP = {
    [UserRoleType.Admin]: 1,
    [UserRoleType.Operations]: 2,
    [UserRoleType.Inspector]: 3,
    [UserRoleType.CustomerService]: 4
};

interface AuthResponse {
    tokens: AuthToken;
    user: IUser;
    requiresMfa?: boolean;
    mfaChallenge?: MfaChallenge;
}

interface TestUser {
    id: number;
    firstName: string;
    lastName: string;
    roleId: number;
}



export async function performAzureAuth(credentials: LoginCredentials): Promise<AuthResponse> {
 

    // TODO: Implement actual Azure AD B2C authentication
  try {
    const response = await axios.post('http://192.168.10.154:5235/api/v1/auth/login', credentials);
    console.log(response);
    return {
        tokens : response.data.tokens,
        user : {
            id: response.data.user.id,
            email: credentials.email,
            firstName: response.data.user.firstName,
            lastName: response.data.user.lastName,
            phoneNumber: null, // Explicitly set as null
            isActive: true,
            azureAdB2CId: "",
            userRoles: [
              {
                id: ROLE_ID_MAP[UserRoleType.Admin], // Map to roleId
                userId: response.data.user.id,
                roleId: ROLE_ID_MAP[UserRoleType.Admin], // Store the correct roleId
                assignedAt: new Date(), // Ensure Date type
                revokedAt: null,
              },
            ],
            createdAt: new Date(),
            modifiedAt: null,
            lastLoginAt: new Date(),
        }
    };
  } catch (error) {
    console.log(error);
    throw new Error('Authentication failed');
  }

}

export async function completeMfaChallenge(verificationCode: string): Promise<AuthResponse> {
    // TODO: Implement actual MFA verification
    return {
        tokens: {
            accessToken: 'dummy_access_token',
            refreshToken: 'dummy_refresh_token',
            idToken: 'dummy_id_token',
            tokenType: 'Bearer',
            scope: ['openid', 'profile'],
            expiresIn: 3600,
            expiresAt: new Date(Date.now() + 3600 * 1000)
        },
        user: {
            id: 123,
            email: 'user@example.com',
            firstName: 'Test',
            lastName: 'User',
            phoneNumber: null,
            isActive: true,
            azureAdB2CId: 'dummy_azure_id',
            userRoles: [{
                id: 1,
                userId: 123,
                roleId: ROLE_ID_MAP[UserRoleType.CustomerService],
                assignedAt: new Date(),
                revokedAt: null
            }],
            createdAt: new Date(),
            modifiedAt: null,
            lastLoginAt: new Date()
        }
    };
}

export async function performTokenRefresh(refreshToken: string): Promise<AuthResponse> {
    // TODO: Implement actual token refresh

    // Generate new tokens with same expiration (24 hours)
    const expiresIn = 24 * 60 * 60; // 24 hours in seconds
    const tokens = {
        accessToken: 'new_dummy_access_token_' + Date.now(),
        refreshToken: 'new_dummy_refresh_token_' + Date.now(),
        idToken: 'new_dummy_id_token_' + Date.now(),
        tokenType: 'Bearer',
        scope: ['openid', 'profile'],
        expiresIn: expiresIn,
        expiresAt: new Date(Date.now() + expiresIn * 1000)
    };

    // Return same user info with new tokens
    return {
        tokens,
        user: {
            id: 123,
            email: 'user@example.com',
            firstName: 'Test',
            lastName: 'User',
            phoneNumber: null,
            isActive: true,
            azureAdB2CId: 'dummy_azure_id',
            userRoles: [{
                id: 1,
                userId: 123,
                roleId: ROLE_ID_MAP[UserRoleType.CustomerService],
                assignedAt: new Date(),
                revokedAt: null
            }],
            createdAt: new Date(),
            modifiedAt: null,
            lastLoginAt: new Date()
        }
    };
}

export async function terminateSession(sessionId: string): Promise<void> {
    // TODO: Implement actual session termination
}

export async function verifyTokenIntegrity(tokens: AuthToken): Promise<boolean> {
    // For development, always return true to prevent unnecessary logouts
    return true;
}

export async function captureDeviceInfo(): Promise<any> {
    // TODO: Implement actual device info capture
    return {
        deviceId: 'dummy_device_id',
        userAgent: navigator.userAgent,
        ipAddress: '127.0.0.1'
    };
}

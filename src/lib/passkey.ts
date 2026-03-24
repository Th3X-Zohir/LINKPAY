import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from '@simplewebauthn/server'
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON
} from '@simplewebauthn/types'
import { db } from './db'

const RP_NAME = 'LinkPay BD'
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost'
const TIMEOUT = 60000 // 60 seconds

export interface PasskeyCredential {
  id: string
  publicKey: string
  counter: number
  deviceType?: string
  name?: string
}

export async function generatePasskeyRegistrationOptions(
  userId: string,
  email: string
): Promise<{ success: true; options: PublicKeyCredentialCreationOptionsJSON } | { success: false; error: string }> {
  try {
    // Get existing credentials for this user
    const existingPasskeys = await db.passkey.findMany({
      where: { userId },
      select: { credentialId: true }
    })

    const user = await db.user.findUnique({
      where: { id: userId },
      select: { name: true }
    })

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: userId,
      userName: email,
      userDisplayName: user?.name || email,
      timeout: TIMEOUT,
      attestationType: 'none',
      excludeCredentials: existingPasskeys.map(pk => ({
        id: Buffer.from(pk.credentialId, 'base64url'),
        type: 'public-key' as const
      })),
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred',
        residentKey: 'preferred'
      }
    })

    // Store challenge for later verification
    // In production, you'd store this in a session/Redis

    return { success: true, options }
  } catch (error) {
    console.error('Passkey registration options error:', error)
    return { success: false, error: 'Failed to generate registration options' }
  }
}

export async function verifyPasskeyRegistration(
  userId: string,
  credential: RegistrationResponseJSON,
  expectedChallenge: string
): Promise<{ success: true; passkey: PasskeyCredential } | { success: false; error: string }> {
  try {
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      expectedRPID: RP_ID,
      requireUserVerification: false
    })

    if (!verification.verified || !verification.registrationInfo) {
      return { success: false, error: 'Registration verification failed' }
    }

    const { credentialPublicKey, credentialID, counter, credentialDeviceType } = verification.registrationInfo

    // Store the credential
    const passkey = await db.passkey.create({
      data: {
        userId,
        credentialId: Buffer.from(credentialID).toString('base64url'),
        publicKey: Buffer.from(credentialPublicKey).toString('base64url'),
        counter,
        deviceType: credentialDeviceType || undefined
      }
    })

    return {
      success: true,
      passkey: {
        id: passkey.id,
        publicKey: passkey.publicKey,
        counter: passkey.counter,
        deviceType: passkey.deviceType || undefined
      }
    }
  } catch (error) {
    console.error('Passkey registration verification error:', error)
    return { success: false, error: 'Failed to verify registration' }
  }
}

export async function generatePasskeyAuthenticationOptions(
  email: string
): Promise<{ success: true; options: PublicKeyCredentialRequestOptionsJSON; userId: string } | { success: false; error: string }> {
  try {
    const user = await db.user.findUnique({
      where: { email },
      include: {
        passkeys: true
      }
    })

    if (!user || user.passkeys.length === 0) {
      return { success: false, error: 'No passkeys found for this user' }
    }

    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      timeout: TIMEOUT,
      userVerification: 'preferred',
      allowCredentials: user.passkeys.map(pk => ({
        id: Buffer.from(pk.credentialId, 'base64url'),
        type: 'public-key' as const
      }))
    })

    return { success: true, options, userId: user.id }
  } catch (error) {
    console.error('Passkey authentication options error:', error)
    return { success: false, error: 'Failed to generate authentication options' }
  }
}

export async function verifyPasskeyAuthentication(
  userId: string,
  credential: AuthenticationResponseJSON,
  expectedChallenge: string,
  credentialId: string
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const passkey = await db.passkey.findFirst({
      where: {
        userId,
        credentialId
      }
    })

    if (!passkey) {
      return { success: false, error: 'Passkey not found' }
    }

    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge,
      expectedOrigin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      expectedRPID: RP_ID,
      authenticator: {
        credentialPublicKey: Buffer.from(passkey.publicKey, 'base64url'),
        credentialID: Buffer.from(passkey.credentialId, 'base64url'),
        counter: passkey.counter
      },
      requireUserVerification: false
    })

    // Update counter
    await db.passkey.update({
      where: { id: passkey.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Passkey authentication verification error:', error)
    return { success: false, error: 'Failed to verify authentication' }
  }
}

export async function getUserPasskeys(userId: string): Promise<PasskeyCredential[]> {
  const passkeys = await db.passkey.findMany({
    where: { userId },
    select: {
      id: true,
      credentialId: true,
      publicKey: true,
      counter: true,
      deviceType: true,
      name: true,
      createdAt: true,
      lastUsedAt: true
    }
  })

  return passkeys.map(pk => ({
    id: pk.id,
    publicKey: pk.publicKey,
    counter: pk.counter,
    deviceType: pk.deviceType || undefined,
    name: pk.name || undefined
  }))
}

export async function deletePasskey(userId: string, passkeyId: string): Promise<boolean> {
  try {
    await db.passkey.delete({
      where: {
        id: passkeyId,
        userId // Ensure user owns this passkey
      }
    })
    return true
  } catch {
    return false
  }
}

import "server-only";
import { signAppleStoreCard, signGoogleSaveJwt } from "./wallet-signing";
import {
  appleStoreCard,
  googleLoyaltyObject,
  type WalletMember,
} from "./wallet";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error("Wallet is not configured");
  return value;
}
function secretBuffer(name: string) {
  return Buffer.from(required(name), "base64");
}
export function prepareSignedAppleCard(
  member: WalletMember,
  encryptedTokenAfterDecryption: string,
  assets: Record<string, Buffer>,
) {
  const payload = appleStoreCard(member, {
    passTypeIdentifier: required("APPLE_PASS_TYPE_IDENTIFIER"),
    teamIdentifier: required("APPLE_TEAM_IDENTIFIER"),
    webServiceURL: required("WALLET_WEB_SERVICE_URL"),
    authenticationToken: encryptedTokenAfterDecryption,
  });
  return signAppleStoreCard(payload, assets, {
    signerCert: secretBuffer("APPLE_PASS_CERTIFICATE_BASE64"),
    signerKey: secretBuffer("APPLE_PASS_PRIVATE_KEY_BASE64"),
    wwdr: secretBuffer("APPLE_WWDR_CERTIFICATE_BASE64"),
    signerKeyPassphrase: process.env.APPLE_PASS_PRIVATE_KEY_PASSPHRASE,
  });
}
export function prepareSignedGoogleCard(member: WalletMember) {
  const object = googleLoyaltyObject(member, {
    issuerId: required("GOOGLE_WALLET_ISSUER_ID"),
    classId: required("GOOGLE_WALLET_CLASS_ID"),
  });
  return signGoogleSaveJwt(object, {
    email: required("GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL"),
    privateKey: secretBuffer("GOOGLE_WALLET_PRIVATE_KEY_BASE64").toString(
      "utf8",
    ),
    origins: required("GOOGLE_WALLET_ALLOWED_ORIGINS")
      .split(",")
      .map((x) => x.trim()),
  });
}

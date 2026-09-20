// Node-only provider primitives. Credentials are passed by a server-only adapter.
// These functions are intentionally not exposed by a public route before review.
import { createPrivateKey, sign, X509Certificate } from "node:crypto";
import { PKPass } from "passkit-generator";
import type { appleStoreCard, googleLoyaltyObject } from "./wallet";

type ApplePayload = ReturnType<typeof appleStoreCard>;
type GoogleObject = ReturnType<typeof googleLoyaltyObject>;
export function signAppleStoreCard(
  payload: ApplePayload,
  assets: Record<string, Buffer>,
  certificates: {
    signerCert: Buffer;
    signerKey: Buffer;
    wwdr: Buffer;
    signerKeyPassphrase?: string;
  },
) {
  for (const name of ["icon.png", "icon@2x.png"]) {
    const buffer = assets[name];
    if (
      !buffer ||
      !buffer
        .subarray(0, 8)
        .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    )
      throw new Error("Wallet PNG assets missing");
  }
  if (
    Object.entries(assets).some(
      ([name, buffer]) =>
        !/^(icon|logo)(@2x|@3x)?\.png$/.test(name) || buffer.length > 1000000,
    )
  )
    throw new Error("Unexpected Wallet asset");
  const cert = new X509Certificate(certificates.signerCert);
  const authority = new X509Certificate(certificates.wwdr);
  if (
    Date.now() > Date.parse(cert.validTo) ||
    Date.now() < Date.parse(cert.validFrom)
  )
    throw new Error("Wallet certificate is not valid");
  const key = createPrivateKey({
    key: certificates.signerKey,
    passphrase: certificates.signerKeyPassphrase,
  });
  if (!cert.checkPrivateKey(key) || !cert.verify(authority.publicKey))
    throw new Error("Wallet certificate chain mismatch");
  if (
    !cert.subject.includes(payload.passTypeIdentifier) ||
    !cert.subject.includes(payload.teamIdentifier)
  )
    throw new Error("Wallet certificate identity mismatch");
  const pass = new PKPass(
    { ...assets, "pass.json": Buffer.from(JSON.stringify(payload)) },
    certificates,
  );
  return pass.getAsBuffer();
}

export function signGoogleSaveJwt(
  object: GoogleObject,
  credentials: { email: string; privateKey: string; origins: string[] },
  issuedAt = Math.floor(Date.now() / 1000),
) {
  if (
    !credentials.email.endsWith(".iam.gserviceaccount.com") ||
    !credentials.origins.length
  )
    throw new Error("Google Wallet credentials missing");
  const origins = credentials.origins.map((value) => {
    const origin = new URL(value);
    if (origin.protocol !== "https:" || origin.origin !== value)
      throw new Error("HTTPS origin required");
    return origin.origin;
  });
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" }),
  ).toString("base64url");
  const body = Buffer.from(
    JSON.stringify({
      iss: credentials.email,
      aud: "google",
      typ: "savetowallet",
      iat: issuedAt,
      origins,
      payload: { loyaltyObjects: [object] },
    }),
  ).toString("base64url");
  const key = createPrivateKey(credentials.privateKey);
  if (key.asymmetricKeyType !== "rsa")
    throw new Error("RSA service account key required");
  const signingInput = header + "." + body;
  const signature = sign("RSA-SHA256", Buffer.from(signingInput), key).toString(
    "base64url",
  );
  return signingInput + "." + signature;
}

// Provider object IDs remain stable. A retry after POST 409 updates the same card.
// PUT replaces the entire object, removing a former barcode on inactive cards.
export async function syncGoogleObject(
  object: GoogleObject,
  accessToken: string,
  fetcher: typeof fetch = fetch,
) {
  if (!accessToken || !/^\d+\.club_[0-9a-f]{32}$/.test(object.id))
    throw new Error("Invalid Wallet synchronization");
  const root =
    "https://walletobjects.googleapis.com/walletobjects/v1/loyaltyObject";
  const request = {
    headers: {
      Authorization: "Bearer " + accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(object),
    signal: AbortSignal.timeout(15000),
  };
  let response = await fetcher(root + "/" + encodeURIComponent(object.id), {
    ...request,
    method: "PUT",
  });
  if (response.status === 404) {
    response = await fetcher(root, { ...request, method: "POST" });
    if (response.status === 409)
      response = await fetcher(root + "/" + encodeURIComponent(object.id), {
        ...request,
        method: "PUT",
      });
  }
  if (!response.ok)
    throw new Error(
      "Google Wallet synchronization failed (" + response.status + ")",
    );
}

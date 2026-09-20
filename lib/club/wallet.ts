// Pure payload builders; caller must obtain this data from the authenticated member.
// No provider is enabled until signing, delivery, update workers and official tests pass.
export type WalletMember = {
  id: string;
  cardIdentifier: string;
  number: string;
  name: string;
  balance: number;
  status: "active" | "suspended" | "closed";
};
export function cardPayload(identifier: string) {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      identifier,
    )
  )
    throw new Error("Invalid card identifier");
  return "LC1:" + identifier;
}
function validateMember(member: WalletMember) {
  if (
    !/^[0-9a-f-]{36}$/i.test(member.id) ||
    !Number.isSafeInteger(member.balance) ||
    member.balance < 0
  )
    throw new Error("Invalid member");
}
export function appleStoreCard(
  member: WalletMember,
  config: {
    passTypeIdentifier: string;
    teamIdentifier: string;
    webServiceURL: string;
    authenticationToken: string;
  },
) {
  validateMember(member);
  if (
    !config.webServiceURL.startsWith("https://") ||
    config.authenticationToken.length < 32
  )
    throw new Error("Secure Wallet configuration required");
  const active = member.status === "active";
  return {
    formatVersion: 1,
    passTypeIdentifier: config.passTypeIdentifier,
    teamIdentifier: config.teamIdentifier,
    serialNumber: "club-" + member.id,
    organizationName: "LACACCINO",
    description: "LACACCINO Club Mitgliedskarte",
    logoText: "LACACCINO CLUB",
    backgroundColor: "rgb(24, 18, 14)",
    foregroundColor: "rgb(245, 237, 221)",
    labelColor: "rgb(203, 179, 135)",
    webServiceURL: config.webServiceURL,
    authenticationToken: config.authenticationToken,
    voided: !active,
    storeCard: {
      primaryFields: [
        {
          key: "points",
          label: active ? "DEINE PUNKTE" : "MITGLIEDSCHAFT INAKTIV",
          value: active ? member.balance : 0,
        },
      ],
      secondaryFields: [
        {
          key: "member",
          label: "MITGLIED",
          value:
            member.status === "closed" ? "Mitgliedschaft beendet" : member.name,
        },
      ],
      auxiliaryFields: [
        { key: "number", label: "MITGLIEDSNUMMER", value: member.number },
      ],
      backFields: [
        {
          key: "notice",
          label: "Hinweis",
          value:
            "Diese Karte dient ausschließlich zur Identifikation. Punkte und Prämien werden durch berechtigtes Personal geprüft. Der Punktestand im Club ist maßgeblich.",
        },
      ],
    },
    ...(active
      ? {
          barcodes: [
            {
              format: "PKBarcodeFormatQR",
              message: cardPayload(member.cardIdentifier),
              messageEncoding: "iso-8859-1",
            },
          ],
        }
      : {}),
  };
}
export function googleLoyaltyObject(
  member: WalletMember,
  config: { issuerId: string; classId: string },
) {
  validateMember(member);
  if (
    !/^\d+$/.test(config.issuerId) ||
    !config.classId.startsWith(config.issuerId + ".")
  )
    throw new Error("Invalid Google issuer");
  const active = member.status === "active";
  return {
    id: config.issuerId + ".club_" + member.id.replaceAll("-", ""),
    classId: config.classId,
    state: active ? "ACTIVE" : "INACTIVE",
    accountId: member.number,
    accountName:
      member.status === "closed" ? "Mitgliedschaft beendet" : member.name,
    hexBackgroundColor: "#18120e",
    loyaltyPoints: {
      label: "Punkte",
      balance: { int: active ? member.balance : 0 },
    },
    ...(active
      ? {
          barcode: {
            type: "QR_CODE",
            value: cardPayload(member.cardIdentifier),
          },
        }
      : {}),
    textModulesData: [
      {
        id: "identification",
        header: "Dein LACACCINO Club",
        body: "Karte zur Identifikation. Punkte und Prämien erfordern eine berechtigte Mitarbeiteraktion.",
      },
    ],
  };
}
export function walletReadiness() {
  return [
    {
      provider: "Apple Wallet",
      ready: false as const,
      label: "Noch nicht eingerichtet",
      detail:
        "Apple Wallet wird später freigeschaltet. Deine persönliche Karte im Portal ist bereits griffbereit.",
    },
    {
      provider: "Google Wallet",
      ready: false as const,
      label: "Noch nicht eingerichtet",
      detail:
        "Google Wallet wird später freigeschaltet. Bis dahin zeigst du einfach die Karte aus deinem Club vor.",
    },
  ];
}

export const ENV = {
  APP_ID: process.env.NEXT_PUBLIC_APP_ID || "app_58fcaf4e2fdc019a1f6219064ee9c5e4",
  RP_ID: process.env.NEXT_PUBLIC_RP_ID || process.env.WORLD_RP_ID || "rp_5b67fb974cb00239",
  SIGNER_ADDRESS:
    process.env.DEV_SIGNER_ADDRESS ||
    process.env.NEXT_PUBLIC_SIGNER_ADDRESS ||
    "0x3D5995Eb27fb94c9b2E6356A14ba5F3503904707",
  SIGNER_PRIVATE_KEY: process.env.DEV_SIGNER_PRIVATE_KEY || "",
  DEFAULT_DEMO_MODE: process.env.NEXT_PUBLIC_DEFAULT_DEMO_MODE !== "false",
} as const;

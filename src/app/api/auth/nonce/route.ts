import { NextResponse } from "next/server";
import { generateSiweNonce } from "viem/siwe";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const nonce = generateSiweNonce();

    // Store nonce in secure HTTP-only cookie
    const cookieStore = await cookies();
    cookieStore.set("siwe_nonce", nonce, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 15, // 15 minutes
      path: "/",
    });

    return NextResponse.json({ nonce }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate nonce";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

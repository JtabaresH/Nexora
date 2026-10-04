const USER_OP_LOOKUP_URL = "https://developer.world.org/api/v2/minikit/userop";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;
  if (!/^0x[a-fA-F0-9]{64}$/.test(hash)) {
    return Response.json({ error: "Invalid user operation hash" }, { status: 400 });
  }

  try {
    const response = await fetch(`${USER_OP_LOOKUP_URL}/${hash}`, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      return Response.json({ error: "User operation lookup failed" }, { status: 502 });
    }

    const data = await response.json();
    return Response.json({
      status: data.status,
      transactionHash: data.transaction_hash ?? null,
    });
  } catch {
    return Response.json({ error: "User operation lookup failed" }, { status: 502 });
  }
}

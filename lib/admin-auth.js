import { NextResponse } from "next/server";

const DEFAULT_ADMIN_USERNAME = "Yasir";
const DEFAULT_ADMIN_PASSWORD = "Yasir";

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME || DEFAULT_ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD,
  };
}

export function isAuthorizedRequest(request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return false;
  }

  try {
    const encoded = authHeader.split(" ")[1];
    const decoded = Buffer.from(encoded, "base64").toString("utf8");
    const separatorIndex = decoded.indexOf(":");

    if (separatorIndex === -1) {
      return false;
    }

    const username = decoded.slice(0, separatorIndex);
    const password = decoded.slice(separatorIndex + 1);
    const adminCredentials = getAdminCredentials();

    return (
      username === adminCredentials.username &&
      password === adminCredentials.password
    );
  } catch {
    return false;
  }
}

export function unauthorizedResponse() {
  return new NextResponse("Yetkilendirme gerekli", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin Panel"',
    },
  });
}

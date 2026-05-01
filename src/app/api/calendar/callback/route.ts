import { google } from "googleapis";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2Client.getToken(code);
    
    // In a real application, you would save these tokens to the user's Firestore document.
    // However, since we don't have the user session context in this generic callback without extra setup (like state parameter),
    // we'll redirect back to the app with the tokens in the URL (for simplicity in this demo),
    // or typically we'd set a cookie and read it in the frontend to save.
    
    // For this implementation, we will pass it back to a special frontend route to save:
    const returnUrl = new URL('/agenda/setup', request.url);
    returnUrl.searchParams.set('tokens', encodeURIComponent(JSON.stringify(tokens)));
    
    return NextResponse.redirect(returnUrl);
  } catch (error) {
    console.error("Error retrieving access token", error);
    return NextResponse.json({ error: "Failed to retrieve access token" }, { status: 500 });
  }
}

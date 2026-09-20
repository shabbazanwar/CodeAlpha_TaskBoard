import { withAuth } from "next-auth/middleware";

// Every route listed in `matcher` requires a session; unauthenticated visitors
// are redirected to /login?callbackUrl=<the page they wanted>.
export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  matcher: ["/projects/:path*"],
};

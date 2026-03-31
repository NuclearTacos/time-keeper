import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
} from "@convex-dev/auth/nextjs/server";

const isPublicRoute = createRouteMatcher(["/signin"]);

export default convexAuthNextjsMiddleware((request, { convexAuth }) => {
  if (!isPublicRoute(request) && !convexAuth.isAuthenticated()) {
    return convexAuth.redirectToSignIn();
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

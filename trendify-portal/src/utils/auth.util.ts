import { publicRoutes } from "@/routes/define.route";

export const isPublicPath = (path: string): boolean => {
  return publicRoutes.some((publicPath) => path.startsWith(publicPath.path));
};

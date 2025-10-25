import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/projects._index.tsx"),
  route("projects/:projectId/board", "routes/projects.$projectId.board.tsx"),
] satisfies RouteConfig;

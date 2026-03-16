import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { IRoute, privateRoutes, publicRoutes } from "@/routes/define.route";

import NotFound from "@/pages/not-found/NotFound";
import { Private, Public } from "@/pages/guards";

const App = () => {
  const renderRoutes = (routes: IRoute[]) => {
    return routes.map((route) => {
      const Page = route.element;
      const Sidebar = route.sidebar || React.Fragment;
      const Header = route.header || React.Fragment;
      const Layout = route?.layout || React.Fragment;

      return (
        <Route
          path={route.path}
          element={
            route?.layout ? (
              <Layout sidebar={<Sidebar />} header={<Header />}>
                <Page />
              </Layout>
            ) : (
              <Page />
            )
          }
        >
          {route.children && renderRoutes(route.children)}
        </Route>
      );
    });
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* public routes */}
        <Route element={<Public />}> {renderRoutes(publicRoutes)}</Route>

        {/* private routes */}
        <Route element={<Private />}>{renderRoutes(privateRoutes)}</Route>

        {/* not found */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;

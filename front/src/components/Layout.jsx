import React, { useContext } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";

const Layout = ({ userRole }) => {
  const { theme } = useContext(ThemeContext);

  return (
    <div className={`min-h-screen flex ${theme === "dark" ? "dark bg-gray-900" : "bg-gray-100"} transition-all duration-300`}>
      <Sidebar userRole={userRole} />
      <div className="flex-1 ml-20 md:ml-64">
        <Header />
        <main className="p-6 bg-white dark:bg-gray-800 rounded-tl-2xl shadow-md min-h-[calc(100vh-4rem)] transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
import React, { useState } from "react";
import { LuUser, LuLogOut, LuMenu, LuX } from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/image/logo.png";
import { SIDEBAR_LINKS } from "../data/sidebarConfig";

const Sidebar = ({ userRole }) => {
  const [activeLink, setActiveLink] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleClick = (index) => {
    setActiveLink(index);
    setIsOpen(false);
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        { withCredentials: true }
      );
      navigate("/login");
    } catch (err) {
      console.error("Erreur lors de la déconnexion:", err);
    }
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const links = SIDEBAR_LINKS[userRole] || [];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-20 p-2.5 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-all duration-200 ease-in-out"
        aria-label={isOpen ? "Fermer la barre latérale" : "Ouvrir la barre latérale"}
      >
        {isOpen ? <LuX className="text-xl" /> : <LuMenu className="text-xl" />}
      </button>

      {/* Sidebar */}
      <div
        className={`w-20 md:w-64 fixed left-0 top-0 z-10 h-screen border-r pt-6 px-4 shadow-lg flex flex-col transition-all duration-300 ease-in-out ${
          document.documentElement.className === "dark"
            ? "bg-gray-800 border-gray-700 text-gray-100"
            : "bg-white border-gray-200 text-gray-800"
        } ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        {/* Logo and App Name */}
        <div className="mb-8 flex items-center justify-center md:justify-start space-x-3">
          <img src={logo} alt="Logo" className="w-10 h-10" />
          <span className="text-xl font-bold hidden md:block">App Orthanc</span>
        </div>

        {/* Navigation Links */}
        <ul className="mt-6 space-y-2 flex-1">
          {links.map((link, index) => (
            <li
              key={index}
              className={`rounded-lg py-2 px-3 hover:bg-blue-500 hover:text-white transition-all duration-200 ease-in-out transform hover:scale-105 ${
                activeLink === index
                  ? document.documentElement.className === "dark"
                    ? "bg-blue-600 text-white"
                    : "bg-blue-100 text-blue-700"
                  : ""
              }`}
            >
              <Link
                to={link.path}
                className="flex justify-center md:justify-start items-center space-x-3"
                onClick={() => handleClick(index)}
              >
                <span>
                  {React.createElement(link.icon, { className: "text-xl" })}
                </span>
                <span className="text-sm font-medium hidden md:flex">{link.name}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout Button */}
        <div className="w-full px-3 py-3">
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center md:justify-start space-x-3 w-full text-sm py-2 px-3 rounded-lg transition-all duration-200 ease-in-out transform hover:scale-105 ${
              document.documentElement.className === "dark" ? "bg-red-600 text-white hover:bg-red-700" : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            <span className="text-lg">
              <LuLogOut />
            </span>
            <span className="hidden md:flex">Déconnexion</span>
          </button>
        </div>
      </div>

      {/* Overlay for mobile when sidebar is open */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-0 transition-opacity duration-300 ease-in-out"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
import React, { useState } from "react";
import { LuUser, LuLogOut, LuMenu, LuX } from "react-icons/lu";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/image/logo.png";
import { SIDEBAR_LINKS } from "../data/sidebarConfig";

const Sidebar = ({ userRole }) => {
    const [activeLink, setActiveLink] = useState(0);
    const [isOpen, setIsOpen] = useState(false); // State for mobile sidebar toggle
    const navigate = useNavigate();

    const handleClick = (index) => {
        setActiveLink(index);
        setIsOpen(false); // Close sidebar on link click in mobile
    };

    const handleLogout = async () => {
        try {
            await axios.post(
                'http://localhost:5000/api/auth/logout',
                {},
                { withCredentials: true }
            );
            navigate('/login');
        } catch (err) {
            console.error('Erreur lors de la déconnexion:', err);
        }
    };

    const toggleSidebar = () => {
        setIsOpen(!isOpen);
    };

    // Select links based on user role
    const links = SIDEBAR_LINKS[userRole] || [];

    return (
        <>
            {/* Mobile Toggle Button */}
            <button
                onClick={toggleSidebar}
                className="md:hidden fixed top-4 left-4 z-20 p-2 bg-blue-200 rounded-md text-gray-800 hover:bg-blue-300 transition-colors"
                aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            >
                {isOpen ? <LuX className="text-xl" /> : <LuMenu className="text-xl" />}
            </button>

            {/* Sidebar */}
            <div
                className={`w-16 md:w-56 fixed left-0 top-0 z-10 h-screen border-r pt-8 px-4 bg-blue-100 bg-opacity-70 text-gray-800 shadow-lg flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"
                    } md:translate-x-0`}
            >
                {/* Logo and App Name */}
                <div className="mb-8 flex items-center justify-center md:justify-start space-x-2">
                    <img src={logo} alt="Logo" className="w-8" />
                    <span className="text-lg font-semibold text-gray-900 hidden md:block">App Orthanc</span>
                </div>

                {/* Navigation Links */}
                <ul className="mt-6 space-y-6 flex-1">
                    {links.map((link, index) => (
                        <li
                            key={index}
                            className={`font-medium rounded-md py-2 px-5 hover:bg-blue-200 hover:text-gray-900 ${activeLink === index ? "bg-blue-200 text-gray-900" : ""
                                }`}
                        >
                            <Link
                                to={link.path}
                                className="flex justify-center md:justify-start items-center md:space-x-5"
                                onClick={() => handleClick(index)}
                            >
                                <span>{React.createElement(link.icon, { className: "text-xl" })}</span>
                                <span className="text-sm hidden md:flex">{link.name}</span>
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Logout Button */}
                <div className="w-full px-4 py-4">
                    <button
                        onClick={handleLogout}
                        className="flex items-center justify-center md:justify-start space-x-2 w-full text-sm text-gray-800 py-2 px-5 bg-blue-200 rounded-md cursor-pointer hover:bg-blue-300 transition-colors"
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
                    className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-0"
                    onClick={toggleSidebar}
                ></div>
            )}
        </>
    );
};

export default Sidebar;
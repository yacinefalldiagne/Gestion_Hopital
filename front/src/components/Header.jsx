import React, { useContext, useState } from "react";
import { GoBell, GoSearch } from "react-icons/go";
import { LuSun, LuMoon } from "react-icons/lu";
import { ThemeContext } from "./ThemeContext";

const Header = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const toggleSearch = () => {
    setIsSearchOpen(!isSearchOpen);
  };

  return (
    <header
      className={`flex justify-between items-center p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300`}
    >
      <div className="flex items-center">
        <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100 hidden md:block">
          Tableau de bord
        </h1>
      </div>
      <div className="flex items-center space-x-4">
        {/* Bouton de recherche pour mobile */}
        <button
          onClick={toggleSearch}
          className="md:hidden text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-transform duration-200 transform hover:scale-105"
          aria-label="Ouvrir la recherche"
        >
          <GoSearch size={24} />
        </button>

        {/* Champ de recherche */}
        <div
          className={`${
            isSearchOpen ? "block" : "hidden"
          } md:block w-full md:w-64 transition-all duration-300`}
        >
          <input
            type="text"
            placeholder="Rechercher..."
            className={`w-full md:w-64 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-all duration-200`}
            aria-label="Rechercher des patients, dossiers ou rendez-vous"
          />
        </div>

        {/* Bouton de notification et bouton de thème */}
        <div className="flex items-center space-x-3">
          {/* Bouton de notification */}
          <button
            className="relative text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-transform duration-200 transform hover:scale-110"
            aria-label="Notifications (5 nouvelles)"
          >
            <GoBell size={28} />
            <span
              className="absolute top-0 right-0 -mt-1 -mr-1 flex justify-center items-center bg-blue-600 text-white font-semibold text-[10px] w-5 h-5 rounded-full border-2 border-white dark:border-gray-800"
            >
              5
            </span>
          </button>

          {/* Bouton de basculement du thème */}
          <button
            onClick={toggleTheme}
            className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition-transform duration-200 transform hover:scale-110"
            aria-label={theme === "dark" ? "Passer au thème clair" : "Passer au thème sombre"}
          >
            {theme === "dark" ? <LuSun size={28} /> : <LuMoon size={28} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
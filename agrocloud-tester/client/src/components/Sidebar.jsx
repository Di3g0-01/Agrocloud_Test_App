import React from 'react';
import { Database, Table, PlusCircle, Wrench } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'connection', label: 'Conexión', icon: Database },
    { id: 'tables', label: 'Visor de tablas', icon: Table },
    { id: 'insert', label: 'Asistente de inserción', icon: PlusCircle },
    { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
  ];

  return (
    <aside className="w-full md:w-[220px] bg-[#171a21] border-b md:border-b-0 md:border-r border-[#262b36] flex-shrink-0 flex flex-col">
      {/* Brand */}
      <div className="h-14 flex items-center px-4 border-b border-[#262b36]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-[#16a34a] rounded-sm"></div>
          <span className="font-semibold text-sm tracking-wide text-[#e5e7eb]">AgroCloud Tester</span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="p-2 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex items-center gap-2.5 px-3 py-2 text-sm rounded-[4px] transition-colors duration-150 whitespace-nowrap text-left w-full ${
                isActive
                  ? 'bg-[#1f2430] text-[#e5e7eb] font-medium'
                  : 'text-[#9ca3af] hover:text-[#e5e7eb] hover:bg-[#1b1f28]'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-1 bottom-1 w-[3px] bg-[#16a34a] rounded-r-sm hidden md:block"></span>
              )}
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#16a34a]' : 'text-[#9ca3af]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

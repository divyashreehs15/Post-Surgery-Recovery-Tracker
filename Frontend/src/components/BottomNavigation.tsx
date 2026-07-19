import React from 'react';
import { Home, ClipboardList, FolderOpen, Bell, User, LogOut, Pill, CalendarDays } from 'lucide-react';
import { Button } from './ui/button';

interface BottomNavigationProps {
  activeTab: string;
  onNavigate: (screen: string) => void;
  onLogout: () => void;
}

export function BottomNavigation({ activeTab, onNavigate, onLogout }: BottomNavigationProps) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home, screen: 'patient-dashboard' },
    { id: 'logs', label: 'Logs', icon: ClipboardList, screen: 'daily-log' },
    { id: 'medications', label: 'Meds', icon: Pill, screen: 'medications' },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays, screen: 'appointments' },
    { id: 'profile', label: 'Profile', icon: User, screen: 'profile' },
  ];

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-100 z-50">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.screen)}
              className={`flex flex-col items-center p-1 rounded-xl transition-colors min-w-0 flex-1 ${
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="w-4 h-4 mb-1" />
              <span className="text-xs truncate">{item.label}</span>
            </button>
          );
        })}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onLogout}
          className="flex flex-col items-center p-1 text-gray-600 hover:text-gray-900 min-w-0 flex-1"
        >
          <LogOut className="w-4 h-4 mb-1" />
          <span className="text-xs">Logout</span>
        </Button>
      </div>
    </div>
  );
}
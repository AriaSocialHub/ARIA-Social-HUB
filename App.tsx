

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { LogOut, Eye, FileUp, ChevronDown, LayoutGrid, Folder, Wrench, Bell, Menu, X, Bot, Users as UsersIcon, Search } from 'lucide-react';
import UploadApp from './UploadApp';
import Login from './components/Login';
import { services, serviceMap } from './services/registry';
import { User, OnlineUser, NavigationTarget, NotificationItem, Service } from './types';
import AvatarSetup from './components/AvatarSetup';
import { useOnlinePresence } from './hooks/useOnlinePresence';
import { getAvatar } from './services/avatarRegistry';
import { timeService } from './services/timeSyncService';
import { useData } from './contexts/DataContext';
import PasswordChange from './components/PasswordChange';
import GlobalSearchModal from './components/GlobalSearchModal';

type View = 'upload' | string; // Can be 'upload' or a service ID
type AuthStatus = 'LOGGED_OUT' | 'NEEDS_PASSWORD_CHANGE' | 'NEEDS_AVATAR_SETUP' | 'LOGGED_IN';

const ACCESS_LEVEL_LABELS: { [key in 'admin' | 'view']: string } = {
    admin: 'Demand',
    view: 'Moderatori'
};

const NavItem = React.memo<React.PropsWithChildren<{ onClick: () => void; active?: boolean; className?: string }>>(({ children, onClick, active, className }) => (
    <button onClick={onClick} className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-semibold transition-colors ${active ? 'bg-white/20' : 'hover:bg-white/10'} ${className || ''}`}>
      {children}
    </button>
));

const MenuItem = React.memo<React.PropsWithChildren<{ onClick: () => void, style?: React.CSSProperties, className?: string }>>(({ children, onClick, style, className }) => (
    <a onClick={onClick} className={`flex items-center gap-3 w-full px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md transition-colors cursor-pointer ${className || ''}`} style={style}>
        {children}
    </a>
));

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authStatus, setAuthStatus] = useState<AuthStatus>('LOGGED_OUT');
  const [isAdminViewing, setIsAdminViewing] = useState(false);
  const [view, setView] = useState<View>('dashboard');
  const [uploadServiceContext, setUploadServiceContext] = useState<string | null>(null);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { notifications, markNotificationRead, markAllNotificationsRead, isLoading: isDataLoading } = useData();
  const [navigationTarget, setNavigationTarget] = useState<NavigationTarget | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileSubMenu, setMobileSubMenu] = useState<string | null>(null);

  // --- Login Persistence ---
  useEffect(() => {
    if (isDataLoading) return;
    try {
      const storedUser = localStorage.getItem('socialHub_currentUser');
      if (storedUser) {
        const user: User = JSON.parse(storedUser);
        if (user.forcePasswordChange) {
          setAuthStatus('NEEDS_PASSWORD_CHANGE');
        } else if (!user.avatar) {
          setAuthStatus('NEEDS_AVATAR_SETUP');
        } else {
          setAuthStatus('LOGGED_IN');
        }
        setCurrentUser(user);
      }
    } catch (error) {
      console.error("Failed to parse stored user data:", error);
      localStorage.removeItem('socialHub_currentUser');
    }
  }, [isDataLoading]);

  const { onlineUsers, signOutPresence } = useOnlinePresence(currentUser, currentUser?.accessLevel || null);
  const isReadOnly = currentUser?.accessLevel === 'view' || (currentUser?.accessLevel === 'admin' && isAdminViewing);

  const documentServices = useMemo(() => services.filter(s => s.category === 'document'), []);
  const utilityServices = useMemo(() => services.filter(s => s.category === 'utility'), []);
  
  const UserAvatar = useMemo(() => getAvatar(currentUser?.avatar), [currentUser?.avatar]);
  
  const unreadNotificationsCount = useMemo(() => {
    if (currentUser) {
      return notifications.filter(n => !n.readBy.includes(currentUser.name)).length;
    }
    return 0;
  }, [notifications, currentUser]);

  // Effect to handle clicking outside of open menus
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);
  
  const handleLoginSuccess = (user: User) => {
    localStorage.setItem('socialHub_currentUser', JSON.stringify(user));
    setCurrentUser(user);
    if (user.forcePasswordChange) {
      setAuthStatus('NEEDS_PASSWORD_CHANGE');
    } else if (!user.avatar) {
      setAuthStatus('NEEDS_AVATAR_SETUP');
    } else {
      setAuthStatus('LOGGED_IN');
      setView('dashboard');
    }
  };

  const handlePasswordChanged = (user: User) => {
    localStorage.setItem('socialHub_currentUser', JSON.stringify(user));
    setCurrentUser(user);
    if (!user.avatar) {
      setAuthStatus('NEEDS_AVATAR_SETUP');
    } else {
      setAuthStatus('LOGGED_IN');
      setView('dashboard');
    }
  };

  const handleProfileCreated = (user: User) => {
    localStorage.setItem('socialHub_currentUser', JSON.stringify(user));
    setCurrentUser(user);
    setAuthStatus('LOGGED_IN');
    setView('dashboard');
  };

  const handleLogout = useCallback(() => {
    signOutPresence();
    localStorage.removeItem('socialHub_currentUser');
    setCurrentUser(null);
    setAuthStatus('LOGGED_OUT');
    setIsAdminViewing(false);
    setView('dashboard');
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
    setMobileSubMenu(null);
  }, [signOutPresence]);
  
  const handleToggleAdminView = useCallback(() => {
    const newViewingState = !isAdminViewing;
    setIsAdminViewing(newViewingState);
    if (newViewingState && view === 'upload') {
        setView('dashboard');
    }
    setOpenMenu(null);
  }, [isAdminViewing, view]);

  const handleSetView = useCallback((newView: View) => {
    if (isReadOnly && newView === 'upload') {
      return;
    }
    if (newView !== 'upload') {
      setUploadServiceContext(null);
    }
    setView(newView);
    window.scrollTo(0,0);
  }, [isReadOnly]);

  const handleUploadFromService = useCallback((serviceId: string) => {
    setUploadServiceContext(serviceId);
    setView('upload');
  }, []);

  const handleMenuToggle = useCallback((menuName: string) => {
    setOpenMenu(openMenu === menuName ? null : menuName);
  }, [openMenu]);

  const handleViewAndCloseMenu = useCallback((newView: View) => {
    handleSetView(newView);
    setOpenMenu(null);
    setIsMobileMenuOpen(false);
    setMobileSubMenu(null);
  }, [handleSetView]);

  const handleNavigate = useCallback((targetOrNotification: NavigationTarget | NotificationItem) => {
    let target: NavigationTarget;
    if ('message' in targetOrNotification && 'readBy' in targetOrNotification) {
        const notification = targetOrNotification as NotificationItem;
        if (currentUser) {
            markNotificationRead(notification.id, currentUser.name);
        }
        target = {
            serviceId: notification.serviceId,
            categoryName: notification.categoryName,
            itemId: notification.itemId
        };
    } else {
        target = targetOrNotification as NavigationTarget;
    }
    
    setNavigationTarget(target);
    setView(target.serviceId);
    window.scrollTo(0,0);
  }, [currentUser, markNotificationRead]);


  const handleMarkAllReadAndShow = useCallback(() => {
    if (currentUser) markAllNotificationsRead(currentUser.name);
    setView('dashboard');
    setOpenMenu(null);
    setTimeout(() => {
        document.getElementById('notifications-feed')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, [currentUser, markAllNotificationsRead]);
  

  if (authStatus === 'LOGGED_OUT' || isDataLoading) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }
  if (!currentUser) return <Login onLoginSuccess={handleLoginSuccess} />;
  
  if (authStatus === 'NEEDS_PASSWORD_CHANGE') {
    return <PasswordChange user={currentUser} onPasswordChanged={handlePasswordChanged} />;
  }
  
  if (authStatus === 'NEEDS_AVATAR_SETUP') {
    return <AvatarSetup user={currentUser} onProfileCreated={handleProfileCreated} />;
  }
  
  const currentService = serviceMap[view] as Service<any> & { detailViews?: any, itemNoun?: string, itemNounPlural?: string };
  const CurrentAppComponent = view !== 'upload' ? currentService?.appComponent : null;
  const now = timeService.getNow();

  return (
    <div className="min-h-screen text-gray-800">
      <header style={{ backgroundColor: 'var(--c-primary)' }} className="text-white shadow-md sticky top-0 z-40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative flex justify-between items-center h-16">
                 {/* Left side: Logo */}
                <div className="flex items-center gap-3">
                    <div style={{ backgroundColor: 'var(--c-accent)' }} className="h-9 w-9 rounded-md flex items-center justify-center">
                        <Bot size={24} strokeWidth={2.5} />
                    </div>
                    <h1 className="text-2xl font-bold tracking-wide hidden sm:block">Social Hub</h1>
                </div>
                
                {/* Desktop Navigation (Absolutely Centered) */}
                <nav className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-2">
                    <NavItem onClick={() => handleSetView('dashboard')} active={view === 'dashboard'}>
                        <LayoutGrid className="h-5 w-5" />
                        <span>Dashboard</span>
                    </NavItem>
                    
                    <div className="relative" ref={openMenu === 'document' ? menuRef : null}>
                        <NavItem onClick={() => handleMenuToggle('document')} active={openMenu === 'document' || documentServices.some(s => s.id === view)}>
                            <Folder className="h-5 w-5" />
                            <span>Risorse</span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMenu === 'document' ? 'rotate-180' : ''}`} />
                        </NavItem>
                        <div className={`menu-panel w-60 ${openMenu === 'document' ? 'open' : ''}`}>
                            <div className="p-2 space-y-1">
                                {documentServices.map((service, index) => (
                                    <MenuItem key={service.id} onClick={() => handleViewAndCloseMenu(service.id)} style={{ animationDelay: `${index * 30}ms`}}>
                                        <service.icon className="h-5 w-5 text-gray-500" />
                                        <span>{service.name}</span>
                                    </MenuItem>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="relative" ref={openMenu === 'utility' ? menuRef : null}>
                        <NavItem onClick={() => handleMenuToggle('utility')} active={openMenu === 'utility' || utilityServices.some(s => s.id === view)}>
                            <Wrench className="h-5 w-5" />
                            <span>Tools</span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${openMenu === 'utility' ? 'rotate-180' : ''}`} />
                        </NavItem>
                        <div className={`menu-panel w-60 ${openMenu === 'utility' ? 'open' : ''}`}>
                            <div className="p-2 space-y-1">
                            {utilityServices.map((service, index) => {
                                if (service.id === 'userManagement') return null;
                                if (service.id === 'commentAnalysis' && isReadOnly) return null;
                                if (service.id === 'newsArchive' && isReadOnly) return null;
                                return (
                                    <MenuItem key={service.id} onClick={() => handleViewAndCloseMenu(service.id)} style={{ animationDelay: `${index * 30}ms`}}>
                                        <service.icon className="h-5 w-5 text-gray-500"/>
                                        <span>{service.name}</span>
                                    </MenuItem>
                                );
                            })}
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Right Side Actions */}
                <div className="flex items-center gap-4">
                     <button
                        onClick={() => document.dispatchEvent(new CustomEvent('open-contextual-search'))}
                        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm bg-white/10 hover:bg-white/20"
                        title="Cerca (⌘+K)"
                     >
                        <Search className="h-4 w-4" />
                        <span className="text-gray-300">Cerca...</span>
                    </button>
                    <div className="relative" ref={openMenu === 'settings' ? menuRef : null}>
                        <button onClick={() => handleMenuToggle('settings')} className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
                           <div className="relative">
                                <UserAvatar className="h-8 w-8 text-white"/>
                                {unreadNotificationsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500 border border-white"></span>
                                    </span>
                                )}
                           </div>
                        </button>

                        <div className={`menu-panel w-64 right-0 origin-top-right ${openMenu === 'settings' ? 'open' : ''}`}>
                            <div className="px-4 py-3 border-b border-gray-100">
                                <div className="font-semibold text-gray-800">{currentUser.name}</div>
                                <div className="text-sm text-gray-500">{ACCESS_LEVEL_LABELS[currentUser.accessLevel]}</div>
                            </div>
                            <div className="p-2 space-y-1">
                                <MenuItem onClick={() => {handleMarkAllReadAndShow(); setOpenMenu(null);}} className="!flex !justify-between">
                                    <div className="flex items-center gap-3"><Bell className="h-5 w-5 text-gray-500" /> <span>Notifiche</span></div>
                                    {unreadNotificationsCount > 0 && <span className="bg-blue-600 text-white text-xs font-semibold rounded-full px-2 py-0.5">{unreadNotificationsCount}</span>}
                                </MenuItem>
                                {currentUser.accessLevel === 'admin' && (
                                    <MenuItem onClick={handleToggleAdminView}>
                                        <Eye className="h-5 w-5 text-gray-500" />
                                        <span>{isAdminViewing ? 'Vista Demand' : 'Vista Moderatori'}</span>
                                    </MenuItem>
                                )}
                                {currentUser.accessLevel === 'admin' && (
                                    <MenuItem onClick={() => handleViewAndCloseMenu('userManagement')}>
                                        <UsersIcon className="h-5 w-5 text-gray-500" />
                                        <span>Gestione Utenze</span>
                                    </MenuItem>
                                )}
                                {!isReadOnly && (
                                    <MenuItem onClick={() => { setUploadServiceContext(null); handleViewAndCloseMenu('upload'); }}>
                                        <FileUp className="h-5 w-5 text-gray-500" />
                                        <span>Importa Dati</span>
                                    </MenuItem>
                                )}
                                 <MenuItem onClick={handleLogout}>
                                    <LogOut className="h-5 w-5 text-gray-500" />
                                    <span>Esci</span>
                                </MenuItem>
                            </div>
                        </div>
                    </div>
                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button onClick={() => setIsMobileMenuOpen(true)} className="inline-flex items-center justify-center p-2 rounded-md hover:bg-white/10 focus:outline-none">
                            <span className="sr-only">Apri menu</span>
                            <Menu className="h-6 w-6" />
                        </button>
                    </div>
                </div>

            </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
            <div className="absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden z-50">
                <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white">
                    <div className="pt-5 pb-6 px-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div style={{ backgroundColor: 'var(--c-accent)' }} className="h-9 w-9 rounded-md flex items-center justify-center text-white">
                                    <Bot size={24} strokeWidth={2.5} />
                                </div>
                                <h1 className="text-xl font-bold text-gray-800">Social Hub</h1>
                            </div>
                            <div className="-mr-2">
                                <button type="button" className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100" onClick={() => { setIsMobileMenuOpen(false); setMobileSubMenu(null); }}>
                                    <span className="sr-only">Chiudi menu</span>
                                    <X className="h-6 w-6" />
                                </button>
                            </div>
                        </div>
                        <div className="mt-8">
                            <nav className="grid gap-y-2">
                                <MenuItem onClick={() => handleViewAndCloseMenu('dashboard')} className={`${view === 'dashboard' ? 'bg-gray-100' : ''}`}>
                                    <LayoutGrid className="h-6 w-6 text-[var(--c-primary-light)]" />
                                    <span className="font-medium text-gray-900">Dashboard</span>
                                </MenuItem>
                                
                                {/* Risorse Section */}
                                <div>
                                    <MenuItem onClick={() => setMobileSubMenu(mobileSubMenu === 'document' ? null : 'document')} className={`${documentServices.some(s => s.id === view) && mobileSubMenu !== 'document' ? 'bg-gray-100' : ''} !justify-between w-full`}>
                                        <div className="flex items-center gap-3">
                                            <Folder className="h-6 w-6 text-[var(--c-primary-light)]" />
                                            <span className="font-medium text-gray-900">Risorse</span>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${mobileSubMenu === 'document' ? 'rotate-180' : ''}`} />
                                    </MenuItem>
                                    {mobileSubMenu === 'document' && (
                                        <div className="pl-8 pt-1 pb-1 space-y-1">
                                            {documentServices.map(service => (
                                                <MenuItem key={service.id} onClick={() => handleViewAndCloseMenu(service.id)} className={`${service.id === view ? 'bg-gray-100' : ''}`}>
                                                    <service.icon className="h-5 w-5 text-gray-500" />
                                                    <span className="text-sm text-gray-800">{service.name}</span>
                                                </MenuItem>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Tools Section */}
                                <div>
                                    <MenuItem onClick={() => setMobileSubMenu(mobileSubMenu === 'utility' ? null : 'utility')} className={`${utilityServices.some(s => s.id === view) && mobileSubMenu !== 'utility' ? 'bg-gray-100' : ''} !justify-between w-full`}>
                                        <div className="flex items-center gap-3">
                                            <Wrench className="h-6 w-6 text-[var(--c-primary-light)]" />
                                            <span className="font-medium text-gray-900">Tools</span>
                                        </div>
                                        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${mobileSubMenu === 'utility' ? 'rotate-180' : ''}`} />
                                    </MenuItem>
                                    {mobileSubMenu === 'utility' && (
                                        <div className="pl-8 pt-1 pb-1 space-y-1">
                                            {utilityServices.map(service => {
                                                if (service.id === 'userManagement') return null;
                                                if (service.id === 'commentAnalysis' && isReadOnly) return null;
                                                if (service.id === 'newsArchive' && isReadOnly) return null;
                                                return (
                                                    <MenuItem key={service.id} onClick={() => handleViewAndCloseMenu(service.id)} className={`${service.id === view ? 'bg-gray-100' : ''}`}>
                                                        <service.icon className="h-5 w-5 text-gray-500" />
                                                        <span className="text-sm text-gray-800">{service.name}</span>
                                                    </MenuItem>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            </nav>
                        </div>
                    </div>
                    <div className="py-6 px-5 space-y-4 border-t">
                        <div className="space-y-2">
                             <MenuItem onClick={() => { document.dispatchEvent(new CustomEvent('open-contextual-search')); setIsMobileMenuOpen(false); }}>
                                <Search className="text-gray-500" /> <span>Cerca...</span>
                            </MenuItem>
                            {currentUser.accessLevel === 'admin' && (
                                <MenuItem onClick={() => { handleToggleAdminView(); setIsMobileMenuOpen(false); }}>
                                    <Eye className="text-gray-500" /> <span>{isAdminViewing ? 'Vista Demand' : 'Vista Moderatori'}</span>
                                </MenuItem>
                            )}
                             {currentUser.accessLevel === 'admin' && (
                                <MenuItem onClick={() => { handleViewAndCloseMenu('userManagement'); setIsMobileMenuOpen(false); }}>
                                    <UsersIcon className="text-gray-500"/> <span>Gestione Utenze</span>
                                </MenuItem>
                            )}
                            {!isReadOnly && (
                                <MenuItem onClick={() => { setUploadServiceContext(null); handleViewAndCloseMenu('upload'); setIsMobileMenuOpen(false); }}>
                                    <FileUp className="text-gray-500"/> <span>Importa Dati</span>
                                </MenuItem>
                            )}
                            <MenuItem onClick={handleLogout}>
                                <LogOut className="text-gray-500"/> <span>Esci</span>
                            </MenuItem>
                        </div>
                         <div className="flex items-center gap-3 border-t pt-4">
                            <UserAvatar className="h-10 w-10 text-gray-700" />
                            <div>
                                <div className="font-semibold text-gray-800">{currentUser.name}</div>
                                <div className="text-sm text-gray-500">{ACCESS_LEVEL_LABELS[currentUser.accessLevel]}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </header>
      <GlobalSearchModal handleNavigate={handleNavigate} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow">
        {view === 'upload' && <UploadApp setView={setView} contextServiceId={uploadServiceContext} currentUser={currentUser} />}
        {CurrentAppComponent && view !== 'upload' && (
             <CurrentAppComponent
                isReadOnly={isReadOnly}
                onUploadClick={() => handleUploadFromService(view)}
                currentUser={currentUser}
                onlineUsers={onlineUsers}
                setView={setView}
                currentUserForBreaks={currentUser}
                now={now}
                handleNavigate={handleNavigate}
                navigationTarget={navigationTarget}
                onNavigationComplete={() => setNavigationTarget(null)}
                serviceId={view}
                // Props for ResourceApp
                detailViews={currentService.detailViews}
                itemNoun={currentService.itemNoun}
                itemNounPlural={currentService.itemNounPlural}
            />
        )}
      </main>
    </div>
  );
};

export default App;
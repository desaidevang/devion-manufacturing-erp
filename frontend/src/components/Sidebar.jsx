// src/components/Sidebar.jsx - Fixed version
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  FiHome, FiUsers, FiPackage, FiCheckCircle, 
  FiBarChart2, FiFileText, FiSettings, FiShield,
  FiTruck, FiBox, FiLayers, FiArchive, FiClipboard,
  FiCalendar, FiUserCheck, FiChevronDown, FiChevronRight,
  FiDollarSign, FiShoppingCart, FiTrendingUp, FiActivity,
  FiChevronLeft, FiBriefcase, FiMapPin, FiAlertTriangle,
  FiPlus, FiList, FiClock, FiX, FiCheck, FiAlertCircle,
  FiBook, FiDatabase, FiEye, FiInbox, FiFilter, FiRefreshCw,
  FiGrid, FiBarChart, FiPieChart, FiGlobe, FiTarget
} from 'react-icons/fi';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Memoized icon components to prevent unnecessary re-renders
const MemoizedIcon = React.memo(({ Icon, className }) => (
  <Icon className={className} />
));

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [expandedMenus, setExpandedMenus] = useState({});
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState('');

  // Reset expanded menus when sidebar is collapsed
  useEffect(() => {
    if (collapsed) {
      setExpandedMenus({});
    }
  }, [collapsed]);

  // Track active item based on current route
  useEffect(() => {
    const path = location.pathname;
    setActiveItem(path);
    
    // Auto-expand dropdown if a sub-item is active
    if (!collapsed) {
      const activeParent = findActiveParent(path);
      if (activeParent) {
        setExpandedMenus(prev => ({
          ...prev,
          [activeParent]: true
        }));
      }
    }
  }, [location.pathname, collapsed]);

  // Find parent menu for active path
  const findActiveParent = useCallback((path) => {
    const navItems = getNavigationItems();
    for (const item of navItems) {
      if (item.type === 'dropdown' && item.items) {
        const isParent = item.items.some(subItem => 
          path === subItem.path || path.startsWith(subItem.path + '/')
        );
        if (isParent) return item.id;
      }
    }
    return null;
  }, []);

  const toggleMenu = useCallback((menu) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  }, []);

  // Navigation structure based on user role
  const navigationStructure = useMemo(() => ({
    ADMIN: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: FiGrid,
        path: '/dashboard',
        type: 'single',
        highlight: true
      },
      {
        id: 'supplier',
        name: 'Supplier Management',
        icon: FiTruck,
        type: 'dropdown',
        badge: '',
        items: [
          { id: 'supplier-create', name: 'Create Supplier', path: '/vendor/create', icon: FiPlus },
          { id: 'supplier-manage', name: 'Supplier Directory', path: '/vendor/manage', icon: FiList },
        ]
      },
      {
        id: 'psi',
        name: 'Product Standards',
        icon: FiTarget,
        type: 'dropdown',
        badge: 'PSI',
        items: [
          { id: 'psi-create', name: 'Create PSI', path: '/psi/create', icon: FiPlus },
          { id: 'psi-view', name: 'View PSI Records', path: '/psi/view', icon: FiEye },
        ]
      },
      {
        id: 'part',
        name: 'Part Management',
        icon: FiPackage,
        type: 'dropdown',
        badge: '',
        items: [
          { id: 'part-create', name: 'Create Part', path: '/part/create', icon: FiPlus },
          { id: 'part-manage', name: 'Manage Parts', path: '/part/manage', icon: FiList },
        ]
      },
      {
        id: 'users',
        name: 'Team Management',
        icon: FiUsers,
        path: '/users',
        type: 'single',
        badge: 'HR'
      },
      {
        id: 'material',
        name: 'Material Management',
        icon: FiBox,
        type: 'dropdown',
        badge: 'GRN',
        items: [
          { id: 'material-receive-new', name: 'Create GRN', path: '/material/receive/new', icon: FiPlus },
          { id: 'material-receive', name: 'Manage GRNs', path: '/material/receive', icon: FiInbox },
          { id: 'grn-view', name: 'View GRN', path: '/grn/view', icon: FiEye },
        ]
      },
   {
  id: 'inspection',
  name: 'Quality Inspection',
  icon: FiCheckCircle,
  type: 'dropdown',
  badge: 'QC',
  items: [
    { id: 'inspection-create', name: 'Schedule Inspection', path: '/inspection/create', icon: FiPlus },
    { id: 'inspection-list', name: 'All Inspections', path: '/inspection', icon: FiList },
    { id: 'inspection-pending', name: 'Pending Inspection', path: '/inspection?status=PENDING', icon: FiFilter },
    { id: 'inspection-judgement', name: 'Add Judgement', path: '/inspection?status=COMPLETED', icon: FiCheckCircle },
  ]
},
{
  id: 'product',
  name: 'Product Management',
  icon: FiPackage,
  type: 'dropdown',
  badge: 'BOM',
  items: [
    { id: 'product-create', name: 'Create Product', path: '/product/create', icon: FiPlus },
    { id: 'product-manage', name: 'Manage Products', path: '/product/manage', icon: FiList },
  ]
},
// In your Sidebar navigation structure (ADMIN role), add:
{
  id: 'batch',
  name: 'Batch Management',
  icon: FiLayers,
  type: 'dropdown',
  badge: 'PROD',
  items: [
    { id: 'batch-dashboard', name: 'Dashboard', path: '/batch/dashboard', icon: FiGrid },
    { id: 'batch-create', name: 'Create Batch', path: '/batch/create', icon: FiPlus },
    { id: 'batch-manage', name: 'Manage Batches', path: '/batch/status', icon: FiList },
    { id: 'batch-assign', name: 'Assign Batches', path: '/batch/assign', icon: FiUserCheck },
  ]
},
      {
        id: 'warehouse',
        name: 'Warehouse Ops',
        icon: FiArchive,
        type: 'dropdown',
        badge: '',
        items: [
          { id: 'warehouse-stock', name: 'Warehouse Stock', path: '/warehouse/stock', icon: FiPackage },
          { id: 'warehouse-locations', name: 'Warehouse Locations', path: '/warehouse/locations', icon: FiMapPin },
          { id: 'warehouse-locations-create', name: 'Create Location', path: '/warehouse/locations/create', icon: FiPlus },
        ]
      },
      {
        id: 'reports',
        name: 'Reports & Analytics',
        icon: FiBarChart2,
        path: '/reports',
        type: 'single',
        badge: ''
      },
      {
        id: 'settings',
        name: 'System Administration',
        icon: FiSettings,
        path: '/settings',
        type: 'single'
      }
    ],
    WAREHOUSE_MANAGER: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: FiGrid,
        path: '/dashboard',
        type: 'single',
        highlight: true
      },
      {
        id: 'supplier',
        name: 'Supplier Management',
        icon: FiTruck,
        type: 'dropdown',
        badge: '',
        items: [
          { id: 'supplier-create-wm', name: 'Create Supplier', path: '/vendor/create', icon: FiPlus },
          { id: 'supplier-manage-wm', name: 'Supplier Directory', path: '/vendor/manage', icon: FiList },
        ]
      },
      {
        id: 'psi',
        name: 'Product Standards',
        icon: FiTarget,
        path: '/psi/view',
        type: 'single',
        badge: 'PSI'
      },
      {
        id: 'part',
        name: 'Part Management',
        icon: FiPackage,
        path: '/part/manage',
        type: 'single'
      },
      {
        id: 'material',
        name: 'Material Management',
        icon: FiBox,
        type: 'dropdown',
        badge: 'GRN',
        items: [
          { id: 'material-receive-new-wm', name: 'Create GRN', path: '/material/receive/new', icon: FiPlus },
          { id: 'material-receive-wm', name: 'Manage GRNs', path: '/material/receive', icon: FiInbox },
          { id: 'grn-view-wm', name: 'View GRN', path: '/grn/view', icon: FiEye },
        ]
      },
      {
        id: 'warehouse',
        name: 'Warehouse Ops',
        icon: FiArchive,
        type: 'dropdown',
        badge: '',
        items: [
          { id: 'warehouse-stock-wm', name: 'Warehouse Stock', path: '/warehouse/stock', icon: FiPackage },
          { id: 'warehouse-stock-add-wm', name: 'Add Stock', path: '/warehouse/stock/add', icon: FiPlus },
          { id: 'warehouse-locations-wm', name: 'Warehouse Locations', path: '/warehouse/locations', icon: FiMapPin },
          { id: 'warehouse-locations-create-wm', name: 'Create Location', path: '/warehouse/locations/create', icon: FiPlus },
        ]
      },
      {
        id: 'reports',
        name: 'Warehouse Reports',
        icon: FiFileText,
        path: '/reports',
        type: 'single',
        badge: ''
      }
    ],
    INSPECTION_OFFICER: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: FiGrid,
        path: '/dashboard',
        type: 'single',
        highlight: true
      },
      {
        id: 'psi',
        name: 'Product Standards',
        icon: FiTarget,
        type: 'dropdown',
        badge: 'PSI',
        items: [
          { id: 'psi-create-io', name: 'Create PSI', path: '/psi/create', icon: FiPlus },
          { id: 'psi-view-io', name: 'View PSI Records', path: '/psi/view', icon: FiEye },
        ]
      },
      {
        id: 'part',
        name: 'Part Management',
        icon: FiPackage,
        type: 'dropdown',
        badge: '',
        items: [
          { id: 'part-create-io', name: 'Create Part', path: '/part/create', icon: FiPlus },
          { id: 'part-manage-io', name: 'Manage Parts', path: '/part/manage', icon: FiList },
        ]
      },
      {
        id: 'material',
        name: 'GRN Management',
        icon: FiBox,
        type: 'dropdown',
        badge: 'GRN',
        items: [
          { id: 'material-receive-io', name: 'Manage GRNs', path: '/material/receive', icon: FiInbox },
          { id: 'grn-view-io', name: 'View GRN', path: '/grn/view', icon: FiEye },
        ]
      },
      {
        id: 'inspection',
        name: 'Inspection',
        icon: FiCheckCircle,
        type: 'dropdown',
        badge: 'QC',
        items: [
          { id: 'inspection-pending-io', name: 'Pending Inspection', path: '/inspection/pending', icon: FiFilter },
          { id: 'inspection-perform-io', name: 'Perform Inspection', path: '/inspection/perform', icon: FiCheck },
        ]
      },
      {
        id: 'warehouse',
        name: 'Warehouse',
        icon: FiArchive,
        path: '/warehouse/stock',
        type: 'single'
      },
      {
        id: 'reports',
        name: 'Quality Reports',
        icon: FiFileText,
        path: '/reports',
        type: 'single',
        badge: ''
      }
    ],
    SUPERVISOR: [
      {
        id: 'dashboard',
        name: 'Dashboard',
        icon: FiGrid,
        path: '/dashboard',
        type: 'single',
        highlight: true
      },
      {
        id: 'psi',
        name: 'Product Standards',
        icon: FiTarget,
        path: '/psi/view',
        type: 'single'
      },
      {
        id: 'part',
        name: 'Part Management',
        icon: FiPackage,
        path: '/part/manage',
        type: 'single'
      },
      {
        id: 'material',
        name: 'GRN Management',
        icon: FiBox,
        path: '/material/receive',
        type: 'single'
      },
      {
        id: 'inspection',
        name: 'Inspection',
        icon: FiCheckCircle,
        path: '/inspection/pending',
        type: 'single'
      },
      {
        id: 'warehouse',
        name: 'Warehouse',
        icon: FiArchive,
        path: '/warehouse/stock',
        type: 'single'
      },
      {
        id: 'reports',
        name: 'Production Reports',
        icon: FiBarChart,
        path: '/reports',
        type: 'single',
        badge: ''
      }
    ],
    EMPLOYEE: [
      {
        id: 'dashboard',
        name: 'My Dashboard',
        icon: FiGrid,
        path: '/dashboard',
        type: 'single',
        highlight: true
      },
      {
        id: 'psi',
        name: 'Product Standards',
        icon: FiTarget,
        path: '/psi/view',
        type: 'single'
      },
      {
        id: 'part',
        name: 'Part Reference',
        icon: FiPackage,
        path: '/part/manage',
        type: 'single'
      },
      {
        id: 'warehouse',
        name: 'Warehouse',
        icon: FiArchive,
        path: '/warehouse/stock',
        type: 'single'
      },
      {
        id: 'reports',
        name: 'My Reports',
        icon: FiFileText,
        path: '/reports',
        type: 'single'
      }
    ]
  }), []);

  const getNavigationItems = useCallback(() => {
    const role = user?.role;
    if (!role || !navigationStructure[role]) {
      return navigationStructure.EMPLOYEE;
    }
    return navigationStructure[role];
  }, [user?.role, navigationStructure]);

  const isItemActive = useCallback((item) => {
    if (item.type === 'single') {
      return activeItem === item.path || activeItem?.startsWith(item.path + '/');
    }
    
    if (item.type === 'dropdown' && item.items) {
      return item.items.some(subItem => 
        activeItem === subItem.path || activeItem?.startsWith(subItem.path + '/')
      );
    }
    
    return false;
  }, [activeItem]);

  const isSubItemActive = useCallback((path) => {
    return activeItem === path || activeItem?.startsWith(path + '/');
  }, [activeItem]);

  const renderMenuItem = useCallback((item, index) => {
    const uniqueKey = `${item.id}-${index}`;
    
    if (item.type === 'single') {
      const isActive = isItemActive(item);
      const Icon = item.icon;
      
      return (
        <Link
          key={uniqueKey}
          to={item.path}
          onClick={() => setActiveItem(item.path)}
          className={`group flex items-center px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 ${
            isActive
              ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg'
              : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-900'
          } ${item.highlight ? 'border-l-4 border-blue-600' : ''}`}
          aria-current={isActive ? 'page' : undefined}
        >
          <MemoizedIcon 
            Icon={Icon} 
            className={`mr-4 flex-shrink-0 w-5 h-5 transition-transform duration-300 ${
              isActive ? 'text-white scale-110' : 'text-gray-500 group-hover:text-blue-700'
            }`} 
          />
          {!collapsed && (
            <>
              <span className={`truncate ${isActive ? 'font-semibold' : 'font-medium'}`}>
                {item.name}
              </span>
              {item.badge && (
                <span className={`ml-auto inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {item.badge}
                </span>
              )}
            </>
          )}
        </Link>
      );
    }

    if (item.type === 'dropdown') {
      const isExpanded = expandedMenus[item.id] || false;
      const hasActiveChild = isItemActive(item);
      const Icon = item.icon;
      const submenuId = `submenu-${item.id}`;
      
      return (
        <div key={uniqueKey} className="space-y-1">
          <button
            onClick={() => toggleMenu(item.id)}
            className={`group flex items-center justify-between w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-300 ${
              hasActiveChild && !isExpanded
                ? 'bg-gradient-to-r from-blue-50 to-gray-50 text-blue-900 border-l-4 border-blue-600'
                : isExpanded
                ? 'bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg'
                : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-blue-50 hover:text-blue-900'
            }`}
            aria-expanded={isExpanded}
            aria-controls={submenuId}
            aria-label={`${item.name} menu`}
          >
            <div className="flex items-center">
              <MemoizedIcon 
                Icon={Icon} 
                className={`mr-4 flex-shrink-0 w-5 h-5 ${
                  isExpanded
                    ? 'text-white'
                    : hasActiveChild
                    ? 'text-blue-700'
                    : 'text-gray-500 group-hover:text-blue-700'
                }`} 
              />
              {!collapsed && (
                <>
                  <span className={`truncate ${(isExpanded || hasActiveChild) ? 'font-semibold' : 'font-medium'}`}>
                    {item.name}
                  </span>
                  {item.badge && (
                    <span className={`ml-2 px-2.5 py-1 text-xs font-semibold rounded-lg ${
                      isExpanded
                        ? 'bg-white/20 text-white'
                        : hasActiveChild
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </div>
            {!collapsed ? (
              isExpanded ? (
                <FiChevronDown className={`w-4 h-4 transition-transform duration-300 ${
                  isExpanded ? 'text-white' : 'text-gray-500'
                }`} />
              ) : (
                <FiChevronRight className={`w-4 h-4 transition-transform duration-300 ${
                  hasActiveChild ? 'text-blue-700' : 'text-gray-500'
                }`} />
              )
            ) : (
              // Show indicator when collapsed and has active child
              hasActiveChild && (
                <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
              )
            )}
          </button>
          
          {isExpanded && !collapsed && (
            <div 
              id={submenuId}
              className="ml-4 pl-8 border-l border-gray-200 space-y-1"
              role="menu"
            >
              {item.items?.map((subItem) => {
                const isSubActive = isSubItemActive(subItem.path);
                const SubIcon = subItem.icon;
                return (
                  <Link
                    key={subItem.id}
                    to={subItem.path}
                    onClick={() => setActiveItem(subItem.path)}
                    className={`flex items-center px-3 py-2.5 text-sm rounded-lg transition-all duration-200 ${
                      isSubActive
                        ? 'text-blue-900 font-semibold bg-blue-50 border-l-4 border-blue-600 -ml-1 pl-3'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                    role="menuitem"
                    aria-current={isSubActive ? 'page' : undefined}
                  >
                    <MemoizedIcon 
                      Icon={SubIcon} 
                      className={`mr-3 w-4 h-4 ${
                        isSubActive ? 'text-blue-700' : 'text-gray-400'
                      }`} 
                    />
                    <span className="truncate">{subItem.name}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return null;
  }, [collapsed, expandedMenus, isItemActive, isSubItemActive, toggleMenu]);

  const navigationItems = useMemo(() => getNavigationItems(), [getNavigationItems]);

  // Fallback UI if no user
  if (!user) {
    return (
      <div className="hidden md:flex md:w-72 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow pt-5 bg-gradient-to-b from-white via-gray-50/30 to-white border-r border-gray-200 shadow-lg overflow-hidden">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center p-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <FiUsers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600">Please log in to view navigation</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`hidden md:flex ${collapsed ? 'md:w-20' : 'md:w-72'} md:flex-col md:fixed md:inset-y-0 transition-all duration-300 ease-in-out`}>
      <div className="flex flex-col flex-grow pt-5 bg-gradient-to-b from-white via-gray-50/30 to-white border-r border-gray-200 shadow-lg overflow-hidden">
        {/* Logo and Collapse Toggle */}
        <div className="px-4 mb-6 flex-shrink-0">
          <div className="flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-3" aria-label="Dashboard">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-900 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
                <FiGlobe className="w-6 h-6 text-white" />
              </div>
              {!collapsed && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Devion Technologies ERP</h1>
                  <p className="text-xs text-gray-600 px-2 py-1 rounded-lg bg-blue-50 text-blue-800 font-medium">
                    Corporate Suite v3.2
                  </p>
                </div>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <FiChevronLeft className={`w-5 h-5 text-gray-600 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="px-4 mb-6 flex-shrink-0">
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} p-3 bg-gradient-to-r from-blue-50 to-gray-50 rounded-xl border border-gray-200`}>
            <div className="relative">
              <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm border-2 border-white">
                <span className="text-blue-900 font-semibold text-sm">
                  {user?.fullName?.split(' ').map(n => n[0]).join('') || 'U'}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.fullName || 'User'}</p>
                <p className="text-xs text-gray-600 truncate flex items-center">
                  <FiBriefcase className="w-3 h-3 mr-1 text-blue-700" />
                  {user?.role?.replace('_', ' ') || 'Role'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden" role="navigation" aria-label="Main navigation">
          <nav className="px-4 pb-4 space-y-2">
            {navigationItems.map((item, index) => renderMenuItem(item, index))}
          </nav>
        </div>

        {/* System Status & Footer */}
        <div className="px-4 py-4 border-t border-gray-200 bg-gradient-to-r from-gray-50/50 to-blue-50/50 flex-shrink-0">
          {!collapsed && (
            <div className="mb-4 p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-800 flex items-center">
                  <FiShield className="w-3 h-3 mr-2 text-green-600" />
                  System Status
                </span>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  <span className="text-xs font-medium text-green-700">Optimal</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">Active Sessions</span>
                <span className="text-xs font-semibold text-gray-800">247</span>
              </div>
            </div>
          )}
          
          <div className="text-center">
            {!collapsed ? (
              <>
                <div className="flex items-center justify-center space-x-1 mb-3">
                  <div className="w-2 h-2 bg-blue-700 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                </div>
                <p className="text-xs text-gray-700 font-medium">Devion Technologies ERP System</p>
                <p className="text-xs text-gray-600 mt-1">Version 3.2.1</p>
                <p className="text-[10px] text-gray-500 mt-1">© 2025 Devion Technologies PVT LTD</p>
                      <p className="text-[10px] text-gray-500 mt-1">deviontech.in</p>
              </>
            ) : (
              <div className="w-10 h-10 mx-auto bg-gradient-to-br from-blue-900 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white text-xs font-bold">HL</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
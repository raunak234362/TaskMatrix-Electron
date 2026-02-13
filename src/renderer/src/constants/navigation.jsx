import {
    LayoutDashboard,
    Hammer,
    PenTool,
    FileQuestion,
    Calculator,
    Briefcase,
    Receipt,
    Landmark,
    CheckSquare,
    Users,
    MessageCircle,
    UserCircle,
    DollarSign,
    Factory,
    FileText,
    Calendar
} from 'lucide-react'

export const navItems = [
    {
        label: 'Dashboard',
        to: '/dashboard',
        icon: <LayoutDashboard />,
        roles: [
            'admin',
            'dept_manager',
            'estimator',
            'staff',
            'project_manager_officer',
            'connection_designer_engineer',
            'operation_executive',
            'deputy_manager',
            'department_manager',
            'project_manager',
            'client',
            'client_admin',
            'system_admin',
            'user',
        ]
    },
    {
        label: 'Fabricator',
        to: 'fabricator',
        icon: <Hammer />,
        roles: [
            'admin',
            'department_manager',
            'deputy_manager',
            'operation_executive',
            'project_manager_officer',
            'system_admin',
            'user',
            'sales_manager',
            'sales'
        ]
    },
    {
        label: 'Connection Designer',
        to: 'connection-designer',
        icon: <PenTool />,
        roles: ['admin', 'operation_executive', 'department-manager', 'deputy_manager']
    },
    {
        label: 'Sales',
        to: 'sales',
        icon: <DollarSign />,
        roles: ['admin', 'sales', 'sales_manager', 'system-admin']
    },
    {
        label: 'RFQ',
        to: 'rfq',
        icon: <FileQuestion />,
        roles: [
            'admin',
            'sales_manager',
            'operation_executive',
            'estimation_head',
            'deputy_manager',
            'client_admin',
            'client',
            'sales'
        ]
    },
    {
        label: 'Estimations',
        to: 'estimation',
        icon: <Calculator />,
        roles: [
            'admin',
            'sales_manager',
            'estimation_head',
            'operation_executive',
            'estimator',
            'department-manager',
            'deputy_manager',
            'user'
        ]
    },
    {
        label: 'Projects',
        to: 'projects',
        icon: <Briefcase />,
        roles: [
            'admin',
            'dept_manager',
            'deputy_manager',
            'estimation_head',
            'operation_executive',
            'project_manager_officer',
            'team_lead',
            'staff',
            'sales_manager',
            'client_admin',
            'connection_designer_engineer',
            'client',
            'project_manager',
            'user',
            'human-resource'
        ]
    },
    {
        label: 'Invoices',
        to: 'invoices',
        icon: <Receipt />,
        roles: ['admin', 'project_manager_officer', 'client_admin', 'pmo', 'client']
    },
    {
        label: 'Calendar',
        to: 'calendar',
        icon: <Calendar />,
        roles: ['admin', 'project_manager_officer', 'pmo','operation_executive']
    },
    {
        label: 'Accounts',
        to: 'accounts',
        icon: <Landmark />,
        roles: ['admin', 'project_manager_officer', 'pmo']
    },
    {
        label: 'Tasks',
        to: 'tasks',
        icon: <CheckSquare />,
        roles: [
            'admin',
            'staff',
            'operation_executive',
            'estimator',
            'dept_manager',
            'estimation_head',
            'department-manager',
            'deputy_manager',
            'project_manager',
            'user',
            'system-admin',
            'human-resource'
        ]
    },
    {
        label: 'Manage Team',
        to: 'manage-team',
        icon: <Users />,
        roles: [
            'admin',
            'human_resource',
            'department-manager',
            'project-manager',
            'operation_executive',
            'deputy_manager',
            'user',
            'human-resource'
        ]
    },
    {
        label: 'Vendor',
        to: 'vendor',
        icon: <Factory />,
        roles: ['admin', 'operation_executive', 'department-manager', 'deputy_manager']
    },
    {
        label: 'Chats',
        to: 'chats',
        icon: <MessageCircle />,
        roles: [
            'admin',
            'staff',
            'department_manager',
            'operation_executive',
            'project_manager_officer',
            'project_manager',
            'estimation_head',
            'deputy_manager',
            'user',
            'human-resource'
        ]
    },
    {
        label: 'Notes',
        to: 'notes',
        icon: <FileText />,
        roles: [
            'admin',
            'staff',
            'department-manager',
            'deputy_manager',
            'project-manager',
            'client',
            'estimation_head',
            'system-admin',
            'user',
            'estimator',
            'sales'
        ]
    },
    {
        label: 'Profile',
        to: 'profile',
        icon: <UserCircle />,
        roles: [
            'admin',
            'project_manager_officer',
            'user',
            'estimation_head',
            'operation_executive',
            'staff',
            'client',
            'connection_designer_engineer',
            'estimator',
            'sales',
            'sales_manager',
            'dept_manager',
            'client_admin',
            'deputy_manager',
            'project_manager',
            'system_admin',
            'human_resource'
        ]
    }
]

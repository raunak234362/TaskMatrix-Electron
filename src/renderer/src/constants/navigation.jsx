import {
    ChartCandlestick,
    Home,
    MessageSquare,
    User2,
    Hourglass,
    FolderOpenDot,
    FileText
} from 'lucide-react'

export const navItems = [
    {
        label: 'Dashboard',
        to: '/dashboard',
        icon: <Home />,
        roles: [
            'admin',
            'staff',
            'department-manager',
            'deputy-manager',
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
        label: 'Estimations',
        to: 'estimation',
        icon: <Hourglass />,
        roles: ['admin', 'estimation_head', 'department-manager', 'deputy-manager', 'staff']
    },
    {
        label: 'Tasks',
        to: 'tasks',
        icon: <ChartCandlestick />,
        roles: [
            'admin',
            'staff',
            'department-manager',
            'deputy-manager',
            'project-manager',
            'estimation_head',
            'user',
            'system-admin',
            'human-resource'
        ]
    },
    {
        label: 'Chats',
        to: 'chats',
        icon: <MessageSquare />,
        roles: [
            'admin',
            'staff',
            'department-manager',
            'project-manager',
            'estimation_head',
            'deputy-manager',
            'user',
            'human-resource'
        ]
    },
    {
        label: 'Projects',
        to: 'projects',
        icon: <FolderOpenDot />,
        roles: [
            'admin',
            'staff',
            'department-manager',
            'deputy-manager',
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
        label: 'Notes',
        to: 'notes',
        icon: <FileText />,
        roles: [
            'admin',
            'staff',
            'department-manager',
            'deputy-manager',
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
        icon: <User2 />,
        roles: [
            'admin',
            'user',
            'staff',
            'client',
            'connection_designer_engineer',
            'estimator',
            'estimation_head',
            'sales',
            'dept_manager',
            'project_manager',
            'system_admin',
            'human_resource'
        ]
    }
]

import Login from '../pages/Login'
import RequireAuth from '../middleware/RequireAuth'
import { WBTDashboard } from '../components'
import ProfilePage from '../pages/ProfilePage'
import { ChatPage } from '../pages/ChatPage'
import ChangePasswordPage from '../pages/ChangePasswordPage'
import RFIPage from '../pages/RFIPage'
import EstimationPage from '../pages/EstimationPage'
import TaskPage from '../pages/TaskPage'
import ProjectPage from '../pages/ProjectPage'
import NotesPage from '../pages/NotesPage'
import VendorPage from '../pages/VendorPage'
import FabricatorPage from '../pages/FabricatorPage'
import RFQPage from '../pages/RFQPage'
import ConnectionPage from '../pages/ConnectionPage'
import invoicePage from '../pages/invoicePage'
import AccountPage from '../pages/AccountPage'
import TeamPage from '../pages/TeamPage'
import CoTablePage from '../components/co/CoTablePage'
import SalesDashboard from '../components/sales/SalesDashboard'
import DesignerLandingDashboard from '../components/dashboard/DesignerLandingDashboard'
import App from '../App'

const routes = [
  { path: '/', Component: Login },
  { path: '/co-table', Component: CoTablePage },
  { path: '/change-password', Component: ChangePasswordPage },
  {
    Component: RequireAuth,
    children: [
      {
        path: '/dashboard',
        Component: App,
        children: [
          { path: '', Component: WBTDashboard },
          { path: 'profile', Component: ProfilePage },
          { path: 'tasks', Component: TaskPage },
          { path: 'estimation', Component: EstimationPage },
          { path: 'chats', Component: ChatPage },
          { path: 'rfi', Component: RFIPage },
          { path: 'projects', Component: ProjectPage },
          { path: 'notes', Component: NotesPage },
          { path: 'vendor', Component: VendorPage },
          { path: 'fabricator', Component: FabricatorPage },
          { path: 'rfq', Component: RFQPage },
          { path: 'connection-designer', Component: ConnectionPage },
          { path: 'invoices', Component: invoicePage },
          { path: 'accounts', Component: AccountPage },
          { path: 'manage-team', Component: TeamPage },
          { path: 'sales', Component: SalesDashboard },
          { path: 'designer', Component: DesignerLandingDashboard }
        ]
      }
    ]
  }
]
export default routes

import FabricatorService from './services/fabricator.service'
import RFQService from './services/RFQ.service'
import RFIService from './services/RFI.service'
import SubmittalsService from './services/Submittals.service'
import COService from './services/CO.service'
import EmployeeService from './services/employee.service'
import TeamService from './services/team.service'
import ConnectionDesignerService from './services/connectionDesigner.service'
import EstimationService from './services/estimation.service'
import ProjectService from './services/project.service'
import TaskService from './services/task.service'
import DashboardService from './services/dashboard.service'
import MilestoneService from './services/milestone.service'
import WBSTemplateService from './services/wbsTemplate.service'
import ChatService from './services/chat.service'
import InvoiceService from './services/invoice.service'
import MeetingService from './services/meeting.service'
import MiscellaneousService from './services/miscellaneous.service'
import StandardsService from './services/standards.service'

class Service { }

const services = [
  FabricatorService,
  RFQService,
  RFIService,
  SubmittalsService,
  COService,
  EmployeeService,
  TeamService,
  ConnectionDesignerService,
  EstimationService,
  ProjectService,
  TaskService,
  DashboardService,
  MilestoneService,
  WBSTemplateService,
  ChatService,
  InvoiceService,
  MeetingService,
  MiscellaneousService,
  StandardsService
]

services.forEach(service => {
  Object.getOwnPropertyNames(service).forEach(prop => {
    if (prop !== 'prototype' && prop !== 'name' && prop !== 'length') {
      Service[prop] = (...args) => service[prop](...args)
    }
  })
})

export {
  FabricatorService,
  RFQService,
  RFIService,
  SubmittalsService,
  COService,
  EmployeeService,
  TeamService,
  ConnectionDesignerService,
  EstimationService,
  ProjectService,
  TaskService,
  DashboardService,
  MilestoneService,
  WBSTemplateService,
  ChatService,
  InvoiceService,
  MeetingService,
  MiscellaneousService,
  StandardsService
}

export default Service

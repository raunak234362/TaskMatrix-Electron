import { toast } from 'react-toastify'
import api from './api'
const token = sessionStorage.getItem('token')
class Service {
  //Get Logged-In User Detail
  static async GetUserByToken() {
    try {
      const response = await api.get(`user/me`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log('Signed In User detail-', response)
      return response.data
    } catch (error) {
      //alert(error);
      console.log('Error while fetching logged-in user Detail', error)
    }
  }

  //Add New Employee
  static async AddEmployee(employeeData) {
    try {
      const response = await api.post(`employee`, employeeData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response?.data
    } catch (error) {
      //alert(error);
      console.log('Error while adding New User', error)
    }
  }

  //Fetch All Employee
  static async FetchAllEmployee() {
    try {
      const response = await api.get(`employee`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      //alert(error);
      console.log('Error fetching all Employee', error)
      console.log('Error fetching all Employee', error)
    }
  }
  //Fetch Employee by ROLE
  static async FetchEmployeeByRole(role) {
    try {
      const response = await api.get(`employee/role/${role}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      // //alert(error);
      console.log('Error fetching all Employee', error)
    }
  }

  // Fetch Employee by ID
  static async FetchEmployeeByID(id) {
    try {
      const response = await api.get(`employee/${id}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      //alert(error);
      console.log('Error fetching Employee by ID', error)
      console.log('Error fetching Employee by ID', error)
    }
  }

  //Edit Employee By ID
  static async EditEmployeeByID(id, data) {
    try {
      const response = await api.put(`employee/update/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      //alert(error);
      console.log('Error fetching Employee by ID', error)
      console.log('Error fetching Employee by ID', error)
    }
  }

  //Add Department
  static async AddDepartment(departmentData) {
    try {
      const response = await api.post(`department`, departmentData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response?.data
    } catch (error) {
      //alert(error);
      console.log('Error while adding New User', error)
    }
  }
  //All Departments
  static async AllDepartments() {
    try {
      const response = await api.get(`department`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      //alert(error);
      console.log('Error fetching all Employee', error)
      console.log('Error fetching all Employee', error)
    }
  }

  // Fetch Department by ID
  static async FetchDepartmentByID(id) {
    try {
      const response = await api.get(`department/department/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      //alert(error);
      console.log('Error fetching Employee by ID', error)
      console.log('Error fetching Employee by ID', error)
    }
  }

  // Add team
  static async AddTeam(teamDataPayload) {
    try {
      const response = await api.post(`team`, teamDataPayload, {
        headers: { 'Content-Type': 'application/json' }
      })
      console.log(response?.data)
      toast.success('Successfully added Team')
    } catch (error) {
      //alert(error);
      console.log('Error adding team', error)
    }
  }

  // Fetch All Team
  static async AllTeam() {
    try {
      const response = await api.get(`team`)
      console.log(response?.data)
      return response?.data
    } catch (error) {
      //alert(error);
      console.log('Error Fetching All Team', error)
      console.log('Error Fetching All Team', error)
    }
  }

  //Fetch team by Id
  static async GetTeamByID(id) {
    try {
      const response = await api.get(`team/${id}`)
      console.log(response?.data)
      return response?.data
    } catch (error) {
      //alert(error);
      console.log('Error Fetching All Team', error)
    }
  }

  // Add Team Members
  static async AddTeamMembers(role, data) {
    try {
      const response = await api.post(`team/addMembers/${role}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response?.data)
      return response?.data
    } catch (error) {
      console.log(error)
    }
  }

  // Update role of Team Member
  static async UpdateTeamMemberRole(teamId, MemberData) {
    try {
      const response = await api.put(`team/updateRole/${teamId}`, MemberData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response?.data)
      return response?.data
    } catch (error) {
      console.log(error)
      console.log('Error Fetching All Team', error)
    }
  }

  // Add fabricator
  static async AddFabricator(fabricatorData) {
    try {
      const response = await api.post(`fabricator`, fabricatorData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log(' Fabricator API Response:', response)
      return response.data
    } catch (error) {
      console.error(' Error while adding New Fabricator:', error)
      throw error
    }
  }

  static async GetAllFabricators() {
    try {
      const response = await api.get(`fabricator/all`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Fabricators fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Fetch Fabricator by ID
  static async GetFabricatorByID(id) {
    try {
      const response = await api.get(`fabricator/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Fabricator fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Update Fabricator by ID
  static async EditFabricatorByID(id, data) {
    try {
      const response = await api.put(`fabricator/update/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('Fabricators Edited:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Add branch by Fabricator ID
  static async AddBranchByFabricator(data) {
    try {
      const response = await api.post(`fabricator/branch`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Fabricators fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Add Client by Fabricator ID
  static async AddClientByFabricator(fabricatorId, data) {
    try {
      const response = await api.post(`client/${fabricatorId}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Client added by Fabricator ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Fetch All Clients by Fabricator ID
  static async FetchAllClientsByFabricatorID(fabricatorId) {
    try {
      const response = await api.get(`client/byFabricator/${fabricatorId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Clients fetched by Fabricator ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find clients', error)
    }
  }

  // Fetch Client by ID
  static async FetchClientByID(clientID) {
    try {
      const response = await api.get(`client/byFabricator/${clientID}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Clients fetched by Fabricator ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find clients', error)
    }
  }

  //Add new RFQ
  static async addRFQ(formData) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`rfq`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }
  //Fetch all the RFQ
  static async FetchAllRFQ() {
    try {
      const response = await api.get(`rfq/all`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Data fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfqs', error)
    }
  }

  // api for sents :
  static async RfqSent() {
    try {
      const response = await api.get(`rfq/sents`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' RFQ sents:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfqs', error)
    }
  }

  //api for recieved:
  static async RFQRecieved() {
    try {
      const response = await api.get(`rfq/received`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      console.log('  RFQ received:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfqs', error)
    }
  }
  //getting rfqbyID

  static async GetRFQbyId(rfqId) {
    try {
      const response = await api.get(`rfq/getById/${rfqId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All rfq fetched by rfq ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfq', error)
    }
  }

  // Update RFQ by ID
  static async UpdateRFQById(rfqId, data) {
    try {
      const response = await api.put(`rfq/update/${rfqId}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('RFQ updated:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot update rfq', error)
    }
  }
  //RESPONSES
  //response post request

  static async addResponse(formData, responseId) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`rfq/${responseId}/responses`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  //Add Connection Designer
  static async AddConnectionDesigner(data) {
    console.log(data)

    try {
      const response = await api.post(`connectionDesign`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Fetch All Connection Designer
  static async FetchAllConnectionDesigner() {
    try {
      const response = await api.get(`connectionDesign/all`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }
  // Fetch Connection Designer By ID
  static async FetchConnectionDesignerByID(id) {
    try {
      const response = await api.get(`connectionDesign/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Fetch Connection Designer By ID
  static async FetchConnectionQuotationByDesignerID(id) {
    try {
      const response = await api.get(`connectionDesignerQuota/designer/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }
  // Update Connection Designer By ID
  static async UpdateConnectionDesignerByID(id, data) {
    try {
      const response = await api.put(`connectionDesign/update/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Add Estimation
  static async AddEstimation(formData) {
    try {
      const response = await api.post(`estimation/estimations`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }
  // Add Estimation
  static async AllEstimation() {
    try {
      const response = await api.get(`estimation/estimations`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }
  // Get Estimation By ID
  static async GetEstimationById(id) {
    try {
      const response = await api.get(`estimation/estimations/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Update Estimation By ID
  static async UpdateEstimationById(id, formData) {
    try {
      const response = await api.put(`estimation/estimations/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  // Add Estimation Task
  static async AddEstimationTask(formData) {
    try {
      const response = await api.post(`estimation/estimation-tasks`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Estimation Task For Assignee
  static async GetEstimationTaskForAssignee() {
    try {
      const response = await api.get(`estimation/estimation-tasks/my`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get all assigned estimation task
  static async GetAllAssignedEstimationTask() {
    try {
      const response = await api.get(`estimation/estimation-tasks/my/all`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Estimation Task By ID
  static async GetEstimationTaskById(id) {
    try {
      const response = await api.get(`estimation/estimation-tasks/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //Estimation Task Start by ID
  static async StartEstimationTaskById(id) {
    try {
      const response = await api.post(`task/EST/start/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //Estimation Task Pause By ID
  static async PauseEstimationTaskById(id, data) {
    try {
      const response = await api.patch(`task/EST/pause/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //Estimation Task Resume By ID
  static async ResumeEstimationTaskById(id) {
    try {
      const response = await api.post(`task/EST/resume/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //Estimation Task End by ID
  static async EndEstimationTaskById(id, data) {
    try {
      const response = await api.post(`task/EST/end/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Summary Estimation Task By ID
  static async SummaryEstimationTaskById(id) {
    try {
      const response = await api.get(`task/EST/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Line Item Group
  static async CreateLineItemGroup(data) {
    try {
      const response = await api.post(`estimation/line-items`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //fetch Group by ID
  static async FetchGroupById(id) {
    try {
      const response = await api.get(`estimation/line-items/group/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //update Group by ID
  static async UpdateGroupById(id, data) {
    try {
      const response = await api.put(`estimation/line-items/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //fetch Line item group
  static async FetchLineItemGroup(id) {
    try {
      const response = await api.get(`estimation/line-items/groups/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //fetch Line item group List
  static async FetchLineItemGroupList(id) {
    try {
      const response = await api.get(`estimation/line-items/Bygroup/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //Update Line Item By ID
  static async UpdateLineItemById(id, data) {
    try {
      const response = await api.put(`estimation/line-items/update/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // add new Line Item
  static async AddLineItem(data) {
    try {
      const response = await api.post(`estimation/line-items/item`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Add Group
  static async AddGroup(data) {
    try {
      const response = await api.post(`chat/group/`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Group added', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Add Project
  static async AddProject(formData) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`project/projects`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get All Projects
  static async GetAllProjects() {
    try {
      const response = await api.get(`project/projects`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Project By ID
  static async GetProjectById(id) {
    try {
      const response = await api.get(`project/projects/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Project Overall Dashboard
  static async GetProjectOverallDashboard(id, stage) {
    try {
      const response = await api.get(`project/${id}/dashboard/${stage}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Edit Project By ID
  static async EditProjectById(id, data) {
    try {
      const response = await api.put(`project/projects/${id}`, data)
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Add Project Milestone
  static async AddProjectMilestone(data) {
    try {
      const response = await api.post(`mileStone/`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Project Milestone By ID
  static async GetProjectMilestoneById(id) {
    try {
      const response = await api.get(`mileStone/project/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //Get mileston by ID
  static async GetMilestoneById(id) {
    try {
      const response = await api.get(`mileStone/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Milestone Responses
  static async addMilestoneResponse(formData) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`mileStone/responses`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error adding milestone response:', error)
      throw error
    }
  }

  static async UpdateMilestoneResponseStatus(parentResponseId, data) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.patch(`mileStone/responses/${parentResponseId}/status`, data, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error updating milestone response status:', error)
      throw error
    }
  }

  static async GetMilestoneResponseById(id) {
    try {
      const response = await api.get(`mileStone/responses/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching milestone response:', error)
      throw error
    }
  }

  static async ViewMilestoneResponseFile(responseId, fileId) {
    try {
      const response = await api.get(`mileStone/response/${responseId}/viewFile/${fileId}`, {
        headers: {
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      })
      return response.data
    } catch (error) {
      console.error('Error viewing milestone response file:', error)
      throw error
    }
  }

  //Fetch WBS-Template
  static async GetWBSTemplate() {
    try {
      const response = await api.get(`project/wbs/bundles`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // fetch bundle by ProjectID
  static async GetBundleByProjectId(projectId) {
    try {
      const response = await api.get(`project/projects/${projectId}/bundles`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //fetch the line item from the wbsID
  static async GetWBSLineItem(wbsId) {
    try {
      const response = await api.get(`project/project-wbs/${wbsId}/line-items`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // patch the LineItem
  static async UpdateLineItem(id, data) {
    try {
      const response = await api.patch(`project/line-items/${id}/`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //Add WBS Template
  static async AddWBSTemplate(data) {
    try {
      const response = await api.post(`project/wbs-templates`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //add wbs from wbs template by project id
  static async AddWBSFromTemplate(projectId, wbsData) {
    try {
      const response = await api.post(`project/projects/${projectId}/wbs/expand`, wbsData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Add WBS in Project
  static async AddWBSInProject(projectId) {
    try {
      const response = await api.post(
        `project/projects/${projectId}/wbs
`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get WBS By Project ID
  static async GetWBSByProjectId(projectId) {
    try {
      const response = await api.get(`project/projects/${projectId}/wbs`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get WBS By ID
  static async GetWBSById(id) {
    try {
      const response = await api.get(`project/wbs/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get WBS By ID
  static async GetWBSLineItemById(projectId, id, stage) {
    try {
      const response = await api.get(
        `project/projects/${projectId}/stages/${stage}/wbs/${id}/line-items`,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Update WBS line-item by ProjectId, wbsId and line-item ID
  static async UpdateWBSLineItem(projectId, wbsId, lineItemId, data) {
    try {
      const response = await api.put(
        `project/projects/${projectId}/work-break-downs/${wbsId}/line-items/${lineItemId}`,
        data,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Fetch All Chats
  static async AllChats() {
    try {
      const response = await api.get(`chat/recent`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Fabricators fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find fabricators', error)
    }
  }

  // Add Group Members
  static async AddGroupMembers(data) {
    try {
      const response = await api.post(`chat/group/members`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Group members added', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Fetch Group Members
  static async GetGroupMembers(groupId) {
    try {
      const response = await api.get(`chat/group/${groupId}/members`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Group members fetched', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Delete Group Member
  static async DeleteGroupMember(groupId, memberId) {
    try {
      const response = await api.delete(`chat/group/${groupId}/member/${memberId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Group member deleted', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Project Notes
  static async GetProjectNotes(projectId) {
    try {
      const response = await api.get(`project/projects/${projectId}/notes`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Project notes fetched', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Get Project Note By ID
  static async GetProjectNoteById(projectId, noteId) {
    try {
      const response = await api.get(`project/projects/${projectId}/notes/${noteId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Project note fetched', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Create Project Note
  static async CreateProjectNote(projectId, data) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`project/projects/${projectId}/notes`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(' Project note created', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Delete Group
  static async DeleteGroup(groupId) {
    try {
      const response = await api.delete(`chat/group/${groupId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Group deleted', response.data)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // Fetch Chats by Group ID
  static async ChatByGroupID(groupId, lastId) {
    console.log(lastId)

    try {
      // lastId is optional so handle it properly
      // const url = lastId
      //   ? `chat/group/${groupId}/history/${lastId}`
      //   : `chat/group/${groupId}/history`;
      const url = `chat/group/${groupId}/history/${lastId}`

      const response = await api.get(url, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Chats by Group ID fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Cannot find chats by group ID', error)
      throw error
    }
  }

  //RFI components
  //Add new RFI
  static async addRFI(formData) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`rfi`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  //pending RFIs
  static async pendingRFIs() {
    try {
      const response = await api.get(`rfi/pendingRFIs`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('pending RFIs:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find pending RFIs', error)
    }
  }
  static async RfiSent() {
    try {
      const response = await api.get(`rfi/sents`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' RFI sents:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfIs', error)
    }
  }

  static async RfiRecieved() {
    try {
      const response = await api.get(`rfi/received`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('  RFI received:', response.data)
      return response.data
    } catch (error) {
      console.error("cannot find rfi's", error)
    }
  }
  static async GetRFIbyId(rfiId) {
    try {
      const response = await api.get(`rfi/getById/${rfiId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All rfi fetched by rfi ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfi', error)
    }
  }
  static async EditRFIByID(id, data) {
    try {
      const response = await api.put(`rfi/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('RFI Edited:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find RFI', error)
    }
  }
  //RFI responses
  static async addRFIResponse(formData, responseId) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`rfi/${responseId}/responses`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  static async GetRFIResponsebyId(rfiId) {
    try {
      const response = await api.get(`rfi/responses/${rfiId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All rfq fetched by rfq ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find rfq', error)
    }
  }

  //submitals route ----------------------------------------------
  static async AddSubmittal(formData) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`submittal/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //pending submittals
  static async PendingSubmittal() {
    try {
      const response = await api.get(`submittal/pendingSubmittal`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Pending submittals:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find submittals', error)
    }
  }

  //All Submitals
  static async SubmittalSent() {
    try {
      const response = await api.get(`submittal/sent`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Submittals sents:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find submittals', error)
    }
  }

  static async SubmittalRecieved() {
    try {
      const response = await api.get(`submittal/received`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      console.log('  Submittal received:', response.data)
      return response.data
    } catch (error) {
      console.error("cannot find submittal's", error)
    }
  }
  static async GetSubmittalbyId(Id) {
    try {
      const response = await api.get(`submittal/${Id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All submittal fetched by submittalID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find submittal', error)
    }
  }
  //submittal responses
  static async addSubmittalResponse(formData) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`submittal/responses/`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }
  static async GetSubmittalResponsebyId(subId) {
    try {
      const response = await api.get(`submittal/responses/${subId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All submittals fetched by sub ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find sub', error)
    }
  }

  //change Order ---------------------------------------------
  static async ChangeOrder(formData) {
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`changeOrder/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  // pending Co
  static async PendingCo() {
    try {
      const response = await api.get(`changeOrder/pendingCOs`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Pending Co:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find Co', error)
    }
  }

  //change order by id
  static async GetChangeOrderByID(ID){
    try {
      const response = await api.get(`changeOrder/ById/${ID}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Co fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find CO', error)
    }
  }

  static async GetChangeOrder(projectId) {
    try {
      const response = await api.get(`changeOrder/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Co fetched by projectID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find CO', error)
    }
  }
  //update Co
  static async EditCoById(id, data) {
    try {
      const response = await api.put(`changeOrder/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      console.log('co Edited:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find CO', error)
    }
  }
  //response routes
  static async addCOResponse(formData, responseId) {
    const token = sessionStorage.getItem('token')

    const response = await api.post(`changeOrder/${responseId}/responses`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  // Change Order Table Methods
  static async GetAllCOTableRows(coId) {
    try {
      const response = await api.get(`changeOrder/${coId}/table`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching CO table rows:', error)
    }
  }

  static async addCOTable(data, coId) {
    try {
      const response = await api.post(`changeOrder/${coId}/table`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('Error saving CO table:', error)
      throw error
    }
  }

  //Add Task
  static async AddTask(data) {
    console.log(data)
    const token = sessionStorage.getItem('token')
    try {
      const response = await api.post(`task/`, data, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })
      console.log(response)
      return response.data
    } catch (error) {
      console.log(error)
    }
  }

  //Get All Task
  static async GetAllTask() {
    try {
      const response = await api.get(`task/getAllTasks`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Task fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
    }
  }

  // Get Tasks By Project ID
  static async GetTasksByProjectId(projectId) {
    try {
      const response = await api.get(`task/project/${projectId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Tasks for project fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching tasks by project ID:', error)
      throw error
    }
  }
  //Get All Task
  static async GetMyTask() {
    try {
      const response = await api.get(`task/user/tasks`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Task fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
    }
  }

  //non-completed-tasks
  static async GetNonCompletedTasks() {
    try {
      const response = await api.get(`task/user/non-completed-tasks`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Task fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
    }
  }

  //Get Task by ID
  static async GetTaskById(id) {
    try {
      const response = await api.get(`task/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' All Task fetched by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
    }
  }

  // Update Task by ID
  static async UpdateTaskById(id, data) {
    try {
      const response = await api.put(`task/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Task updated by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot update Task', error)
    }
  }

  //delete Task by ID
  static async DeleteTaskById(id) {
    try {
      const response = await api.delete(`task/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log(' Task deleted by ID:', response.data)
      return response.data
    } catch (error) {
      console.error('cannot delete Task', error)
    }
  }

  //Task Start
  static async TaskStart(id) {
    try {
      const response = await api.post(`task/start/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      // console.log(" All Task fetched by ID:", response.data);
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
    }
  }

  //Task Resume
  static async TaskResume(id) {
    try {
      const response = await api.post(`task/resume/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      // console.log(" All Task fetched by ID:", response.data);
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
    }
  }

  //Task Pause
  static async TaskPause(id, data) {
    try {
      const response = await api.patch(`task/pause/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      // console.log(" All Task fetched by ID:", response.data);
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
    }
  }

  //Task End
  static async TaskEnd(id, data) {
    try {
      const response = await api.post(`task/end/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      // console.log(" All Task fetched by ID:", response.data);
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
    }
  }

// Task Comments
static async AddTaskComment(data) {
  try {
    const response = await api.post(`comment`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('Task comment added:', response.data)
    return response.data
  } catch (error) {
    console.error('Error adding task comment:', error)
    throw error
  }
}

// Add Acknowledged by comment ID
static async AddTaskCommentAcknowledged(id,data) {
  try {
    const response = await api.patch(`comment/acknowledge/${id}`, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    })
    console.log('Task comment acknowledged:', response.data)
    return response.data
  } catch (error) {
    console.error('Error acknowledging task comment:', error)
    throw error
  }
}

  // Get User Stats
  static async getUsersStats(userId) {
    try {
      const response = await api.get(`task/user/stats/${userId}`)
      return response.data
    } catch (error) {
      console.error(`Error fetching stats for user ${userId}:`, error)
      throw error
    }
  }

  // Add Bank Account
  static async AddBankAccount(data) {
    try {
      const response = await api.post(`invoice/account`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Bank account added:', response.data)
      return response.data
    } catch (error) {
      console.error('Error adding bank account:', error)
      throw error
    }
  }

  // Add Invoice
  static async AddInvoice(data) {
    try {
      const response = await api.post(`invoice/create`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Invoice added:', response.data)
      return response.data
    } catch (error) {
      console.error('Error adding invoice:', error)
      throw error
    }
  }

  // Get Invoice
  static async GetInvoiceById(id) {
    try {
      const response = await api.get(`invoice/byId/${id}`)
      console.log('Invoice fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching invoice:', error)
      throw error
    }
  }

  // all Invoice
  static async GetAllInvoice() {
    try {
      const response = await api.get(`invoice/AllInvoices`)
      console.log('Invoice fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching invoice:', error)
      throw error
    }
  }

  //get bank accounts
  static async GetBankAccounts() {
    try {
      const response = await api.get(`invoice/accounts/all`)
      // console.log("Bank accounts fetched:", response.data);
      return response.data
    } catch (error) {
      console.error('Error fetching bank accounts:', error)
      throw error
    }
  }

  //get bank account by ID
  static async GetBankAccountById(id) {
    try {
      const response = await api.get(`invoice/account/${id}`)
      console.log('Bank account fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching bank account:', error)
      throw error
    }
  }

  //Dashboard Data
  static async GetDashboardData() {
    try {
      const response = await api.get(`dashBoardData/`)
      console.log('Dashboard data fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      throw error
    }
  }

  // upcomping submittal
  static async GetPendingSubmittal() {
    try {
      const response = await api.get(`mileStone/pendingSubmittals`)
      console.log('Upcoming submittal fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching upcoming submittal:', error)
      throw error
    }
  }

  // Create Share Link
  static async createShareLink(table, parentId, fileId, versionId) {
    try {
      const url = versionId 
        ? `share/${table}/${parentId}/versions/${versionId}/${fileId}`
        : `share/${table}/${parentId}/${fileId}`
      const response = await api.post(url)
      return response.data
    } catch (error) {
      console.error('Error creating share link:', error)
      throw error
    }
  }

  // ===========================================================
  // DESIGN DRAWINGS SERVICES
  // ===========================================================

  // Create new Design Drawing
  static async CreateDesignDrawing(data) {
    try {
      const response = await api.post(`design-drawings`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      console.error('Error creating design drawing:', error)
      throw error
    }
  }

  // Update stage / description of a Design Drawing
  static async UpdateDesignDrawing(id, data) {
    try {
      const response = await api.put(`design-drawings/${id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      return response.data
    } catch (error) {
      console.error('Error updating design drawing:', error)
      throw error
    }
  }

  // Get all Design Drawings (Admin)
  static async GetAllDesignDrawings() {
    try {
      const response = await api.get(`design-drawings`)
      return response.data
    } catch (error) {
      console.error('Error fetching all design drawings:', error)
      throw error
    }
  }

  // Get Design Drawings by Project ID
  static async GetDesignDrawingsByProjectId(projectId) {
    try {
      const response = await api.get(`design-drawings/project/${projectId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching design drawings by project ID:', error)
      throw error
    }
  }

  // Get a single Design Drawing by ID
  static async GetDesignDrawingById(id) {
    try {
      const response = await api.get(`design-drawings/${id}`)
      return response.data
    } catch (error) {
      console.error('Error fetching design drawing by ID:', error)
      throw error
    }
  }

  // Delete a Design Drawing
  static async DeleteDesignDrawing(id) {
    try {
      const response = await api.delete(`design-drawings/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting design drawing:', error)
      throw error
    }
  }

  // Get file metadata (from Design Drawing)
  static async GetDesignDrawingFileMetadata(designId, fileId) {
    try {
      const response = await api.get(`design-drawings/${designId}/files/${fileId}`)
      return response.data
    } catch (error) {
      console.error('Error fetching design drawing file metadata:', error)
      throw error
    }
  }

  // Stream file (from Design Drawing)
  static async ViewDesignDrawingFile(designId, fileId) {
    try {
      const response = await api.get(`design-drawings/viewFile/${designId}/${fileId}`)
      return response.data
    } catch (error) {
      console.error('Error viewing design drawing file:', error)
      throw error
    }
  }

  // Client Communication Followup Add
  static async AddClientCommunicationFollowup(data) {
    try {
      const response = await api.post(`communications`, data)
      return response.data
    } catch (error) {
      console.error('Error adding client communication followup:', error)
      throw error
    }
  }

  // Client Communication Followup List
  static async GetClientCommunicationFollowupList() {
    try {
      const response = await api.get(`communications`)
      return response.data
    } catch (error) {
      console.error('Error fetching client communication followup list:', error)
      throw error
    }
  }

  // Client Communication Followup Update
  static async UpdateClientCommunicationFollowup(id, data) {
    try {
      const response = await api.patch(`communications/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating client communication followup:', error)
      throw error
    }
  }

  // Client Communication mark as completed
  static async MarkClientCommunicationAsCompleted(id) {
    try {
      const response = await api.patch(`communications/complete/${id}`)
      return response.data
    } catch (error) {
      console.error('Error marking client communication as completed:', error)
      throw error
    }
  }

}
export default Service

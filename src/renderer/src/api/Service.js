/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from "react-toastify";
import api from "./api";
const token = sessionStorage.getItem("token");
class Service {
  //Get Logged-In User Detail
  static async GetUserByToken() {
    try {
      const response = await api.get(`user/me`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Signed In User detail-", response);
      return response.data;
    } catch (error) {
      //alert(error);
      console.log("Error while fetching logged-in user Detail", error);
    }
  }

  //Add New Employee
  static async AddEmployee(employeeData) {
    try {
      const response = await api.post(`employee`, employeeData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      return response?.data;
    } catch (error) {
      //alert(error);
      console.log("Error while adding New User", error);
    }
  }

  //Fetch All Employee
  static async FetchAllEmployee() {
    try {
      const response = await api.get(`employee`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      //alert(error);
      console.log("Error fetching all Employee", error);
      console.log("Error fetching all Employee", error);
    }
  }
  //Fetch Employee by ROLE
  static async FetchEmployeeByRole(role) {
    try {
      const response = await api.get(`employee/role/${role}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      // //alert(error);
      console.log("Error fetching all Employee", error);
    }
  }

  // Fetch Employee by ID
  static async FetchEmployeeByID(id) {
    try {
      const response = await api.get(`employee/${id}`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      //alert(error);
      console.log("Error fetching Employee by ID", error);
      console.log("Error fetching Employee by ID", error);
    }
  }

  //Edit Employee By ID
  static async EditEmployeeByID(id, data) {
    try {
      const response = await api.put(`employee/update/${id}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      //alert(error);
      console.log("Error fetching Employee by ID", error);
      console.log("Error fetching Employee by ID", error);
    }
  }

  //Add Department
  static async AddDepartment(departmentData) {
    try {
      const response = await api.post(`department`, departmentData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response?.data;
    } catch (error) {
      //alert(error);
      console.log("Error while adding New User", error);
    }
  }
  //All Departments
  static async AllDepartments() {
    try {
      const response = await api.get(`department`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      //alert(error);
      console.log("Error fetching all Employee", error);
      console.log("Error fetching all Employee", error);
    }
  }

  // Fetch Department by ID
  static async FetchDepartmentByID(id) {
    try {
      const response = await api.get(`department/department/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      //alert(error);
      console.log("Error fetching Employee by ID", error);
      console.log("Error fetching Employee by ID", error);
    }
  }

  // Add team
  static async AddTeam(teamDataPayload) {
    try {
      const response = await api.post(`team`, teamDataPayload, {
        headers: { "Content-Type": "application/json" },
      });
      console.log(response?.data);
      toast.success("Successfully added Team");
    } catch (error) {
      //alert(error);
      console.log("Error adding team", error);
    }
  }

  // Fetch All Team
  static async AllTeam() {
    try {
      const response = await api.get(`team`);
      console.log(response?.data);
      return response?.data;
    } catch (error) {
      //alert(error);
      console.log("Error Fetching All Team", error);
      console.log("Error Fetching All Team", error);
    }
  }

  //Fetch team by Id
  static async GetTeamByID(id) {
    try {
      const response = await api.get(`team/${id}`);
      console.log(response?.data);
      return response?.data;
    } catch (error) {
      //alert(error);
      console.log("Error Fetching All Team", error);
    }
  }

  // Add Team Members
  static async AddTeamMembers(role, data) {
    try {
      const response = await api.post(`team/addMembers/${role}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response?.data);
      return response?.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Update role of Team Member
  static async UpdateTeamMemberRole(teamId, MemberData) {
    try {
      const response = await api.put(`team/updateRole/${teamId}`, MemberData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response?.data);
      return response?.data;
    } catch (error) {
      console.log(error);
      console.log("Error Fetching All Team", error);
    }
  }

  // Add fabricator
  static async AddFabricator(fabricatorData) {
    try {
      const response = await api.post(`fabricator`, fabricatorData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(" Fabricator API Response:", response);
      return response.data;
    } catch (error) {
      console.error(" Error while adding New Fabricator:", error);
      throw error;
    }
  }

  static async GetAllFabricators() {
    try {
      const response = await api.get(`fabricator/all`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" All Fabricators fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find fabricators", error);
    }
  }

  // Fetch Fabricator by ID
  static async GetFabricatorByID(id) {
    try {
      const response = await api.get(`fabricator/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" Fabricator fetched by ID:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find fabricators", error);
    }
  }

  // Update Fabricator by ID
  static async EditFabricatorByID(id, data) {
    try {
      const response = await api.put(`fabricator/update/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("Fabricators Edited:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find fabricators", error);
    }
  }

  // Add branch by Fabricator ID
  static async AddBranchByFabricator(data) {
    try {
      const response = await api.post(`fabricator/branch`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" All Fabricators fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find fabricators", error);
    }
  }

  // Add Client by Fabricator ID
  static async AddClientByFabricator(fabricatorId, data) {
    try {
      const response = await api.post(`client/${fabricatorId}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" Client added by Fabricator ID:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find fabricators", error);
    }
  }

  // Fetch All Clients by Fabricator ID
  static async FetchAllClientsByFabricatorID(fabricatorId) {
    try {
      const response = await api.get(`client/byFabricator/${fabricatorId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" All Clients fetched by Fabricator ID:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find clients", error);
    }
  }

  // Fetch Client by ID
  static async FetchClientByID(clientID) {
    try {
      const response = await api.get(`client/byFabricator/${clientID}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" All Clients fetched by Fabricator ID:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find clients", error);
    }
  }

  //Add new RFQ
  static async addRFQ(formData) {
    const token = sessionStorage.getItem("token");

    const response = await api.post(`rfq`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data;
  }
  //Fetch all the RFQ
  static async FetchAllRFQ(rfqId) {
    try {
      const response = await api.get(`rfq/${rfqId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" All Data fetched by RFQ id:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find rfqs", error);
    }
  }

  // api for sents :
  static async RfqSent() {
    try {
      const response = await api.get(`rfq/sents`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" RFQ sents:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find rfqs", error);
    }
  }

  //api for recieved:
  static async RFQRecieved() {
    try {
      const response = await api.get(`rfq/received`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("  RFQ received:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find rfqs", error);
    }
  }
  //getting rfqbyID

  static async GetRFQbyId(rfqId) {
      try {
        const response = await api.get(`rfq/getById/${rfqId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(" All rfq fetched by rfq ID:", response.data);
        return response.data;
      } catch (error) {
        console.error("cannot find rfq", error);
      }
    }
  
  // Update RFQ by ID
  static async UpdateRFQById(rfqId, data) {
    try {
      const response = await api.put(`rfq/update/${rfqId}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("RFQ updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot update rfq", error);
    }
  } 
    //RESPONSES
  //response post request 

static async addResponse(formData, responseId) {
  const token = sessionStorage.getItem("token");

  const response = await api.post(`rfq/${responseId}/responses`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

    return response.data;
  }

  //Add Connection Designer
  static async AddConnectionDesigner(data) {
    console.log(data);

    try {
      const response = await api.post(`connectionDesign`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Fetch All Connection Designer
  static async FetchAllConnectionDesigner() {
    try {
      const response = await api.get(`connectionDesign/all`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }
  // Fetch Connection Designer By ID
  static async FetchConnectionDesignerByID(id) {
    try {
      const response = await api.get(`connectionDesign/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }
  // Update Connection Designer By ID
  static async UpdateConnectionDesignerByID(id, data) {
    try {
      const response = await api.put(`connectionDesign/update/${id}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Add Estimation 
  static async AddEstimation(formData) {
    try {
      const response = await api.post(`estimation/estimations`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }
  // Add Estimation 
  static async AllEstimation() {
    try {
      const response = await api.get(`estimation/estimations`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }
  // Get Estimation By ID
  static async GetEstimationById(id) {
    try {
      const response = await api.get(`estimation/estimations/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Add Estimation Task
  static async AddEstimationTask(formData) {
    try {
      const response = await api.post(`estimation/estimation-tasks`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Add Group
  static async AddGroup(data) {
    try {
      const response = await api.post(`chat/group/`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" Group added", response.data);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Add Project
  static async AddProject(formData) {
    const token = sessionStorage.getItem("token");
    try {
      const response = await api.post(`project/projects`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Get All Projects
  static async GetAllProjects() {
    try {
      const response = await api.get(`project/projects`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Get Project By ID
  static async GetProjectById(id) {
    try {
      const response = await api.get(`project/projects/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Edit Project By ID
  static async EditProjectById(id, data) {
    try {
      const response = await api.put(`project/projects/${id}`, data);
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Add Project Milestone
  static async AddProjectMilestone(data) {
    try {
      const response = await api.post(`mileStone/`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Get Project Milestone By ID
  static async GetProjectMilestoneById(id) {
    try {
      const response = await api.get(`mileStone/project/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Add WBS in Project
  static async AddWBSInProject(projectId) {
    try {
      const response = await api.post(`project/projects/${projectId}/wbs
`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Get WBS By Project ID
  static async GetWBSByProjectId(projectId) {
    try {
      const response = await api.get(`project/projects/${projectId}/wbs`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Get WBS By ID
  static async GetWBSById(id) {
    try {
      const response = await api.get(`project/wbs/${id}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Update WBS line-item by ProjectId, wbsId and line-item ID
  static async UpdateWBSLineItem(projectId, wbsId, lineItemId, data) {
    try {
      const response = await api.put(`project/projects/${projectId}/work-break-downs/${wbsId}/line-items/${lineItemId}`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(response);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Fetch All Chats
  static async AllChats() {
    try {
      const response = await api.get(`chat/recent`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" All Fabricators fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find fabricators", error);
    }
  }


  // Add Group Members
  static async AddGroupMembers(data) { 
    try {
      const response = await api.post(`chat/group/members`, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" Group members added", response.data);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Fetch Group Members
  static async GetGroupMembers(groupId) {
    try {
      const response = await api.get(`chat/group/${groupId}/members`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" Group members fetched", response.data);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

    

  // Delete Group Member
  static async DeleteGroupMember(groupId, memberId) {
    try {
      const response = await api.delete(`chat/group/${groupId}/member/${memberId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" Group member deleted", response.data);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Get Project Notes
  static async GetProjectNotes(projectId) {
    try {
      const response = await api.get(`project/projects/${projectId}/notes`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" Project notes fetched", response.data);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Create Project Note
  static async CreateProjectNote(projectId, data) {
    const token = sessionStorage.getItem("token");
    try {
      const response = await api.post(`project/projects/${projectId}/notes`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log(" Project note created", response.data);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  

  // Delete Group
  static async DeleteGroup(groupId) {
    try {
      const response = await api.delete(`chat/group/${groupId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Group deleted", response.data);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  // Fetch Chats by Group ID
  static async ChatByGroupID(groupId, lastId) {
    console.log(lastId);
    
    try {
      // lastId is optional so handle it properly
      // const url = lastId
      //   ? `chat/group/${groupId}/history/${lastId}`
      //   : `chat/group/${groupId}/history`;
      const url = `chat/group/${groupId}/history/${lastId}`;

      const response = await api.get(url, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log("Chats by Group ID fetched:", response.data);
      return response.data;
    } catch (error) {
      console.error("Cannot find chats by group ID", error);
      throw error;
    }
  }

  //RFI components 
 //Add new RFI
 static async addRFI(formData) {
  const token = sessionStorage.getItem("token");

  const response = await api.post(`rfi`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}
  static async RfiSent() {
    try {
      const response = await api.get(`rfi/sents`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" RFI sents:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find rfIs", error);
    }
  }

  static async RfiRecieved() {
    try {
      const response = await api.get(`rfi/received`, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("  RFI received:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find rfi's", error);
    }                                                                                                                                                                                                                     
  }
  static async GetRFIbyId(rfiId) {
    try {
      const response = await api.get(`rfi/getById/${rfiId}`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      console.log(" All rfi fetched by rfi ID:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find rfi", error);
    }
  }
  static async EditRFIByID(id, data) {
    try {
      const response = await api.put(`rfi/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log("RFI Edited:", response.data);
      return response.data;
    } catch (error) {
      console.error("cannot find RFI", error);
    }
  } 
//RFI responses
static async addRFIResponse(formData, responseId) {
  const token = sessionStorage.getItem("token");

  const response = await api.post(`rfi/${responseId}/responses`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "multipart/form-data",
    },
  });

    return response.data;
  }


static async GetRFIResponsebyId(rfiId) {
      try {
        const response = await api.get(`rfi/responses/${rfiId}`, {
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log(" All rfq fetched by rfq ID:", response.data);
        return response.data;
      } catch (error) {
        console.error("cannot find rfq", error);
      }
    }
}
export default Service;

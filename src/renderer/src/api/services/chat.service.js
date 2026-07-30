import api from '../api'

class ChatService {
  // Add Group
  static async AddGroup(data) {
    try {
      const response = await api.post(`chat/create-group`, data, {
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

  // All Chats
  static async AllChats() {
    try {
      const response = await api.get(`chat/`, {
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

  // Add Group Members
  static async AddGroupMembers(data) {
    try {
      const response = await api.post(`chat/add-members`, data, {
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

  // Get Group Members
  static async GetGroupMembers(groupId) {
    try {
      const response = await api.get(`chat/members/${groupId}`, {
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

  // Delete Group Member
  static async DeleteGroupMember(groupId, memberId) {
    try {
      const response = await api.delete(`chat/remove-member/${groupId}/${memberId}`, {
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

  // Delete Group
  static async DeleteGroup(groupId) {
    try {
      const response = await api.delete(`chat/delete-group/${groupId}`, {
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

  // Chat By Group ID
  static async ChatByGroupID(groupId, lastId) {
    try {
      const params = lastId ? { lastId } : {}
      const response = await api.get(`chat/history/${groupId}`, {
        params,
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
}

export default ChatService

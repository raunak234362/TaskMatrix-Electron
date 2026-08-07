import api from '../api'

class ChatService {
  // Add Group (POST /chat/group)
  static async AddGroup(data) {
    try {
      const response = await api.post(`chat/group`, data, {
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

  // All Chats (GET /chat/recent)
  static async AllChats() {
    try {
      const response = await api.get(`chat/recent`, {
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

  // Add Group Members (POST /chat/group/members)
  static async AddGroupMembers(data) {
    try {
      const response = await api.post(`chat/group/members`, data, {
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

  // Get Group Members (GET /chat/group/{groupId}/members)
  static async GetGroupMembers(groupId) {
    try {
      const response = await api.get(`chat/group/${groupId}/members`, {
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

  // Delete Group Member (DELETE /chat/group/{groupId}/member/{memberId})
  static async DeleteGroupMember(groupId, memberId) {
    try {
      const response = await api.delete(`chat/group/${groupId}/member/${memberId}`, {
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

  // Delete Group (DELETE /chat/group/{groupId})
  static async DeleteGroup(groupId) {
    try {
      const response = await api.delete(`chat/group/${groupId}`, {
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

  // Chat By Group ID (GET /chat/group/{groupId}/history/{lastMessageId})
  static async ChatByGroupID(groupId, lastId) {
    try {
      const url = lastId
        ? `chat/group/${groupId}/history/${lastId}`
        : `chat/group/${groupId}/history/undefined`

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

  // Private Chat By User ID (GET /chat/private/{userId})
  static async GetPrivateChat(userId) {
    try {
      const response = await api.get(`chat/private/${userId}`, {
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

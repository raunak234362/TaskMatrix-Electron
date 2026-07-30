import api from '../api'

class TaskService {
  // Add Task
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

  // Get All Task
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

  // Get all task by userID
  static async GetAllTaskByUserID(id) {
    try {
      const response = await api.get(`task/AllTasks/${id}`, {
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

  // Get All Task
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

  // non-completed-tasks
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

  // Get Task by ID
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

  // delete Task by ID
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

  // Task Start
  static async TaskStart(id) {
    try {
      const response = await api.post(
        `task/start/${id}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
      throw error
    }
  }

  // Task Resume
  static async TaskResume(id) {
    try {
      const response = await api.post(
        `task/resume/${id}`,
        {},
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
      throw error
    }
  }

  // Task Pause
  static async TaskPause(id, data) {
    try {
      const response = await api.patch(`task/pause/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
      throw error
    }
  }

  // Task End
  static async TaskEnd(id, data) {
    try {
      const response = await api.post(`task/end/${id}`, data, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      return response.data
    } catch (error) {
      console.error('cannot find Task', error)
      throw error
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

  // Fetch My Comments
  static async FetchMyComments() {
    try {
      const response = await api.get(`comment/myComments`, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching my comments:', error)
      throw error
    }
  }

  // Fetch Unread Comments for My Tasks
  static async FetchUnreadCommentsMyTasks() {
    try {
      const response = await api.get(`comment/unread/my-tasks`, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching unread comments for my tasks:', error)
      throw error
    }
  }

  // Fetch Unread Comments for My Team
  static async FetchUnreadCommentsMyTeam() {
    try {
      const response = await api.get(`comment/unread/my-team`, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error) {
      console.error('Error fetching unread comments for my team:', error)
      throw error
    }
  }

  // Mark Comments as Read
  static async MarkCommentsAsRead(data) {
    try {
      const response = await api.patch(`comment/read`, data, {
        headers: { 'Content-Type': 'application/json' }
      })
      return response.data
    } catch (error) {
      console.error('Error marking comments as read:', error)
      throw error
    }
  }

  // Add Acknowledged by comment ID
  static async AddTaskCommentAcknowledged(id, data) {
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

  // Add Estimation Task Comment
  static async AddEstimationTaskComment(estimationTaskId, userId, commentText) {
    try {
      const payload = {
        estimationTaskId,
        task_id: '',
        user_id: userId ? Number(userId) : null,
        data: commentText
      }
      return await this.AddTaskComment(payload)
    } catch (error) {
      console.error('Error adding estimation task comment:', error)
      throw error
    }
  }

  // Acknowledge Estimation Task Comment
  static async AcknowledgeEstimationTaskComment(commentId) {
    try {
      const payload = {
        acknowledged: true,
        acknowledgedTime: new Date()
      }
      return await this.AddTaskCommentAcknowledged(commentId, payload)
    } catch (error) {
      console.error('Error acknowledging estimation task comment:', error)
      throw error
    }
  }
}

export default TaskService

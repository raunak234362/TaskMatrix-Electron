import api from '../api'
class SelfTaskService {
    //add self task 
    static async addSelfTask(taskData) {
        const response = await api.post('/selfAssignedTasks', taskData, {
            headers: { 'Content-Type': 'application/json' }
        })
        return response.data
    }

    //get self task
    static async getSelfTask(params = {}) {
        try {
            const response = await api.get('/selfAssignedTasks', {
                params,
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            return response.data
        } catch (error) {
            console.error('Error fetching self tasks:', error)
            throw error
        }
    }

    static async getSelfTaskById(id) {
        const response = await api.get(`/selfAssignedTasks/${id}`)
        return response.data
    }

    static async startSelfTask(id) {
        const response = await api.post(`/selfAssignedTasks/${id}/start`)
        return response.data
    }

    static async pauseSelfTask(id) {
        const response = await api.patch(`/selfAssignedTasks/${id}/pause`)
        return response.data
    }

    static async resumeSelfTask(id) {
        const response = await api.post(`/selfAssignedTasks/${id}/resume`)
        return response.data
    }

    static async endSelfTask(id) {
        const response = await api.post(`/selfAssignedTasks/${id}/end`)
        return response.data
    }

    static async addSelfTaskComment(id, data) {
        const response = await api.post('/comment', { selfTask_id: id, data })
        return response.data
    }

    //get my self tasks
    static async getMySelfTask(userId) {
        try {
            const response = await api.get(`/selfAssignedTasks/my-tasks`, {
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            return response.data
        } catch (error) {
            console.error('Error fetching my self tasks:', error)
            throw error
        }
    }
    //self assigned notcompleted tasks
    static async getSelfAssignedNotCompletedTasks() {
        try {
            const response = await api.get(`/selfAssignedTasks/my-tasks/non-completed`, {
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            return response.data
        } catch (error) {
            console.error('Error fetching self assigned not completed tasks:', error)
            throw error
        }
    }


    //get self assigned tasks by team id
    static async getSelfAssignedTasksByTeamId(teamId) {
        try {
            const response = await api.get(`/selfAssignedTasks/team/${teamId}`, {
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            return response.data
        } catch (error) {
            console.error('Error fetching self assigned tasks by team id:', error)
            throw error
        }
    }

    //get self assigned tasks by userid
    static async getSelfAssignedTasksByUserId(id) {
        try {
            const response = await api.get(`/selfAssignedTasks/user/${id}`, {
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            return response.data
        } catch (error) {
            console.error('Error fetching self assigned tasks by user id:', error)
            throw error
        }
    }

    //update self assigned task by id
    static async updateSelfAssignedTaskById(id, taskData) {
        try {
            const response = await api.put(`/selfAssignedTasks/${id}`, taskData, {
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            return response.data
        } catch (error) {
            console.error('Error updating self assigned task by id:', error)
            throw error
        }
    }

    //delete self assigned task by id
    static async deleteSelfAssignedTaskById(id) {
        try {
            const response = await api.delete(`/selfAssignedTasks/${id}`, {
                headers: {
                    'Content-Type': 'application/json'
                },
            })
            return response.data
        } catch (error) {
            console.error('Error deleting self assigned task by id:', error)
            throw error
        }
    }
}
export default SelfTaskService

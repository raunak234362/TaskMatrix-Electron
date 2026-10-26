import api from '../api'
const token = sessionStorage.getItem('token')
class SelfTaskService {
    //add self task 
    static async addSelfTask(taskData) {
        console.log(taskData,"task data");
        
      const response = await api.post('/selfAssignedTasks', taskData,{
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
            } 
        })
        return response.data


    }

    //get self task
    static async getSelfTask() {
        try {
        const response = await api.get('/selfAssignedTasks', {
            headers: {
               'Content-Type': 'application/json'
            },
        })
        return response.data
       }  catch (error) {
        console.error('Error fetching self tasks:', error)
        throw error
        }   
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
       }  catch (error) {
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
       }  catch (error) {
        console.error('Error fetching self assigned not completed tasks:', error)
        throw error
        }   
    }
    

    //get self asssigned tasks by departmentid 
    static async getSelfAssignedTasksByDepartmentId(departmentId) {
        try {
        const response = await api.get(`/selfAssignedTasks/department/${departmentId}`, {
            headers: {
               'Content-Type': 'application/json'
            },
        })
        return response.data
       }  catch (error) {
        console.error('Error fetching self assigned tasks by department id:', error)
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
       }  catch (error) {
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
       }  catch (error) {
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
       }  catch (error) {
        console.error('Error deleting self assigned task by id:', error)
        throw error
        }   
    }
}
export default SelfTaskService
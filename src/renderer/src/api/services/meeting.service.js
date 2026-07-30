import api from '../api'

class MeetingService {
  // Meetings API methods
  static async CreateMeeting(meetingData, fabricatorName, projectName) {
    try {
      const response = await api.post(
        `meetings?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`,
        meetingData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      console.log('Meeting created:', response.data)
      return response.data
    } catch (error) {
      console.error('Error creating meeting:', error)
      throw error
    }
  }

  static async MarkMeetingAttendance(attendanceData) {
    try {
      const response = await api.post(`meetings/attendance`, attendanceData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Attendance marked:', response.data)
      return response.data
    } catch (error) {
      console.error('Error marking attendance:', error)
      throw error
    }
  }

  static async GetAttendanceHistory(params) {
    try {
      const response = await api.get(`meetings/attendance/history`, {
        params,
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Attendance history fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching attendance history:', error)
      throw error
    }
  }

  static async AddMeetingParticipants(participantsData, fabricatorName, projectName) {
    try {
      const response = await api.post(
        `meetings/participants?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`,
        participantsData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      console.log('Participants added:', response.data)
      return response.data
    } catch (error) {
      console.error('Error adding participants:', error)
      throw error
    }
  }

  static async DeleteMeetingParticipant(attendeeId) {
    try {
      const response = await api.delete(`meetings/participants/${attendeeId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Participant deleted:', response.data)
      return response.data
    } catch (error) {
      console.error('Error deleting participant:', error)
      throw error
    }
  }

  static async UpdateMeetingParticipant(attendeeId, participantData, fabricatorName, projectName) {
    try {
      const response = await api.put(
        `meetings/participants/${attendeeId}?fabricatorName=${encodeURIComponent(fabricatorName)}&projectName=${encodeURIComponent(projectName)}`,
        participantData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      )
      console.log('Participant updated:', response.data)
      return response.data
    } catch (error) {
      console.error('Error updating participant:', error)
      throw error
    }
  }

  static async GetMeetingStatusCount() {
    try {
      const response = await api.get(`meetings/status/count`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Meeting status count fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching meeting status count:', error)
      throw error
    }
  }

  static async GetMyMeetings() {
    try {
      const response = await api.get(`meetings/my`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('My meetings fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching my meetings:', error)
      throw error
    }
  }

  static async GetMyPastMeetings() {
    try {
      const response = await api.get(`meetings/past`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Past meetings fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching past meetings:', error)
      throw error
    }
  }

  static async GetMyUpcomingMeetings() {
    try {
      const response = await api.get(`meetings/upcoming`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Upcoming meetings fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching upcoming meetings:', error)
      throw error
    }
  }

  static async ViewMeetingFile(meetingId, fileId) {
    try {
      const response = await api.get(`meetings/${meetingId}/files/${fileId}`, {
        responseType: 'blob'
      })
      console.log('Meeting file fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching meeting file:', error)
      throw error
    }
  }

  static async DeleteMeeting(id) {
    try {
      const response = await api.delete(`meetings/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Meeting deleted:', response.data)
      return response.data
    } catch (error) {
      console.error('Error deleting meeting:', error)
      throw error
    }
  }

  static async GetMeetingById(id) {
    try {
      const response = await api.get(`meetings/${id}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Meeting by ID fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching meeting by ID:', error)
      throw error
    }
  }

  static async UpdateMeetingById(id, meetingData) {
    try {
      const response = await api.put(`meetings/${id}`, meetingData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Meeting updated:', response.data)
      return response.data
    } catch (error) {
      console.error('Error updating meeting:', error)
      throw error
    }
  }

  static async UpdateMeetingStatus(id, statusData) {
    try {
      const response = await api.patch(`meetings/${id}/status`, statusData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Meeting status updated:', response.data)
      return response.data
    } catch (error) {
      console.error('Error updating meeting status:', error)
      throw error
    }
  }

  static async GetMeetingSummary(id) {
    try {
      const response = await api.get(`meetings/${id}/summary`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Meeting summary fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching meeting summary:', error)
      throw error
    }
  }

  static async GetMeetingAttendance(meetingId) {
    try {
      const response = await api.get(`meetings/${meetingId}/attendance`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Meeting attendance fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching meeting attendance:', error)
      throw error
    }
  }

  static async GetMeetingFileById(meetingId, fileId) {
    try {
      const response = await api.get(`meetings/${meetingId}/files/${fileId}`, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Meeting file by ID fetched:', response.data)
      return response.data
    } catch (error) {
      console.error('Error fetching meeting file by ID:', error)
      throw error
    }
  }

  static async UpdateMeetingRSVP(meetingId, rsvpData) {
    try {
      const response = await api.patch(`meetings/${meetingId}/rsvp`, rsvpData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('Meeting RSVP updated:', response.data)
      return response.data
    } catch (error) {
      console.error('Error updating meeting RSVP:', error)
      throw error
    }
  }
}

export default MeetingService
